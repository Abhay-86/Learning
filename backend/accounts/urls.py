from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView,
    LoginView,
    ProfileView,
    CookieTokenRefreshView,
    LogoutView,
    SendOTPEmailView,   
    VerifyOTPEmailView,
    CompleteProfileView,
    # School Management ViewSets
    SchoolViewSet,
    SubjectViewSet,
    ClassViewSet,
    StudentViewSet,
    ParentViewSet,
    TeacherViewSet,
    GradeViewSet,
    AssignmentViewSet,
    AssignmentSubmissionViewSet,
    AttendanceViewSet,
    FeeViewSet,
    FeePaymentViewSet,
    EventViewSet,
    DashboardView,
)

# Create router for ViewSets
router = DefaultRouter()
router.register(r'schools', SchoolViewSet)
router.register(r'subjects', SubjectViewSet)
router.register(r'classes', ClassViewSet)
router.register(r'students', StudentViewSet)
router.register(r'parents', ParentViewSet)
router.register(r'teachers', TeacherViewSet)
router.register(r'grades', GradeViewSet)
router.register(r'assignments', AssignmentViewSet)
router.register(r'submissions', AssignmentSubmissionViewSet)
router.register(r'attendance', AttendanceViewSet)
router.register(r'fees', FeeViewSet)
router.register(r'payments', FeePaymentViewSet)
router.register(r'events', EventViewSet)

urlpatterns = [
    # Authentication endpoints
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('send-email/', SendOTPEmailView.as_view(), name='send-email'),
    path('verify-email/', VerifyOTPEmailView.as_view(), name='verify-email'),
    path('complete-profile/', CompleteProfileView.as_view(), name='complete-profile'),
    
    # Dashboard endpoint
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    
    # School Management API endpoints
    path('', include(router.urls)),
]

