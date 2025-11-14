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
