from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.files.storage import default_storage
from .utils import generate_file_structure
import uuid
import os
import json

# Create your models here.

class UserQuota(models.Model):
    """Quota management with file structure JSON storage"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='referly_quota')
    
    # Quota limits - DEFAULT 2 FREE each
    template_limit = models.PositiveIntegerField(default=2)
    templates_used = models.PositiveIntegerField(default=0)
    
    resume_limit = models.PositiveIntegerField(default=2) 
    resumes_used = models.PositiveIntegerField(default=0)
    
    # File structure JSON (VSCode-like)
    file_structure = models.JSONField(default=dict)  # Stores the complete folder structure
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def can_create_template(self):
        return self.templates_used < self.template_limit
    
    def can_create_resume(self):
        return self.resumes_used < self.resume_limit
    
    def update_file_structure(self):
        """Utility function to regenerate file structure JSON"""
        self.file_structure = generate_file_structure(self.user)
        self.save()
    
    def __str__(self):
        return f"{self.user.username} - T:{self.templates_used}/{self.template_limit}, R:{self.resumes_used}/{self.resume_limit}"


class Template(models.Model):
    """HTML Templates only - numbered 1, 2, 3..."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='referly_templates')
    
    # Auto-assigned template number for easy selection
    template_number = models.PositiveIntegerField()  # 1, 2, 3...
    
    # Template details
    name = models.CharField(max_length=255)  # Internal name
    display_name = models.CharField(max_length=255)  # What shows in file explorer
    content = models.TextField()  # HTML content only
    
    # Metadata
    variables = models.JSONField(default=list)  # ["name", "email", "company"]
    description = models.TextField(blank=True, null=True)
    
    # Tracking
    is_active = models.BooleanField(default=True)
    is_deleted = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['template_number']
        unique_together = ['user', 'template_number']
    
    def save(self, *args, **kwargs):
        if not self.pk and not self.is_deleted:
            # Check quota
            quota, _ = UserQuota.objects.get_or_create(user=self.user)
            if not quota.can_create_template():
                raise ValueError("Template limit reached. Need to purchase additional slots.")
            
            # Auto-assign template number
            last_template = Template.objects.filter(
                user=self.user, 
                is_deleted=False
            ).order_by('-template_number').first()
            
            self.template_number = (last_template.template_number + 1) if last_template else 1
            
            # Generate display name if not provided
            if not self.display_name:
                self.display_name = f"{self.template_number}. {self.name.lower().replace(' ', '-')}.html"
            
            # Update quota
            quota.templates_used += 1
            quota.save()
            
        super().save(*args, **kwargs)
        
        # Update file structure after save
        quota = UserQuota.objects.get(user=self.user)
        quota.update_file_structure()
    
    def delete(self, *args, **kwargs):
        # Update quota when deleted
        quota = UserQuota.objects.get(user=self.user)
        if quota.templates_used > 0:
            quota.templates_used -= 1
            quota.save()
            quota.update_file_structure()
        super().delete(*args, **kwargs)
    
    def __str__(self):
        return f"Template {self.template_number}: {self.name} ({self.user.username})"


