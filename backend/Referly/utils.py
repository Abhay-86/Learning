"""
Utility functions for Referly app
Generates VSCode-like file structure JSON
"""
from django.utils import timezone
from datetime import timedelta
import uuid

from .models import Template, Resume, TemporaryWorkspace, UserQuota


def generate_file_structure(user):
    """
    Generate VSCode-like file structure JSON for a user
    
    Returns:
    {
        "templates": {
            "name": "Templates (2/3)",
            "type": "folder", 
            "children": [...]
        },
        "resumes": {
            "name": "Resumes (1/2)",
            "type": "folder",
            "children": [...]
        },
        "drafts": {
            "name": "Drafts",
            "type": "folder", 
            "children": [...]
        }
    }
    """
    # Get user's quota
    try:
        quota = user.referly_quota
    except:
        quota = UserQuota.objects.create(user=user)
    
    # Get templates
    templates = Template.objects.filter(user=user, is_deleted=False).order_by('template_number')
    template_children = []
    
    for template in templates:
        template_children.append({
            'id': f'template_{template.template_number}',
            'name': template.display_name,
            'type': 'file',
            'extension': 'html',
            'metadata': {
                'template_number': template.template_number,
                'internal_name': template.name,
                'created_at': template.created_at.isoformat(),
                'can_edit': True,
                'file_type': 'template'
            }
        })
    
    # Get resumes
    resumes = Resume.objects.filter(user=user, is_deleted=False).order_by('resume_number')
    resume_children = []
    
    for resume in resumes:
        resume_children.append({
            'id': f'resume_{resume.resume_number}',
            'name': resume.display_name,
            'type': 'file',
            'extension': 'pdf',
            'metadata': {
                'resume_number': resume.resume_number,
                'title': resume.title,
                'file_size': resume.file_size,
                'file_url': resume.pdf_file.url if resume.pdf_file else None,
                'created_at': resume.created_at.isoformat(),
                'can_download': True,
                'file_type': 'resume'
            }
        })
    
    # Get drafts from temporary workspace
    draft_children = []
    temp_workspace = TemporaryWorkspace.objects.filter(user=user).first()
    
    if temp_workspace:
        # Template drafts
        for draft_id, draft_data in temp_workspace.draft_templates.items():
            draft_children.append({
                'id': draft_id,
                'name': f"{draft_data.get('name', 'untitled')}.html",
                'type': 'file',
                'extension': 'html',
                'metadata': {
                    'is_draft': True,
                    'draft_type': 'template',
                    'created_at': draft_data.get('created_at'),
                    'can_save_as': True,
                    'file_type': 'draft'
                }
            })
        
        # Resume drafts
        for draft_id, draft_data in temp_workspace.draft_resumes.items():
            draft_children.append({
                'id': draft_id,
                'name': f"{draft_data.get('title', 'untitled')}.pdf",
                'type': 'file',
                'extension': 'pdf',
                'metadata': {
                    'is_draft': True,
                    'draft_type': 'resume',
                    'created_at': draft_data.get('created_at'),
                    'can_save_as': True,
                    'file_type': 'draft'
                }
            })
    
    # Build complete file structure
    file_structure = {
        'templates': {
            'id': 'templates_folder',
            'name': f'Templates ({quota.templates_used}/{quota.template_limit})',
            'type': 'folder',
            'children': template_children,
            'metadata': {
                'can_create_new': quota.can_create_template(),
                'usage': quota.templates_used,
                'limit': quota.template_limit,
                'folder_type': 'templates'
            }
        },
        'resumes': {
            'id': 'resumes_folder', 
            'name': f'Resumes ({quota.resumes_used}/{quota.resume_limit})',
            'type': 'folder',
            'children': resume_children,
            'metadata': {
                'can_upload_new': quota.can_create_resume(),
                'usage': quota.resumes_used,
                'limit': quota.resume_limit,
                'folder_type': 'resumes'
            }
        }
    }
    
    # Only add drafts folder if there are drafts
    if draft_children:
        file_structure['drafts'] = {
            'id': 'drafts_folder',
            'name': 'Drafts',
            'type': 'folder',
            'children': draft_children,
            'metadata': {
                'folder_type': 'drafts',
                'draft_count': len(draft_children)
            }
        }
    
    return file_structure


def get_quota_status(user):
    """Get user's quota status for API responses"""
    try:
        quota = user.referly_quota
    except:
        quota = UserQuota.objects.create(user=user)
    
    return {
        'templates': {
            'used': quota.templates_used,
            'limit': quota.template_limit,
            'can_create': quota.can_create_template(),
            'remaining': quota.template_limit - quota.templates_used
        },
        'resumes': {
            'used': quota.resumes_used,
            'limit': quota.resume_limit,
            'can_create': quota.can_create_resume(),
            'remaining': quota.resume_limit - quota.resumes_used
        },
        'coin_balance': user.wallet.coin_balance if hasattr(user, 'wallet') else 0
    }


def create_session_id():
    """Generate unique session ID for temporary workspace"""
    return f"session_{uuid.uuid4().hex[:16]}"


def cleanup_expired_sessions():
    """Cleanup expired temporary workspace sessions"""
    # Remove sessions older than 24 hours
    cutoff_time = timezone.now() - timedelta(hours=24)
    expired_count = TemporaryWorkspace.objects.filter(expires_at__lt=cutoff_time).count()
    TemporaryWorkspace.objects.filter(expires_at__lt=cutoff_time).delete()
    
    return f"Cleaned up {expired_count} expired sessions"