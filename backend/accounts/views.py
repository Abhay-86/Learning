from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db import transaction
from drf_spectacular.utils import extend_schema
from django.core.mail import send_mail

from .serializers import (
    RegisterSerializer, 
    UserSerializer,
    LoginSerializer,
    SendOTPSerializer,
    VerifyOTPSerializer,
)
from .models import CustomUser

class RegisterView(APIView):
    """User registration endpoint"""
    permission_classes = [AllowAny]
    authentication_classes = []
    
    @extend_schema(request=RegisterSerializer, responses={201: UserSerializer})
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    user = serializer.save()
                    return Response(
                        {
                            "message": "User registered successfully!",
                            "user": UserSerializer(user).data
                        },
                        status=status.HTTP_201_CREATED
                    )
            except Exception as e:
                return Response(
                    {"error": f"Something went wrong: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class LoginView(APIView):
    """User login endpoint - to be implemented"""
    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(request=LoginSerializer, responses={200: UserSerializer})
    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.validated_data['user']
            try:
                custom_user = CustomUser.objects.get(user=user)
            except CustomUser.DoesNotExist:
                return Response(
                    {"error": "Custom user profile not found."},
                    status=status.HTTP_404_NOT_FOUND
                )
            # if not custom_user.is_verified:
            #     return Response(
            #         {"error": "Please verify your email before logging in."},
            #         status=status.HTTP_403_FORBIDDEN
            #     )
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)
            response =  Response({
                "message": "Login successful.",
                "user": UserSerializer(user).data,
                "access": access_token,
                "refresh": refresh_token
            }, status=status.HTTP_200_OK)
        
            response.set_cookie(
                key='access',
                value=access_token,
                httponly=True,
                secure=True,      # True in production (HTTPS)
                samesite='None',
                max_age=60 * 60   # 1 hour
            )
            response.set_cookie(
                key='refresh',
                value=refresh_token,
                httponly=True,
                secure=True,
                samesite='None',
                max_age=24 * 60 * 60  # 1 day
            )
            return response
        

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProfileView(APIView):
    """User profile endpoint"""
    permission_classes = [IsAuthenticated]

    extend_schema(responses={200: UserSerializer})
    def get(self, request):
        user = request.user
        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)
class CookieTokenRefreshView(TokenRefreshView):
    """Custom refresh endpoint that reads the refresh token from HttpOnly cookie."""
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get('refresh')
        if not refresh_token:
            return Response({'error': 'Refresh token missing'}, status=status.HTTP_401_UNAUTHORIZED)

        serializer = self.get_serializer(data={'refresh': refresh_token})
        try:
            serializer.is_valid(raise_exception=True)
        except Exception:
            # Happens when refresh token is invalid or user doesn't exist
            return Response({'error': 'Invalid or expired refresh token'}, status=status.HTTP_401_UNAUTHORIZED)

        access_token = serializer.validated_data.get('access')
        response = Response({'access': access_token}, status=status.HTTP_200_OK)
        response.set_cookie(
            key='access',
            value=access_token,
            httponly=True,
            secure=True,
            samesite='None',
            max_age=60 * 60  # 1 hour
        )
        return response

class LogoutView(APIView):
    """User logout endpoint"""
    permission_classes = [IsAuthenticated]  # user must be logged in

    @extend_schema(responses={200: {"message": "Logout successful"}})
    def post(self, request):
        refresh_token = request.COOKIES.get("refresh")

        response = Response({"message": "Logout successful"}, status=status.HTTP_200_OK)

        # Clear both access and refresh cookies
        response.delete_cookie("access")
        response.delete_cookie("refresh")


        # OPTIONAL: blacklist refresh token for security
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()  # only if blacklist app enabled
            except Exception:
                pass

        return response
    