class Resume(models.Model):
    """PDF Resumes only - numbered 1, 2, 3..."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='referly_resumes')
    
    # Auto-assigned resume number
    resume_number = models.PositiveIntegerField()  # 1, 2, 3...
    
    # Resume details
    title = models.CharField(max_length=255)  # What user enters: "Abhay"
    display_name = models.CharField(max_length=255)  # What shows: "1. Abhay.pdf"
    
    # File management - PDF only
    pdf_file = models.FileField(upload_to='resumes/%Y/%m/', blank=True, null=True)
    original_filename = models.CharField(max_length=255)  # Original uploaded filename
    file_size = models.PositiveIntegerField(default=0)  # File size in bytes
    
    # Tracking
    is_active = models.BooleanField(default=True)
    is_deleted = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['resume_number']
        unique_together = ['user', 'resume_number']
    
    def save(self, *args, **kwargs):
        if not self.pk and not self.is_deleted:
            # Check quota
            quota, _ = UserQuota.objects.get_or_create(user=self.user)
            if not quota.can_create_resume():
                raise ValueError("Resume limit reached. Need to purchase additional slots.")
            
            # Auto-assign resume number
            last_resume = Resume.objects.filter(
                user=self.user,
                is_deleted=False
            ).order_by('-resume_number').first()
            
            self.resume_number = (last_resume.resume_number + 1) if last_resume else 1
            
            # Generate display name: "1. Abhay.pdf"
            if not self.display_name:
                self.display_name = f"{self.resume_number}. {self.title}.pdf"
            
            # Update quota
            quota.resumes_used += 1
            quota.save()
            
        super().save(*args, **kwargs)
        
        # Update file structure after save
        quota = UserQuota.objects.get(user=self.user)
        quota.update_file_structure()
    
    def delete(self, *args, **kwargs):
        # Update quota when deleted
        quota = UserQuota.objects.get(user=self.user)
        if quota.resumes_used > 0:
            quota.resumes_used -= 1
            quota.save()
            quota.update_file_structure()
        super().delete(*args, **kwargs)
    
    def __str__(self):
        return f"Resume {self.resume_number}: {self.title} ({self.user.username})"


class TemporaryWorkspace(models.Model):
    """30-second sync storage - drafts before Save As"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='temp_workspaces')
    session_id = models.CharField(max_length=255, unique=True)
    
    # Draft content (before Save As)
    draft_templates = models.JSONField(default=dict)  # {"draft_1": {"name": "untitled", "content": "..."}}
    draft_resumes = models.JSONField(default=dict)    # {"draft_2": {"title": "My Resume", "data": {...}}}
    
    # Editor state
    open_files = models.JSONField(default=list)      # ["template_1", "draft_1"]
    active_file = models.CharField(max_length=255, blank=True, null=True)
    cursor_positions = models.JSONField(default=dict)  # {"template_1": {"line": 5, "col": 10}}
    
    # Sync tracking
    last_sync = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField()  # Auto-cleanup old sessions
    
    class Meta:
        unique_together = ['user', 'session_id']
        ordering = ['-last_sync']
    
    def add_template_draft(self, name, content):
        """Add new template draft"""
        if not self.draft_templates:
            self.draft_templates = {}
        
        draft_id = f"draft_template_{len(self.draft_templates) + 1}"
        self.draft_templates[draft_id] = {
            'name': name or 'untitled',
            'content': content,
            'created_at': timezone.now().isoformat(),
            'type': 'template'
        }
        self.save()
        return draft_id
    
    def save_template_draft_as_permanent(self, draft_id, final_name):
        """Convert draft to permanent template (Save As functionality)"""
        if draft_id not in self.draft_templates:
            raise ValueError("Draft not found")
        
        draft = self.draft_templates[draft_id]
        
        # Create permanent template
        template = Template.objects.create(
            user=self.user,
            name=final_name,
            content=draft['content']
        )
        
        # Remove from drafts
        del self.draft_templates[draft_id]
        self.save()
        
        return template
    
    def __str__(self):
        return f"{self.user.username} - Session {self.session_id[:8]}..."


class QuotaPurchase(models.Model):
    """Coin deduction for additional slots"""
    PURCHASE_TYPES = [
        ('TEMPLATE_SLOT', 'Additional Template Slot'),
        ('RESUME_SLOT', 'Additional Resume Slot'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='referly_purchases')
    purchase_type = models.CharField(max_length=20, choices=PURCHASE_TYPES)
    coins_spent = models.PositiveIntegerField()  # Amount deducted
    slots_added = models.PositiveIntegerField(default=1)
    
    # Link to coin wallet transaction
    transaction = models.ForeignKey('payments.CoinTransaction', on_delete=models.CASCADE, null=True, related_name='referly_purchases')
    
    purchased_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-purchased_at']
    
    def save(self, *args, **kwargs):
        """Auto-deduct coins and increase quota"""
        if not self.pk:
            # Deduct coins from user's wallet
            wallet = self.user.wallet
            if wallet.coin_balance < self.coins_spent:
                raise ValueError("Insufficient coins. Please recharge.")
            
            # Deduct coins
            success = wallet.deduct_coins(
                self.coins_spent, 
                'FEATURE_BUY', 
                f'{self.purchase_type.lower()}_purchase'
            )
            
            if not success:
                raise ValueError("Failed to deduct coins")
            
            # Increase quota limit
            quota, _ = UserQuota.objects.get_or_create(user=self.user)
            
            if self.purchase_type == 'TEMPLATE_SLOT':
                quota.template_limit += self.slots_added
            elif self.purchase_type == 'RESUME_SLOT':
                quota.resume_limit += self.slots_added
                
            quota.save()
            quota.update_file_structure()  # Update file structure with new limits
            
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.user.username} - {self.purchase_type} ({self.coins_spent} coins)"
