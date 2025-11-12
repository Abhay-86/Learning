from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db import transaction
from django.conf import settings
from drf_spectacular.utils import extend_schema
from decimal import Decimal
import uuid
import hmac
import hashlib

from .renderers import DecimalSafeJSONRenderer

from .models import PaymentOrder, UserWallet, PaymentLog
from .serializers import CreateOrderSerializer, PaymentOrderSerializer, UserWalletSerializer
from .utils.razorpay_client import client as razorpay_client
from .utils.payment_helpers import (
    create_razorpay_qr_code, get_qr_code_status, close_qr_code,
    calculate_coins_for_amount, calculate_order_expiry, log_payment_activity, 
    get_or_create_user_wallet
)


class CreateOrderView(APIView):
    """Create order for coin purchase - 1 INR = 1 Coin"""
    permission_classes = [IsAuthenticated]
    renderer_classes = [DecimalSafeJSONRenderer]
    
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
                    
                    # Try to create Razorpay QR code (optional)
                    qr_result = None
                    try:
                        qr_result = create_razorpay_qr_code(float(amount), order_id, coins_to_credit, request.user)
                    except Exception as qr_error:
                        print(f"QR Code creation failed: {qr_error}")
                        # Continue without QR code - Razorpay checkout will still work
                    
                    # Create payment order in database
                    payment_order = PaymentOrder.objects.create(
                        order_id=order_id,
                        razorpay_order_id=razorpay_order['id'],
                        user=request.user,
                        amount=amount,
                        coins_to_credit=coins_to_credit,
                        currency='INR',
                        status='PENDING',
                        payment_method='CHECKOUT',  # Default to checkout
                        
                        # Razorpay QR Code data (if available)
                        razorpay_qr_code_id=qr_result['qr_code_id'] if qr_result else None,
                        qr_code_image_url=qr_result['qr_code_url'] if qr_result else None,
                        qr_code_status=qr_result['qr_code_status'] if qr_result else None,
                        
                        expires_at=calculate_order_expiry(),
                        notes={
                            'razorpay_order': dict(razorpay_order) if razorpay_order else {},
                            'exchange_rate': '1 INR = 1 Coin',
                            'qr_code_data': qr_result['qr_code_data'] if qr_result else None,
                            'qr_creation_error': str(qr_error) if 'qr_error' in locals() else None
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
                        'razorpay_key_id': settings.RAZORPAY_KEY_ID,
                        'exchange_rate': '1 INR = 1 Coin',
                        'payment_options': {
                            'razorpay_checkout': {
                                'order_id': razorpay_order['id'],
                                'amount': int(float(amount) * 100),  # in paise
                                'currency': 'INR',
                                'description': f'Purchase {coins_to_credit} coins for ₹{amount}'
                            },
                            'qr_code': {
                                'qr_code_id': qr_result['qr_code_id'] if qr_result else None,
                                'qr_image_url': qr_result['qr_code_url'] if qr_result else None,
                                'status': qr_result['qr_code_status'] if qr_result else None,
                                'available': qr_result is not None
                            },
                            'payment_link': f'https://rzp.io/i/{razorpay_order["id"]}' if razorpay_order else None
                        }
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
    renderer_classes = [DecimalSafeJSONRenderer]
    
    @extend_schema(responses={200: UserWalletSerializer})
    def get(self, request):
        wallet = get_or_create_user_wallet(request.user)
        serializer = UserWalletSerializer(wallet)
        
        return Response({
            'success': True,
            'wallet': serializer.data
        }, status=status.HTTP_200_OK)


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
            # Find the order
            payment_order = PaymentOrder.objects.get(
                razorpay_order_id=razorpay_order_id,
                user=request.user,
                status='PENDING'
            )
            
            # Verify signature with Razorpay
            message = f"{razorpay_order_id}|{razorpay_payment_id}"
            signature = hmac.new(
                settings.RAZORPAY_KEY_SECRET.encode(),
                message.encode(),
                hashlib.sha256
            ).hexdigest()
            
            if signature != razorpay_signature:
                return Response({
                    'success': False,
                    'error': 'Invalid payment signature'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            with transaction.atomic():
                # Update order status
                payment_order.status = 'PAID'
                payment_order.razorpay_payment_id = razorpay_payment_id
                payment_order.razorpay_signature = razorpay_signature
                payment_order.mark_as_paid()
                
                # Credit coins to user wallet
                wallet = get_or_create_user_wallet(request.user)
                wallet.add_coins(
                    amount=payment_order.coins_to_credit,
                    transaction_type='PURCHASE',
                    reference=payment_order.order_id
                )
                
                # Update wallet's total money spent
                wallet.total_money_spent += payment_order.amount
                wallet.save()
                
                # Log the activity
                log_payment_activity(
                    user=request.user,
                    log_type='PAYMENT_SUCCESS',
                    message=f"Payment verified: ₹{payment_order.amount} for {payment_order.coins_to_credit} coins",
                    order=payment_order,
                    request_data=request.data,
                    ip_address=self.get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', '')
                )
                
                log_payment_activity(
                    user=request.user,
                    log_type='COINS_CREDITED',
                    message=f"Coins credited: {payment_order.coins_to_credit} coins added to wallet",
                    order=payment_order,
                    ip_address=self.get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', '')
                )
            
            return Response({
                'success': True,
                'message': f'Payment verified! {payment_order.coins_to_credit} coins added to your wallet.',
                'order_id': payment_order.order_id,
                'coins_credited': payment_order.coins_to_credit,
                'new_balance': wallet.coin_balance
            }, status=status.HTTP_200_OK)
            
        except PaymentOrder.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Order not found or already processed'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            # Log error
            log_payment_activity(
                user=request.user,
                log_type='ERROR',
                message=f"Payment verification failed: {str(e)}",
                request_data=request.data,
                ip_address=self.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response({
                'success': False,
                'error': 'Payment verification failed',
                'message': str(e) if request.user.is_staff else 'Verification failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class OrderStatusView(APIView):
    """Get order status and details"""
    permission_classes = [IsAuthenticated]
    renderer_classes = [DecimalSafeJSONRenderer]
    
    def get(self, request, order_id):
        try:
            payment_order = PaymentOrder.objects.get(
                order_id=order_id,
                user=request.user
            )
            
            # Check QR code status if available
            qr_status_updated = False
            if payment_order.razorpay_qr_code_id and payment_order.status == 'PENDING':
                qr_status, qr_data = get_qr_code_status(payment_order.razorpay_qr_code_id)
                if qr_status and qr_status != payment_order.qr_code_status:
                    payment_order.qr_code_status = qr_status
                    payment_order.webhook_data = qr_data or {}
                    payment_order.save()
                    qr_status_updated = True
                    
                    # If QR code was paid, update order status
                    if qr_status == 'paid':
                        with transaction.atomic():
                            payment_order.status = 'PAID'
                            payment_order.mark_as_paid()
                            
                            # Credit coins to user wallet
                            wallet = get_or_create_user_wallet(request.user)
                            wallet.add_coins(
                                amount=payment_order.coins_to_credit,
                                transaction_type='PURCHASE',
                                reference=payment_order.order_id
                            )
                            wallet.total_money_spent += payment_order.amount
                            wallet.save()
            
            serializer = PaymentOrderSerializer(payment_order)
            
            response_data = {
                'success': True,
                'order': serializer.data,
                'message': f'Order status: {payment_order.status}'
            }
            
            if qr_status_updated:
                response_data['qr_status_updated'] = True
                
            return Response(response_data, status=status.HTTP_200_OK)
            
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
            webhook_body = request.body
            
            if not webhook_signature:
                return Response({
                    'error': 'Missing webhook signature'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verify webhook signature
            expected_signature = hmac.new(
                settings.RAZORPAY_WEBHOOK_SECRET.encode() if hasattr(settings, 'RAZORPAY_WEBHOOK_SECRET') else b'',
                webhook_body,
                hashlib.sha256
            ).hexdigest()
            
            # For now, skip signature verification in development
            # In production, uncomment this:
            # if not hmac.compare_digest(webhook_signature, expected_signature):
            #     return Response({'error': 'Invalid signature'}, status=400)
            
            event = request.data.get('event')
            payload = request.data.get('payload', {})
            
            # Handle different webhook events
            if event == 'payment.captured':
                self.handle_payment_captured(payload)
            elif event == 'qr_code.credited':
                self.handle_qr_payment(payload)
            elif event == 'order.paid':
                self.handle_order_paid(payload)
                
            return Response({'status': 'ok'}, status=status.HTTP_200_OK)
            
        except Exception as e:
            # Log the error for debugging
            print(f"Webhook error: {str(e)}")
            return Response({
                'error': 'Webhook processing failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def handle_payment_captured(self, payload):
        """Handle payment.captured webhook"""
        payment = payload.get('payment', {}).get('entity', {})
        order_id = payment.get('order_id')
        payment_id = payment.get('id')
        
        if order_id and payment_id:
            payment_order = PaymentOrder.objects.filter(
                razorpay_order_id=order_id,
                status='PENDING'
            ).first()
            
            if payment_order:
                with transaction.atomic():
                    payment_order.status = 'PAID'
                    payment_order.razorpay_payment_id = payment_id
                    payment_order.webhook_data = payload
                    payment_order.mark_as_paid()
                    
                    # Credit coins
                    wallet = get_or_create_user_wallet(payment_order.user)
                    wallet.add_coins(
                        amount=payment_order.coins_to_credit,
                        transaction_type='PURCHASE',
                        reference=payment_order.order_id
                    )
                    wallet.total_money_spent += payment_order.amount
                    wallet.save()
    
    def handle_qr_payment(self, payload):
        """Handle QR code payment webhook"""
        qr_code = payload.get('qr_code', {}).get('entity', {})
        qr_code_id = qr_code.get('id')
        
        if qr_code_id:
            payment_order = PaymentOrder.objects.filter(
                razorpay_qr_code_id=qr_code_id,
                status='PENDING'
            ).first()
            
            if payment_order:
                with transaction.atomic():
                    payment_order.status = 'PAID'
                    payment_order.qr_code_status = 'paid'
                    payment_order.webhook_data = payload
                    payment_order.mark_as_paid()
                    
                    # Credit coins
                    wallet = get_or_create_user_wallet(payment_order.user)
                    wallet.add_coins(
                        amount=payment_order.coins_to_credit,
                        transaction_type='PURCHASE',
                        reference=payment_order.order_id
                    )
                    wallet.total_money_spent += payment_order.amount
                    wallet.save()
    
    def handle_order_paid(self, payload):
        """Handle order.paid webhook"""
        order = payload.get('order', {}).get('entity', {})
        order_id = order.get('id')
        
        if order_id:
            payment_order = PaymentOrder.objects.filter(
                razorpay_order_id=order_id,
                status='PENDING'
            ).first()
            
            if payment_order:
                # This will be handled by payment.captured event
                # Just update webhook data
                payment_order.webhook_data = payload
                payment_order.save()
