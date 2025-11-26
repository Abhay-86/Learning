from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db import transaction
from drf_spectacular.utils import extend_schema
from django.core.mail import send_mail
from .google_auth import get_user_info_from_google
from rest_framework.exceptions import AuthenticationFailed

from .serializers import (
    RegisterSerializer, 
    UserSerializer,
    LoginSerializer,
    SendOTPSerializer,
    VerifyOTPSerializer,
    GoogleLoginSerializer,
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


class GoogleLoginView(APIView):
    """Google OAuth login endpoint"""
    permission_classes = [AllowAny]
    authentication_classes = []
    
    @extend_schema(request=GoogleLoginSerializer, responses={200: UserSerializer})
    def post(self, request):
        
        serializer = GoogleLoginSerializer(data=request.data)
        
        if serializer.is_valid():
            token = serializer.validated_data['token']
            
            try:
                # Verify token and get user info from Google
                google_user_info = get_user_info_from_google(token)
                
                email = google_user_info['email']
                first_name = google_user_info['first_name']
                last_name = google_user_info['last_name']
                
                # Check if user exists
                try:
                    user = User.objects.get(email=email)
                except User.DoesNotExist:
                    # Create new user
                    with transaction.atomic():
                        # Generate username from email
                        username = email.split('@')[0]
                        # Make unique if username already exists
                        base_username = username
                        counter = 1
                        while User.objects.filter(username=username).exists():
                            username = f"{base_username}{counter}"
                            counter += 1
                        
                        user = User.objects.create_user(
                            username=username,
                            email=email,
                            first_name=first_name,
                            last_name=last_name,
                            is_active=True
                        )
                        # Set unusable password for Google OAuth users
                        user.set_unusable_password()
                        user.save()
                        
                        # Create CustomUser profile
                        CustomUser.objects.create(
                            user=user,
                            is_verified=True,  # Google already verified the email
                            role='USER'
                        )
                
                # Generate JWT tokens
                refresh = RefreshToken.for_user(user)
                access_token = str(refresh.access_token)
                refresh_token = str(refresh)
                
                response = Response({
                    "message": "Login successful.",
                    "user": UserSerializer(user).data,
                    "access": access_token,
                    "refresh": refresh_token
                }, status=status.HTTP_200_OK)
                
                # Set HttpOnly cookies
                response.set_cookie(
                    key='access',
                    value=access_token,
                    httponly=True,
                    secure=True,
                    samesite='None',
                    max_age=60 * 60  # 1 hour
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
                
            except AuthenticationFailed as e:
                return Response(
                    {"error": str(e)},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            except Exception as e:
                return Response(
                    {"error": f"Authentication failed: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
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


# ============================================
# Gmail OAuth Views
# ============================================

from .gmail_oauth import GmailOAuthService
from django.utils import timezone
from django.conf import settings


class GmailAuthURLView(APIView):
    """
    Generate Gmail OAuth authorization URL
    
    GET /api/accounts/gmail/auth-url/
    
    Returns:
        {
            "success": true,
            "auth_url": "https://accounts.google.com/o/oauth2/v2/auth?..."
        }
    """
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        responses={200: dict},
        description="Generate Gmail OAuth URL for user to grant email sending permission"
    )
    def get(self, request):
        user = request.user
        redirect_uri = f"{settings.BACKEND_URL}/api/accounts/gmail/callback/"
        
        auth_url = GmailOAuthService.generate_auth_url(
            user_id=user.id,
            redirect_uri=redirect_uri
        )
        
        return Response({
            "success": True,
            "auth_url": auth_url,
            "message": "Redirect user to this URL to grant Gmail permissions"
        }, status=status.HTTP_200_OK)


class GmailCallbackView(APIView):
    """
    Handle Gmail OAuth callback and save refresh token
    
    GET /api/accounts/gmail/callback/?code=XXX&state=user_id
    
    This endpoint is called by Google after user grants permission
    """
    permission_classes = [AllowAny]
    authentication_classes = []
    
    @extend_schema(
        responses={200: dict},
        description="OAuth callback endpoint - called by Google"
    )
    def get(self, request):
        code = request.query_params.get("code")
        user_id = request.query_params.get("state")
        
        if not code or not user_id:
            return Response(
                {"error": "Missing code or state parameter"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Get user
            user = User.objects.get(id=user_id)
            custom_user = user.custom_user
            
            # Exchange code for tokens
            redirect_uri = f"{settings.BACKEND_URL}/api/accounts/gmail/callback/"
            token_data = GmailOAuthService.exchange_code_for_token(
                code=code,
                redirect_uri=redirect_uri
            )
            
            refresh_token = token_data.get("refresh_token")
            
            if not refresh_token:
                return Response(
                    {
                        "error": "No refresh token returned. Please revoke access in Google Account settings and try again.",
                        "help_url": "https://myaccount.google.com/permissions"
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Save refresh token
            custom_user.gmail_refresh_token = refresh_token
            custom_user.gmail_permission_granted_at = timezone.now()
            custom_user.save()
            
            # Redirect to frontend success page
            frontend_url = f"{settings.FRONTEND_URL}/settings/gmail-success"
            return Response({
                "success": True,
                "message": "Gmail permission granted successfully!",
                "redirect_url": frontend_url
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to process OAuth callback: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GmailAcceptPrivacyView(APIView):
    """
    Accept Gmail privacy policy
    
    POST /api/accounts/gmail/accept-privacy/
    
    User must accept privacy policy before connecting Gmail
    """
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        responses={200: dict},
        description="Accept Gmail privacy policy"
    )
    def post(self, request):
        """Mark that user has accepted Gmail privacy policy"""
        user = request.user
        custom_user = user.custom_user
        
        custom_user.gmail_privacy_accepted = True
        custom_user.save()
        
        return Response({
            "success": True,
            "message": "Privacy policy accepted",
            "privacy_accepted": True
        }, status=status.HTTP_200_OK)


class GmailPermissionStatusView(APIView):
    """
    Check if user has granted Gmail permission
    
    GET /api/accounts/gmail/status/
    
    Returns:
        {
            "success": true,
            "has_permission": true,
            "granted_at": "2025-11-25T10:30:00Z",
            "user_email": "user@gmail.com"
        }
    """
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        responses={200: dict},
        description="Check Gmail permission status for authenticated user"
    )
    def get(self, request):
        user = request.user
        custom_user = user.custom_user
        
        return Response({
            "success": True,
            "has_permission": custom_user.has_gmail_permission(),
            "privacy_accepted": custom_user.gmail_privacy_accepted,
            "granted_at": custom_user.gmail_permission_granted_at,
            "user_email": user.email
        }, status=status.HTTP_200_OK)
    
    @extend_schema(
        responses={200: dict},
        description="Revoke Gmail permission"
    )
    def delete(self, request):
        """Revoke Gmail permission"""
        user = request.user
        custom_user = user.custom_user
        
        custom_user.gmail_refresh_token = None
        custom_user.gmail_permission_granted_at = None
        custom_user.gmail_privacy_accepted = False  # Reset privacy acceptance
        custom_user.save()
        
        return Response({
            "success": True,
            "message": "Gmail permission revoked successfully"
        }, status=status.HTTP_200_OK)