class SendOTPEmailView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(request=SendOTPSerializer, responses={200: dict})
    def post(self, request):
        serializer = SendOTPSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "OTP sent successfully!"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyOTPEmailView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(request=VerifyOTPSerializer, responses={200: dict})
    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            return Response(data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CompleteProfileView(APIView):
    """Complete user profile after registration"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if not hasattr(user, 'custom_user'):
            return Response({"error": "User profile not found"}, status=status.HTTP_404_NOT_FOUND)
        
        role = user.custom_user.role
        profile_data = request.data
        
        try:
            if role == 'STUDENT':
                return self.complete_student_profile(user, profile_data)
            elif role == 'TEACHER':
                return self.complete_teacher_profile(user, profile_data)
            elif role == 'PARENT':
                return self.complete_parent_profile(user, profile_data)
            else:
                return Response({"message": "Admin profile is already complete"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def complete_student_profile(self, user, data):
        from .models import Student, Class
        
        student = user.custom_user.student_profile
        
        # Update basic information
        if 'date_of_birth' in data:
            student.date_of_birth = data['date_of_birth']
        if 'address' in data:
            student.address = data['address']
        if 'emergency_contact' in data:
            student.emergency_contact = data['emergency_contact']
        if 'blood_group' in data:
            student.blood_group = data['blood_group']
            
        # Class assignment (usually done by admin, but allowing for demo purposes)
        if 'class_id' in data:
            try:
                class_obj = Class.objects.get(id=data['class_id'])
                student.current_class = class_obj
                # Auto-generate roll number if not provided
                if not student.roll_number:
                    last_roll = Student.objects.filter(
                        current_class=class_obj
                    ).exclude(roll_number__isnull=True).count()
                    student.roll_number = str(last_roll + 1).zfill(3)
            except Class.DoesNotExist:
                pass
        
        student.save()
        return Response({
            "message": "Student profile completed successfully",
            "profile": StudentSerializer(student).data
        })
    
    def complete_teacher_profile(self, user, data):
        from .models import Teacher, Subject, Class
        
        teacher = user.custom_user.teacher_profile
        
        # Update basic information
        if 'qualification' in data:
            teacher.qualification = data['qualification']
        if 'experience_years' in data:
            teacher.experience_years = data['experience_years']
        if 'salary' in data:
            teacher.salary = data['salary']
        
        teacher.save()
        
        # Assign subjects and classes (if provided)
        if 'subject_ids' in data:
            subjects = Subject.objects.filter(id__in=data['subject_ids'])
            teacher.subjects.set(subjects)
        
        if 'class_ids' in data:
            classes = Class.objects.filter(id__in=data['class_ids'])
            teacher.classes.set(classes)
        
        return Response({
            "message": "Teacher profile completed successfully",
            "profile": TeacherSerializer(teacher).data
        })
    
    def complete_parent_profile(self, user, data):
        from .models import Parent, Student
        
        parent = user.custom_user.parent_profile
        
        # Update basic information
        if 'relationship' in data:
            parent.relationship = data['relationship']
        if 'occupation' in data:
            parent.occupation = data['occupation']
        if 'office_address' in data:
            parent.office_address = data['office_address']
        if 'office_phone' in data:
            parent.office_phone = data['office_phone']
        
        parent.save()
        
        # Link to children (if provided student IDs)
        if 'student_ids' in data:
            students = Student.objects.filter(id__in=data['student_ids'])
            parent.students.set(students)
        
        return Response({
            "message": "Parent profile completed successfully",
            "profile": ParentSerializer(parent).data
        })


# School Management API Views
from rest_framework import generics, viewsets, permissions
from rest_framework.decorators import action
from django.db.models import Q, Avg, Count
from datetime import datetime, timedelta
from django.utils import timezone

from .serializers import (
    SchoolSerializer, SubjectSerializer, ClassSerializer, StudentSerializer,
    ParentSerializer, TeacherSerializer, GradeSerializer, AssignmentSerializer,
    AssignmentSubmissionSerializer, AttendanceSerializer, FeeSerializer,
    FeePaymentSerializer, EventSerializer
)
from .models import (
    School, Subject, Class, Student, Parent, Teacher, Grade, Assignment,
    AssignmentSubmission, Attendance, Fee, FeePayment, Event
)

class IsAdminOrReadOnly(permissions.BasePermission):
    """Custom permission to allow only admins to edit."""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and hasattr(request.user, 'custom_user') and request.user.custom_user.role == 'ADMIN'

class IsTeacherOrAdmin(permissions.BasePermission):
    """Custom permission for teachers and admins."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if hasattr(request.user, 'custom_user'):
            return request.user.custom_user.role in ['TEACHER', 'ADMIN']
        return False

class SchoolViewSet(viewsets.ModelViewSet):
    queryset = School.objects.all()
    serializer_class = SchoolSerializer
    permission_classes = [IsAdminOrReadOnly]

class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [IsTeacherOrAdmin]

class ClassViewSet(viewsets.ModelViewSet):
    queryset = Class.objects.all()
    serializer_class = ClassSerializer
    permission_classes = [IsTeacherOrAdmin]
    
    @action(detail=True, methods=['get'])
    def students(self, request, pk=None):
        """Get all students in a class"""
        class_obj = self.get_object()
        students = class_obj.students.all()
        serializer = StudentSerializer(students, many=True)
        return Response(serializer.data)

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'custom_user'):
            role = user.custom_user.role
            if role == 'ADMIN':
                return Student.objects.all()
            elif role == 'TEACHER':
                # Teachers can see students in their classes
                teacher = user.custom_user.teacher_profile
                return Student.objects.filter(current_class__in=teacher.classes.all())
            elif role == 'PARENT':
                # Parents can see their children
                parent = user.custom_user.parent_profile
                return parent.students.all()
            elif role == 'STUDENT':
                # Students can see only themselves
                return Student.objects.filter(user=user.custom_user)
        return Student.objects.none()
    
    @action(detail=True, methods=['get'])
    def grades(self, request, pk=None):
        """Get all grades for a student"""
        student = self.get_object()
        grades = student.grades.all().order_by('-exam_date')
        serializer = GradeSerializer(grades, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def attendance(self, request, pk=None):
        """Get attendance record for a student"""
        student = self.get_object()
        attendance = student.attendance.all().order_by('-date')
        serializer = AttendanceSerializer(attendance, many=True)
        return Response(serializer.data)

class ParentViewSet(viewsets.ModelViewSet):
    queryset = Parent.objects.all()
    serializer_class = ParentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'custom_user'):
            role = user.custom_user.role
            if role == 'ADMIN':
                return Parent.objects.all()
            elif role == 'PARENT':
                return Parent.objects.filter(user=user.custom_user)
        return Parent.objects.none()

