from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from decimal import Decimal
import uuid


class PaymentOrder(models.Model):
    """Payment order for coin purchases"""
    
    PAYMENT_STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PAID', 'Paid'),
        ('FAILED', 'Failed'),
        ('CANCELLED', 'Cancelled'),
        ('REFUNDED', 'Refunded'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('CHECKOUT', 'Razorpay Checkout'),
        ('QR_CODE', 'QR Code Payment'),
        ('UPI', 'UPI Payment'),
    ]
    
    order_id = models.CharField(max_length=50, unique=True)
    razorpay_order_id = models.CharField(max_length=100, blank=True, null=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True, null=True)
    razorpay_signature = models.CharField(max_length=255, blank=True, null=True)
    
    # QR Code specific fields
    razorpay_qr_code_id = models.CharField(max_length=100, blank=True, null=True)
    qr_code_image_url = models.URLField(blank=True, null=True)
    qr_code_status = models.CharField(max_length=20, blank=True, null=True)  # active, closed, paid
    
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE, related_name='payment_orders')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    coins_to_credit = models.PositiveIntegerField()
    currency = models.CharField(max_length=3, default='INR')
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='PENDING')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='CHECKOUT')
    
    # Legacy fields (will be removed after migration)
    qr_code = models.TextField(blank=True, null=True)  # Base64 encoded QR image
    upi_payment_url = models.URLField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField()
    paid_at = models.DateTimeField(blank=True, null=True)
    notes = models.JSONField(default=dict, blank=True)
    
    # Webhook data
    webhook_data = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Order {self.order_id} - ₹{self.amount} for {self.coins_to_credit} coins"
    
    def mark_as_paid(self):
        self.status = 'PAID'
        self.paid_at = timezone.now()
        self.save()


class UserWallet(models.Model):
    """User's coin wallet"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='wallet')
    coin_balance = models.PositiveIntegerField(default=0)
    total_coins_earned = models.PositiveIntegerField(default=0)  # Lifetime earnings
    total_coins_spent = models.PositiveIntegerField(default=0)   # Lifetime spending
    total_money_spent = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.coin_balance} coins"
    
    def add_coins(self, amount, transaction_type, reference=None):
        """Add coins to wallet and create transaction record"""
        self.coin_balance += amount
        self.total_coins_earned += amount
        self.save()
        
        # Create transaction record
        CoinTransaction.objects.create(
            user=self.user,
            transaction_type=transaction_type,
            amount=amount,
            balance_after=self.coin_balance,
            reference_id=reference,
            description=f"Added {amount} coins via {transaction_type}"
        )
    
    def deduct_coins(self, amount, transaction_type, reference=None):
        """Deduct coins from wallet if sufficient balance"""
        if self.coin_balance >= amount:
            self.coin_balance -= amount
            self.total_coins_spent += amount
            self.save()
            
            # Create transaction record
            CoinTransaction.objects.create(
                user=self.user,
                transaction_type=transaction_type,
                amount=-amount,  # Negative for deduction
                balance_after=self.coin_balance,
                reference_id=reference,
                description=f"Spent {amount} coins on {transaction_type}"
            )
            return True
        return False


class CoinTransaction(models.Model):
    """All coin transactions for audit trail"""
    TRANSACTION_TYPES = [
        ('PURCHASE', 'Coin Purchase'),
        ('FEATURE_BUY', 'Feature Purchase'),
        ('REDEMPTION', 'Coin Redemption'),
        ('BONUS', 'Bonus Coins'),
        ('REFUND', 'Refund'),
        ('ADMIN_CREDIT', 'Admin Credit'),
        ('ADMIN_DEBIT', 'Admin Debit'),
    ]
    
    transaction_id = models.CharField(max_length=100, unique=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='coin_transactions')
    
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.IntegerField()  # Positive for credit, negative for debit
    balance_after = models.PositiveIntegerField()
    
    reference_id = models.CharField(max_length=100, blank=True, null=True)  # Order ID, Feature ID, etc.
    description = models.TextField(blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.amount} coins ({self.transaction_type})"


class FeaturePurchase(models.Model):
    """Records of feature purchases using coins"""
    purchase_id = models.CharField(max_length=100, unique=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='feature_purchases')
    feature = models.ForeignKey('features.Feature', on_delete=models.CASCADE)
    
    coins_spent = models.PositiveIntegerField()
    duration_days = models.PositiveIntegerField(default=30)
    
    purchased_at = models.DateTimeField(auto_now_add=True)
    activated_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    transaction = models.OneToOneField(CoinTransaction, on_delete=models.CASCADE, null=True, blank=True)
    
    class Meta:
        ordering = ['-purchased_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.feature.name} ({self.coins_spent} coins)"


class CoinRedemption(models.Model):
    """Coin to money redemption requests"""
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('PAID', 'Paid'),
        ('REJECTED', 'Rejected'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    redemption_id = models.CharField(max_length=100, unique=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='coin_redemptions')
    
    coins_redeemed = models.PositiveIntegerField()
    amount_to_pay = models.DecimalField(max_digits=10, decimal_places=2)  # Amount in INR
    exchange_rate = models.DecimalField(max_digits=6, decimal_places=4)  # Coins per INR
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    # Bank details for payout
    bank_details = models.JSONField(default=dict, blank=True)
    
    requested_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    
    admin_notes = models.TextField(blank=True, null=True)
    transaction = models.OneToOneField(CoinTransaction, on_delete=models.CASCADE, null=True, blank=True)
    
    class Meta:
        ordering = ['-requested_at']
    
    def __str__(self):
        return f"Redemption {self.redemption_id} - {self.coins_redeemed} coins for ₹{self.amount_to_pay}"


class PaymentLog(models.Model):
    """Comprehensive logging for all payment activities"""
    LOG_TYPES = [
        ('ORDER_CREATED', 'Order Created'),
        ('PAYMENT_SUCCESS', 'Payment Success'),
        ('PAYMENT_FAILED', 'Payment Failed'),
        ('COINS_CREDITED', 'Coins Credited'),
        ('FEATURE_PURCHASED', 'Feature Purchased'),
        ('REDEMPTION_REQUEST', 'Redemption Requested'),
        ('WEBHOOK_RECEIVED', 'Webhook Received'),
        ('ERROR', 'Error Occurred'),
    ]
    
    log_id = models.CharField(max_length=100, unique=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payment_logs', null=True, blank=True)
    
    log_type = models.CharField(max_length=30, choices=LOG_TYPES)
    message = models.TextField()
    
    # Related objects
    order = models.ForeignKey(PaymentOrder, on_delete=models.SET_NULL, null=True, blank=True)
    transaction = models.ForeignKey(CoinTransaction, on_delete=models.SET_NULL, null=True, blank=True)
    redemption = models.ForeignKey(CoinRedemption, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Technical details
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)
    request_data = models.JSONField(default=dict, blank=True)
    response_data = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.log_type} - {self.message[:50]}..."


class CoinRate(models.Model):
    """Exchange rates for coins"""
    rate_type = models.CharField(max_length=20, choices=[
        ('PURCHASE', 'Purchase Rate'),
        ('REDEMPTION', 'Redemption Rate')
    ])
    coins_per_inr = models.DecimalField(max_digits=6, decimal_places=2)  # How many coins for 1 INR
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.rate_type}: {self.coins_per_inr} coins per ₹1"
