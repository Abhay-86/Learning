from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db import transaction
from drf_spectacular.utils import extend_schema
from django.core.mail import send_mail

from .serializers import (
    RegisterSerializer, 
    UserSerializer,
    LoginSerializer,
    SendOTPSerializer,
    VerifyOTPSerializer,
)
from .models import CustomUser
from django.contrib.auth.models import User

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
                "access": access_token,
                "refresh": refresh_token
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
    """User profile endpoint with wallet information"""
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: UserSerializer})
    def get(self, request):
        user = request.user
        
        # Ensure user has a wallet (create if doesn't exist)
        from payments.utils.payment_helpers import get_or_create_user_wallet
        get_or_create_user_wallet(user)
        
        # Use select_related to optimize database queries
        user_with_wallet = User.objects.select_related('custom_user', 'wallet').get(id=user.id)
        
        serializer = UserSerializer(user_with_wallet)
        
        return Response({
            'success': True,
            'user': serializer.data,
            'message': 'Profile retrieved successfully'
        }, status=status.HTTP_200_OK)


class DashboardView(APIView):
    """Dashboard endpoint with comprehensive user data including wallet and features"""
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: dict})
    def get(self, request):
        user = request.user
        
        # Ensure user has a wallet
        from payments.utils.payment_helpers import get_or_create_user_wallet
        wallet = get_or_create_user_wallet(user)
        
        # Get user with related data
        user_with_wallet = User.objects.select_related('custom_user', 'wallet').get(id=user.id)
        user_serializer = UserSerializer(user_with_wallet)
        
        # Get recent transactions
        from payments.models import CoinTransaction, PaymentOrder
        recent_transactions = CoinTransaction.objects.filter(user=user).order_by('-created_at')[:5]
        recent_orders = PaymentOrder.objects.filter(user=user).order_by('-created_at')[:3]
        
        # Get active features
        from features.models import UserFeature
        active_features = UserFeature.objects.filter(
            user=user, 
            is_active=True
        ).select_related('feature')
        
        # Prepare transaction data
        transaction_data = []
        for transaction in recent_transactions:
            transaction_data.append({
                'transaction_id': transaction.transaction_id,
                'type': transaction.transaction_type,
                'amount': transaction.amount,
                'balance_after': transaction.balance_after,
                'description': transaction.description,
                'created_at': transaction.created_at
            })
        
        # Prepare order data
        order_data = []
        for order in recent_orders:
            order_data.append({
                'order_id': order.order_id,
                'amount': str(order.amount),
                'coins_to_credit': order.coins_to_credit,
                'status': order.status,
                'created_at': order.created_at
            })
        
        # Prepare feature data
        feature_data = []
        for user_feature in active_features:
            feature_data.append({
                'feature_id': user_feature.feature.id,
                'feature_name': user_feature.feature.name,
                'feature_code': user_feature.feature.code,
                'description': user_feature.feature.description,
                'activated_on': user_feature.activated_on,
                'expires_on': user_feature.expires_on,
                'is_valid': user_feature.is_valid()
            })
        
        return Response({
            'success': True,
            'dashboard': {
                'user': user_serializer.data,
                'wallet': {
                    'coin_balance': wallet.coin_balance,
                    'total_coins_earned': wallet.total_coins_earned,
                    'total_coins_spent': wallet.total_coins_spent,
                    'total_money_spent': str(wallet.total_money_spent)
                },
                'recent_transactions': transaction_data,
                'recent_orders': order_data,
                'active_features': feature_data,
                'stats': {
                    'total_orders': PaymentOrder.objects.filter(user=user).count(),
                    'successful_orders': PaymentOrder.objects.filter(user=user, status='PAID').count(),
                    'total_transactions': CoinTransaction.objects.filter(user=user).count(),
                    'active_features_count': active_features.count()
                }
            },
            'message': 'Dashboard data retrieved successfully'
        }, status=status.HTTP_200_OK)
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
    

class SendOTPEmailView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(request=SendOTPSerializer, responses={200: dict})
    def post(self, request):
        serializer = SendOTPSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "OTP sent successfully!"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyOTPEmailView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(request=VerifyOTPSerializer, responses={200: dict})
    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            return Response(data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)