class TeacherViewSet(viewsets.ModelViewSet):
    queryset = Teacher.objects.all()
    serializer_class = TeacherSerializer
    permission_classes = [IsTeacherOrAdmin]
    
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'custom_user'):
            role = user.custom_user.role
            if role == 'ADMIN':
                return Teacher.objects.all()
            elif role == 'TEACHER':
                return Teacher.objects.filter(user=user.custom_user)
        return Teacher.objects.none()
    
    @action(detail=True, methods=['get'])
    def my_classes(self, request, pk=None):
        """Get classes assigned to a teacher"""
        teacher = self.get_object()
        classes = teacher.classes.all()
        serializer = ClassSerializer(classes, many=True)
        return Response(serializer.data)

class GradeViewSet(viewsets.ModelViewSet):
    queryset = Grade.objects.all()
    serializer_class = GradeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'custom_user'):
            role = user.custom_user.role
            if role == 'ADMIN':
                return Grade.objects.all()
            elif role == 'TEACHER':
                teacher = user.custom_user.teacher_profile
                return Grade.objects.filter(teacher=teacher)
            elif role == 'STUDENT':
                student = user.custom_user.student_profile
                return Grade.objects.filter(student=student)
            elif role == 'PARENT':
                parent = user.custom_user.parent_profile
                return Grade.objects.filter(student__in=parent.students.all())
        return Grade.objects.none()

