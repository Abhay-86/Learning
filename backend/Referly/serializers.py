from rest_framework import serializers
from .models import Template, Resume, UserQuota
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