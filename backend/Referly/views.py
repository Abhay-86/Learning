from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
import base64

from features.permission import ReferlyPermission
from .models import Template, Resume, UserQuota
from .serializers import (
    TemplateSerializer, TemplateCreateSerializer, TemplateUpdateSerializer,
    ResumeSerializer, ResumeUploadSerializer, UserQuotaSerializer,
    FolderStructureSerializer, ResumePreviewSerializer
)
from .utils import FolderStructureManager


# Folder Structure APIs
class FolderStructureView(APIView):
    """Get complete folder structure"""
    permission_classes = [IsAuthenticated, ReferlyPermission]
    
    @extend_schema(responses={200: FolderStructureSerializer})
    def get(self, request):
        structure = FolderStructureManager.get_full_structure(request.user)
        return Response(structure, status=status.HTTP_200_OK)


class TemplatesFolderView(APIView):
    """Get templates folder structure only"""
    permission_classes = [IsAuthenticated, ReferlyPermission]
    
    @extend_schema(responses={200: FolderStructureSerializer})
    def get(self, request):
        structure = FolderStructureManager.get_templates_structure(request.user)
        return Response(structure, status=status.HTTP_200_OK)


class ResumesFolderView(APIView):
    """Get resumes folder structure only"""
    permission_classes = [IsAuthenticated, ReferlyPermission]
    
    @extend_schema(responses={200: FolderStructureSerializer})
    def get(self, request):
        structure = FolderStructureManager.get_resumes_structure(request.user)
        return Response(structure, status=status.HTTP_200_OK)


