from rest_framework.permissions import BasePermission
from django.utils import timezone
from .models import UserFeature

class BaseProductPermission(BasePermission):
    """
    Base permission class that each product app will inherit from.
    Each product app will specify its feature_code.
    """
    feature_code = None  # Override this in each product app
    
    def has_permission(self, request, view):
        if not self.feature_code:
            raise NotImplementedError("feature_code must be set in the permission class")
            
        # Check authentication
        if not request.user or not request.user.is_authenticated:
            return False
            
        # Check feature access using the correct relationship
        try:
            user_feature = UserFeature.objects.get(
                user=request.user,
                feature__code=self.feature_code,  # Access feature.code via relationship
                is_active=True
            )
            
            # Use the model's built-in is_valid method which checks expiry
            return user_feature.is_valid()
            
        except UserFeature.DoesNotExist:
            return False

class RequireFeature(BasePermission):
    """
    Factory-style permission for dynamic feature checking
    Usage: permission_classes = [IsAuthenticated, RequireFeature('crm')]
    """
    def __init__(self, feature_code):
        self.feature_code = feature_code
        super().__init__()
    
    def has_permission(self, request, view):
        # Check authentication
        if not request.user or not request.user.is_authenticated:
            return False
            
        # Check feature access using correct relationship
        try:
            user_feature = UserFeature.objects.get(
                user=request.user,
                feature__code=self.feature_code,
                is_active=True
            )
            
            # Use the model's is_valid method
            return user_feature.is_valid()
            
        except UserFeature.DoesNotExist:
            return False

# Product-specific permissions
class CRMPermission(BaseProductPermission):
    feature_code = 'crm'

class AIBotPermission(BaseProductPermission):  
    feature_code = 'ai_bot'

class ReferlyPermission(BaseProductPermission):
    feature_code = 'referly'

class TimeTravelPermission(BaseProductPermission):
    feature_code = 'time_travel'

class TestProductPermission(BaseProductPermission):
    feature_code = 'test'

# Factory function for dynamic permissions
def create_feature_permission(feature_code):
    """
    Factory function to create permission classes for any feature
    Usage: permission_classes = [IsAuthenticated, create_feature_permission('crm')]
    """
    class DynamicFeaturePermission(BasePermission):
        def has_permission(self, request, view):
            if not request.user or not request.user.is_authenticated:
                return False
                
            try:
                user_feature = UserFeature.objects.get(
                    user=request.user,
                    feature__code=feature_code,
                    is_active=True
                )
                
                return user_feature.is_valid()
                
            except UserFeature.DoesNotExist:
                return False
    
    return DynamicFeaturePermission