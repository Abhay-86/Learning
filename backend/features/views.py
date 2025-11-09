from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from drf_spectacular.utils import extend_schema
from accounts.models import IsCustomAdmin
from .serializers import UserFeatureToggleSerializer, UserFeatureSerializer, FeatureCreateSerializer
from django.contrib.auth.models import User

from .models import Feature, UserFeature
from .serializers import FeatureSerializer, UserFeatureSerializer


class FeatureListView(APIView):
    """List all available system features"""
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: FeatureSerializer(many=True)})
    def get(self, request):
        features = Feature.objects.all()
        serializer = FeatureSerializer(features, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserFeatureListView(APIView):
    """List all features assigned to the logged-in user"""
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: UserFeatureSerializer(many=True)})
    def get(self, request):
        user_features = UserFeature.objects.filter(user=request.user)
        serializer = UserFeatureSerializer(user_features, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class ToggleUserFeatureView(APIView):
    permission_classes = [IsCustomAdmin, IsAuthenticated]

    @extend_schema(
        request=UserFeatureToggleSerializer,
        responses={200: UserFeatureSerializer},
        description="Admin can activate/deactivate a feature for a user."
    )
    def post(self, request):
        serializer = UserFeatureToggleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_id = serializer.validated_data["user_id"]
        feature_id = serializer.validated_data["feature_id"]
        is_active = serializer.validated_data["is_active"]

        user = User.objects.get(id=user_id)
        feature = Feature.objects.get(id=feature_id)

        user_feature, _ = UserFeature.objects.get_or_create(user=user, feature=feature)
        user_feature.is_active = is_active
        user_feature.save()

        return Response({
            "message": "Feature toggled successfully!",
            "data": UserFeatureSerializer(user_feature).data
        }, status=status.HTTP_200_OK)
class FeatureCreateView(APIView):
    """Admin-only endpoint to create a new product/feature"""
    permission_classes = [IsAuthenticated, IsCustomAdmin]

    @extend_schema(request=FeatureCreateSerializer, responses={201: FeatureSerializer})
    def post(self, request):
        serializer = FeatureCreateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Product created successfully!", "data": serializer.data},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)