# Template Management APIs
class TemplateListView(APIView):
    """List all user templates"""
    permission_classes = [IsAuthenticated, ReferlyPermission]
    
    @extend_schema(responses={200: TemplateSerializer(many=True)})
    def get(self, request):
        templates = Template.objects.filter(user=request.user, is_active=True)
        serializer = TemplateSerializer(templates, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TemplateCreateView(APIView):
    """Create a new template"""
    permission_classes = [IsAuthenticated, ReferlyPermission]
    
    @extend_schema(request=TemplateCreateSerializer, responses={201: TemplateSerializer})
    def post(self, request):
        # Check quota
        quota, _ = UserQuota.objects.get_or_create(user=request.user)
        if not quota.can_create_template():
            return Response(
                {"error": f"Template limit reached. Maximum {quota.max_templates} templates allowed."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = TemplateCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            template = serializer.save()
            response_serializer = TemplateSerializer(template)
            return Response(
                {"message": "Template created successfully!", "data": response_serializer.data},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TemplateDetailView(APIView):
    """Get, update, or delete a specific template"""
    permission_classes = [IsAuthenticated, ReferlyPermission]
    
    def get_object(self, template_id, user):
        return get_object_or_404(Template, id=template_id, user=user, is_active=True)
    
    @extend_schema(responses={200: TemplateSerializer})
    def get(self, request, template_id):
        template = self.get_object(template_id, request.user)
        print('Fetched template:', template)
        serializer = TemplateSerializer(template)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @extend_schema(request=TemplateUpdateSerializer, responses={200: TemplateSerializer})
    def put(self, request, template_id):
        template = self.get_object(template_id, request.user)
        serializer = TemplateUpdateSerializer(template, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            response_serializer = TemplateSerializer(template)
            return Response(
                {"message": "Template updated successfully!", "data": response_serializer.data},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @extend_schema(responses={204: None})
    def delete(self, request, template_id):
        template = self.get_object(template_id, request.user)
        template.is_active = False  # Soft delete
        template.save()
        return Response(
            {"message": "Template deleted successfully!"},
            status=status.HTTP_204_NO_CONTENT
        )


class TemplateContentView(APIView):
    """Get template HTML content for editor"""
    permission_classes = [IsAuthenticated, ReferlyPermission]
    
    @extend_schema(responses={200: {"type": "object", "properties": {"html_content": {"type": "string"}}}})
    def get(self, request, template_id):
        template = get_object_or_404(Template, id=template_id, user=request.user, is_active=True)
        return Response({"html_content": template.html_content}, status=status.HTTP_200_OK)


# Resume Management APIs
class ResumeListView(APIView):
    """List all user resumes"""
    permission_classes = [IsAuthenticated, ReferlyPermission]
    
    @extend_schema(responses={200: ResumeSerializer(many=True)})
    def get(self, request):
        resumes = Resume.objects.filter(user=request.user, is_active=True)
        serializer = ResumeSerializer(resumes, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ResumeUploadView(APIView):
    """Upload a new resume"""
    permission_classes = [IsAuthenticated, ReferlyPermission]
    
    @extend_schema(request=ResumeUploadSerializer, responses={201: ResumeSerializer})
    def post(self, request):
        # Check quota
        quota, _ = UserQuota.objects.get_or_create(user=request.user)
        if not quota.can_create_resume():
            return Response(
                {"error": f"Resume limit reached. Maximum {quota.max_resumes} resumes allowed."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = ResumeUploadSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            resume = serializer.save()
            response_serializer = ResumeSerializer(resume)
            return Response(
                {"message": "Resume uploaded successfully!", "data": response_serializer.data},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ResumeDetailView(APIView):
    """Get or delete a specific resume"""
    permission_classes = [IsAuthenticated, ReferlyPermission]
    
    def get_object(self, resume_id, user):
        return get_object_or_404(Resume, id=resume_id, user=user, is_active=True)
    
    @extend_schema(responses={200: ResumeSerializer})
    def get(self, request, resume_id):
        resume = self.get_object(resume_id, request.user)
        serializer = ResumeSerializer(resume)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @extend_schema(responses={204: None})
    def delete(self, request, resume_id):
        resume = self.get_object(resume_id, request.user)
        resume.is_active = False  # Soft delete
        resume.save()
        return Response(
            {"message": "Resume deleted successfully!"},
            status=status.HTTP_204_NO_CONTENT
        )


class ResumePreviewView(APIView):
    """Preview resume content for iframe/HTML display"""
    permission_classes = [IsAuthenticated, ReferlyPermission]
    
    def get(self, request, resume_id):
        resume = get_object_or_404(Resume, id=resume_id, user=request.user, is_active=True)
        
        if resume.file_extension == 'pdf':
            # Return PDF binary data with proper headers for iframe display
            response = HttpResponse(resume.file_content, content_type='application/pdf')
            response['Content-Disposition'] = f'inline; filename="{resume.name}.pdf"'
            return response
        
        elif resume.file_extension == 'docx':
            # For DOCX, return a simple HTML preview (you can enhance this with actual conversion)
            html_content = f'''
            <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Document Preview</h2>
                <p><strong>File:</strong> {resume.name}.{resume.file_extension}</p>
                <p><strong>Size:</strong> {resume.file_size // 1024}KB</p>
                <p><strong>Uploaded:</strong> {resume.created_at.strftime('%Y-%m-%d %H:%M')}</p>
                <hr>
                <p><em>DOCX preview not yet implemented. File is ready for download or email attachment.</em></p>
            </body>
            </html>
            '''
            return HttpResponse(html_content, content_type='text/html')
        
        return Response({"error": "Unsupported file type"}, status=status.HTTP_400_BAD_REQUEST)


class ResumeDownloadView(APIView):
    """Download resume file"""
    permission_classes = [IsAuthenticated, ReferlyPermission]
    
    def get(self, request, resume_id):
        resume = get_object_or_404(Resume, id=resume_id, user=request.user, is_active=True)
        
        content_type = 'application/pdf' if resume.file_extension == 'pdf' else 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        response = HttpResponse(resume.file_content, content_type=content_type)
        response['Content-Disposition'] = f'attachment; filename="{resume.name}.{resume.file_extension}"'
        
        return response


class ResumeEmailFormatView(APIView):
    """Get resume in email-friendly format (base64)"""
    permission_classes = [IsAuthenticated, ReferlyPermission]
    
    @extend_schema(responses={200: ResumePreviewSerializer})
    def get(self, request, resume_id):
        resume = get_object_or_404(Resume, id=resume_id, user=request.user, is_active=True)
        serializer = ResumePreviewSerializer(resume)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ResumeFileView(APIView):
    """Serve raw resume file for iframe embedding (with proper headers)"""
    permission_classes = [IsAuthenticated, ReferlyPermission]
    
    def get(self, request, resume_id):
        resume = get_object_or_404(Resume, id=resume_id, user=request.user, is_active=True)
        
        if resume.file_extension == 'pdf':
            # Return raw PDF with iframe-friendly headers
            response = HttpResponse(resume.file_content, content_type='application/pdf')
            response['Content-Disposition'] = f'inline; filename="{resume.name}.pdf"'
            
            # Headers for iframe embedding (since X_FRAME_OPTIONS = "ALLOWALL" in settings)
            response['Cache-Control'] = 'public, max-age=3600'  # Cache for 1 hour
            response['Access-Control-Allow-Origin'] = '*'  # Allow cross-origin access
            
            return response
            
        elif resume.file_extension == 'docx':
            # For DOCX, return the actual file (browsers will handle download)
            response = HttpResponse(resume.file_content, content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document')
            response['Content-Disposition'] = f'inline; filename="{resume.name}.{resume.file_extension}"'
            return response
        
        return Response({"error": "Unsupported file type"}, status=status.HTTP_400_BAD_REQUEST)


# User Quota API
class UserQuotaView(APIView):
    """Get user quota information"""
    permission_classes = [IsAuthenticated, ReferlyPermission]
    
    @extend_schema(responses={200: UserQuotaSerializer})
    def get(self, request):
        quota, _ = UserQuota.objects.get_or_create(user=request.user)
        serializer = UserQuotaSerializer(quota)
        return Response(serializer.data, status=status.HTTP_200_OK)
