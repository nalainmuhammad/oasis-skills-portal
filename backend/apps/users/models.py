"""
Custom User model — mirrors the DDL from §2.2 exactly.

Design decisions (§2.1):
- BIGINT auto PK for internal joins (index locality, join speed)
- UUID public_id for external-facing references (unguessable)
- email normalized to lowercase in save()
- password_hash nullable for social-login-only accounts
- metadata JSONB for bio, links, department, custom fields
"""
import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    """Custom manager with create_user/create_superuser."""

    def create_user(self, email, full_name, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email).lower()
        user = self.model(email=email, full_name=full_name, **extra_fields)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, full_name, password=None, **extra_fields):
        extra_fields.setdefault('role', 'admin')
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('email_verified', True)
        return self.create_user(email, full_name, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom user model supporting Members, Volunteers, Instructors, and Admins:
    - public_id (UUID) for external references
    - registration_number (e.g. OASIS-VOL-2026-10001)
    - 4-step profile completion tracking (25%, 50%, 75%, 100%)
    """

    class Role(models.TextChoices):
        MEMBER = 'member', 'Member'
        INSTRUCTOR = 'instructor', 'Instructor'
        ADMIN = 'admin', 'Admin'

    class UserType(models.TextChoices):
        MEMBER = 'member', 'Member'
        VOLUNTEER = 'volunteer', 'Volunteer'
        ADMIN = 'admin', 'Admin'

    class VolunteerStatus(models.TextChoices):
        NOT_APPLIED = 'not_applied', 'Not Applied'
        PENDING = 'pending', 'Pending Approval'
        APPROVED = 'approved', 'Approved Volunteer'
        REJECTED = 'rejected', 'Rejected'

    class Position(models.TextChoices):
        VOLUNTEER = 'Volunteer', 'Volunteer'
        COORDINATOR = 'Coordinator', 'Coordinator'
        DIRECTOR = 'Director', 'Director'
        MENTOR = 'Mentor', 'Mentor'
        ALUMNI = 'Alumni', 'Alumni'
        MEMBER = 'Member', 'Member'

    class Gender(models.TextChoices):
        MALE = 'male', 'Male'
        FEMALE = 'female', 'Female'
        OTHER = 'other', 'Other'
        PREFER_NOT_TO_SAY = 'prefer_not_to_say', 'Prefer not to say'

    class AvatarType(models.TextChoices):
        UPLOAD = 'upload', 'Uploaded Photo'
        ICON = 'icon', 'Preset Icon'
        GOOGLE = 'google', 'Google Profile Photo'

    # Public UUID PK reference
    public_id = models.UUIDField(
        default=uuid.uuid4, unique=True, editable=False,
        help_text='Public-facing UUID'
    )
    registration_number = models.CharField(
        max_length=50, unique=True, blank=True, null=True,
        help_text='Unique Oasis Registration Number (e.g. OASIS-VOL-2026-10001)'
    )
    email = models.EmailField(max_length=255, unique=True)
    email_verified = models.BooleanField(default=False)
    
    # Personal Info
    first_name = models.CharField(max_length=150, blank=True, default='')
    last_name = models.CharField(max_length=150, blank=True, default='')
    full_name = models.CharField(max_length=255)
    gender = models.CharField(max_length=20, choices=Gender.choices, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    phone_number = models.CharField(max_length=30, blank=True, null=True)
    cnic_number = models.CharField(max_length=30, blank=True, null=True, help_text='CNIC or B-Form Number')

    user_type = models.CharField(max_length=20, choices=UserType.choices, default=UserType.MEMBER)
    position = models.CharField(max_length=50, choices=Position.choices, default=Position.MEMBER)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.MEMBER)
    volunteer_status = models.CharField(max_length=20, choices=VolunteerStatus.choices, default=VolunteerStatus.NOT_APPLIED)

    # ── 1. Educational Information (50% Completion Trigger) ──
    institution_name = models.CharField(max_length=255, blank=True, null=True)
    degree_program = models.CharField(max_length=255, blank=True, null=True)
    semester_class = models.CharField(max_length=100, blank=True, null=True)
    student_id = models.CharField(max_length=100, blank=True, null=True)
    gpa_percentage = models.CharField(max_length=50, blank=True, null=True)
    graduation_year = models.CharField(max_length=10, blank=True, null=True)

    # ── 2. Address Information (75% Completion Trigger) ──
    province = models.CharField(max_length=100, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    complete_address = models.TextField(blank=True, null=True)
    postal_code = models.CharField(max_length=20, blank=True, null=True)

    # ── 3. Emergency Information (100% Completion Trigger Part 1) ──
    guardian_name = models.CharField(max_length=255, blank=True, null=True)
    guardian_relationship = models.CharField(max_length=100, blank=True, null=True)
    guardian_contact = models.CharField(max_length=30, blank=True, null=True)
    alternate_contact = models.CharField(max_length=30, blank=True, null=True)

    # ── 4. Social Information (100% Completion Trigger Part 2) ──
    linkedin_url = models.URLField(max_length=1024, blank=True, null=True)
    github_url = models.URLField(max_length=1024, blank=True, null=True)
    portfolio_url = models.URLField(max_length=1024, blank=True, null=True)
    instagram_url = models.URLField(max_length=1024, blank=True, null=True)
    resume_url = models.URLField(max_length=2048, blank=True, null=True)

    # Avatar System
    avatar_url = models.URLField(max_length=2048, blank=True, null=True)
    avatar_type = models.CharField(
        max_length=10, choices=AvatarType.choices,
        default=AvatarType.ICON
    )
    avatar_icon = models.CharField(
        max_length=30, default='default'
    )
    bio = models.TextField(max_length=500, blank=True, null=True)

    metadata = models.JSONField(default=dict, blank=True)
    institution = models.CharField(max_length=255, blank=True, null=True)

    # Django auth fields
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login_at = models.DateTimeField(blank=True, null=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['email'], name='idx_users_email'),
            models.Index(fields=['registration_number'], name='idx_users_reg_num'),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.full_name} ({self.registration_number or self.email})'

    def save(self, *args, **kwargs):
        self.email = self.email.lower()
        if not self.full_name and (self.first_name or self.last_name):
            self.full_name = f'{self.first_name} {self.last_name}'.strip()
        if not self.institution and self.institution_name:
            self.institution = self.institution_name
        super().save(*args, **kwargs)

    @property
    def is_personal_complete(self) -> bool:
        return bool(self.full_name and self.phone_number and self.cnic_number)

    @property
    def is_educational_complete(self) -> bool:
        return bool(self.institution_name and self.degree_program)

    @property
    def is_address_complete(self) -> bool:
        return bool(self.province and self.city and self.complete_address)

    @property
    def is_emergency_social_complete(self) -> bool:
        has_emergency = bool(self.guardian_name and self.guardian_contact)
        has_social = bool(self.linkedin_url or self.github_url or self.portfolio_url or self.instagram_url)
        return has_emergency and has_social

    @property
    def profile_completion_percentage(self) -> int:
        score = 0
        if self.is_personal_complete:
            score += 25
        if self.is_educational_complete:
            score += 25
        if self.is_address_complete:
            score += 25
        if self.is_emergency_social_complete:
            score += 25
        return score

    @property
    def pending_sections(self) -> list:
        pending = []
        if not self.is_educational_complete:
            pending.append('Educational Information')
        if not self.is_address_complete:
            pending.append('Address Information')
        if not self.is_emergency_social_complete:
            pending.append('Emergency & Social Information')
        return pending

    @property
    def can_apply_for_volunteer(self) -> bool:
        return self.profile_completion_percentage == 100

    def approve_as_volunteer(self):
        import random
        self.volunteer_status = self.VolunteerStatus.APPROVED
        self.user_type = self.UserType.VOLUNTEER
        self.position = self.Position.VOLUNTEER
        if not self.registration_number:
            num = random.randint(10000, 99999)
            self.registration_number = f"OASIS-VOL-2026-{num}"
        self.save()


class PendingVolunteer(User):
    class Meta:
        proxy = True
        verbose_name = 'Pending Volunteer Request'
        verbose_name_plural = 'Pending Volunteer Requests (Action Required)'


class ApprovedVolunteer(User):
    class Meta:
        proxy = True
        verbose_name = 'Approved Volunteer'
        verbose_name_plural = 'Approved Volunteers Roster'



