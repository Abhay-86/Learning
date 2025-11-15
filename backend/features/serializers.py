from rest_framework import serializers
from .models import Feature, UserFeature


class FeatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feature
        fields = ['id', 'name', 'code', 'description', 'status']


class UserFeatureSerializer(serializers.ModelSerializer):
    feature = FeatureSerializer(read_only=True)

    class Meta:
        model = UserFeature
        fields = ['id', 'feature', 'is_active', 'activated_on', 'expires_on']

class FeatureCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feature
        fields = ['id', 'name', 'code', 'description']

class UserFeatureToggleSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    feature_id = serializers.IntegerField()
    is_active = serializers.BooleanField()

class FeatureDeleteSerializer(serializers.Serializer):
    feature_id = serializers.IntegerField()
