from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta


class Feature(models.Model):
    """All possible system features/modules"""
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, default='active')  # e.g., active, deprecated , inactive, upcoming

    def __str__(self):
        return self.name


class UserFeature(models.Model):
    """Tracks which user has which features active"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_features')
    feature = models.ForeignKey(Feature, on_delete=models.CASCADE, related_name='feature_users')
    is_active = models.BooleanField(default=False)
    activated_on = models.DateTimeField(auto_now_add=True)
    expires_on = models.DateTimeField(null=True, blank=True)

    def activate(self, days=30):
        self.is_active = True
        self.activated_on = timezone.now()
        self.expires_on = timezone.now() + timedelta(days=days)
        self.save()

    def deactivate(self):
        self.is_active = False
        self.save()

    def is_valid(self):
        return self.is_active and (self.expires_on is None or self.expires_on > timezone.now())

    def __str__(self):
        return f"{self.user.username} - {self.feature.name} ({'Active' if self.is_active else 'Inactive'})"
