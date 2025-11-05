from rest_framework.views import APIView
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
            return Response({
                "message": "Login successful.",
                "user": UserSerializer(user).data,
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },
            }, status=status.HTTP_200_OK)
        

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProfileView(APIView):
    """User profile endpoint"""
    permission_classes = [IsAuthenticated]

    extend_schema(responses={200: UserSerializer})
    def get(self, request):
        user = request.user
        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)