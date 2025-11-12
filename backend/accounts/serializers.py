from rest_framework import serializers
from django.contrib.auth.models import User
from .models import CustomUser, EmailOTP
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password

class RegisterSerializer(serializers.ModelSerializer):
    phone_number = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True, required=True)
    role = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = (
            'email',
            'password',
            'confirm_password',
            'first_name',
            'last_name',
            'phone_number',
            'role',
        )

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        phone_number = validated_data.pop('phone_number', None)
        validated_data.pop('confirm_password', None)
        email = validated_data.get('email')

        # generate username from email
        username = email.split('@')[0]

        user = User.objects.create_user(
            username=username,
            password=validated_data['password'],
            email=email,
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            is_active=True
        )

        CustomUser.objects.create(
            user=user,
            phone_number=phone_number,
            is_verified=False,
            role='USER'
        )

        return user
    
class UserSerializer(serializers.ModelSerializer):
    phone_number = serializers.CharField(source='custom_user.phone_number', read_only=True)
    role = serializers.CharField(source='custom_user.role', read_only=True)
    is_verified = serializers.BooleanField(source='custom_user.is_verified', read_only=True)
    
    # Wallet information
    coin_balance = serializers.SerializerMethodField()
    total_coins_earned = serializers.SerializerMethodField()
    total_coins_spent = serializers.SerializerMethodField()
    total_money_spent = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name', 
            'phone_number', 'role', 'is_verified',
            'coin_balance', 'total_coins_earned', 'total_coins_spent', 'total_money_spent'
        )
    
    def get_coin_balance(self, obj):
        """Get user's current coin balance"""
        if hasattr(obj, 'wallet'):
            return obj.wallet.coin_balance
        return 0
    
    def get_total_coins_earned(self, obj):
        """Get user's total coins earned"""
        if hasattr(obj, 'wallet'):
            return obj.wallet.total_coins_earned
        return 0
    
    def get_total_coins_spent(self, obj):
        """Get user's total coins spent"""
        if hasattr(obj, 'wallet'):
            return obj.wallet.total_coins_spent
        return 0
    
    def get_total_money_spent(self, obj):
        """Get user's total money spent"""
        if hasattr(obj, 'wallet'):
            return str(obj.wallet.total_money_spent)
        return "0.00"

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if not email or not password:
            raise serializers.ValidationError("Both email and password are required.")
        # exsistence of user shouldn't be checked here, moved as this will releve the all the user before 
        # But that’s actually less secure, because it reveals to an attacker which usernames exist in your system (called user enumeration).
        # if not User.objects.filter(username=username).exists():
            # raise serializers.ValidationError("User does not exist.")

        try:
            user_obj = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid email or password.")

        # Authenticate using username internally
        user = authenticate(username=user_obj.username, password=password)

        if not user:
            raise serializers.ValidationError("Invalid email or password.")

        if not user.is_active:
            raise serializers.ValidationError("User account is disabled.")

        attrs['user'] = user
        return attrs

class SendOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email does not exist.")
        return value

    def create(self, validated_data):
        email = validated_data["email"]
        user = User.objects.get(email=email)
        otp_code = EmailOTP.generate_otp()
        EmailOTP.objects.create(user=user, otp=otp_code)

        # send the OTP email
        from django.core.mail import send_mail
        send_mail(
            subject="Your OTP Code",
            message=f"Your verification code is {otp_code}",
            from_email="abhay.singh@auraml.com",
            recipient_list=[email],
        )
        return {"message": "OTP sent successfully!"}


class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)

    def validate(self, data):
        email = data.get("email")
        otp = data.get("otp")

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found")

        otp_entry = EmailOTP.objects.filter(user=user, otp=otp, is_used=False).last()
        if not otp_entry:
            raise serializers.ValidationError("Invalid OTP")

        if otp_entry.is_expired():
            raise serializers.ValidationError("OTP expired")

        otp_entry.is_used = True
        otp_entry.save()

        # mark verified
        custom_user = user.custom_user
        custom_user.is_verified = True
        custom_user.save()

        return {"message": "Email verified successfully!"}
