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


class ExcelDataNormalizer:
    """Utility class for normalizing Excel data for bulk uploads"""
    
    @staticmethod
    def normalize_column_names(df):
        """
        Normalize DataFrame column names to standard format.
        Can be updated over time as column naming conventions change.
        """
        # Convert to lowercase and replace spaces/special chars with underscores
        df.columns = df.columns.str.lower().str.strip()
        df.columns = df.columns.str.replace(r'[^\w\s]', '', regex=True)  # Remove special chars
        df.columns = df.columns.str.replace(r'\s+', '_', regex=True)     # Replace spaces with underscore
        
        # Map common variations to standard column names
        column_mapping = {
            # Company fields
            'company': 'company_name',
            'companyname': 'company_name',
            'company_id': 'company_id',
            'companyid': 'company_id',
            'website': 'domain',
            'company_website': 'domain',
            'linkedin': 'linkedin_url',
            'linkedin_profile': 'linkedin_url',
            'company_linkedin': 'linkedin_url',
            'size': 'company_size',
            'employees': 'employee_count_range',
            'employee_count': 'employee_count_range',
            
            # HR Contact fields
            'first': 'first_name',
            'firstname': 'first_name',
            'last': 'last_name',
            'lastname': 'last_name',
            'email_address': 'email',
            'mail': 'email',
            'phone_number': 'phone',
            'mobile': 'phone',
            'linkedin_profile': 'linkedin_url',
            'linkedin': 'linkedin_url',
        }
        
        df.rename(columns=column_mapping, inplace=True)
        return df
    
    @staticmethod
    def clean_company_data(row):
        """Clean and normalize a single company data row"""
        cleaned = {}
        
        # Required fields
        cleaned['name'] = str(row.get('company_name', '')).strip() if row.get('company_name') else ''
        cleaned['domain'] = str(row.get('domain', '')).strip() if row.get('domain') else ''
        
        # Optional fields
        cleaned['industry'] = str(row.get('industry', '')).strip() if row.get('industry') else ''
        cleaned['location'] = str(row.get('location', '')).strip() if row.get('location') else ''
        cleaned['employee_count_range'] = str(row.get('employee_count_range', '')).strip() if row.get('employee_count_range') else ''
        cleaned['company_size'] = str(row.get('company_size', '')).strip() if row.get('company_size') else ''
        cleaned['linkedin_url'] = str(row.get('linkedin_url', '')).strip() if row.get('linkedin_url') else ''
        cleaned['linkedin_company_id'] = str(row.get('linkedin_company_id', '')).strip() if row.get('linkedin_company_id') else ''
        
        return cleaned
    
    @staticmethod
    def clean_hr_contact_data(row):
        """Clean and normalize a single HR contact data row"""
        cleaned = {}
        
        # Required fields
        cleaned['first_name'] = str(row.get('first_name', '')).strip() if row.get('first_name') else ''
        cleaned['last_name'] = str(row.get('last_name', '')).strip() if row.get('last_name') else ''
        cleaned['email'] = str(row.get('email', '')).strip().lower() if row.get('email') else ''
        
        # Company reference (required)
        cleaned['company_name'] = str(row.get('company_name', '')).strip() if row.get('company_name') else ''
        cleaned['company_id'] = str(row.get('company_id', '')).strip() if row.get('company_id') else ''
        
        # Optional fields
        cleaned['phone'] = str(row.get('phone', '')).strip() if row.get('phone') else ''
        cleaned['linkedin_url'] = str(row.get('linkedin_url', '')).strip() if row.get('linkedin_url') else ''
        
        return cleaned
    
    @staticmethod
    def validate_email(email):
        """Basic email validation"""
        import re
        if not email:
            return False
        pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
        return re.match(pattern, email) is not None
    
    @staticmethod
    def validate_url(url):
        """Basic URL validation"""
        if not url:
            return True  # Empty URLs are ok (optional field)
        return url.startswith('http://') or url.startswith('https://')