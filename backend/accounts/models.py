from django.contrib.auth.models import User
from django.db import models

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

    

    def __str__(self):
        return self.user.username