class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'custom_user'):
            role = user.custom_user.role
            if role == 'ADMIN':
                return Assignment.objects.all()
            elif role == 'TEACHER':
                teacher = user.custom_user.teacher_profile
                return Assignment.objects.filter(teacher=teacher)
            elif role in ['STUDENT', 'PARENT']:
                if role == 'STUDENT':
                    student = user.custom_user.student_profile
                    return Assignment.objects.filter(classes=student.current_class)
                else:  # PARENT
                    parent = user.custom_user.parent_profile
                    student_classes = [s.current_class for s in parent.students.all()]
                    return Assignment.objects.filter(classes__in=student_classes)
        return Assignment.objects.none()
    
    @action(detail=True, methods=['get'])
    def submissions(self, request, pk=None):
        """Get all submissions for an assignment"""
        assignment = self.get_object()
        submissions = assignment.submissions.all()
        serializer = AssignmentSubmissionSerializer(submissions, many=True)
        return Response(serializer.data)

class AssignmentSubmissionViewSet(viewsets.ModelViewSet):
    queryset = AssignmentSubmission.objects.all()
    serializer_class = AssignmentSubmissionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'custom_user'):
            role = user.custom_user.role
            if role == 'ADMIN':
                return AssignmentSubmission.objects.all()
            elif role == 'TEACHER':
                teacher = user.custom_user.teacher_profile
                return AssignmentSubmission.objects.filter(assignment__teacher=teacher)
            elif role == 'STUDENT':
                student = user.custom_user.student_profile
                return AssignmentSubmission.objects.filter(student=student)
            elif role == 'PARENT':
                parent = user.custom_user.parent_profile
                return AssignmentSubmission.objects.filter(student__in=parent.students.all())
        return AssignmentSubmission.objects.none()

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'custom_user'):
            role = user.custom_user.role
            if role == 'ADMIN':
                return Attendance.objects.all()
            elif role == 'TEACHER':
                teacher = user.custom_user.teacher_profile
                return Attendance.objects.filter(teacher=teacher)
            elif role == 'STUDENT':
                student = user.custom_user.student_profile
                return Attendance.objects.filter(student=student)
            elif role == 'PARENT':
                parent = user.custom_user.parent_profile
                return Attendance.objects.filter(student__in=parent.students.all())
        return Attendance.objects.none()
    
    @action(detail=False, methods=['post'])
    def mark_attendance(self, request):
        """Mark attendance for multiple students"""
        if not (hasattr(request.user, 'custom_user') and 
                request.user.custom_user.role in ['TEACHER', 'ADMIN']):
            return Response({"error": "Permission denied"}, status=403)
        
        attendance_data = request.data.get('attendance', [])
        teacher = request.user.custom_user.teacher_profile if request.user.custom_user.role == 'TEACHER' else None
        
        created_records = []
        for record in attendance_data:
            attendance, created = Attendance.objects.update_or_create(
                student_id=record['student_id'],
                date=record['date'],
                defaults={
                    'status': record['status'],
                    'teacher': teacher,
                    'remarks': record.get('remarks', '')
                }
            )
            created_records.append(AttendanceSerializer(attendance).data)
        
        return Response({"message": "Attendance marked successfully", "records": created_records})

class FeeViewSet(viewsets.ModelViewSet):
    queryset = Fee.objects.all()
    serializer_class = FeeSerializer
    permission_classes = [IsAdminOrReadOnly]

