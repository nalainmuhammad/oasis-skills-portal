import os
import uuid
from datetime import datetime
from typing import List, Optional
from django.conf import settings
from django.http import HttpResponse, HttpResponseRedirect
from django.core.cache import cache
from ninja import Router, Schema
from ninja.errors import HttpError
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from apps.users.api import jwt_auth
from apps.activities.models import Activity, ActivityApplication
from .models import Certificate, CertificateTemplate

User = get_user_model()
router = Router()


# ─────────────────────────────────────────────
# SCHEMAS
# ─────────────────────────────────────────────
class CertificateOut(Schema):
    verification_uuid: uuid.UUID
    certificate_number: Optional[str] = None
    title_snapshot: str
    course_title_snapshot: Optional[str] = None
    recipient_name_snapshot: str
    role_snapshot: Optional[str] = None
    cert_type: str
    status: str
    issued_at: datetime
    pdf_url: Optional[str] = None
    verification_url: str


class CertificateVerifyOut(Schema):
    verification_uuid: uuid.UUID
    certificate_number: Optional[str] = None
    title_snapshot: str
    course_title_snapshot: Optional[str] = None
    recipient_name_snapshot: str
    role_snapshot: Optional[str] = None
    cert_type: str
    status: str
    issued_at: datetime
    pdf_url: Optional[str] = None
    recipient_avatar_url: Optional[str] = None
    recipient_avatar_type: Optional[str] = None
    recipient_avatar_icon: Optional[str] = None
    course_slug: Optional[str] = None


class TemplateCreateIn(Schema):
    name: str
    description: Optional[str] = None
    background_image_url: Optional[str] = None
    logo_image_url: Optional[str] = None
    signature_image_url: Optional[str] = None
    custom_positions: dict = {}


class TemplateOut(Schema):
    public_id: uuid.UUID
    name: str
    description: Optional[str] = None
    background_image_url: Optional[str] = None
    logo_image_url: Optional[str] = None
    signature_image_url: Optional[str] = None
    custom_positions: dict
    created_at: str


class IssueIndividualCertIn(Schema):
    user_id: uuid.UUID
    template_id: Optional[uuid.UUID] = None
    title: str
    role: str = 'Volunteer'


class IssueProgramCertIn(Schema):
    activity_id: uuid.UUID
    template_id: Optional[uuid.UUID] = None
    custom_title: Optional[str] = None


# ─────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────

@router.get('/me/certificates', response=List[CertificateOut], auth=jwt_auth)
def my_certificates(request):
    """List authenticated user's earned certificates."""
    user = request.auth_user
    certs = Certificate.objects.filter(user=user)
    res = []
    for c in certs:
        res.append({
            'verification_uuid': c.verification_uuid,
            'certificate_number': c.certificate_number or f"CERT-{c.id}",
            'title_snapshot': c.title_snapshot,
            'course_title_snapshot': c.title_snapshot,
            'recipient_name_snapshot': c.recipient_name_snapshot,
            'role_snapshot': c.role_snapshot,
            'cert_type': c.cert_type,
            'status': c.status,
            'issued_at': c.issued_at,
            'pdf_url': c.pdf_url or f"/api/certificates/{c.verification_uuid}/download",
            'verification_url': c.verification_url,
        })
    return res


@router.get('/verify/{cert_uuid}', response=CertificateVerifyOut)
def verify_certificate(request, cert_uuid: str):
    """Public verification lookup for certificates."""
    try:
        parsed_uuid = uuid.UUID(cert_uuid)
    except ValueError:
        raise HttpError(400, 'Invalid certificate ID format')

    cert_obj = Certificate.objects.filter(verification_uuid=parsed_uuid).select_related('user', 'course').first()
    if not cert_obj:
        raise HttpError(404, 'Certificate not found')

    avatar_url = cert_obj.user.avatar_url if cert_obj.user else None
    avatar_type = cert_obj.user.avatar_type if cert_obj.user else 'icon'
    avatar_icon = cert_obj.user.avatar_icon if cert_obj.user else 'default'

    course_slug = cert_obj.course.slug if cert_obj.course else None

    return {
        'verification_uuid': cert_obj.verification_uuid,
        'certificate_number': cert_obj.certificate_number or f"CERT-{cert_obj.id}",
        'title_snapshot': cert_obj.title_snapshot,
        'course_title_snapshot': cert_obj.title_snapshot,
        'recipient_name_snapshot': cert_obj.recipient_name_snapshot,
        'role_snapshot': cert_obj.role_snapshot,
        'cert_type': cert_obj.cert_type,
        'status': cert_obj.status,
        'issued_at': cert_obj.issued_at,
        'pdf_url': f"/api/certificates/{cert_obj.verification_uuid}/download",
        'recipient_avatar_url': avatar_url,
        'recipient_avatar_type': avatar_type,
        'recipient_avatar_icon': avatar_icon,
        'course_slug': course_slug,
    }


