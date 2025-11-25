from django.db import models
from django.contrib.auth.models import User

# Create your models here.

class Template(models.Model):
    """Template model for storing HTML email templates"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='referly_templates')
    user_template_id = models.PositiveIntegerField()  # Auto-increment per user (1, 2, 3...)
    name = models.CharField(max_length=255)
    html_content = models.TextField()  # Store HTML as string
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'referly_template'
        unique_together = [['user', 'user_template_id'], ['user', 'name']]
        ordering = ['user', 'user_template_id']
        
    def save(self, *args, **kwargs):
        if not self.user_template_id:
            # Auto-assign next template ID for this user
            last_template = Template.objects.filter(user=self.user).order_by('-user_template_id').first()
            self.user_template_id = (last_template.user_template_id + 1) if last_template else 1
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Template #{self.user_template_id}: {self.name} (User: {self.user.username})"


class Resume(models.Model):
    """Resume model for storing PDF/DOCX files as binary data"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='referly_resumes')
    user_resume_id = models.PositiveIntegerField()  # Auto-increment per user (1, 2, 3...)
    name = models.CharField(max_length=255)
    file_extension = models.CharField(max_length=10)  # "pdf" or "docx"
    file_content = models.BinaryField()  # BLOB storage for actual file
    file_size = models.PositiveIntegerField()  # Track file size in bytes
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'referly_resume'
        unique_together = [['user', 'user_resume_id'], ['user', 'name']]
        ordering = ['user', 'user_resume_id']
        
    def save(self, *args, **kwargs):
        if not self.user_resume_id:
            # Auto-assign next resume ID for this user
            last_resume = Resume.objects.filter(user=self.user).order_by('-user_resume_id').first()
            self.user_resume_id = (last_resume.user_resume_id + 1) if last_resume else 1
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Resume #{self.user_resume_id}: {self.name}.{self.file_extension} (User: {self.user.username})"


class UserQuota(models.Model):
    """User quota model for tracking template and resume limits"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='referly_quota')
    max_templates = models.PositiveIntegerField(default=2)
    max_resumes = models.PositiveIntegerField(default=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'referly_userquota'
    
    @property
    def current_templates(self):
        return self.user.referly_templates.filter(is_active=True).count()
    
    @property
    def current_resumes(self):
        return self.user.referly_resumes.filter(is_active=True).count()
        
    def can_create_template(self):
        return self.current_templates < self.max_templates
        
    def can_create_resume(self):
        return self.current_resumes < self.max_resumes
    
    def get_template_by_user_id(self, template_id):
        """Get template by user-specific ID"""
        return self.user.referly_templates.filter(
            user_template_id=template_id, 
            is_active=True
        ).first()
    
    def get_resume_by_user_id(self, resume_id):
        """Get resume by user-specific ID"""
        return self.user.referly_resumes.filter(
            user_resume_id=resume_id, 
            is_active=True
        ).first()
    
    def __str__(self):
        return f"Quota for {self.user.username}: Templates({self.current_templates}/{self.max_templates}), Resumes({self.current_resumes}/{self.max_resumes})"


class Company(models.Model):
    """Company model for storing company information"""
    # Your custom company ID (unique)
    company_id = models.CharField(max_length=50, unique=True)  # Your custom ID like "COMP001", "COMP002"
    
    # LinkedIn info (optional)
    linkedin_company_id = models.CharField(max_length=100, blank=True)  # Not unique, just reference
    
    # Basic company info
    name = models.CharField(max_length=255)
    website = models.URLField(blank=True)  # company website
    linkedin_url = models.URLField(blank=True)
    
    # Additional company details
    industry = models.CharField(max_length=100, blank=True)
    location = models.CharField(max_length=255, blank=True)
    employee_count_range = models.CharField(max_length=50, blank=True)
    about_us = models.TextField(blank=True)  # Company description/about section
    
    # Status fields
    is_active = models.BooleanField(default=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'referly_company'
        ordering = ['company_id']
    
    def __str__(self):
        return f"{self.company_id}: {self.name}"


class HRContact(models.Model):
    """HR Contact model for storing HR contact information"""
    # Link to company
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='hr_contacts')
    
    # Basic HR Contact Info
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)  # Unique emails globally
    phone = models.CharField(max_length=20, blank=True)
    linkedin_url = models.URLField(blank=True)
    
    # Verification & Status
    email_verified = models.BooleanField(default=False)
    linkedin_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'referly_hrcontact'
        ordering = ['company__company_id', 'first_name', 'last_name']
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.company.name}"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
