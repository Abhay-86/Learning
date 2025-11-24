from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.db.models import Q, Count
import base64

from features.permission import ReferlyPermission
from .models import Template, Resume, UserQuota, Company, HRContact
from .serializers import (
    TemplateSerializer, TemplateCreateSerializer, TemplateUpdateSerializer,
    ResumeSerializer, ResumeUploadSerializer, UserQuotaSerializer,
    FolderStructureSerializer, ResumePreviewSerializer,
    CompanySerializer, CompanyCreateSerializer, CompanyUpdateSerializer,
    HRContactSerializer, HRContactCreateSerializer, HRContactUpdateSerializer,
    HRContactListSerializer, BulkUploadResponseSerializer,
    CompanyStatsSerializer, HRContactStatsSerializer,
    CompanyBulkUploadSerializer, HRContactBulkUploadSerializer,
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
        template.delete()
        # template.save()
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
        # resume.save()
        resume.delete()
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
            # Return raw PDF with Chrome-compatible headers
            response = HttpResponse(resume.file_content, content_type='application/pdf')
            response['Content-Disposition'] = f'inline; filename="{resume.name}.pdf"'
            
            # Chrome-specific headers to allow embedding
            response['X-Frame-Options'] = 'SAMEORIGIN'  # Changed from ALLOWALL to SAMEORIGIN
            response['Content-Security-Policy'] = "frame-ancestors 'self' http://localhost:3000 https://localhost:3000"
            response['Cache-Control'] = 'public, max-age=3600'
            response['Access-Control-Allow-Origin'] = 'http://localhost:3000'
            response['Access-Control-Allow-Credentials'] = 'true'
            
            # Remove problematic headers that Chrome might block
            # response['Cross-Origin-Embedder-Policy'] = 'unsafe-none'
            # response['Cross-Origin-Resource-Policy'] = 'cross-origin'
            
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


# ==================== COMPANY MANAGEMENT VIEWS ====================

class CompanyListView(APIView):
    """List all companies with pagination and search"""
    permission_classes = [IsAuthenticated, ReferlyPermission]
    
    @extend_schema(
        parameters=[
            OpenApiParameter(name='search', type=str, description='Search in company name or domain'),
            OpenApiParameter(name='industry', type=str, description='Filter by industry'),
            OpenApiParameter(name='location', type=str, description='Filter by location'),
            OpenApiParameter(name='company_size', type=str, description='Filter by company size'),
        ],
        responses={200: CompanySerializer(many=True)}
    )
    def get(self, request):
        companies = Company.objects.filter(is_active=True)
        
        # Search functionality
        search = request.query_params.get('search', None)
        if search:
            companies = companies.filter(
                Q(name__icontains=search) | 
                Q(domain__icontains=search) |
                Q(company_id__icontains=search)
            )
        
        # Filter by industry
        industry = request.query_params.get('industry', None)
        if industry:
            companies = companies.filter(industry__icontains=industry)
        
        # Filter by location
        location = request.query_params.get('location', None)
        if location:
            companies = companies.filter(location__icontains=location)
        
        # Filter by company size
        company_size = request.query_params.get('company_size', None)
        if company_size:
            companies = companies.filter(company_size__icontains=company_size)
        
        serializer = CompanySerializer(companies, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CompanyCreateView(APIView):
    """Create a new company"""
    permission_classes = [IsAuthenticated, ReferlyPermission]
    
    @extend_schema(request=CompanyCreateSerializer, responses={201: CompanySerializer})
    def post(self, request):
        serializer = CompanyCreateSerializer(data=request.data)
        if serializer.is_valid():
            company = serializer.save()
            response_serializer = CompanySerializer(company)
            return Response(
                {"message": "Company created successfully!", "data": response_serializer.data},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CompanyDetailView(APIView):
    """Get, update, or delete a specific company"""
    permission_classes = [IsAuthenticated, ReferlyPermission]
    
    def get_object(self, company_id):
        return get_object_or_404(Company, company_id=company_id, is_active=True)
    
    @extend_schema(responses={200: CompanySerializer})
    def get(self, request, company_id):
        company = self.get_object(company_id)
        serializer = CompanySerializer(company)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @extend_schema(request=CompanyUpdateSerializer, responses={200: CompanySerializer})
    def put(self, request, company_id):
        company = self.get_object(company_id)
        serializer = CompanyUpdateSerializer(company, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            response_serializer = CompanySerializer(company)
            return Response(
                {"message": "Company updated successfully!", "data": response_serializer.data},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @extend_schema(responses={204: None})
    def delete(self, request, company_id):
        company = self.get_object(company_id)
        company.is_active = False  # Soft delete
        company.save()
        return Response(
            {"message": "Company deleted successfully!"},
            status=status.HTTP_204_NO_CONTENT
        )


class CompanySearchView(APIView):
    """Advanced company search with multiple filters"""
    permission_classes = [IsAuthenticated, ReferlyPermission]
    
    @extend_schema(
        parameters=[
            OpenApiParameter(name='query', type=str, description='General search query'),
            OpenApiParameter(name='industry', type=str, description='Filter by industry'),
            OpenApiParameter(name='location', type=str, description='Filter by location'),
            OpenApiParameter(name='min_employees', type=int, description='Minimum employee count'),
            OpenApiParameter(name='has_linkedin', type=bool, description='Has LinkedIn profile'),
        ],
        responses={200: CompanySerializer(many=True)}
    )
    def get(self, request):
        companies = Company.objects.filter(is_active=True)
        
        query = request.query_params.get('query', None)
        if query:
            companies = companies.filter(
                Q(name__icontains=query) |
                Q(domain__icontains=query) |
                Q(industry__icontains=query) |
                Q(location__icontains=query)
            )
        
        industry = request.query_params.get('industry', None)
        if industry:
            companies = companies.filter(industry__iexact=industry)
        
        location = request.query_params.get('location', None)
        if location:
            companies = companies.filter(location__icontains=location)
        
        has_linkedin = request.query_params.get('has_linkedin', None)
        if has_linkedin is not None:
            if has_linkedin.lower() == 'true':
                companies = companies.exclude(linkedin_url='')
            else:
                companies = companies.filter(linkedin_url='')
        
        serializer = CompanySerializer(companies, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# ==================== HR CONTACT MANAGEMENT VIEWS ====================

class HRContactListView(APIView):
    """List all HR contacts with pagination and search"""
    permission_classes = [IsAuthenticated, ReferlyPermission]
    
    @extend_schema(
        parameters=[
            OpenApiParameter(name='search', type=str, description='Search in HR name or email'),
            OpenApiParameter(name='company_id', type=str, description='Filter by company ID'),
            OpenApiParameter(name='verified_only', type=bool, description='Show only verified contacts'),
        ],
        responses={200: HRContactListSerializer(many=True)}
    )
    def get(self, request):
        hr_contacts = HRContact.objects.filter(is_active=True).select_related('company')
        
        # Search functionality
        search = request.query_params.get('search', None)
        if search:
            hr_contacts = hr_contacts.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search) |
                Q(company__name__icontains=search)
            )
        
        # Filter by company
        company_id = request.query_params.get('company_id', None)
        if company_id:
            hr_contacts = hr_contacts.filter(company__company_id=company_id)
        
        # Filter verified contacts only
        verified_only = request.query_params.get('verified_only', None)
        if verified_only and verified_only.lower() == 'true':
            hr_contacts = hr_contacts.filter(email_verified=True)
        
        serializer = HRContactListSerializer(hr_contacts, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class HRContactCreateView(APIView):
    """Create a new HR contact"""
    permission_classes = [IsAuthenticated, ReferlyPermission]
    
    @extend_schema(request=HRContactCreateSerializer, responses={201: HRContactSerializer})
    def post(self, request):
        serializer = HRContactCreateSerializer(data=request.data)
        if serializer.is_valid():
            hr_contact = serializer.save()
            response_serializer = HRContactSerializer(hr_contact)
            return Response(
                {"message": "HR contact created successfully!", "data": response_serializer.data},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class HRContactDetailView(APIView):
    """Get, update, or delete a specific HR contact"""
    permission_classes = [IsAuthenticated, ReferlyPermission]
    
    def get_object(self, hr_id):
        return get_object_or_404(HRContact, id=hr_id, is_active=True)
    
    @extend_schema(responses={200: HRContactSerializer})
    def get(self, request, hr_id):
        hr_contact = self.get_object(hr_id)
        serializer = HRContactSerializer(hr_contact)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @extend_schema(request=HRContactUpdateSerializer, responses={200: HRContactSerializer})
    def put(self, request, hr_id):
        hr_contact = self.get_object(hr_id)
        serializer = HRContactUpdateSerializer(hr_contact, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            response_serializer = HRContactSerializer(hr_contact)
            return Response(
                {"message": "HR contact updated successfully!", "data": response_serializer.data},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @extend_schema(responses={204: None})
    def delete(self, request, hr_id):
        hr_contact = self.get_object(hr_id)
        hr_contact.is_active = False  # Soft delete
        hr_contact.save()
        return Response(
            {"message": "HR contact deleted successfully!"},
            status=status.HTTP_204_NO_CONTENT
        )


class HRContactSearchView(APIView):
    """Advanced HR contact search"""
    permission_classes = [IsAuthenticated, ReferlyPermission]
    
    @extend_schema(
        parameters=[
            OpenApiParameter(name='query', type=str, description='General search query'),
            OpenApiParameter(name='company_name', type=str, description='Filter by company name'),
            OpenApiParameter(name='industry', type=str, description='Filter by company industry'),
            OpenApiParameter(name='location', type=str, description='Filter by company location'),
            OpenApiParameter(name='verified_email', type=bool, description='Has verified email'),
            OpenApiParameter(name='verified_linkedin', type=bool, description='Has verified LinkedIn'),
        ],
        responses={200: HRContactListSerializer(many=True)}
    )
    def get(self, request):
        hr_contacts = HRContact.objects.filter(is_active=True).select_related('company')
        
        query = request.query_params.get('query', None)
        if query:
            hr_contacts = hr_contacts.filter(
                Q(first_name__icontains=query) |
                Q(last_name__icontains=query) |
                Q(email__icontains=query) |
                Q(company__name__icontains=query)
            )
        
        company_name = request.query_params.get('company_name', None)
        if company_name:
            hr_contacts = hr_contacts.filter(company__name__icontains=company_name)
        
        industry = request.query_params.get('industry', None)
        if industry:
            hr_contacts = hr_contacts.filter(company__industry__icontains=industry)
        
        location = request.query_params.get('location', None)
        if location:
            hr_contacts = hr_contacts.filter(company__location__icontains=location)
        
        verified_email = request.query_params.get('verified_email', None)
        if verified_email is not None:
            hr_contacts = hr_contacts.filter(email_verified=verified_email.lower() == 'true')
        
        verified_linkedin = request.query_params.get('verified_linkedin', None)
        if verified_linkedin is not None:
            hr_contacts = hr_contacts.filter(linkedin_verified=verified_linkedin.lower() == 'true')
        
        serializer = HRContactListSerializer(hr_contacts, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class HRContactByCompanyView(APIView):
    """Get all HR contacts for a specific company"""
    permission_classes = [IsAuthenticated, ReferlyPermission]
    
    @extend_schema(responses={200: HRContactListSerializer(many=True)})
    def get(self, request, company_id):
        company = get_object_or_404(Company, company_id=company_id, is_active=True)
        hr_contacts = HRContact.objects.filter(company=company, is_active=True)
        serializer = HRContactListSerializer(hr_contacts, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# ==================== VERIFICATION VIEWS ====================

class VerifyHREmailView(APIView):
    """Mark HR contact email as verified"""
    permission_classes = [IsAuthenticated, ReferlyPermission]
    
    @extend_schema(responses={200: HRContactSerializer})
    def post(self, request, hr_id):
        hr_contact = get_object_or_404(HRContact, id=hr_id, is_active=True)
        hr_contact.email_verified = True
        hr_contact.save()
        serializer = HRContactSerializer(hr_contact)
        return Response(
            {"message": "Email verified successfully!", "data": serializer.data},
            status=status.HTTP_200_OK
        )


class VerifyHRLinkedInView(APIView):
    """Mark HR contact LinkedIn as verified"""
    permission_classes = [IsAuthenticated, ReferlyPermission]
    
    @extend_schema(responses={200: HRContactSerializer})
    def post(self, request, hr_id):
        hr_contact = get_object_or_404(HRContact, id=hr_id, is_active=True)
        hr_contact.linkedin_verified = True
        hr_contact.save()
        serializer = HRContactSerializer(hr_contact)
        return Response(
            {"message": "LinkedIn verified successfully!", "data": serializer.data},
            status=status.HTTP_200_OK
        )


# ==================== STATISTICS VIEWS ====================

class CompanyStatsView(APIView):
    """Get company statistics"""
    permission_classes = [IsAuthenticated, ReferlyPermission]
    
    @extend_schema(responses={200: CompanyStatsSerializer})
    def get(self, request):
        companies = Company.objects.filter(is_active=True)
        
        stats = {
            'total_companies': companies.count(),
            'active_companies': companies.filter(is_active=True).count(),
            'companies_by_industry': dict(companies.values('industry').annotate(count=Count('industry')).values_list('industry', 'count')),
            'companies_by_size': dict(companies.values('company_size').annotate(count=Count('company_size')).values_list('company_size', 'count')),
        }
        
        serializer = CompanyStatsSerializer(stats)
        return Response(serializer.data, status=status.HTTP_200_OK)


class HRContactStatsView(APIView):
    """Get HR contact statistics"""
    permission_classes = [IsAuthenticated, ReferlyPermission]
    
    @extend_schema(responses={200: HRContactStatsSerializer})
    def get(self, request):
        hr_contacts = HRContact.objects.filter(is_active=True)
        
        stats = {
            'total_hr_contacts': hr_contacts.count(),
            'active_hr_contacts': hr_contacts.filter(is_active=True).count(),
            'verified_emails': hr_contacts.filter(email_verified=True).count(),
            'verified_linkedin': hr_contacts.filter(linkedin_verified=True).count(),
            'contacts_by_company': dict(hr_contacts.values('company__name').annotate(count=Count('company')).values_list('company__name', 'count')),
        }
        
        serializer = HRContactStatsSerializer(stats)
        return Response(serializer.data, status=status.HTTP_200_OK)


# ==================== BULK UPLOAD VIEWS ====================

class CompanyBulkUploadView(APIView):
    """Bulk upload companies from Excel file (Admin only)"""
    permission_classes = [IsAuthenticated, ReferlyPermission]
    
    from accounts.models import IsCustomAdmin
    permission_classes = [IsAuthenticated, IsCustomAdmin, ReferlyPermission]
    
    @extend_schema(
        request=CompanyBulkUploadSerializer,
        responses={200: BulkUploadResponseSerializer}
    )
    def post(self, request):
        import pandas as pd
        from .utils import ExcelDataNormalizer
        from django.db import transaction
        
        serializer = CompanyBulkUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        excel_file = serializer.validated_data['file']
        
        try:
            # Read Excel file
            df = pd.read_excel(excel_file)
            
            # Normalize column names
            df = ExcelDataNormalizer.normalize_column_names(df)
            
            # Replace NaN with empty strings
            df = df.fillna('')
            
            success_count = 0
            error_count = 0
            errors = []
            created_companies = []
            
            for index, row in df.iterrows():
                row_number = index + 2  # Excel row number (accounting for header)
                
                try:
                    # Clean data
                    cleaned = ExcelDataNormalizer.clean_company_data(row)
                    
                    # Validate required fields
                    if not cleaned['name']:
                        errors.append(f"Row {row_number}: Missing company name")
                        error_count += 1
                        continue
                    
                    if not cleaned['domain']:
                        errors.append(f"Row {row_number}: Missing domain")
                        error_count += 1
                        continue
                    
                    # Generate company_id if not provided
                    if 'company_id' in row and row.get('company_id'):
                        company_id = str(row['company_id']).strip()
                    else:
                        # Auto-generate company_id from name
                        base_id = cleaned['name'][:20].upper().replace(' ', '_')
                        company_id = base_id
                        counter = 1
                        while Company.objects.filter(company_id=company_id).exists():
                            company_id = f"{base_id}_{counter}"
                            counter += 1
                    
                    # Check if company already exists
                    if Company.objects.filter(company_id=company_id).exists():
                        errors.append(f"Row {row_number}: Company ID '{company_id}' already exists")
                        error_count += 1
                        continue
                    
                    # Create company
                    with transaction.atomic():
                        company = Company.objects.create(
                            company_id=company_id,
                            name=cleaned['name'],
                            domain=cleaned['domain'],
                            industry=cleaned['industry'],
                            location=cleaned['location'],
                            employee_count_range=cleaned['employee_count_range'],
                            company_size=cleaned['company_size'],
                            linkedin_url=cleaned['linkedin_url'],
                            linkedin_company_id=cleaned['linkedin_company_id'],
                            is_active=True
                        )
                        created_companies.append(company.company_id)
                        success_count += 1
                
                except Exception as e:
                    errors.append(f"Row {row_number}: {str(e)}")
                    error_count += 1
            
            return Response({
                'success': True,
                'message': f'Uploaded {success_count} companies',
                'total_rows': len(df),
                'created': success_count,
                'errors': error_count,
                'error_details': errors[:20],  # Limit to first 20 errors
                'created_company_ids': created_companies[:10]  # Show first 10
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': f'Failed to process Excel file: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)


class HRContactBulkUploadView(APIView):
    """Bulk upload HR contacts from Excel file (Admin only)"""
    from accounts.models import IsCustomAdmin
    permission_classes = [IsAuthenticated, IsCustomAdmin, ReferlyPermission]
    
    @extend_schema(
        request=HRContactBulkUploadSerializer,
        responses={200: BulkUploadResponseSerializer}
    )
    def post(self, request):
        import pandas as pd
        from .utils import ExcelDataNormalizer
        from django.db import transaction
        
        serializer = HRContactBulkUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        excel_file = serializer.validated_data['file']
        
        try:
            # Read Excel file
            df = pd.read_excel(excel_file)
            
            # Normalize column names
            df = ExcelDataNormalizer.normalize_column_names(df)
            
            # Replace NaN with empty strings
            df = df.fillna('')
            
            success_count = 0
            error_count = 0
            errors = []
            created_contacts = []
            
            for index, row in df.iterrows():
                row_number = index + 2  # Excel row number (accounting for header)
                
                try:
                    # Clean data
                    cleaned = ExcelDataNormalizer.clean_hr_contact_data(row)
                    
                    # Validate required fields
                    if not cleaned['first_name']:
                        errors.append(f"Row {row_number}: Missing first name")
                        error_count += 1
                        continue
                    
                    if not cleaned['last_name']:
                        errors.append(f"Row {row_number}: Missing last name")
                        error_count += 1
                        continue
                    
                    if not cleaned['email']:
                        errors.append(f"Row {row_number}: Missing email")
                        error_count += 1
                        continue
                    
                    # Validate email format
                    if not ExcelDataNormalizer.validate_email(cleaned['email']):
                        errors.append(f"Row {row_number}: Invalid email format: {cleaned['email']}")
                        error_count += 1
                        continue
                    
                    # Check for duplicate email
                    if HRContact.objects.filter(email=cleaned['email']).exists():
                        errors.append(f"Row {row_number}: Email already exists: {cleaned['email']}")
                        error_count += 1
                        continue
                    
                    # Find company by company_id or company_name
                    company = None
                    if cleaned['company_id']:
                        try:
                            company = Company.objects.get(company_id=cleaned['company_id'], is_active=True)
                        except Company.DoesNotExist:
                            errors.append(f"Row {row_number}: Company ID not found: {cleaned['company_id']}")
                            error_count += 1
                            continue
                    elif cleaned['company_name']:
                        try:
                            company = Company.objects.get(name__iexact=cleaned['company_name'], is_active=True)
                        except Company.DoesNotExist:
                            errors.append(f"Row {row_number}: Company name not found: {cleaned['company_name']}")
                            error_count += 1
                            continue
                        except Company.MultipleObjectsReturned:
                            errors.append(f"Row {row_number}: Multiple companies found with name: {cleaned['company_name']}")
                            error_count += 1
                            continue
                    else:
                        errors.append(f"Row {row_number}: Missing company reference (company_id or company_name)")
                        error_count += 1
                        continue
                    
                    # Create HR contact
                    with transaction.atomic():
                        hr_contact = HRContact.objects.create(
                            company=company,
                            first_name=cleaned['first_name'],
                            last_name=cleaned['last_name'],
                            email=cleaned['email'],
                            phone=cleaned['phone'],
                            linkedin_url=cleaned['linkedin_url'],
                            email_verified=False,
                            linkedin_verified=False,
                            is_active=True
                        )
                        created_contacts.append(hr_contact.email)
                        success_count += 1
                
                except Exception as e:
                    errors.append(f"Row {row_number}: {str(e)}")
                    error_count += 1
            
            return Response({
                'success': True,
                'message': f'Uploaded {success_count} HR contacts',
                'total_rows': len(df),
                'created': success_count,
                'errors': error_count,
                'error_details': errors[:20],  # Limit to first 20 errors
                'created_emails': created_contacts[:10]  # Show first 10
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': f'Failed to process Excel file: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
