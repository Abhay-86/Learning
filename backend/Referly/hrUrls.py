from django.urls import path
from . import views

app_name = 'referly_hr'

urlpatterns = [
    
    # ========================= COMPANY MANAGEMENT =========================
    
    # Company CRUD Operations
    path('companies/', views.CompanyListView.as_view(), name='company_list'),
    path('companies/create/', views.CompanyCreateView.as_view(), name='company_create'),
    path('companies/search/', views.CompanySearchView.as_view(), name='company_search'),
    path('companies/<str:company_id>/', views.CompanyDetailView.as_view(), name='company_detail'),
    
    # ========================= HR CONTACT MANAGEMENT =========================
    
    # HR Contact CRUD Operations
    path('contacts/', views.HRContactListView.as_view(), name='hr_contact_list'),
    path('contacts/create/', views.HRContactCreateView.as_view(), name='hr_contact_create'),
    path('contacts/search/', views.HRContactSearchView.as_view(), name='hr_contact_search'),
    path('contacts/<int:hr_id>/', views.HRContactDetailView.as_view(), name='hr_contact_detail'),
    path('contacts/by-company/<str:company_id>/', views.HRContactByCompanyView.as_view(), name='hr_by_company'),
    
    # HR Contact Verification Operations
    path('contacts/<int:hr_id>/verify-email/', views.VerifyHREmailView.as_view(), name='verify_hr_email'),
    path('contacts/<int:hr_id>/verify-linkedin/', views.VerifyHRLinkedInView.as_view(), name='verify_hr_linkedin'),
    
    # ========================= ANALYTICS & STATISTICS =========================
    
    # Statistics & Analytics
    path('stats/companies/', views.CompanyStatsView.as_view(), name='company_stats'),
    path('stats/contacts/', views.HRContactStatsView.as_view(), name='hr_contact_stats'),
    
]