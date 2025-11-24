from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    GoogleLoginView,
    ProfileView,
    DashboardView,
    CookieTokenRefreshView,
    LogoutView,
    SendOTPEmailView,   
    VerifyOTPEmailView,
)


urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('google-login/', GoogleLoginView.as_view(), name='google-login'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('send-email/', SendOTPEmailView.as_view(), name='send-email'),
    path('verify-email/', VerifyOTPEmailView.as_view(), name='verify-email'),
]

