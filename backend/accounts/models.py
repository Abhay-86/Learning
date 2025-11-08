from django.contrib.auth.models import User
from django.db import models
import random
from datetime import timedelta
from django.utils import timezone

# Create your models here.
class CustomUser(models.Model):
    ROLE_CHOICES = [
        ('ADMIN', 'Admin'),
        ('TEACHER', 'Teacher'),
        ('STUDENT', 'Student'),
        ('PARENT', 'Parent'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='custom_user')
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='STUDENT')
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} ({self.get_role_display()})"

class EmailOTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='email_otps')
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def is_expired(self):
        # OTP valid for 5 minutes
        return timezone.now() > self.created_at + timedelta(minutes=5)

    @staticmethod
    def generate_otp():
        return str(random.randint(100000, 999999))


# School Management Models
class School(models.Model):
    name = models.CharField(max_length=200)
    address = models.TextField()
    phone = models.CharField(max_length=15)
    email = models.EmailField()
    website = models.URLField(blank=True, null=True)
    principal_name = models.CharField(max_length=100)
    established_year = models.IntegerField()
    logo = models.ImageField(upload_to='school_logos/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Subject(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=10, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.code})"


class Class(models.Model):
    name = models.CharField(max_length=50)  # e.g., "Grade 1A", "Class 10B"
    grade_level = models.IntegerField()  # 1-12
    section = models.CharField(max_length=5)  # A, B, C, etc.
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='classes')
    subjects = models.ManyToManyField(Subject, related_name='classes')
    academic_year = models.CharField(max_length=9)  # e.g., "2024-2025"
    max_students = models.IntegerField(default=30)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['grade_level', 'section', 'school', 'academic_year']
        verbose_name_plural = "Classes"

    def __str__(self):
        return f"{self.name} - {self.school.name}"


class Student(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='student_profile')
    student_id = models.CharField(max_length=20, unique=True)
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='students')
    current_class = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='students', null=True, blank=True)
    roll_number = models.CharField(max_length=10, blank=True, null=True)
    date_of_birth = models.DateField()
    address = models.TextField()
    emergency_contact = models.CharField(max_length=15)
    blood_group = models.CharField(max_length=5, blank=True)
    admission_date = models.DateField()
    is_active = models.BooleanField(default=True)
    
    class Meta:
        # Only enforce unique roll_number within a class if both exist
        constraints = [
            models.UniqueConstraint(
                fields=['roll_number', 'current_class'],
                condition=models.Q(roll_number__isnull=False) & models.Q(current_class__isnull=False),
                name='unique_roll_number_per_class'
            )
        ]

    def __str__(self):
        return f"{self.user.user.get_full_name()} - {self.student_id}"


class Parent(models.Model):
    RELATIONSHIP_CHOICES = [
        ('FATHER', 'Father'),
        ('MOTHER', 'Mother'),
        ('GUARDIAN', 'Guardian'),
        ('GRANDPARENT', 'Grandparent'),
        ('OTHER', 'Other'),
    ]
    
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='parent_profile')
    students = models.ManyToManyField(Student, related_name='parents')
    relationship = models.CharField(max_length=20, choices=RELATIONSHIP_CHOICES)
    occupation = models.CharField(max_length=100, blank=True)
    office_address = models.TextField(blank=True)
    office_phone = models.CharField(max_length=15, blank=True)

    def __str__(self):
        return f"{self.user.user.get_full_name()} - {self.get_relationship_display()}"


class Teacher(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='teacher_profile')
    teacher_id = models.CharField(max_length=20, unique=True)
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='teachers')
    subjects = models.ManyToManyField(Subject, related_name='teachers')
    classes = models.ManyToManyField(Class, related_name='teachers')
    qualification = models.CharField(max_length=200)
    experience_years = models.IntegerField(default=0)
    salary = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    date_of_joining = models.DateField()
    is_class_teacher = models.BooleanField(default=False)
    class_teacher_of = models.ForeignKey(Class, on_delete=models.SET_NULL, null=True, blank=True, related_name='class_teacher')

    def __str__(self):
        return f"{self.user.user.get_full_name()} - {self.teacher_id}"