@router.get('/{cert_uuid}/download')
def download_certificate(request, cert_uuid: str):
    """Public download endpoint for certificates."""
    try:
        parsed_uuid = uuid.UUID(cert_uuid)
    except ValueError:
        raise HttpError(400, 'Invalid certificate ID format')

    cert_obj = Certificate.objects.filter(verification_uuid=parsed_uuid).first()
    if not cert_obj:
        raise HttpError(404, 'Certificate not found')

    if cert_obj.pdf_url and cert_obj.pdf_url.startswith('http'):
        return HttpResponseRedirect(cert_obj.pdf_url)

    if cert_obj.pdf_url and cert_obj.pdf_url.startswith('/media/'):
        media_path = cert_obj.pdf_url.lstrip('/')
        full_path = os.path.join(settings.BASE_DIR, media_path)
        if os.path.exists(full_path):
            with open(full_path, 'rb') as f:
                response = HttpResponse(f.read(), content_type='application/pdf')
                response['Content-Disposition'] = f'attachment; filename="Oasis_Certificate_{cert_obj.verification_uuid}.pdf"'
                return response

    return {
        "status": cert_obj.status,
        "verification_uuid": cert_obj.verification_uuid,
        "recipient_name": cert_obj.recipient_name_snapshot,
        "course_title": cert_obj.title_snapshot,
        "issued_at": cert_obj.issued_at,
        "message": "Certificate available for direct verification page download."
    }


# ── ADMIN TEMPLATE & CERTIFICATE GENERATION ──

@router.get('/templates', response=List[TemplateOut], auth=jwt_auth)
def list_templates(request):
    user = request.auth_user
    if user.role != 'admin' and not user.is_staff:
        raise HttpError(403, "Admin access required.")

    templates = CertificateTemplate.objects.all()
    res = []
    for t in templates:
        res.append({
            'public_id': t.public_id,
            'name': t.name,
            'description': t.description,
            'background_image_url': t.background_image_url,
            'logo_image_url': t.logo_image_url,
            'signature_image_url': t.signature_image_url,
            'custom_positions': t.custom_positions or {},
            'created_at': t.created_at.isoformat(),
        })
    return res


@router.post('/templates/create', response=TemplateOut, auth=jwt_auth)
def create_template(request, data: TemplateCreateIn):
    user = request.auth_user
    if user.role != 'admin' and not user.is_staff:
        raise HttpError(403, "Admin access required.")

    tmpl = CertificateTemplate.objects.create(
        name=data.name,
        description=data.description,
        background_image_url=data.background_image_url,
        logo_image_url=data.logo_image_url,
        signature_image_url=data.signature_image_url,
        custom_positions=data.custom_positions
    )

    return {
        'public_id': tmpl.public_id,
        'name': tmpl.name,
        'description': tmpl.description,
        'background_image_url': tmpl.background_image_url,
        'logo_image_url': tmpl.logo_image_url,
        'signature_image_url': tmpl.signature_image_url,
        'custom_positions': tmpl.custom_positions or {},
        'created_at': tmpl.created_at.isoformat(),
    }


@router.patch('/templates/{tmpl_id}/positions', response=TemplateOut, auth=jwt_auth)
def update_template_positions(request, tmpl_id: uuid.UUID, custom_positions: dict):
    user = request.auth_user
    if user.role != 'admin' and not user.is_staff:
        raise HttpError(403, "Admin access required.")

    tmpl = get_object_or_404(CertificateTemplate, public_id=tmpl_id)
    tmpl.custom_positions = custom_positions
    tmpl.save(update_fields=['custom_positions'])

    return {
        'public_id': tmpl.public_id,
        'name': tmpl.name,
        'description': tmpl.description,
        'background_image_url': tmpl.background_image_url,
        'logo_image_url': tmpl.logo_image_url,
        'signature_image_url': tmpl.signature_image_url,
        'custom_positions': tmpl.custom_positions or {},
        'created_at': tmpl.created_at.isoformat(),
    }


