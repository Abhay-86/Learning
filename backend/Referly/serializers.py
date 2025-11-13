from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserQuota, Template, Resume, TemporaryWorkspace, QuotaPurchase
from payments.models import CoinTransaction


class UserQuotaSerializer(serializers.ModelSerializer):
    """Serializer for user quota with file structure"""
    username = serializers.CharField(source='user.username', read_only=True)
    templates_remaining = serializers.SerializerMethodField()
    resumes_remaining = serializers.SerializerMethodField()
    can_create_template = serializers.SerializerMethodField()
    can_create_resume = serializers.SerializerMethodField()
    
    class Meta:
        model = UserQuota
        fields = [
            'id', 'username', 'template_limit', 'templates_used', 'templates_remaining',
            'resume_limit', 'resumes_used', 'resumes_remaining', 
            'can_create_template', 'can_create_resume',
            'file_structure', 'created_at', 'updated_at'
        ]
        read_only_fields = ['templates_used', 'resumes_used', 'file_structure', 'created_at', 'updated_at']
    
    def get_templates_remaining(self, obj):
        return obj.template_limit - obj.templates_used
    
    def get_resumes_remaining(self, obj):
        return obj.resume_limit - obj.resumes_used
    
    def get_can_create_template(self, obj):
        return obj.can_create_template()
    
    def get_can_create_resume(self, obj):
        return obj.can_create_resume()


class TemplateSerializer(serializers.ModelSerializer):
    """Serializer for HTML templates with auto-numbering"""
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Template
        fields = [
            'id', 'template_number', 'name', 'display_name', 'content',
            'variables', 'description', 'username', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['template_number', 'display_name', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Validate quota before creating template"""
        if self.instance is None:  # Creating new template
            user = self.context['request'].user
            quota, _ = UserQuota.objects.get_or_create(user=user)
            if not quota.can_create_template():
                raise serializers.ValidationError({
                    'quota_error': f'Template limit reached ({quota.templates_used}/{quota.template_limit}). Purchase additional slots.'
                })
        return data
    
    def create(self, validated_data):
        """Create template with user from request"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class ResumeSerializer(serializers.ModelSerializer):
    """Serializer for PDF resumes with file upload"""
    username = serializers.CharField(source='user.username', read_only=True)
    file_size_mb = serializers.SerializerMethodField()
    
    class Meta:
        model = Resume
        fields = [
            'id', 'resume_number', 'title', 'display_name', 'pdf_file',
            'original_filename', 'file_size', 'file_size_mb', 'username',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['resume_number', 'display_name', 'original_filename', 'file_size', 'created_at', 'updated_at']
    
    def get_file_size_mb(self, obj):
        """Convert file size to MB"""
        if obj.file_size:
            return round(obj.file_size / (1024 * 1024), 2)
        return 0
    
    def validate_pdf_file(self, value):
        """Validate PDF file upload"""
        if value:
            # Check file extension
            if not value.name.lower().endswith('.pdf'):
                raise serializers.ValidationError("Only PDF files are allowed.")
            
            # Check file size (max 10MB)
            max_size = 10 * 1024 * 1024  # 10MB
            if value.size > max_size:
                raise serializers.ValidationError(f"File size exceeds 10MB limit. Current size: {round(value.size/(1024*1024), 2)}MB")
        
        return value
    
    def validate(self, data):
        """Validate quota before creating resume"""
        if self.instance is None:  # Creating new resume
            user = self.context['request'].user
            quota, _ = UserQuota.objects.get_or_create(user=user)
            if not quota.can_create_resume():
                raise serializers.ValidationError({
                    'quota_error': f'Resume limit reached ({quota.resumes_used}/{quota.resume_limit}). Purchase additional slots.'
                })
        return data
    
    def create(self, validated_data):
        """Create resume with user and file metadata"""
        user = self.context['request'].user
        validated_data['user'] = user
        
        # Store original filename and file size
        pdf_file = validated_data.get('pdf_file')
        if pdf_file:
            validated_data['original_filename'] = pdf_file.name
            validated_data['file_size'] = pdf_file.size
        
        return super().create(validated_data)


class TemporaryWorkspaceSerializer(serializers.ModelSerializer):
    """Serializer for temporary workspace (30-second sync)"""
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = TemporaryWorkspace
        fields = [
            'id', 'session_id', 'username', 'draft_templates', 'draft_resumes',
            'open_files', 'active_file', 'cursor_positions',
            'last_sync', 'expires_at'
        ]
        read_only_fields = ['last_sync']
    
    def create(self, validated_data):
        """Create workspace with user from request"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class QuotaPurchaseSerializer(serializers.ModelSerializer):
    """Serializer for quota purchase with coin deduction"""
    username = serializers.CharField(source='user.username', read_only=True)
    purchase_type_display = serializers.CharField(source='get_purchase_type_display', read_only=True)
    
    class Meta:
        model = QuotaPurchase
        fields = [
            'id', 'username', 'purchase_type', 'purchase_type_display',
            'coins_spent', 'slots_added', 'purchased_at', 'is_active'
        ]
        read_only_fields = ['purchased_at', 'is_active']
    
    def validate(self, data):
        """Validate coin balance before purchase"""
        user = self.context['request'].user
        coins_needed = data.get('coins_spent', 0)
        
        # Check if user has wallet
        if not hasattr(user, 'wallet'):
            raise serializers.ValidationError({
                'wallet_error': 'User wallet not found. Please contact support.'
            })
        
        # Check coin balance
        wallet = user.wallet
        if wallet.coin_balance < coins_needed:
            raise serializers.ValidationError({
                'insufficient_coins': f'Insufficient coins. Required: {coins_needed}, Available: {wallet.coin_balance}'
            })
        
        return data
    
    def create(self, validated_data):
        """Create purchase with user from request"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class DraftTemplateSerializer(serializers.Serializer):
    """Serializer for template drafts in temporary workspace"""
    name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    content = serializers.CharField(required=True)
    
    def validate_name(self, value):
        """Default name if empty"""
        return value or 'untitled'


class SaveDraftAsTemplateSerializer(serializers.Serializer):
    """Serializer for converting draft to permanent template"""
    draft_id = serializers.CharField(required=True)
    final_name = serializers.CharField(max_length=255, required=True)
    
    def validate_final_name(self, value):
        """Ensure final name is provided"""
        if not value or not value.strip():
            raise serializers.ValidationError("Final name is required.")
        return value.strip()


class FileStructureSerializer(serializers.Serializer):
    """Serializer for VSCode-like file structure response"""
    file_structure = serializers.JSONField()
    quota_info = UserQuotaSerializer()
    templates = TemplateSerializer(many=True)
    resumes = ResumeSerializer(many=True)