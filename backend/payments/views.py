from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db import transaction
from django.conf import settings
from django.utils import timezone
from decimal import Decimal
from datetime import timedelta
import uuid
import hmac
import hashlib

from .models import PaymentOrder, UserWallet
from .serializers import CreateOrderSerializer, PaymentOrderSerializer, UserWalletSerializer
from .utils.razorpay_client import client as razorpay_client


# Helper Functions
def get_or_create_user_wallet(user):
    """Get or create user wallet"""
    wallet, created = UserWallet.objects.get_or_create(
        user=user,
        defaults={'coin_balance': 0, 'total_money_spent': 0}
    )
    return wallet


class CreateOrderView(APIView):
    """Simple create order for coin purchase - 1 INR = 1 Coin"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = CreateOrderSerializer(data=request.data)
        
        if serializer.is_valid():
            amount = serializer.validated_data['amount']
            
            try:
                with transaction.atomic():
                    # Calculate coins (1 INR = 1 Coin)
                    coins_to_credit = int(amount)
                    
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
                    
                    # Create payment order in database
                    payment_order = PaymentOrder.objects.create(
                        order_id=order_id,
                        razorpay_order_id=razorpay_order['id'],
                        user=request.user,
                        amount=amount,
                        coins_to_credit=coins_to_credit,
                        currency='INR',
                        status='PENDING',
                        payment_method='CHECKOUT',
                        expires_at=timezone.now() + timedelta(hours=1),
                        notes={'razorpay_order': dict(razorpay_order)}
                    )
                    
                    # Ensure user has a wallet
                    get_or_create_user_wallet(request.user)
                    
                    # Return response
                    response_serializer = PaymentOrderSerializer(payment_order)
                    
                    return Response({
                        'success': True,
                        'message': f'Order created successfully! You will receive {coins_to_credit} coins after payment.',
                        'order': response_serializer.data,
                        'razorpay_key_id': settings.RAZORPAY_KEY_ID,
                        'exchange_rate': '1 INR = 1 Coin'
                    }, status=status.HTTP_201_CREATED)
                    
            except Exception as e:
                return Response({
                    'success': False,
                    'error': 'Failed to create order. Please try again.',
                    'message': str(e) if request.user.is_staff else 'Order creation failed'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class UserWalletView(APIView):
    """Get user's wallet information"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        wallet = get_or_create_user_wallet(request.user)
        serializer = UserWalletSerializer(wallet)
        return Response({
            'success': True,
            'wallet': serializer.data
        })


class VerifyPaymentView(APIView):
    """Verify Razorpay payment and update order status"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_signature = request.data.get('razorpay_signature')
        
        if not all([razorpay_payment_id, razorpay_order_id, razorpay_signature]):
            return Response({
                'success': False,
                'error': 'Missing payment verification data'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Verify signature
            body = razorpay_order_id + "|" + razorpay_payment_id
            expected_signature = hmac.new(
                settings.RAZORPAY_KEY_SECRET.encode('utf-8'),
                body.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            
            if expected_signature != razorpay_signature:
                return Response({
                    'success': False,
                    'error': 'Invalid payment signature'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Find and update order
            with transaction.atomic():
                payment_order = PaymentOrder.objects.get(
                    razorpay_order_id=razorpay_order_id,
                    user=request.user,
                    status='PENDING'
                )
                
                # Update order
                payment_order.status = 'PAID'
                payment_order.razorpay_payment_id = razorpay_payment_id
                payment_order.razorpay_signature = razorpay_signature
                payment_order.paid_at = timezone.now()
                payment_order.save()
                
                # Credit coins to wallet
                wallet = get_or_create_user_wallet(request.user)
                wallet.coin_balance += payment_order.coins_to_credit
                wallet.total_coins_earned += payment_order.coins_to_credit
                wallet.total_money_spent += payment_order.amount
                wallet.save()
                
                return Response({
                    'success': True,
                    'message': f'{payment_order.coins_to_credit} coins added to your wallet!',
                    'order': PaymentOrderSerializer(payment_order).data,
                    'wallet_balance': wallet.coin_balance
                })
                
        except PaymentOrder.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Payment order not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'success': False,
                'error': 'Payment verification failed',
                'message': str(e) if request.user.is_staff else 'Verification failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class OrderStatusView(APIView):
    """Get order status and details"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, order_id):
        try:
            payment_order = PaymentOrder.objects.get(
                order_id=order_id,
                user=request.user
            )
            
            serializer = PaymentOrderSerializer(payment_order)
            
            return Response({
                'success': True,
                'order': serializer.data,
                'message': f'Order status: {payment_order.status}'
            }, status=status.HTTP_200_OK)
            
        except PaymentOrder.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Order not found'
            }, status=status.HTTP_404_NOT_FOUND)


