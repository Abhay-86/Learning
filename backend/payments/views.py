from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from drf_spectacular.utils import extend_schema
from decimal import Decimal
import uuid

from .models import PaymentOrder, UserWallet, PaymentLog
from .serializers import CreateOrderSerializer, PaymentOrderSerializer, UserWalletSerializer
from .utils.razorpay_client import client as razorpay_client
from .utils.payment_helpers import (
    generate_qr_code, create_upi_url, calculate_coins_for_amount,
    calculate_order_expiry, log_payment_activity, get_or_create_user_wallet
)


class CreateOrderView(APIView):
    """Create order for coin purchase - 1 INR = 1 Coin"""
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        request=CreateOrderSerializer,
        responses={201: PaymentOrderSerializer}
    )
    def post(self, request):
        serializer = CreateOrderSerializer(data=request.data)
        
        if serializer.is_valid():
            amount = serializer.validated_data['amount']
            
            try:
                with transaction.atomic():
                    # Calculate coins (1 INR = 1 Coin)
                    coins_to_credit = calculate_coins_for_amount(amount)
                    
                    # Generate unique order ID
                    order_id = f"order_{uuid.uuid4().hex[:12]}"
                    
                    # Create Razorpay order
                    razorpay_order_data = {
                        'amount': int(amount * 100),  # Convert to paise
                        'currency': 'INR',
                        'receipt': order_id,
                        'notes': {
                            'user_id': request.user.id,
                            'username': request.user.username,
                            'coins_to_credit': coins_to_credit
                        }
                    }
                    
                    razorpay_order = razorpay_client.order.create(razorpay_order_data)
                    
                    # Generate UPI URL and QR code
                    upi_url = create_upi_url(amount, order_id)
                    qr_code = generate_qr_code(upi_url)
                    
                    # Create payment order in database
                    payment_order = PaymentOrder.objects.create(
                        order_id=order_id,
                        razorpay_order_id=razorpay_order['id'],
                        user=request.user,
                        amount=amount,
                        coins_to_credit=coins_to_credit,
                        currency='INR',
                        status='PENDING',
                        qr_code=qr_code,
                        upi_payment_url=upi_url,
                        expires_at=calculate_order_expiry(),
                        notes={
                            'razorpay_order': razorpay_order,
                            'exchange_rate': '1 INR = 1 Coin'
                        }
                    )
                    
                    # Ensure user has a wallet
                    get_or_create_user_wallet(request.user)
                    
                    # Log the activity
                    log_payment_activity(
                        user=request.user,
                        log_type='ORDER_CREATED',
                        message=f"Order created: ₹{amount} for {coins_to_credit} coins",
                        order=payment_order,
                        request_data=serializer.validated_data,
                        response_data={
                            'order_id': order_id,
                            'razorpay_order_id': razorpay_order['id']
                        },
                        ip_address=self.get_client_ip(request),
                        user_agent=request.META.get('HTTP_USER_AGENT', '')
                    )
                    
                    # Return response
                    response_serializer = PaymentOrderSerializer(payment_order)
                    
                    return Response({
                        'success': True,
                        'message': f'Order created successfully! You will receive {coins_to_credit} coins after payment.',
                        'order': response_serializer.data,
                        'razorpay_key_id': razorpay_order_data.get('key_id'),  # You might want to add this
                        'exchange_rate': '1 INR = 1 Coin'
                    }, status=status.HTTP_201_CREATED)
                    
            except Exception as e:
                # Log error
                log_payment_activity(
                    user=request.user,
                    log_type='ERROR',
                    message=f"Order creation failed: {str(e)}",
                    request_data=serializer.validated_data,
                    ip_address=self.get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', '')
                )
                
                return Response({
                    'success': False,
                    'error': 'Failed to create order. Please try again.',
                    'message': str(e) if request.user.is_staff else 'Order creation failed'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class UserWalletView(APIView):
    """Get user's wallet information"""
    permission_classes = [IsAuthenticated]
    
    @extend_schema(responses={200: UserWalletSerializer})
    def get(self, request):
        wallet = get_or_create_user_wallet(request.user)
        serializer = UserWalletSerializer(wallet)
        
        return Response({
            'success': True,
            'wallet': serializer.data
        }, status=status.HTTP_200_OK)
