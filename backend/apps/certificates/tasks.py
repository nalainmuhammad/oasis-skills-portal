"""
Certificate generation Celery task chain (§4.2).

Three independently retryable steps wired as a chain:
1. generate_certificate_pdf — Render HTML + convert to PDF with WeasyPrint
2. upload_certificate_pdf — Upload to S3, compute SHA-256
3. send_certificate_ready_email — Dispatch via SendGrid
"""
import hashlib
import io
import os
from celery import shared_task, chain
from django.conf import settings
from django.template.loader import render_to_string


def generate_certificate_chain(certificate_id: int):
    """
    Fire the full certificate pipeline as a Celery chain (§4.2).
    Each step is independently retryable — if email fails, PDF isn't regenerated.
    """
    chain(
        generate_certificate_pdf.s(certificate_id),
        upload_certificate_pdf.s(),
        send_certificate_ready_email.s(),
    ).apply_async()


@shared_task(
    bind=True,
    name='apps.certificates.tasks.generate_certificate_pdf',
    autoretry_for=(Exception,),
    retry_backoff=True,
    max_retries=3,
)
def generate_certificate_pdf(self, certificate_id: int):
    """
    Step 1: Render HTML template with snapshot data and QR code,
    convert to PDF with WeasyPrint (§4.2 step 1).

    Fetch certificate row with snapshot fields (single-table read, no joins).
    """
    from .models import Certificate

    cert = Certificate.objects.get(id=certificate_id)

    # Generate QR code encoding verification URL
    import qrcode
    from qrcode.image.pil import PilImage

    verification_url = f'https://learn.oasisfoundation.org/verify/{cert.verification_uuid}'
    qr = qrcode.make(verification_url, image_factory=PilImage)

    # Convert QR to base64 for embedding in HTML
    import base64
    qr_buffer = io.BytesIO()
    qr.save(qr_buffer, format='PNG')
    qr_base64 = base64.b64encode(qr_buffer.getvalue()).decode()

    # Render HTML template
    html_content = render_to_string('certificates/certificate.html', {
        'recipient_name': cert.recipient_name_snapshot,
        'course_title': cert.course_title_snapshot,
        'issued_at': cert.issued_at,
        'verification_uuid': str(cert.verification_uuid),
        'verification_url': verification_url,
        'qr_code_base64': qr_base64,
    })

    # Convert to PDF with WeasyPrint
    try:
        from weasyprint import HTML
        pdf_bytes = HTML(string=html_content).write_pdf()
    except ImportError:
        # WeasyPrint not installed (missing system libs) — mark as failed
        cert.status = Certificate.Status.FAILED
        cert.save(update_fields=['status'])
        raise

    return {
        'certificate_id': certificate_id,
        'pdf_bytes_b64': base64.b64encode(pdf_bytes).decode(),
    }


@shared_task(
    bind=True,
    name='apps.certificates.tasks.upload_certificate_pdf',
    autoretry_for=(Exception,),
    retry_backoff=True,
    max_retries=3,
)
def upload_certificate_pdf(self, result: dict):
    """
    Step 2: Compute SHA-256, upload to S3, update certificate row (§4.2 step 2).
    """
    import base64
    from .models import Certificate

    certificate_id = result['certificate_id']
    pdf_bytes = base64.b64decode(result['pdf_bytes_b64'])

    cert = Certificate.objects.get(id=certificate_id)

    # Compute SHA-256 checksum
    sha256 = hashlib.sha256(pdf_bytes).hexdigest()

    # Upload to S3 (or local storage in dev)
    if settings.AWS_ACCESS_KEY_ID:
        import boto3
        s3 = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_S3_REGION_NAME,
        )
        key = f'certificates/{cert.verification_uuid}.pdf'
        s3.put_object(
            Bucket=settings.AWS_STORAGE_BUCKET_NAME,
            Key=key,
            Body=pdf_bytes,
            ContentType='application/pdf',
        )
        pdf_url = f'https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com/{key}'
    else:
        # Dev: save to local media directory
        media_dir = os.path.join(settings.MEDIA_ROOT, 'certificates')
        os.makedirs(media_dir, exist_ok=True)
        filename = f'{cert.verification_uuid}.pdf'
        filepath = os.path.join(media_dir, filename)
        with open(filepath, 'wb') as f:
            f.write(pdf_bytes)
        pdf_url = f'{settings.MEDIA_URL}certificates/{filename}'

    # Update certificate row
    cert.pdf_url = pdf_url
    cert.pdf_sha256 = sha256
    cert.status = Certificate.Status.GENERATED
    cert.save(update_fields=['pdf_url', 'pdf_sha256', 'status'])

    return {
        'certificate_id': certificate_id,
        'pdf_url': pdf_url,
    }


@shared_task(
    bind=True,
    name='apps.certificates.tasks.send_certificate_ready_email',
    autoretry_for=(Exception,),
    retry_backoff=True,
    max_retries=3,
)
def send_certificate_ready_email(self, result: dict):
    """
    Step 3: Send "certificate ready" email via SendGrid (§4.2 step 3).
    """
    from .models import Certificate

    certificate_id = result['certificate_id']
    cert = Certificate.objects.select_related('user').get(id=certificate_id)

    if not cert.user or not cert.user.email:
        return  # User deleted or no email — skip

    from apps.users.api import send_email_via_resend

    subject = f'🎉 Your Certificate is Ready — {cert.course_title_snapshot}'
    text_message = (
        f'Congratulations, {cert.recipient_name_snapshot}!\n\n'
        f'You have successfully completed "{cert.course_title_snapshot}" '
        f'on the OASIS Platform.\n\n'
        f'Download your certificate: {cert.pdf_url}\n'
        f'Verify it: https://oasisportal.tech/verify/{cert.verification_uuid}\n\n'
        f'— The OASIS Foundation Team'
    )
    html_message = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #00d47e; margin: 0; font-size: 28px;">OASIS Academy</h1>
            <p style="color: #888; margin-top: 5px;">Certificate of Completion</p>
        </div>
        <div style="background: #1a1a2e; border-radius: 16px; padding: 30px; border: 1px solid rgba(255,255,255,0.1);">
            <p style="color: #ccc; margin-top: 0;">Congratulations <strong style="color: #fff;">{cert.recipient_name_snapshot}</strong>,</p>
            <p style="color: #aaa;">You have successfully completed <strong>"{cert.course_title_snapshot}"</strong>!</p>
            <div style="margin: 25px 0; text-align: center;">
                <a href="{cert.pdf_url}" style="background: #00d47e; color: #000; font-weight: bold; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Download Certificate (PDF)</a>
            </div>
            <p style="color: #888; font-size: 13px; text-align: center;">
                Verification Link: <a href="https://oasisportal.tech/verify/{cert.verification_uuid}" style="color: #00d47e;">https://oasisportal.tech/verify/{cert.verification_uuid}</a>
            </p>
        </div>
    </div>
    """

    send_email_via_resend(cert.user.email, subject, html_message, text_message)

    return {'certificate_id': certificate_id, 'email_sent': True}