class Grade(models.Model):
    EXAM_TYPE_CHOICES = [
        ('UNIT_TEST', 'Unit Test'),
        ('MID_TERM', 'Mid Term'),
        ('FINAL', 'Final Exam'),
        ('ASSIGNMENT', 'Assignment'),
        ('PROJECT', 'Project'),
        ('QUIZ', 'Quiz'),
    ]
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='grades')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='grades')
    exam_type = models.CharField(max_length=20, choices=EXAM_TYPE_CHOICES)
    marks_obtained = models.DecimalField(max_digits=5, decimal_places=2)
    total_marks = models.DecimalField(max_digits=5, decimal_places=2)
    exam_date = models.DateField()
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='grades_given')
    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['student', 'subject', 'exam_type', 'exam_date']

    def __str__(self):
        return f"{self.student} - {self.subject} - {self.marks_obtained}/{self.total_marks}"

    @property
    def percentage(self):
        return (self.marks_obtained / self.total_marks) * 100


class Assignment(models.Model):
    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='assignments')
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='assignments')
    classes = models.ManyToManyField(Class, related_name='assignments')
    due_date = models.DateTimeField()
    max_marks = models.DecimalField(max_digits=5, decimal_places=2)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='MEDIUM')
    attachment = models.FileField(upload_to='assignments/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.subject}"


class AssignmentSubmission(models.Model):
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='assignment_submissions')
    submission_file = models.FileField(upload_to='submissions/')
    submission_text = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    marks_obtained = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    feedback = models.TextField(blank=True)
    is_late = models.BooleanField(default=False)

    class Meta:
        unique_together = ['assignment', 'student']

    def __str__(self):
        return f"{self.student} - {self.assignment}"


class Attendance(models.Model):
    ATTENDANCE_STATUS = [
        ('PRESENT', 'Present'),
        ('ABSENT', 'Absent'),
        ('LATE', 'Late'),
        ('EXCUSED', 'Excused'),
    ]
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='attendance')
    date = models.DateField()
    status = models.CharField(max_length=10, choices=ATTENDANCE_STATUS)
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='attendance_marked')
    remarks = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['student', 'date']

    def __str__(self):
        return f"{self.student} - {self.date} - {self.status}"


class Fee(models.Model):
    FEE_TYPE_CHOICES = [
        ('TUITION', 'Tuition Fee'),
        ('LIBRARY', 'Library Fee'),
        ('LAB', 'Laboratory Fee'),
        ('TRANSPORT', 'Transport Fee'),
        ('EXAM', 'Examination Fee'),
        ('SPORTS', 'Sports Fee'),
        ('OTHER', 'Other'),
    ]
    
    class_grade = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='fees')
    fee_type = models.CharField(max_length=20, choices=FEE_TYPE_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    academic_year = models.CharField(max_length=9)
    due_date = models.DateField()
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.class_grade} - {self.get_fee_type_display()} - {self.amount}"


class FeePayment(models.Model):
    PAYMENT_STATUS = [
        ('PENDING', 'Pending'),
        ('PAID', 'Paid'),
        ('PARTIAL', 'Partial'),
        ('OVERDUE', 'Overdue'),
    ]
    
    PAYMENT_METHOD = [
        ('CASH', 'Cash'),
        ('CARD', 'Card'),
        ('ONLINE', 'Online'),
        ('BANK_TRANSFER', 'Bank Transfer'),
        ('CHEQUE', 'Cheque'),
    ]
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='fee_payments')
    fee = models.ForeignKey(Fee, on_delete=models.CASCADE, related_name='payments')
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateField()
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD)
    transaction_id = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=10, choices=PAYMENT_STATUS, default='PAID')
    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student} - {self.fee} - {self.amount_paid}"


class Event(models.Model):
    EVENT_TYPE_CHOICES = [
        ('ANNOUNCEMENT', 'Announcement'),
        ('EXAM', 'Exam'),
        ('HOLIDAY', 'Holiday'),
        ('SPORTS', 'Sports Event'),
        ('CULTURAL', 'Cultural Event'),
        ('MEETING', 'Meeting'),
        ('OTHER', 'Other'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    event_type = models.CharField(max_length=20, choices=EVENT_TYPE_CHOICES)
    date = models.DateField()
    time = models.TimeField(blank=True, null=True)
    location = models.CharField(max_length=200, blank=True)
    target_audience = models.CharField(max_length=50)  # 'ALL', 'STUDENTS', 'TEACHERS', 'PARENTS', specific class
    created_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='events_created')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.date}"
