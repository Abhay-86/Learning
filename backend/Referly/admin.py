from django.contrib import admin
from .models import Template, Resume, UserQuota

# Register your models here.

@admin.register(Template)
class TemplateAdmin(admin.ModelAdmin):
    list_display = ['user_template_id', 'name', 'user', 'created_at', 'is_active']
    list_filter = ['is_active', 'created_at', 'user']
    search_fields = ['name', 'user__username']
    ordering = ['user', 'user_template_id']
    readonly_fields = ['user_template_id', 'created_at', 'updated_at']


@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = ['user_resume_id', 'name', 'file_extension', 'file_size', 'user', 'created_at', 'is_active']
    list_filter = ['is_active', 'file_extension', 'created_at', 'user']
    search_fields = ['name', 'user__username']
    ordering = ['user', 'user_resume_id']
    readonly_fields = ['user_resume_id', 'file_size', 'created_at', 'updated_at']
    exclude = ['file_content']  # Hide binary content from admin interface


@admin.register(UserQuota)
class UserQuotaAdmin(admin.ModelAdmin):
    list_display = ['user', 'current_templates', 'max_templates', 'current_resumes', 'max_resumes', 'created_at']
    list_filter = ['max_templates', 'max_resumes', 'created_at']
    search_fields = ['user__username']
    readonly_fields = ['current_templates', 'current_resumes', 'created_at']
