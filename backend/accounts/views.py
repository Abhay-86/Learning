from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db import transaction
from drf_spectacular.utils import extend_schema

from .serializers import (
    RegisterSerializer, 
    UserSerializer,
    LoginSerializer
)
from .models import CustomUser

class RegisterView(APIView):
    """User registration endpoint"""
    permission_classes = [AllowAny]
    authentication_classes = []
    
    @extend_schema(request=RegisterSerializer, responses={201: UserSerializer})
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    user = serializer.save()
                    return Response(
                        {
                            "message": "User registered successfully!",
                            "user": UserSerializer(user).data
                        },
                        status=status.HTTP_201_CREATED
                    )
            except Exception as e:
                return Response(
                    {"error": f"Something went wrong: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class LoginView(APIView):
    """User login endpoint - to be implemented"""
    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(request=LoginSerializer, responses={200: UserSerializer})
    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.validated_data['user']
            try:
                custom_user = CustomUser.objects.get(user=user)
            except CustomUser.DoesNotExist:
                return Response(
                    {"error": "Custom user profile not found."},
                    status=status.HTTP_404_NOT_FOUND
                )
            # if not custom_user.is_verified:
            #     return Response(
            #         {"error": "Please verify your email before logging in."},
            #         status=status.HTTP_403_FORBIDDEN
            #     )
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)
            response =  Response({
                "message": "Login successful.",
                "user": UserSerializer(user).data,
            }, status=status.HTTP_200_OK)
        
            response.set_cookie(
                key='access',
                value=access_token,
                httponly=True,
                secure=True,      # True in production (HTTPS)
                samesite='None',
                max_age=60 * 60   # 1 hour
            )
            response.set_cookie(
                key='refresh',
                value=refresh_token,
                httponly=True,
                secure=True,
                samesite='None',
                max_age=24 * 60 * 60  # 1 day
            )
            return response
        

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProfileView(APIView):
    """User profile endpoint"""
    permission_classes = [IsAuthenticated]

    extend_schema(responses={200: UserSerializer})
    def get(self, request):
        user = request.user
        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)
class CookieTokenRefreshView(TokenRefreshView):
    """Custom refresh endpoint that reads the refresh token from HttpOnly cookie."""
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get('refresh')
        if not refresh_token:
            return Response({'error': 'Refresh token missing'}, status=status.HTTP_401_UNAUTHORIZED)

        serializer = self.get_serializer(data={'refresh': refresh_token})
        try:
            serializer.is_valid(raise_exception=True)
        except Exception:
            # Happens when refresh token is invalid or user doesn't exist
            return Response({'error': 'Invalid or expired refresh token'}, status=status.HTTP_401_UNAUTHORIZED)

        access_token = serializer.validated_data.get('access')
        response = Response({'access': access_token}, status=status.HTTP_200_OK)
        response.set_cookie(
            key='access',
            value=access_token,
            httponly=True,
            secure=True,
            samesite='None',
            max_age=60 * 60  # 1 hour
        )
        return response

class LogoutView(APIView):
    """User logout endpoint"""
    permission_classes = [IsAuthenticated]  # user must be logged in

    @extend_schema(responses={200: {"message": "Logout successful"}})
    def post(self, request):
        refresh_token = request.COOKIES.get("refresh")

        response = Response({"message": "Logout successful"}, status=status.HTTP_200_OK)

        # Clear both access and refresh cookies
        response.delete_cookie("access")
        response.delete_cookie("refresh")


        # OPTIONAL: blacklist refresh token for security
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()  # only if blacklist app enabled
            except Exception:
                pass

        return response