class PaymentWebhookView(APIView):
    """Handle Razorpay webhooks for automatic payment processing"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            # Verify webhook signature
            webhook_signature = request.META.get('HTTP_X_RAZORPAY_SIGNATURE')
            webhook_secret = settings.RAZORPAY_WEBHOOK_SECRET
            
            if webhook_secret and webhook_signature:
                expected_signature = hmac.new(
                    webhook_secret.encode('utf-8'),
                    request.body,
                    hashlib.sha256
                ).hexdigest()
                
                if expected_signature != webhook_signature:
                    return Response({'error': 'Invalid signature'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Process webhook
            payload = request.data
            event = payload.get('event')
            
            if event == 'payment.captured':
                self.handle_payment_captured(payload)
            elif event == 'order.paid':
                self.handle_order_paid(payload)
                
            return Response({'status': 'ok'}, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Webhook error: {str(e)}")
            return Response({
                'error': 'Webhook processing failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def handle_payment_captured(self, payload):
        """Handle payment.captured webhook"""
        payment = payload.get('payload', {}).get('payment', {}).get('entity', {})
        order_id = payment.get('order_id')
        payment_id = payment.get('id')
        
        if order_id and payment_id:
            try:
                with transaction.atomic():
                    payment_order = PaymentOrder.objects.get(
                        razorpay_order_id=order_id,
                        status='PENDING'
                    )
                    
                    # Update order
                    payment_order.status = 'PAID'
                    payment_order.razorpay_payment_id = payment_id
                    payment_order.paid_at = timezone.now()
                    payment_order.webhook_data = payload
                    payment_order.save()
                    
                    # Credit coins
                    wallet = get_or_create_user_wallet(payment_order.user)
                    wallet.coin_balance += payment_order.coins_to_credit
                    wallet.total_coins_earned += payment_order.coins_to_credit
                    wallet.total_money_spent += payment_order.amount
                    wallet.save()
                    
            except PaymentOrder.DoesNotExist:
                print(f"Order not found for webhook: {order_id}")
    
    def handle_order_paid(self, payload):
        """Handle order.paid webhook"""
        order = payload.get('payload', {}).get('order', {}).get('entity', {})
        order_id = order.get('id')
        
        if order_id:
            try:
                with transaction.atomic():
                    payment_order = PaymentOrder.objects.get(
                        razorpay_order_id=order_id,
                        status='PENDING'
                    )
                    
                    # Update order
                    payment_order.status = 'PAID'
                    payment_order.paid_at = timezone.now()
                    payment_order.webhook_data = payload
                    payment_order.save()
                    
                    # Credit coins
                    wallet = get_or_create_user_wallet(payment_order.user)
                    wallet.coin_balance += payment_order.coins_to_credit
                    wallet.total_coins_earned += payment_order.coins_to_credit
                    wallet.total_money_spent += payment_order.amount
                    wallet.save()
                    
            except PaymentOrder.DoesNotExist:
                print(f"Order not found for webhook: {order_id}")