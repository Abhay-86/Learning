from rest_framework import serializers
from .models import Template, Resume, UserQuota, Company, HRContact, Job
from django.contrib.auth.models import User
import base64


class TemplateSerializer(serializers.ModelSerializer):
    """Serializer for Template model"""
    user_id = serializers.IntegerField(source='user_template_id', read_only=True)
    size = serializers.SerializerMethodField()
    
    class Meta:
        model = Template
        fields = ['id', 'user_id', 'name', 'html_content', 'created_at', 'updated_at', 'size']
        read_only_fields = ['id', 'user_id', 'created_at', 'updated_at']
    
    def get_size(self, obj):
        return len(obj.html_content.encode('utf-8'))


class TemplateCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating templates"""
    class Meta:
        model = Template
        fields = ['name', 'html_content']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class TemplateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating template HTML content"""
    class Meta:
        model = Template
        fields = ['html_content']


class ResumeSerializer(serializers.ModelSerializer):
    """Serializer for Resume model (without binary content)"""
    user_id = serializers.IntegerField(source='user_resume_id', read_only=True)
    display_name = serializers.SerializerMethodField()
    size_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = Resume
        fields = ['id', 'user_id', 'name', 'file_extension', 'file_size', 
                 'display_name', 'size_formatted', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user_id', 'created_at', 'updated_at']
    
    def get_display_name(self, obj):
        return f"{obj.name}.{obj.file_extension}"
    
    def get_size_formatted(self, obj):
        if obj.file_size < 1024 * 1024:  # Less than 1MB
            return f"{obj.file_size // 1024}KB"
        else:
            return f"{obj.file_size // (1024 * 1024)}MB"


class ResumeUploadSerializer(serializers.ModelSerializer):
    """Serializer for uploading resume files"""
    file = serializers.FileField(write_only=True)
    
    class Meta:
        model = Resume
        fields = ['name', 'file']
    
    def validate_file(self, value):
        # Check file extension
        if not value.name.lower().endswith(('.pdf', '.docx')):
            raise serializers.ValidationError("Only PDF and DOCX files are allowed.")
        
        # Check file size (max 5MB)
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("File size cannot exceed 5MB.")
        
        return value
    
    def create(self, validated_data):
        file = validated_data.pop('file')
        validated_data['user'] = self.context['request'].user
        validated_data['file_extension'] = file.name.split('.')[-1].lower()
        validated_data['file_content'] = file.read()
        validated_data['file_size'] = file.size
        
        return super().create(validated_data)


class UserQuotaSerializer(serializers.ModelSerializer):
    """Serializer for user quota information"""
    current_templates = serializers.ReadOnlyField()
    current_resumes = serializers.ReadOnlyField()
    can_create_template = serializers.SerializerMethodField()
    can_create_resume = serializers.SerializerMethodField()
    templates_remaining = serializers.SerializerMethodField()
    resumes_remaining = serializers.SerializerMethodField()
    
    class Meta:
        model = UserQuota
        fields = ['max_templates', 'max_resumes', 'current_templates', 'current_resumes',
                 'can_create_template', 'can_create_resume', 'templates_remaining', 'resumes_remaining']
    
    def get_can_create_template(self, obj):
        return obj.can_create_template()
    
    def get_can_create_resume(self, obj):
        return obj.can_create_resume()
    
    def get_templates_remaining(self, obj):
        return obj.max_templates - obj.current_templates
    
    def get_resumes_remaining(self, obj):
        return obj.max_resumes - obj.current_resumes


class FolderStructureSerializer(serializers.Serializer):
    """Serializer for folder structure response"""
    name = serializers.CharField()
    type = serializers.CharField()
    usage = serializers.CharField(required=False)
    can_create = serializers.BooleanField(required=False)
    children = serializers.ListField(required=False)


class ResumePreviewSerializer(serializers.ModelSerializer):
    """Serializer for resume preview with base64 content"""
    base64_content = serializers.SerializerMethodField()
    mime_type = serializers.SerializerMethodField()
    
    class Meta:
        model = Resume
        fields = ['id', 'name', 'file_extension', 'base64_content', 'mime_type', 'file_size']
    
    def get_base64_content(self, obj):
        return base64.b64encode(obj.file_content).decode('utf-8')
    
    def get_mime_type(self, obj):
        if obj.file_extension == 'pdf':
            return 'application/pdf'
        elif obj.file_extension == 'docx':
            return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        return 'application/octet-stream'


# Company Serializers
class CompanySerializer(serializers.ModelSerializer):
    """Serializer for Company model"""
    hr_contacts_count = serializers.SerializerMethodField()
    jobs_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Company
        fields = ['id', 'company_id', 'name', 'website', 'about_us', 'headquarters', 
                 'founded_year', 'company_size', 'company_url', 'hr_contacts_count', 
                 'jobs_count', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'hr_contacts_count', 'jobs_count']
    
    def get_hr_contacts_count(self, obj):
        return obj.hr_contacts.filter(is_active=True).count()
    
    def get_jobs_count(self, obj):
        return obj.jobs.filter(is_active=True).count()


class CompanyCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating companies"""
    class Meta:
        model = Company
        fields = ['company_id', 'name', 'website', 'about_us', 'headquarters', 
                 'founded_year', 'company_size', 'company_url']
    
    def validate_company_id(self, value):
        if Company.objects.filter(company_id=value).exists():
            raise serializers.ValidationError("Company with this ID already exists.")
        return value


class CompanyUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating companies"""
    class Meta:
        model = Company
        fields = ['name', 'website', 'about_us', 'headquarters', 'founded_year', 
                 'company_size', 'company_url', 'is_active']


# HR Contact Serializers
class HRContactSerializer(serializers.ModelSerializer):
    """Serializer for HR Contact model"""
    company_name = serializers.CharField(source='company.name', read_only=True)
    company_id = serializers.CharField(source='company.company_id', read_only=True)
    full_name = serializers.ReadOnlyField()
    
    class Meta:
        model = HRContact
        fields = ['id', 'company', 'company_id', 'company_name', 'first_name', 'last_name', 'full_name',
                 'email', 'email_verified', 'linkedin_verified', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'full_name', 'company_name', 'company_id']


class HRContactCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating HR contacts"""
    company_id = serializers.CharField(write_only=True)
    
    class Meta:
        model = HRContact
        fields = ['company_id', 'first_name', 'last_name', 'email']
    
    def validate_company_id(self, value):
        try:
            company = Company.objects.get(company_id=value, is_active=True)
            return company
        except Company.DoesNotExist:
            raise serializers.ValidationError("Company with this ID does not exist.")
    
    def validate_email(self, value):
        if HRContact.objects.filter(email=value, is_active=True).exists():
            raise serializers.ValidationError("HR contact with this email already exists.")
        return value
    
    def create(self, validated_data):
        company = validated_data.pop('company_id')
        validated_data['company'] = company
        return super().create(validated_data)


class HRContactUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating HR contacts"""
    class Meta:
        model = HRContact
        fields = ['first_name', 'last_name', 'email', 'is_active']
    
    def validate_email(self, value):
        # Check if email exists for other HR contacts
        if self.instance:
            existing = HRContact.objects.filter(email=value, is_active=True).exclude(id=self.instance.id)
            if existing.exists():
                raise serializers.ValidationError("HR contact with this email already exists.")
        return value


class HRContactListSerializer(serializers.ModelSerializer):
    """Simplified serializer for HR contact lists"""
    company_name = serializers.CharField(source='company.name', read_only=True)
    company_id = serializers.CharField(source='company.company_id', read_only=True)
    full_name = serializers.ReadOnlyField()
    
    class Meta:
        model = HRContact
        fields = ['id', 'company_id', 'company_name', 'full_name', 'email', 'email_verified', 'linkedin_verified', 'created_at']


# Bulk Upload Serializers
class CompanyBulkUploadSerializer(serializers.Serializer):
    """Serializer for bulk company upload from Excel"""
    file = serializers.FileField(required=True)
    
    def validate_file(self, value):
        if not value.name.endswith(('.xlsx', '.xls')):
            raise serializers.ValidationError("Only Excel files (.xlsx, .xls) are allowed")
        return value


class HRContactBulkUploadSerializer(serializers.Serializer):
    """Serializer for bulk HR contact upload from Excel"""
    file = serializers.FileField(required=True)
    
    def validate_file(self, value):
        if not value.name.endswith(('.xlsx', '.xls')):
            raise serializers.ValidationError("Only Excel files (.xlsx, .xls) are allowed")
        return value


class BulkUploadResponseSerializer(serializers.Serializer):
    """Serializer for bulk upload response"""
    success_count = serializers.IntegerField()
    error_count = serializers.IntegerField()
    errors = serializers.ListField(child=serializers.CharField(), required=False)
    warnings = serializers.ListField(child=serializers.CharField(), required=False)


class CompanyStatsSerializer(serializers.Serializer):
    """Serializer for company statistics"""
    total_companies = serializers.IntegerField()
    active_companies = serializers.IntegerField()
    companies_by_industry = serializers.DictField()
    companies_by_size = serializers.DictField()


class HRContactStatsSerializer(serializers.Serializer):
    """Serializer for HR contact statistics"""
    total_hr_contacts = serializers.IntegerField()
    active_hr_contacts = serializers.IntegerField()
    verified_emails = serializers.IntegerField()
    verified_linkedin = serializers.IntegerField()
    contacts_by_company = serializers.DictField()


# Job Serializers
class JobSerializer(serializers.ModelSerializer):
    """Serializer for Job model"""
    company_name = serializers.CharField(source='company.name', read_only=True)
    company_id = serializers.CharField(source='company.company_id', read_only=True)
    title_display = serializers.CharField(source='get_title_display', read_only=True)
    job_type_display = serializers.CharField(source='get_job_type_display', read_only=True)
    
    # Expose whether this job has at least one active HR contact for its company
    hasHR = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = ['id', 'title', 'title_display', 'job_type', 'job_type_display', 'company', 
                 'company_id', 'company_name', 'posted_date', 'created_at', 'updated_at', 'is_active', 'hasHR']
        read_only_fields = ['id', 'created_at', 'updated_at', 'posted_date', 'company_name', 
                           'company_id', 'title_display', 'job_type_display', 'hasHR']

    def get_hasHR(self, obj):
        # If view annotated the queryset with `has_hr` (Exists subquery), prefer that value
        if hasattr(obj, 'has_hr'):
            return bool(getattr(obj, 'has_hr'))

        # Fallback: perform a fast existence check
        return obj.company.hr_contacts.filter(is_active=True).exists()


class JobCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating jobs"""
    company_id = serializers.CharField(write_only=True)
    
    class Meta:
        model = Job
        fields = ['company_id', 'title', 'job_type']
    
    def validate_company_id(self, value):
        try:
            company = Company.objects.get(company_id=value, is_active=True)
            return company
        except Company.DoesNotExist:
            raise serializers.ValidationError("Company with this ID does not exist.")
    
    def create(self, validated_data):
        company = validated_data.pop('company_id')
        validated_data['company'] = company
        return super().create(validated_data)


class JobUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating jobs"""
    class Meta:
        model = Job
        fields = ['title', 'job_type', 'is_active']


class JobListSerializer(serializers.ModelSerializer):
    """Simplified serializer for job lists"""
    company_name = serializers.CharField(source='company.name', read_only=True)
    company_id = serializers.CharField(source='company.company_id', read_only=True)
    title_display = serializers.CharField(source='get_title_display', read_only=True)
    job_type_display = serializers.CharField(source='get_job_type_display', read_only=True)
    
    # Expose whether this job has at least one active HR contact for its company
    hasHR = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = ['id', 'title', 'title_display', 'job_type', 'job_type_display', 
                 'company_id', 'company_name', 'posted_date', 'hasHR']

    def get_hasHR(self, obj):
        if hasattr(obj, 'has_hr'):
            return bool(getattr(obj, 'has_hr'))
        return obj.company.hr_contacts.filter(is_active=True).exists()