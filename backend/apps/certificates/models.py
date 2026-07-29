import uuid
from django.conf import settings
from django.db import models


class CertificateTemplate(models.Model):
    public_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    background_image_url = models.URLField(max_length=2048, blank=True, null=True)
    logo_image_url = models.URLField(max_length=2048, blank=True, null=True)
    signature_image_url = models.URLField(max_length=2048, blank=True, null=True)

    # Custom positions JSON storing pixel/percent coordinates:
    # {
    #   "name": {"x": 50, "y": 42, "fontSize": 28, "color": "#00d47e", "align": "center"},
    #   "role": {"x": 50, "y": 50, "fontSize": 18, "color": "#ffffff", "align": "center"},
    #   "program_name": {"x": 50, "y": 58, "fontSize": 22, "color": "#ffffff", "align": "center"},
    #   "date": {"x": 20, "y": 80, "fontSize": 14, "color": "#aaaaaa", "align": "left"},
    #   "cert_number": {"x": 80, "y": 80, "fontSize": 14, "color": "#aaaaaa", "align": "right"},
    #   "signature": {"x": 75, "y": 68, "width": 140},
    #   "qr_code": {"x": 25, "y": 68, "width": 100}
    # }
    custom_positions = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'certificate_templates'
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class Certificate(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        GENERATED = 'generated', 'Generated'
        FAILED = 'failed', 'Failed'
        REVOKED = 'revoked', 'Revoked'

    class CertType(models.TextChoices):
        INDIVIDUAL = 'individual', 'Individual Award / Certificate'
        PROGRAM = 'program', 'Program Certificate'
        COURSE = 'course', 'Course Certificate'

    verification_uuid = models.UUIDField(
        default=uuid.uuid4, unique=True, editable=False,
        help_text='Public verification identifier'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='certificates'
    )
    template = models.ForeignKey(
        CertificateTemplate, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='certificates'
    )
    cert_type = models.CharField(
        max_length=20, choices=CertType.choices, default=CertType.INDIVIDUAL
    )

    # Nullable relationships (for course certificates)
    course = models.ForeignKey(
        'courses.Course', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='certificates'
    )
    enrollment = models.ForeignKey(
        'enrollments.Enrollment', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='certificate'
    )

    certificate_number = models.CharField(max_length=100, unique=True, blank=True, null=True)
    recipient_name_snapshot = models.CharField(max_length=255)
    title_snapshot = models.CharField(max_length=500)
    role_snapshot = models.CharField(max_length=100, blank=True, default='')

    # Generated PDF / QR
    pdf_url = models.URLField(max_length=2048, blank=True, null=True)
    pdf_sha256 = models.CharField(max_length=64, blank=True, null=True)

    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.GENERATED
    )
    issued_at = models.DateTimeField(auto_now_add=True)
    revoked_at = models.DateTimeField(blank=True, null=True)
    revoke_reason = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'certificates'
        indexes = [
            models.Index(fields=['user'], name='idx_certificates_user_id'),
            models.Index(fields=['verification_uuid'], name='idx_certificates_ver_uuid'),
        ]
        ordering = ['-issued_at']

    def __str__(self):
        return f'Certificate: {self.recipient_name_snapshot} — {self.title_snapshot}'

    @property
    def is_valid(self):
        return self.status == self.Status.GENERATED

    @property
    def verification_url(self):
        return f'/verify/{self.verification_uuid}'
