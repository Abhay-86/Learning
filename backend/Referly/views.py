from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from drf_spectacular.utils import extend_schema
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
from django.db import transaction
from django.contrib.auth.models import User

from .models import UserQuota, Template, Resume, TemporaryWorkspace, QuotaPurchase
from .serializers import (
    UserQuotaSerializer, TemplateSerializer, ResumeSerializer,
    TemporaryWorkspaceSerializer, QuotaPurchaseSerializer,
    DraftTemplateSerializer, SaveDraftAsTemplateSerializer, FileStructureSerializer
)
from .utils import generate_file_structure, get_quota_status, cleanup_expired_sessions


class QuotaStatusView(APIView):
    """Get current quota status with file structure"""
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: FileStructureSerializer})
    def get(self, request):
        quota, created = UserQuota.objects.get_or_create(user=request.user)
        
        # Generate fresh file structure
        quota.update_file_structure()
        
        # Get templates and resumes
        templates = Template.objects.filter(user=request.user, is_deleted=False)
        resumes = Resume.objects.filter(user=request.user, is_deleted=False)
        
        data = {
            'file_structure': quota.file_structure,
            'quota_info': UserQuotaSerializer(quota).data,
            'templates': TemplateSerializer(templates, many=True).data,
            'resumes': ResumeSerializer(resumes, many=True).data
        }
        
        return Response(data, status=status.HTTP_200_OK)


