from rest_framework import serializers
from .models import PaymentOrder, UserWallet, CoinTransaction, PaymentLog
from decimal import Decimal


class CreateOrderSerializer(serializers.Serializer):
    """Serializer for creating coin purchase orders"""
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('1.00'))
    
    def validate_amount(self, value):
        # Minimum order amount validation
        if value < Decimal('10.00'):
            raise serializers.ValidationError("Minimum order amount is ₹10")
        if value > Decimal('50000.00'):
            raise serializers.ValidationError("Maximum order amount is ₹50,000")
        return value


class PaymentOrderSerializer(serializers.ModelSerializer):
    """Serializer for payment order response"""
    
    class Meta:
        model = PaymentOrder
        fields = [
            'order_id', 'razorpay_order_id', 'amount', 'coins_to_credit',
            'currency', 'status', 'qr_code', 'upi_payment_url',
            'created_at', 'expires_at'
        ]
        read_only_fields = fields


class UserWalletSerializer(serializers.ModelSerializer):
    """Serializer for user wallet info"""
    
    class Meta:
        model = UserWallet
        fields = [
            'coin_balance', 'total_coins_earned', 'total_coins_spent', 
            'total_money_spent', 'created_at', 'updated_at'
        ]
        read_only_fields = fields


class CoinTransactionSerializer(serializers.ModelSerializer):
    """Serializer for coin transaction history"""
    
    class Meta:
        model = CoinTransaction
        fields = [
            'transaction_id', 'transaction_type', 'amount', 'balance_after',
            'reference_id', 'description', 'created_at'
        ]
        read_only_fields = fields