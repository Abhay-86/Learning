from rest_framework import serializers
from django.contrib.auth.models import User
from .models import CustomUser
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password

class RegisterSerializer(serializers.ModelSerializer):
    phone_number = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = (
                'username',
                'password',
                'confirm_password',
                'email',
                'first_name',
                'last_name',
                'phone_number',
            )
    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        phone_number = validated_data.pop('phone_number', None)
        validated_data.pop('confirm_password', None)
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            email=validated_data.get('email', ''),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            is_active=True
        )
        CustomUser.objects.create(
            user=user,
            phone_number=phone_number,
            is_verified=False
        )
        return user
    
class UserSerializer(serializers.ModelSerializer):
    phone_number = serializers.CharField(source='custom_user.phone_number', read_only=True)
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'phone_number')

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        if not username or not password:
            raise serializers.ValidationError("Both username and password are required.")
        # exsistence of user shouldn't be checked here, moved as this will releve the all the user before 
        # But that’s actually less secure, because it reveals to an attacker which usernames exist in your system (called user enumeration).
        # if not User.objects.filter(username=username).exists():
            # raise serializers.ValidationError("User does not exist.")

        user = authenticate(username=username, password=password)

        if not user:
            raise serializers.ValidationError("Invalid username or password.")
        
        if not user.is_active:
            raise serializers.ValidationError("User account is disabled.")
        
        attrs['user'] = user
        return attrs