class QuotaPurchaseView(APIView):
    """Purchase additional quota slots using coins"""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=QuotaPurchaseSerializer,
        responses={201: QuotaPurchaseSerializer},
        description="Purchase additional template or resume slots using coins."
    )
    def post(self, request):
        serializer = QuotaPurchaseSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    purchase = serializer.save()
                    
                    # Refresh quota info
                    quota = UserQuota.objects.get(user=request.user)
                    quota_data = UserQuotaSerializer(quota).data
                    
                    return Response({
                        "message": f"Successfully purchased {purchase.slots_added} {purchase.purchase_type.lower()} slot(s) for {purchase.coins_spent} coins.",
                        "data": {
                            'purchase': serializer.data,
                            'updated_quota': quota_data
                        }
                    }, status=status.HTTP_201_CREATED)
                    
            except ValueError as e:
                return Response({
                    'error': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TemplateListView(APIView):
    """List user templates or create new template"""
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: TemplateSerializer(many=True)})
    def get(self, request):
        templates = Template.objects.filter(user=request.user, is_deleted=False)
        serializer = TemplateSerializer(templates, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        request=TemplateSerializer,
        responses={201: TemplateSerializer},
        description="Create new HTML template with quota validation."
    )
    def post(self, request):
        serializer = TemplateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Template created successfully!",
                "data": serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TemplateDetailView(APIView):
    """Get, update, or delete specific template"""
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):
        try:
            return Template.objects.get(pk=pk, user=user, is_deleted=False)
        except Template.DoesNotExist:
            return None

    @extend_schema(responses={200: TemplateSerializer})
    def get(self, request, pk):
        template = self.get_object(pk, request.user)
        if not template:
            return Response({'error': 'Template not found'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = TemplateSerializer(template)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        request=TemplateSerializer,
        responses={200: TemplateSerializer}
    )
    def put(self, request, pk):
        template = self.get_object(pk, request.user)
        if not template:
            return Response({'error': 'Template not found'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = TemplateSerializer(template, data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Template updated successfully!",
                "data": serializer.data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(responses={200: dict})
    def delete(self, request, pk):
        template = self.get_object(pk, request.user)
        if not template:
            return Response({'error': 'Template not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Soft delete
        template.is_deleted = True
        template.deleted_at = timezone.now()
        template.save()
        
        # Update quota counter
        quota = UserQuota.objects.get(user=request.user)
        if quota.templates_used > 0:
            quota.templates_used -= 1
            quota.save()
            quota.update_file_structure()
        
        return Response({
            "message": "Template deleted successfully!"
        }, status=status.HTTP_200_OK)


class ResumeListView(APIView):
    """List user resumes or create new resume"""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]  # For file uploads

    @extend_schema(responses={200: ResumeSerializer(many=True)})
    def get(self, request):
        resumes = Resume.objects.filter(user=request.user, is_deleted=False)
        serializer = ResumeSerializer(resumes, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        request=ResumeSerializer,
        responses={201: ResumeSerializer},
        description="Create new PDF resume with quota validation."
    )
    def post(self, request):
        serializer = ResumeSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Resume created successfully!",
                "data": serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ResumeDetailView(APIView):
    """Get, update, or delete specific resume"""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_object(self, pk, user):
        try:
            return Resume.objects.get(pk=pk, user=user, is_deleted=False)
        except Resume.DoesNotExist:
            return None

    @extend_schema(responses={200: ResumeSerializer})
    def get(self, request, pk):
        resume = self.get_object(pk, request.user)
        if not resume:
            return Response({'error': 'Resume not found'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = ResumeSerializer(resume)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        request=ResumeSerializer,
        responses={200: ResumeSerializer}
    )
    def put(self, request, pk):
        resume = self.get_object(pk, request.user)
        if not resume:
            return Response({'error': 'Resume not found'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = ResumeSerializer(resume, data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Resume updated successfully!",
                "data": serializer.data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(responses={200: dict})
    def delete(self, request, pk):
        resume = self.get_object(pk, request.user)
        if not resume:
            return Response({'error': 'Resume not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Soft delete
        resume.is_deleted = True
        resume.deleted_at = timezone.now()
        resume.save()
        
        # Delete PDF file
        if resume.pdf_file:
            resume.pdf_file.delete()
        
        # Update quota counter
        quota = UserQuota.objects.get(user=request.user)
        if quota.resumes_used > 0:
            quota.resumes_used -= 1
            quota.save()
            quota.update_file_structure()
        
        return Response({
            "message": "Resume deleted successfully!"
        }, status=status.HTTP_200_OK)


class ResumeUploadView(APIView):
    """Upload or replace PDF file for existing resume"""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    @extend_schema(
        request=ResumeSerializer,
        responses={200: ResumeSerializer},
        description="Upload PDF file to existing resume."
    )
    def post(self, request, pk):
        try:
            resume = Resume.objects.get(pk=pk, user=request.user, is_deleted=False)
        except Resume.DoesNotExist:
            return Response({'error': 'Resume not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if 'pdf_file' not in request.FILES:
            return Response({
                'error': 'No PDF file provided'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        pdf_file = request.FILES['pdf_file']
        
        # Validate file
        if not pdf_file.name.lower().endswith('.pdf'):
            return Response({
                'error': 'Only PDF files are allowed'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update resume with new file
        old_file = resume.pdf_file
        resume.pdf_file = pdf_file
        resume.original_filename = pdf_file.name
        resume.file_size = pdf_file.size
        resume.save()
        
        # Delete old file
        if old_file:
            old_file.delete()
        
        return Response({
            'message': 'PDF uploaded successfully!',
            'data': ResumeSerializer(resume).data
        }, status=status.HTTP_200_OK)


class WorkspaceSyncView(APIView):
    """Sync workspace data (every 30 seconds)"""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=TemporaryWorkspaceSerializer,
        responses={200: TemporaryWorkspaceSerializer},
        description="Sync workspace data every 30 seconds."
    )
    def post(self, request):
        # Cleanup expired sessions first
        cleanup_expired_sessions()
        
        session_id = request.data.get('session_id')
        
        if not session_id:
            return Response({
                'error': 'session_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get or create workspace
        workspace, created = TemporaryWorkspace.objects.get_or_create(
            user=request.user,
            session_id=session_id,
            defaults={
                'expires_at': timezone.now() + timedelta(minutes=30)
            }
        )
        
        # Update workspace data
        serializer = TemporaryWorkspaceSerializer(
            workspace, 
            data=request.data, 
            partial=True,
            context={'request': request}
        )
        
        if serializer.is_valid():
            # Update expiry on each sync
            workspace.expires_at = timezone.now() + timedelta(minutes=30)
            serializer.save()
            
            return Response({
                'message': 'Workspace synced successfully',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TemplateDraftView(APIView):
    """Add new template draft to workspace"""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=DraftTemplateSerializer,
        responses={201: TemporaryWorkspaceSerializer},
        description="Add new template draft to workspace."
    )
    def post(self, request):
        session_id = request.data.get('session_id')
        
        if not session_id:
            return Response({
                'error': 'session_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        workspace = get_object_or_404(TemporaryWorkspace, user=request.user, session_id=session_id)
        
        # Validate draft data
        draft_serializer = DraftTemplateSerializer(data=request.data)
        if draft_serializer.is_valid():
            draft_data = draft_serializer.validated_data
            draft_id = workspace.add_template_draft(
                draft_data['name'], 
                draft_data['content']
            )
            
            return Response({
                'message': 'Template draft added successfully',
                'data': {
                    'draft_id': draft_id,
                    'workspace': TemporaryWorkspaceSerializer(workspace).data
                }
            }, status=status.HTTP_201_CREATED)
        
        return Response(draft_serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SaveDraftAsTemplateView(APIView):
    """Convert draft to permanent template (Save As)"""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=SaveDraftAsTemplateSerializer,
        responses={201: TemplateSerializer},
        description="Convert template draft to permanent template."
    )
    def post(self, request):
        session_id = request.data.get('session_id')
        
        if not session_id:
            return Response({
                'error': 'session_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        workspace = get_object_or_404(TemporaryWorkspace, user=request.user, session_id=session_id)
        
        # Validate save data
        save_serializer = SaveDraftAsTemplateSerializer(data=request.data)
        if save_serializer.is_valid():
            save_data = save_serializer.validated_data
            
            try:
                template = workspace.save_template_draft_as_permanent(
                    save_data['draft_id'],
                    save_data['final_name']
                )
                
                return Response({
                    'message': f'Draft saved as template: {template.display_name}',
                    'data': {
                        'template': TemplateSerializer(template).data,
                        'workspace': TemporaryWorkspaceSerializer(workspace).data
                    }
                }, status=status.HTTP_201_CREATED)
                
            except ValueError as e:
                return Response({
                    'error': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(save_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
