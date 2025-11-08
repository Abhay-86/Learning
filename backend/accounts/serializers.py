from rest_framework import serializers
from django.contrib.auth.models import User
from .models import CustomUser, EmailOTP
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from datetime import timedelta

class RegisterSerializer(serializers.ModelSerializer):
    phone_number = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True, required=True)
    role = serializers.ChoiceField(choices=CustomUser.ROLE_CHOICES, default='STUDENT')

    class Meta:
        model = User
        fields = (
            'email',
            'password',
            'confirm_password',
            'first_name',
            'last_name',
            'phone_number',
            'role',
        )

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        phone_number = validated_data.pop('phone_number', None)
        validated_data.pop('confirm_password', None)
        email = validated_data.get('email')

        # generate username from email
        username = email.split('@')[0]

        user = User.objects.create_user(
            username=username,
            password=validated_data['password'],
            email=email,
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            is_active=True
        )

        role = validated_data.get('role', 'STUDENT')
        
        custom_user = CustomUser.objects.create(
            user=user,
            phone_number=phone_number,
            is_verified=False,
            role=role
        )

        # Create role-specific profile based on the selected role
        self.create_role_profile(custom_user, role)

        return user
    
    def create_role_profile(self, custom_user, role):
        """Create role-specific profile after user registration"""
        from .models import Student, Teacher, Parent, School
        
        # Get or create a default school (you might want to make this configurable)
        default_school, created = School.objects.get_or_create(
            name="Default School",
            defaults={
                'address': "123 School Street",
                'phone': "+1234567890",
                'email': "admin@defaultschool.edu",
                'principal_name': "Principal Smith",
                'established_year': 2020,
            }
        )
        
        if role == 'STUDENT':
            # Create student profile with basic info
            # Note: current_class and roll_number will need to be set by admin later
            Student.objects.create(
                user=custom_user,
                student_id=f"STD{custom_user.user.id:06d}",
                school=default_school,
                # current_class=None (will be assigned by admin)
                # roll_number=None (will be assigned by admin) 
                admission_date=timezone.now().date(),
                date_of_birth=timezone.now().date() - timedelta(days=6570),  # Default to ~18 years old
                address="To be updated",
                emergency_contact=custom_user.phone_number or "To be updated",
            )
            
        elif role == 'TEACHER':
            # Create teacher profile
            Teacher.objects.create(
                user=custom_user,
                teacher_id=f"TCH{custom_user.user.id:06d}",
                school=default_school,
                qualification="To be updated",
                experience_years=0,
                date_of_joining=timezone.now().date(),
            )
            
        elif role == 'PARENT':
            # Create parent profile
            Parent.objects.create(
                user=custom_user,
                relationship='FATHER',  # Default, can be updated later
                occupation="To be updated",
            )
            
        # ADMIN role doesn't need additional profile - they use CustomUser directly
    
class UserSerializer(serializers.ModelSerializer):
    phone_number = serializers.CharField(source='custom_user.phone_number', read_only=True)
    role = serializers.CharField(source='custom_user.role', read_only=True)
    profile_id = serializers.SerializerMethodField()
    profile_complete = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'phone_number','role', 'profile_id', 'profile_complete')
    
    def get_profile_id(self, obj):
        """Get the profile ID based on user role"""
        if hasattr(obj, 'custom_user'):
            role = obj.custom_user.role
            if role == 'STUDENT' and hasattr(obj.custom_user, 'student_profile'):
                return obj.custom_user.student_profile.id
            elif role == 'TEACHER' and hasattr(obj.custom_user, 'teacher_profile'):
                return obj.custom_user.teacher_profile.id
            elif role == 'PARENT' and hasattr(obj.custom_user, 'parent_profile'):
                return obj.custom_user.parent_profile.id
        return None
    
    def get_profile_complete(self, obj):
        """Check if the user profile is complete"""
        if hasattr(obj, 'custom_user'):
            role = obj.custom_user.role
            if role == 'STUDENT' and hasattr(obj.custom_user, 'student_profile'):
                student = obj.custom_user.student_profile
                return student.current_class is not None and student.roll_number is not None
            elif role == 'TEACHER' and hasattr(obj.custom_user, 'teacher_profile'):
                teacher = obj.custom_user.teacher_profile
                return teacher.qualification != "To be updated"
            elif role == 'PARENT' and hasattr(obj.custom_user, 'parent_profile'):
                return True  # Parent profiles are considered complete by default
        return False

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if not email or not password:
            raise serializers.ValidationError("Both email and password are required.")
        # exsistence of user shouldn't be checked here, moved as this will releve the all the user before 
        # But that’s actually less secure, because it reveals to an attacker which usernames exist in your system (called user enumeration).
        # if not User.objects.filter(username=username).exists():
            # raise serializers.ValidationError("User does not exist.")

        try:
            user_obj = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid email or password.")

        # Authenticate using username internally
        user = authenticate(username=user_obj.username, password=password)

        if not user:
            raise serializers.ValidationError("Invalid email or password.")

        if not user.is_active:
            raise serializers.ValidationError("User account is disabled.")

        attrs['user'] = user
        return attrs

class SendOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email does not exist.")
        return value

    def create(self, validated_data):
        email = validated_data["email"]
        user = User.objects.get(email=email)
        otp_code = EmailOTP.generate_otp()
        EmailOTP.objects.create(user=user, otp=otp_code)

        # send the OTP email
        from django.core.mail import send_mail
        send_mail(
            subject="Your OTP Code",
            message=f"Your verification code is {otp_code}",
            from_email="abhay.singh@auraml.com",
            recipient_list=[email],
        )
        return {"message": "OTP sent successfully!"}


class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)

    def validate(self, data):
        email = data.get("email")
        otp = data.get("otp")

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found")

        otp_entry = EmailOTP.objects.filter(user=user, otp=otp, is_used=False).last()
        if not otp_entry:
            raise serializers.ValidationError("Invalid OTP")

        if otp_entry.is_expired():
            raise serializers.ValidationError("OTP expired")

        otp_entry.is_used = True
        otp_entry.save()

        # mark verified
        custom_user = user.custom_user
        custom_user.is_verified = True
        custom_user.save()

        return {"message": "Email verified successfully!"}


# School Management Serializers
from .models import (
    School, Subject, Class, Student, Parent, Teacher, 
    Grade, Assignment, AssignmentSubmission, Attendance, 
    Fee, FeePayment, Event
)

class SchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = '__all__'

class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = '__all__'

class ClassSerializer(serializers.ModelSerializer):
    subjects = SubjectSerializer(many=True, read_only=True)
    student_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Class
        fields = '__all__'
    
    def get_student_count(self, obj):
        return obj.students.count()

class StudentSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    school_name = serializers.CharField(source='school.name', read_only=True)
    class_name = serializers.CharField(source='current_class.name', read_only=True)
    
    class Meta:
        model = Student
        fields = '__all__'

class ParentSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    children = StudentSerializer(source='students', many=True, read_only=True)
    
    class Meta:
        model = Parent
        fields = '__all__'

class TeacherSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    subjects_taught = SubjectSerializer(source='subjects', many=True, read_only=True)
    classes_handled = ClassSerializer(source='classes', many=True, read_only=True)
    school_name = serializers.CharField(source='school.name', read_only=True)
    
    class Meta:
        model = Teacher
        fields = '__all__'

class GradeSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.user.get_full_name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.user.user.get_full_name', read_only=True)
    percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = Grade
        fields = '__all__'

class AssignmentSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.user.user.get_full_name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    classes_assigned = ClassSerializer(source='classes', many=True, read_only=True)
    
    class Meta:
        model = Assignment
        fields = '__all__'

class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.user.get_full_name', read_only=True)
    assignment_title = serializers.CharField(source='assignment.title', read_only=True)
    
    class Meta:
        model = AssignmentSubmission
        fields = '__all__'

class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.user.get_full_name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.user.user.get_full_name', read_only=True)
    
    class Meta:
        model = Attendance
        fields = '__all__'

class FeeSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='class_grade.name', read_only=True)
    
    class Meta:
        model = Fee
        fields = '__all__'

class FeePaymentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.user.get_full_name', read_only=True)
    fee_type = serializers.CharField(source='fee.get_fee_type_display', read_only=True)
    
    class Meta:
        model = FeePayment
        fields = '__all__'

class EventSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.user.get_full_name', read_only=True)
    
    class Meta:
        model = Event
        fields = '__all__'
