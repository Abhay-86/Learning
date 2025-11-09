from django.contrib.auth.models import User
from django.db import models
import random
from datetime import timedelta
from django.utils import timezone
from rest_framework.permissions import BasePermission

# Create your models here.
class CustomUser(models.Model):
    ROLE_CHOICES = [
        ('ADMIN', 'Admin'),
        ('MANAGER', 'Manager'),
        ('USER', 'User'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='custom_user')
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='USER')
    is_verified = models.BooleanField(default=False)

    

    def __str__(self):
        return self.user.username

class EmailOTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='email_otps')
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def is_expired(self):
        # OTP valid for 5 minutes
        return timezone.now() > self.created_at + timedelta(minutes=5)

    @staticmethod
    def generate_otp():
        return str(random.randint(100000, 999999))


class IsCustomAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and hasattr(request.user, 'custom_user')
            and request.user.custom_user.role == 'ADMIN'
        )