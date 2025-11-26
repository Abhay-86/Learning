from django.urls import path
from . import views

app_name = 'referly'

urlpatterns = [
    # Folder Structure Endpoints
    path('folders/full/', views.FolderStructureView.as_view(), name='folder_structure'),
    path('folders/templates/', views.TemplatesFolderView.as_view(), name='templates_folder'),
    path('folders/resumes/', views.ResumesFolderView.as_view(), name='resumes_folder'),
    
    # Template Endpoints
    path('templates/', views.TemplateListView.as_view(), name='template_list'),
    path('templates/create/', views.TemplateCreateView.as_view(), name='template_create'),
    path('templates/<int:template_id>/', views.TemplateDetailView.as_view(), name='template_detail'),
    path('templates/<int:template_id>/content/', views.TemplateContentView.as_view(), name='template_content'),
    
    # Resume Endpoints
    path('resumes/', views.ResumeListView.as_view(), name='resume_list'),
    path('resumes/upload/', views.ResumeUploadView.as_view(), name='resume_upload'),
    path('resumes/<int:resume_id>/', views.ResumeDetailView.as_view(), name='resume_detail'),
    path('resumes/<int:resume_id>/file/', views.ResumeFileView.as_view(), name='resume_file'),
    path('resumes/<int:resume_id>/preview/', views.ResumePreviewView.as_view(), name='resume_preview'),
    path('resumes/<int:resume_id>/download/', views.ResumeDownloadView.as_view(), name='resume_download'),
    path('resumes/<int:resume_id>/email-format/', views.ResumeEmailFormatView.as_view(), name='resume_email_format'),

    # Company Management Endpoints
    path('companies/', views.CompanyListView.as_view(), name='company_list'),
    path('companies/create/', views.CompanyCreateView.as_view(), name='company_create'),
    path('companies/search/', views.CompanySearchView.as_view(), name='company_search'),
    path('companies/<str:company_id>/', views.CompanyDetailView.as_view(), name='company_detail'),
    
    # HR Contact Management Endpoints  
    path('hr-contacts/', views.HRContactListView.as_view(), name='hr_contact_list'),
    path('hr-contacts/create/', views.HRContactCreateView.as_view(), name='hr_contact_create'),
    path('hr-contacts/search/', views.HRContactSearchView.as_view(), name='hr_contact_search'),
    path('hr-contacts/<int:hr_id>/', views.HRContactDetailView.as_view(), name='hr_contact_detail'),
    path('hr-contacts/by-company/<str:company_id>/', views.HRContactByCompanyView.as_view(), name='hr_by_company'),
    
    # HR Contact Verification Endpoints
    path('hr-contacts/<int:hr_id>/verify-email/', views.VerifyHREmailView.as_view(), name='verify_hr_email'),
    path('hr-contacts/<int:hr_id>/verify-linkedin/', views.VerifyHRLinkedInView.as_view(), name='verify_hr_linkedin'),
    
    # Statistics Endpoints
    path('stats/companies/', views.CompanyStatsView.as_view(), name='company_stats'),
    path('stats/hr-contacts/', views.HRContactStatsView.as_view(), name='hr_contact_stats'),
    
    # Bulk Upload Endpoints (Admin only)
    path('bulk-upload/companies/', views.CompanyBulkUploadView.as_view(), name='company_bulk_upload'),
    path('bulk-upload/hr-contacts/', views.HRContactBulkUploadView.as_view(), name='hr_contact_bulk_upload'),
    
    # User Quota Endpoint
    path('quota/', views.UserQuotaView.as_view(), name='user_quota'),
    
    # Job Management Endpoints
    path('jobs/', views.JobListView.as_view(), name='job_list'),
    path('jobs/create/', views.JobCreateView.as_view(), name='job_create'),
    path('jobs/search/', views.JobSearchView.as_view(), name='job_search'),
    path('jobs/<int:job_id>/', views.JobDetailView.as_view(), name='job_detail'),
    path('jobs/by-company/<str:company_id>/', views.JobsByCompanyView.as_view(), name='jobs_by_company'),
]