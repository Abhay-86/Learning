from django.contrib import admin
from .models import Template, Resume, UserQuota, Company, HRContact, Job

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
    exclude = ['file_content']


@admin.register(UserQuota)
class UserQuotaAdmin(admin.ModelAdmin):
    list_display = ['user', 'current_templates', 'max_templates', 'current_resumes', 'max_resumes', 'created_at']
    list_filter = ['max_templates', 'max_resumes', 'created_at']
    search_fields = ['user__username']
    readonly_fields = ['current_templates', 'current_resumes', 'created_at']


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    # Removed: industry, location
    list_display = ['company_id', 'name', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['company_id', 'name']
    ordering = ['company_id']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(HRContact)
class HRContactAdmin(admin.ModelAdmin):
    list_display = [
        'full_name', 'email', 'company',
        'email_verified', 'linkedin_verified',
        'is_active', 'created_at'
    ]
    list_filter = ['is_active', 'email_verified', 'linkedin_verified', 'company', 'created_at']
    search_fields = ['first_name', 'last_name', 'email', 'company__name']
    ordering = ['company', 'first_name', 'last_name']
    readonly_fields = ['created_at', 'updated_at']

    def full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"



@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    # Removed: location, salary_min, salary_max, industry, description
    list_display = ['title', 'company', 'job_type', 'is_active', 'posted_date']
    list_filter = ['is_active', 'job_type', 'company', 'posted_date']
    search_fields = ['title', 'company__name']
    ordering = ['-posted_date']
    readonly_fields = ['posted_date', 'created_at', 'updated_at']

    fieldsets = (
        ('Job Information', {
            'fields': ('title', 'company', 'job_type')
        }),
        ('Requirements', {
            'fields': ('requirements',)
        }),
        ('Status & Dates', {
            'fields': ('is_active', 'posted_date', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
