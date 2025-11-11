import qrcode
import io
import base64
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta


def generate_qr_code(upi_url):
    """Generate QR code for UPI payment"""
    try:
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(upi_url)
        qr.make(fit=True)

        # Create QR code image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        
        qr_base64 = base64.b64encode(buffer.getvalue()).decode()
        return f"data:image/png;base64,{qr_base64}"
    
    except Exception as e:
        return None


def create_upi_url(amount, order_id, merchant_name="YourApp"):
    """Create UPI payment URL"""
    # UPI URL format for QR code
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
    from .models import PaymentLog
    
    try:
        PaymentLog.objects.create(
            user=user,
            log_type=log_type,
            message=message,
            order=order,
            request_data=kwargs.get('request_data', {}),
            response_data=kwargs.get('response_data', {}),
            ip_address=kwargs.get('ip_address'),
            user_agent=kwargs.get('user_agent')
        )
    except Exception as e:
        # If logging fails, don't break the main flow
        print(f"Logging failed: {str(e)}")


def get_or_create_user_wallet(user):
    """Get or create user wallet"""
    from .models import UserWallet
    
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