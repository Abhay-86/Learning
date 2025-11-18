from django.urls import path
from . import views

app_name = 'referly'

urlpatterns = [
    # ========================= USER MANAGEMENT SECTION =========================
    
    # Folder Structure Endpoints
    path('folders/full/', views.FolderStructureView.as_view(), name='folder_structure'),
    path('folders/templates/', views.TemplatesFolderView.as_view(), name='templates_folder'),
    path('folders/resumes/', views.ResumesFolderView.as_view(), name='resumes_folder'),
    
    # Template Management
    path('templates/', views.TemplateListView.as_view(), name='template_list'),
    path('templates/create/', views.TemplateCreateView.as_view(), name='template_create'),
    path('templates/<int:template_id>/', views.TemplateDetailView.as_view(), name='template_detail'),
    path('templates/<int:template_id>/content/', views.TemplateContentView.as_view(), name='template_content'),
    
    # Resume Management
    path('resumes/', views.ResumeListView.as_view(), name='resume_list'),
    path('resumes/upload/', views.ResumeUploadView.as_view(), name='resume_upload'),
    path('resumes/<int:resume_id>/', views.ResumeDetailView.as_view(), name='resume_detail'),
    path('resumes/<int:resume_id>/file/', views.ResumeFileView.as_view(), name='resume_file'),
    path('resumes/<int:resume_id>/preview/', views.ResumePreviewView.as_view(), name='resume_preview'),
    path('resumes/<int:resume_id>/download/', views.ResumeDownloadView.as_view(), name='resume_download'),
    path('resumes/<int:resume_id>/email-format/', views.ResumeEmailFormatView.as_view(), name='resume_email_format'),

    # User Quota Management
    path('quota/', views.UserQuotaView.as_view(), name='user_quota'),
]