class FeePaymentViewSet(viewsets.ModelViewSet):
    queryset = FeePayment.objects.all()
    serializer_class = FeePaymentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'custom_user'):
            role = user.custom_user.role
            if role == 'ADMIN':
                return FeePayment.objects.all()
            elif role == 'STUDENT':
                student = user.custom_user.student_profile
                return FeePayment.objects.filter(student=student)
            elif role == 'PARENT':
                parent = user.custom_user.parent_profile
                return FeePayment.objects.filter(student__in=parent.students.all())
        return FeePayment.objects.none()

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter events based on user role and target audience"""
        queryset = Event.objects.filter(is_active=True).order_by('-date')
        user = self.request.user
        
        if hasattr(user, 'custom_user'):
            role = user.custom_user.role
            if role != 'ADMIN':
                # Filter by target audience
                queryset = queryset.filter(
                    Q(target_audience='ALL') | 
                    Q(target_audience=role.upper() + 'S')  # STUDENTS, TEACHERS, PARENTS
                )
        
        return queryset

# Dashboard API Views
class DashboardView(APIView):
    """Dashboard data based on user role"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        if not hasattr(user, 'custom_user'):
            return Response({"error": "User profile not found"}, status=404)
        
        role = user.custom_user.role
        
        if role == 'STUDENT':
            return self.student_dashboard(user)
        elif role == 'PARENT':
            return self.parent_dashboard(user)
        elif role == 'TEACHER':
            return self.teacher_dashboard(user)
        elif role == 'ADMIN':
            return self.admin_dashboard(user)
        
        return Response({"error": "Invalid role"}, status=400)
    
    def student_dashboard(self, user):
        student = user.custom_user.student_profile
        
        # Recent grades
        recent_grades = Grade.objects.filter(student=student).order_by('-exam_date')[:5]
        
        # Upcoming assignments
        upcoming_assignments = Assignment.objects.filter(
            classes=student.current_class,
            due_date__gte=timezone.now()
        ).order_by('due_date')[:5]
        
        # Attendance percentage
        total_days = Attendance.objects.filter(student=student).count()
        present_days = Attendance.objects.filter(student=student, status='PRESENT').count()
        attendance_percentage = (present_days / total_days * 100) if total_days > 0 else 0
        
        # Recent events
        events = Event.objects.filter(
            Q(target_audience='ALL') | Q(target_audience='STUDENTS'),
            is_active=True,
            date__gte=timezone.now().date()
        ).order_by('date')[:5]
        
        return Response({
            "role": "STUDENT",
            "student_info": StudentSerializer(student).data,
            "recent_grades": GradeSerializer(recent_grades, many=True).data,
            "upcoming_assignments": AssignmentSerializer(upcoming_assignments, many=True).data,
            "attendance_percentage": round(attendance_percentage, 2),
            "upcoming_events": EventSerializer(events, many=True).data
        })
    
    def parent_dashboard(self, user):
        parent = user.custom_user.parent_profile
        children = parent.students.all()
        
        dashboard_data = {
            "role": "PARENT",
            "parent_info": ParentSerializer(parent).data,
            "children": []
        }
        
        for child in children:
            # Recent grades for each child
            recent_grades = Grade.objects.filter(student=child).order_by('-exam_date')[:3]
            
            # Attendance percentage for each child
            total_days = Attendance.objects.filter(student=child).count()
            present_days = Attendance.objects.filter(student=child, status='PRESENT').count()
            attendance_percentage = (present_days / total_days * 100) if total_days > 0 else 0
            
            dashboard_data["children"].append({
                "student_info": StudentSerializer(child).data,
                "recent_grades": GradeSerializer(recent_grades, many=True).data,
                "attendance_percentage": round(attendance_percentage, 2)
            })
        
        return Response(dashboard_data)
    
    def teacher_dashboard(self, user):
        teacher = user.custom_user.teacher_profile
        
        # Classes taught
        classes = teacher.classes.all()
        
        # Recent assignments created
        recent_assignments = Assignment.objects.filter(teacher=teacher).order_by('-created_at')[:5]
        
        # Students count
        total_students = Student.objects.filter(current_class__in=classes).count()
        
        return Response({
            "role": "TEACHER",
            "teacher_info": TeacherSerializer(teacher).data,
            "classes_count": classes.count(),
            "total_students": total_students,
            "recent_assignments": AssignmentSerializer(recent_assignments, many=True).data
        })
    
    def admin_dashboard(self, user):
        # System overview
        total_students = Student.objects.count()
        total_teachers = Teacher.objects.count()
        total_parents = Parent.objects.count()
        total_classes = Class.objects.count()
        
        # Recent registrations
        recent_students = Student.objects.order_by('-user__created_at')[:5]
        
        return Response({
            "role": "ADMIN",
            "stats": {
                "total_students": total_students,
                "total_teachers": total_teachers,
                "total_parents": total_parents,
                "total_classes": total_classes
            },
            "recent_students": StudentSerializer(recent_students, many=True).data
        })