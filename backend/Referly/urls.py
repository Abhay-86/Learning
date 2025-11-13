from django.urls import path
from .views import (
    QuotaStatusView, QuotaPurchaseView,
    TemplateListView, TemplateDetailView,
    ResumeListView, ResumeDetailView, ResumeUploadView,
    WorkspaceSyncView, TemplateDraftView, SaveDraftAsTemplateView
)

app_name = 'referly'

urlpatterns = [
    # Quota Management
    path('quota/status/', QuotaStatusView.as_view(), name='quota-status'),
    path('quota/purchase/', QuotaPurchaseView.as_view(), name='quota-purchase'),
    
    # Template Management
    path('templates/', TemplateListView.as_view(), name='template-list'),
    path('templates/<int:pk>/', TemplateDetailView.as_view(), name='template-detail'),
    
    # Resume Management
    path('resumes/', ResumeListView.as_view(), name='resume-list'),
    path('resumes/<int:pk>/', ResumeDetailView.as_view(), name='resume-detail'),
    path('resumes/<int:pk>/upload/', ResumeUploadView.as_view(), name='resume-upload'),
    
    # Workspace Management (30-second sync)
    path('workspace/sync/', WorkspaceSyncView.as_view(), name='workspace-sync'),
    path('workspace/add-draft/', TemplateDraftView.as_view(), name='add-template-draft'),
    path('workspace/save-draft/', SaveDraftAsTemplateView.as_view(), name='save-draft-as-template'),
]

# API Endpoints Documentation:
# GET    /api/referly/quota/status/              - Get quota status + file structure
# POST   /api/referly/quota/purchase/            - Purchase additional slots

# GET    /api/referly/templates/                 - List user templates
# POST   /api/referly/templates/                 - Create new template (quota checked)
# GET    /api/referly/templates/{id}/            - Get specific template
# PUT    /api/referly/templates/{id}/            - Update template
# DELETE /api/referly/templates/{id}/            - Delete template (soft delete)

# GET    /api/referly/resumes/                   - List user resumes
# POST   /api/referly/resumes/                   - Create new resume (quota checked)
# GET    /api/referly/resumes/{id}/              - Get specific resume
# PUT    /api/referly/resumes/{id}/              - Update resume
# DELETE /api/referly/resumes/{id}/              - Delete resume (soft delete)
# POST   /api/referly/resumes/{id}/upload/       - Upload PDF file

# POST   /api/referly/workspace/sync/            - Sync workspace (30-second)
# POST   /api/referly/workspace/add-draft/       - Add template draft
# POST   /api/referly/workspace/save-draft/      - Save draft as permanent template