@router.post('/issue/individual', response=CertificateOut, auth=jwt_auth)
def issue_individual_certificate(request, data: IssueIndividualCertIn):
    """Admin issues individual award / certificate to 1 person."""
    admin = request.auth_user
    if admin.role != 'admin' and not admin.is_staff:
        raise HttpError(403, "Admin access required.")

    recipient = get_object_or_404(User, public_id=data.user_id)
    template_obj = CertificateTemplate.objects.filter(public_id=data.template_id).first() if data.template_id else None

    cert_num = f"CERT-OASIS-{datetime.now().year}-{Certificate.objects.count() + 1001}"

    cert = Certificate.objects.create(
        user=recipient,
        template=template_obj,
        cert_type=Certificate.CertType.INDIVIDUAL,
        certificate_number=cert_num,
        recipient_name_snapshot=recipient.full_name,
        title_snapshot=data.title,
        role_snapshot=data.role,
        status=Certificate.Status.GENERATED
    )

    # Notify recipient
    try:
        from apps.notifications.models import Notification
        Notification.objects.create(
            user=recipient,
            title="New Certificate Awarded!",
            message=f"Congratulations {recipient.full_name}! You have been awarded '{data.title}'. View it now on your dashboard.",
            type=Notification.NotificationType.CERTIFICATE_ISSUED
        )
    except Exception:
        pass

    return {
        'verification_uuid': cert.verification_uuid,
        'certificate_number': cert.certificate_number,
        'title_snapshot': cert.title_snapshot,
        'recipient_name_snapshot': cert.recipient_name_snapshot,
        'role_snapshot': cert.role_snapshot,
        'cert_type': cert.cert_type,
        'status': cert.status,
        'issued_at': cert.issued_at,
        'pdf_url': f"/api/certificates/{cert.verification_uuid}/download",
        'verification_url': cert.verification_url,
    }


@router.post('/issue/program', response=dict, auth=jwt_auth)
def issue_program_certificates(request, data: IssueProgramCertIn):
    """Admin bulk issues program certificates for all accepted participants of an activity."""
    admin = request.auth_user
    if admin.role != 'admin' and not admin.is_staff:
        raise HttpError(403, "Admin access required.")

    activity = get_object_or_404(Activity, public_id=data.activity_id)
    template_obj = CertificateTemplate.objects.filter(public_id=data.template_id).first() if data.template_id else None

    accepted_apps = ActivityApplication.objects.filter(activity=activity, status=ActivityApplication.Status.ACCEPTED)

    issued_count = 0
    title = data.custom_title or f"Certificate of Completion: {activity.title}"

    for app in accepted_apps:
        recipient = app.applicant
        # Avoid duplicate cert if already issued for this program
        if Certificate.objects.filter(user=recipient, title_snapshot=title).exists():
            continue

        cert_num = f"CERT-OASIS-{datetime.now().year}-{Certificate.objects.count() + 1001}"
        cert = Certificate.objects.create(
            user=recipient,
            template=template_obj,
            cert_type=Certificate.CertType.PROGRAM,
            certificate_number=cert_num,
            recipient_name_snapshot=recipient.full_name,
            title_snapshot=title,
            role_snapshot=app.applied_position,
            status=Certificate.Status.GENERATED
        )

        issued_count += 1

        # Notify participant
        try:
            from apps.notifications.models import Notification
            Notification.objects.create(
                user=recipient,
                title=f"Program Certificate Issued: {activity.title}",
                message=f"Congratulations! Your certificate for '{activity.title}' is now ready to download on your dashboard.",
                type=Notification.NotificationType.CERTIFICATE_ISSUED
            )
        except Exception:
            pass

    return {
        'message': f"Successfully generated {issued_count} certificates for program '{activity.title}'.",
        'issued_count': issued_count
    }
