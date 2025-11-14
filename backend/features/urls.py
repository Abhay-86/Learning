from django.urls import path
from .views import FeatureListView, UserFeatureListView, ToggleUserFeatureView, FeatureCreateView, FeatureDeleteView

urlpatterns = [
    path('features/', FeatureListView.as_view(), name='feature-list'),
    path('features/create/', FeatureCreateView.as_view(), name='feature-create'),
    path('features/<int:feature_id>/', FeatureDeleteView.as_view(), name='delete-feature'),
    path('user/features/', UserFeatureListView.as_view(), name='user-feature-list'),
    path('features/toggle/', ToggleUserFeatureView.as_view(), name='toggle-feature'),
]
