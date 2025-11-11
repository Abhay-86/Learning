from decimal import Decimal
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
from .razorpay_client import client as razorpay_client
import json


def decimal_serializer(obj):
    """JSON serializer for Decimal objects"""
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")


def create_razorpay_qr_code(amount, order_id, coins_to_credit, user):
    """Create Razorpay QR Code for payment"""
    try:
        # Ensure amount is properly converted to float/int for API
        amount_float = float(amount) if isinstance(amount, Decimal) else amount
        
        qr_data = {
            'type': 'upi_qr',
            'name': f'Coin Purchase - {coins_to_credit} coins',
            'usage': 'single_use',
            'fixed_amount': True,
            'payment_amount': int(amount_float * 100),  # Convert to paise
            'description': f'Purchase {coins_to_credit} coins for ₹{amount_float}',
            'customer_id': str(user.id),
            'notes': {
                'order_id': order_id,
                'user_id': str(user.id),
                'username': user.username,
                'coins_to_credit': str(coins_to_credit),
                'purpose': 'coin_purchase'
            }
        }
        
        qr_code = razorpay_client.qrcode.create(qr_data)
        
        return {
            'qr_code_id': qr_code['id'],
            'qr_code_url': qr_code['image_url'],
            'qr_code_status': qr_code['status'],
            'qr_code_data': qr_code
        }
    except Exception as e:
        print(f"Razorpay QR Code creation error: {e}")
        return None


def get_qr_code_status(qr_code_id):
    """Get QR code status from Razorpay"""
    try:
        qr_code = razorpay_client.qrcode.fetch(qr_code_id)
        return qr_code.get('status'), qr_code
    except Exception as e:
        print(f"QR Code status fetch error: {e}")
        return None, None


def close_qr_code(qr_code_id):
    """Close/deactivate QR code"""
    try:
        result = razorpay_client.qrcode.close(qr_code_id)
        return result
    except Exception as e:
        print(f"QR Code close error: {e}")
        return None


# Legacy functions (deprecated - kept for backward compatibility)
def generate_qr_code(upi_url):
    """Generate QR code for UPI payment - DEPRECATED: Use create_razorpay_qr_code instead"""
    # This function is deprecated in favor of Razorpay's native QR codes
    return None


def create_upi_url(amount, order_id, merchant_name="YourApp"):
    """Create UPI payment URL - DEPRECATED: Use create_razorpay_qr_code instead"""
    # This is now deprecated in favor of Razorpay QR codes
    upi_id = "merchant@upi"  # Replace with your actual UPI ID
    amount_str = f"{amount:.2f}"
    
    upi_url = f"upi://pay?pa={upi_id}&pn={merchant_name}&am={amount_str}&tr={order_id}&tn=Coin Purchase Order {order_id}"
    return upi_url


def calculate_coins_for_amount(amount):
    """Calculate coins for given amount (1 INR = 1 Coin)"""
    return int(amount)


def get_coin_exchange_rate():
    """Get current coin exchange rate"""
    # For now, fixed rate: 1 INR = 1 Coin
    return Decimal('1.00')


def calculate_order_expiry():
    """Calculate order expiry time (24 hours from now)"""
    return timezone.now() + timedelta(hours=24)


def log_payment_activity(user, log_type, message, order=None, **kwargs):
    """Helper function to log payment activities"""
    from ..models import PaymentLog
    
    try:
        # Convert any Decimal objects to float for JSON serialization
        request_data = kwargs.get('request_data', {})
        response_data = kwargs.get('response_data', {})
        
        # Safely serialize data that might contain Decimal objects
        if request_data:
            request_data = json.loads(json.dumps(request_data, default=decimal_serializer))
        if response_data:
            response_data = json.loads(json.dumps(response_data, default=decimal_serializer))
        
        PaymentLog.objects.create(
            user=user,
            log_type=log_type,
            message=message,
            order=order,
            request_data=request_data,
            response_data=response_data,
            ip_address=kwargs.get('ip_address'),
            user_agent=kwargs.get('user_agent')
        )
    except Exception as e:
        # If logging fails, don't break the main flow
        print(f"Logging failed: {str(e)}")


def get_or_create_user_wallet(user):
    """Get or create user wallet"""
    from ..models import UserWallet
    
    wallet, created = UserWallet.objects.get_or_create(
        user=user,
        defaults={
            'coin_balance': 0,
            'total_coins_earned': 0,
            'total_coins_spent': 0,
            'total_money_spent': Decimal('0.00')
        }
    )
    return wallet