"""Certificates admin (Unfold themed)."""
from django.contrib import admin
from django.utils import timezone
from unfold.admin import ModelAdmin
from .models import Certificate, CertificateTemplate


@admin.register(CertificateTemplate)
class CertificateTemplateAdmin(ModelAdmin):
    list_display = ('name', 'created_at')
    search_fields = ('name',)


@admin.register(Certificate)
class CertificateAdmin(ModelAdmin):
    list_display = (
        'recipient_name_snapshot', 'title_snapshot', 'cert_type',
        'status', 'issued_at', 'verification_uuid'
    )
    list_filter = ('status', 'cert_type', 'issued_at')
    search_fields = ('recipient_name_snapshot', 'title_snapshot', 'verification_uuid', 'certificate_number')
    readonly_fields = (
        'verification_uuid', 'recipient_name_snapshot', 'title_snapshot',
        'pdf_url', 'pdf_sha256', 'issued_at',
    )

    actions = ['revoke_certificates']

    @admin.action(description='Revoke selected certificates')
    def revoke_certificates(self, request, queryset):
        queryset.update(
            status='revoked',
            revoked_at=timezone.now(),
            revoke_reason='Revoked by admin',
        )
        self.message_user(request, f'{queryset.count()} certificate(s) revoked.')
