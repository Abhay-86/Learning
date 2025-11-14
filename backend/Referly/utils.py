from .models import Template, Resume, UserQuota


class FolderStructureManager:
    """Utility class for generating folder structures"""
    
    @staticmethod
    def get_templates_structure(user):
        """Return only templates folder structure"""
        quota, _ = UserQuota.objects.get_or_create(user=user)
        templates = Template.objects.filter(user=user, is_active=True).order_by('user_template_id')
        
        return {
            "name": "Templates",
            "type": "folder",
            "id": "templates_folder",
            "usage": f"{quota.current_templates}/{quota.max_templates}",
            "can_create": quota.can_create_template(),
            "children": [
                {
                    "id": t.id,
                    "user_id": t.user_template_id,
                    "name": f"Template #{t.user_template_id} - {t.name}.html",
                    "display_name": f"{t.name}.html",
                    "type": "file",
                    "extension": "html",
                    "created_at": t.created_at.isoformat(),
                    "updated_at": t.updated_at.isoformat(),
                    "size": len(t.html_content.encode('utf-8'))
                } for t in templates
            ]
        }

    @staticmethod
    def get_resumes_structure(user):
        """Return only resumes folder structure"""
        quota, _ = UserQuota.objects.get_or_create(user=user)
        resumes = Resume.objects.filter(user=user, is_active=True).order_by('user_resume_id')
        
        return {
            "name": "Resumes", 
            "type": "folder",
            "id": "resumes_folder",
            "usage": f"{quota.current_resumes}/{quota.max_resumes}",
            "can_create": quota.can_create_resume(),
            "children": [
                {
                    "id": r.id,
                    "user_id": r.user_resume_id,
                    "name": f"Resume #{r.user_resume_id} - {r.name}.{r.file_extension}",
                    "display_name": f"{r.name}.{r.file_extension}",
                    "type": "file",
                    "extension": r.file_extension,
                    "created_at": r.created_at.isoformat(),
                    "updated_at": r.updated_at.isoformat(),
                    "size": r.file_size,
                    "size_formatted": f"{r.file_size // 1024}KB" if r.file_size < 1024*1024 else f"{r.file_size // (1024*1024)}MB"
                } for r in resumes
            ]
        }
    
    @staticmethod
    def get_full_structure(user):
        """Return complete folder structure with both templates and resumes"""
        return {
            "name": "Referly",
            "type": "folder",
            "id": "root",
            "children": [
                FolderStructureManager.get_templates_structure(user),
                FolderStructureManager.get_resumes_structure(user)
            ]
        }
    
    @staticmethod
    def get_user_quota_info(user):
        """Get detailed user quota and usage information"""
        quota, _ = UserQuota.objects.get_or_create(user=user)
        
        return {
            "templates": {
                "current": quota.current_templates,
                "max": quota.max_templates,
                "can_create": quota.can_create_template(),
                "remaining": quota.max_templates - quota.current_templates
            },
            "resumes": {
                "current": quota.current_resumes,
                "max": quota.max_resumes,
                "can_create": quota.can_create_resume(),
                "remaining": quota.max_resumes - quota.current_resumes
            }
        }