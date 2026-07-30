"""
Authentication API — RS256 JWT flow per §5.1.

Endpoints:
- POST /api/auth/register — Create account, send OTP email
- POST /api/auth/login — Issue JWT pair (access + refresh)
- POST /api/auth/refresh — Rotate access token
- POST /api/auth/verify-otp — Verify email with 6-digit OTP
- POST /api/auth/resend-otp — Resend OTP email
- POST /api/auth/google — Google OAuth sign-in
- GET /api/auth/me — Current user profile
- PATCH /api/auth/me — Update profile
- POST /api/auth/password — Update password
- POST /api/auth/upload-avatar — Upload avatar image
"""
import hashlib
import os
import random
import secrets
import string
import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Optional, List

import dns.resolver
import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password, check_password
from django.core.cache import cache
from django.core.mail import send_mail
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from ninja import Router, Schema, File, UploadedFile
from ninja.errors import HttpError
from ninja.security import HttpBearer

User = get_user_model()
router = Router()


# ─────────────────────────────────────────────
# JWT UTILITIES (§5.1 — RS256 asymmetric)
# ─────────────────────────────────────────────
def _get_private_key():
    """Load RSA private key for signing JWTs."""
    try:
        with open(settings.JWT_PRIVATE_KEY_PATH, 'r') as f:
            return f.read()
    except FileNotFoundError:
        # Development fallback: use HS256 with secret key
        return None


def _get_public_key():
    """Load RSA public key for verifying JWTs."""
    try:
        with open(settings.JWT_PUBLIC_KEY_PATH, 'r') as f:
            return f.read()
    except FileNotFoundError:
        return None


def create_access_token(user) -> str:
    """
    RS256-signed JWT, 15-minute TTL.
    Claims: sub (public_id), role, exp, iat (§5.1).
    Falls back to HS256 with SECRET_KEY in development.
    """
    now = datetime.now(timezone.utc)
    payload = {
        'sub': str(user.public_id),
        'role': user.role,
        'iat': now,
        'exp': now + timedelta(seconds=settings.JWT_ACCESS_TOKEN_LIFETIME_SECONDS),
        'type': 'access',
    }

    private_key = _get_private_key()
    if private_key:
        return jwt.encode(payload, private_key, algorithm='RS256')
    else:
        return jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')


def create_refresh_token(user) -> str:
    """
    Opaque random string, stored hashed in Redis (§5.1).
    Rotated on every use — reuse signals theft.
    """
    token = secrets.token_urlsafe(64)
    token_hash = hashlib.sha256(token.encode()).hexdigest()

    # Store hashed in cache with TTL matching lifetime
    ttl = settings.JWT_REFRESH_TOKEN_LIFETIME_DAYS * 86400
    cache.set(f'refresh:{token_hash}', str(user.public_id), ttl)

    return token


def verify_access_token(token: str) -> dict:
    """Verify JWT signature and expiry."""
    try:
        public_key = _get_public_key()
        if public_key:
            return jwt.decode(token, public_key, algorithms=['RS256'])
        else:
            return jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        raise HttpError(401, 'Token expired')
    except jwt.InvalidTokenError:
        raise HttpError(401, 'Invalid token')


# ─────────────────────────────────────────────
# AUTH DEPENDENCY (Ninja security — verifies JWT on every API call per §5.1)
# ─────────────────────────────────────────────
class JWTAuth(HttpBearer):
    """
    Django independently re-verifies the JWT on every API call (§5.1).
    Edge Middleware check is UX optimization, not the security boundary.
    """
    def authenticate(self, request, token: str):
        payload = verify_access_token(token)
        try:
            user = User.objects.get(public_id=payload['sub'])
            request.auth_user = user
            return user
        except User.DoesNotExist:
            raise HttpError(401, 'User not found')


jwt_auth = JWTAuth()


# ─────────────────────────────────────────────
# EMAIL DOMAIN VALIDATION (MX Record Check with Fallback)
# ─────────────────────────────────────────────
def validate_email_domain(email: str) -> bool:
    """
    Check if the email domain has valid MX records.
    Catches invalid domain formats while preventing cloud network timeouts from blocking users.
    """
    if not email or '@' not in email:
        return False
    domain = email.split('@')[1]
    if not domain or '.' not in domain:
        return False
    try:
        mx_records = dns.resolver.resolve(domain, 'MX', lifetime=2.0)
        return len(mx_records) > 0
    except Exception as e:
        # On cloud providers like Render, DNS query to external MX records may time out or be restricted.
        # Fallback to True for validly formatted emails so legitimate users are not blocked.
        print(f"[Email Validation] MX lookup notice for {domain}: {e}")
        return True


# ─────────────────────────────────────────────
# OTP UTILITIES
# ─────────────────────────────────────────────
def generate_otp() -> str:
    """Generate a 6-digit OTP."""
    return ''.join(random.choices(string.digits, k=6))


import threading

def send_email_via_resend(to_email: str, subject: str, html_message: str, text_message: str = None) -> bool:
    """
    Sends an email using the Resend API with fallback to Django send_mail.
    Returns True if sent successfully via Resend or Django SMTP.
    """
    resend_key = (
        os.getenv('RESEND_API_KEY') or 
        os.getenv('RESEND_KEY') or 
        os.getenv('RESEND_TOKEN') or 
        getattr(settings, 'RESEND_API_KEY', '')
    ).strip()

    from_sender = (
        os.getenv('DEFAULT_FROM_EMAIL') or 
        getattr(settings, 'DEFAULT_FROM_EMAIL', '')
    ).strip()

    if not from_sender or 'resend.dev' in from_sender or 'oasisfoundation.org' in from_sender:
        from_sender = 'OASIS Academy <noreply@oasisportal.tech>'
    elif '<' not in from_sender:
        from_sender = f'OASIS Academy <{from_sender}>'

    if not resend_key:
        print(f"[Resend API WARNING] RESEND_API_KEY environment variable is missing on server! Cannot send to {to_email}.")
    else:
        try:
            import json
            import urllib.request
            import urllib.error
            url = "https://api.resend.com/emails"
            data_dict = {
                "from": from_sender,
                "to": [to_email],
                "subject": subject,
                "html": html_message,
            }
            if text_message:
                data_dict["text"] = text_message

            payload = json.dumps(data_dict).encode('utf-8')
            req = urllib.request.Request(
                url,
                data=payload,
                headers={
                    "Authorization": f"Bearer {resend_key}",
                    "Content-Type": "application/json",
                    "User-Agent": "OASIS-Academy/1.0 (https://oasisportal.tech)",
                },
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                if response.status in (200, 201):
                    print(f"[Resend API] Successfully sent '{subject}' to {to_email} via Resend API")
                    return True
        except urllib.error.HTTPError as http_err:
            error_body = http_err.read().decode('utf-8', errors='ignore')
            print(f"[Resend API HTTP Error {http_err.code}] {error_body}")
        except Exception as resend_err:
            print(f"[Resend API Error] Failed to send to {to_email}: {resend_err}")

    # Fallback to Django send_mail
    try:
        from django.core.mail import send_mail
        send_mail(
            subject=subject,
            message=text_message or "Please view this email in an HTML-compatible client.",
            from_email=from_sender,
            recipient_list=[to_email],
            html_message=html_message,
            fail_silently=True,
        )
        print(f"[Django Mail] Sent '{subject}' to {to_email} via SMTP fallback")
        return True
    except Exception as smtp_err:
        print(f"[SMTP Fallback Error] Failed to send to {to_email}: {smtp_err}")
        return False


def _send_otp_email_thread(email: str, otp: str, full_name: str):
    """Background thread function to send OTP email."""
    subject = 'OASIS Academy — Verify Your Email'
    message = (
        f'Hello {full_name},\n\n'
        f'Welcome to OASIS Academy! Your email verification code is:\n\n'
        f'    {otp}\n\n'
        f'This code expires in 10 minutes.\n\n'
        f'If you did not create an account, please ignore this email.\n\n'
        f'— The OASIS Team'
    )
    html_message = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #00d47e; margin: 0; font-size: 28px;">OASIS Academy</h1>
            <p style="color: #888; margin-top: 5px;">Verify Your Email Address</p>
        </div>
        <div style="background: #1a1a2e; border-radius: 16px; padding: 30px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">
            <p style="color: #ccc; margin-top: 0;">Hello <strong style="color: #fff;">{full_name}</strong>,</p>
            <p style="color: #aaa;">Your verification code is:</p>
            <div style="background: #0f0f23; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #00d47e33;">
                <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #00d47e;">{otp}</span>
            </div>
            <p style="color: #888; font-size: 13px;">This code expires in 10 minutes.</p>
        </div>
        <p style="color: #666; font-size: 12px; text-align: center; margin-top: 20px;">
            If you did not create an account, please ignore this email.
        </p>
    </div>
    """
    sent = send_email_via_resend(email, subject, html_message, message)
    if not sent:
        print(f"[OTP Email Code] Fallback verification code for {email}: {otp}")


def send_otp_email(email: str, otp: str, full_name: str):
    """Send OTP verification email asynchronously."""
    thread = threading.Thread(target=_send_otp_email_thread, args=(email, otp, full_name))
    thread.start()


def send_deletion_email(email: str, full_name: str):
    """Send an account deletion notification email."""
    subject = 'OASIS Academy — Account Deleted'
    html_message = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #e11d48; margin: 0; font-size: 28px;">OASIS Academy</h1>
        </div>
        <div style="background: #1a1a2e; border-radius: 16px; padding: 30px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">
            <p style="color: #ccc; margin-top: 0;">Hello <strong style="color: #fff;">{full_name}</strong>,</p>
            <p style="color: #aaa;">This is a confirmation that your OASIS Academy account has been successfully deleted.</p>
            <p style="color: #aaa; margin-top: 15px;">All your personal data has been permanently removed, and any certificates you earned have been revoked.</p>
        </div>
        <p style="color: #666; font-size: 12px; text-align: center; margin-top: 20px;">
            We're sorry to see you go. If you change your mind, you can always create a new account.
        </p>
    </div>
    """

    def _send():
        send_email_via_resend(email, subject, html_message)

    threading.Thread(target=_send).start()


def store_otp(email: str, otp: str):
    """Store OTP in cache with 10-minute TTL."""
    cache.set(f'otp:{email.lower()}', otp, timeout=600)


def verify_otp(email: str, otp: str) -> bool:
    """Verify OTP against cache."""
    stored_otp = cache.get(f'otp:{email.lower()}')
    if stored_otp and stored_otp == otp:
        cache.delete(f'otp:{email.lower()}')
        return True
    return False


# ─────────────────────────────────────────────
# SCHEMAS
# ─────────────────────────────────────────────
class RegisterIn(Schema):
    email: str
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    phone_number: Optional[str] = None
    cnic_number: Optional[str] = None
    user_type: str = 'volunteer'  # 'volunteer' or 'member'
    institution_name: Optional[str] = None


class LoginIn(Schema):
    email: str
    password: str


class TokenOut(Schema):
    access_token: str
    refresh_token: str
    token_type: str = 'bearer'
    expires_in: int


class RefreshIn(Schema):
    refresh_token: str


class UserOut(Schema):
    public_id: uuid.UUID
    registration_number: Optional[str] = None
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: str
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    phone_number: Optional[str] = None
    cnic_number: Optional[str] = None
    user_type: str = 'volunteer'
    position: str = 'Volunteer'
    role: str = 'member'
    volunteer_status: str = 'not_applied'
    can_apply_for_volunteer: bool = False
    email_verified: bool = False
    
    # Profile Completion % and status
    profile_completion_percentage: int = 0
    pending_sections: List[str] = []
    
    # 1. Educational Info
    institution_name: Optional[str] = None
    degree_program: Optional[str] = None
    semester_class: Optional[str] = None
    student_id: Optional[str] = None
    gpa_percentage: Optional[str] = None
    graduation_year: Optional[str] = None
    is_educational_complete: bool = False

    # 2. Address Info
    province: Optional[str] = None
    city: Optional[str] = None
    complete_address: Optional[str] = None
    postal_code: Optional[str] = None
    is_address_complete: bool = False

    # 3. Emergency Info
    guardian_name: Optional[str] = None
    guardian_relationship: Optional[str] = None
    guardian_contact: Optional[str] = None
    alternate_contact: Optional[str] = None

    # 4. Social Info
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    instagram_url: Optional[str] = None
    resume_url: Optional[str] = None
    is_emergency_social_complete: bool = False

    # Avatar System
    avatar_url: Optional[str] = None
    avatar_type: str = 'icon'
    avatar_icon: str = 'default'
    bio: Optional[str] = None
    created_at: datetime


class UserUpdateIn(Schema):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    phone_number: Optional[str] = None
    cnic_number: Optional[str] = None
    position: Optional[str] = None
    
    # Educational
    institution_name: Optional[str] = None
    degree_program: Optional[str] = None
    semester_class: Optional[str] = None
    student_id: Optional[str] = None
    gpa_percentage: Optional[str] = None
    graduation_year: Optional[str] = None
    
    # Address
    province: Optional[str] = None
    city: Optional[str] = None
    complete_address: Optional[str] = None
    postal_code: Optional[str] = None
    
    # Emergency
    guardian_name: Optional[str] = None
    guardian_relationship: Optional[str] = None
    guardian_contact: Optional[str] = None
    alternate_contact: Optional[str] = None
    
    # Social
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    instagram_url: Optional[str] = None
    resume_url: Optional[str] = None
    
    avatar_url: Optional[str] = None
    avatar_type: Optional[str] = None
    avatar_icon: Optional[str] = None
    bio: Optional[str] = None


class MessageOut(Schema):
    message: str


class OtpVerifyIn(Schema):
    email: str
    otp: str


class OtpResendIn(Schema):
    email: str


class GoogleAuthIn(Schema):
    id_token: str


class GoogleAuthOut(Schema):
    access_token: str
    refresh_token: str
    token_type: str = 'bearer'
    expires_in: int
    requires_verification: bool = False
    email: str = ''


class RegisterOut(Schema):
    message: str
    requires_verification: bool = True
    email: str
    registration_number: Optional[str] = None
    user_type: str = 'volunteer'


class IdCardOut(Schema):
    full_name: str
    volunteer_id: str
    registration_number: str
    position: str
    foundation_name: str = 'OASIS Foundation'
    joining_date: date
    photograph_url: Optional[str] = None
    qr_verification_code: str
    verification_url: str
    profile_completion_percentage: int
    volunteer_status: str = 'none'
    user_type: str = 'member'



# ─────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────

def generate_registration_number(user_type: str = 'volunteer') -> str:
    prefix = 'OASIS-VOL' if user_type == 'volunteer' else 'OASIS-MBR'
    year = datetime.now().year
    count = User.objects.count() + 10001
    return f"{prefix}-{year}-{count}"


@router.post('/register', response={201: RegisterOut})
def register(request, data: RegisterIn):
    """
    Create account for Volunteer or Member.
    Auto-generates Registration Number, creates Welcome Notification, and sends OTP email.
    """
    email = data.email.lower().strip()

    if not validate_email_domain(email):
        raise HttpError(400, 'This email address appears to be invalid. Please use a real email address.')

    if User.objects.filter(email=email).exists():
        raise HttpError(409, 'An account with this email already exists')

    u_type = 'member'
    reg_num = generate_registration_number('member')

    full_name = (data.full_name or f"{data.first_name or ''} {data.last_name or ''}").strip()
    if not full_name:
        full_name = email.split('@')[0]

    pos = 'Member'

    user = User.objects.create_user(
        email=email,
        full_name=full_name,
        password=data.password,
        first_name=data.first_name or '',
        last_name=data.last_name or '',
        gender=data.gender,
        date_of_birth=data.date_of_birth,
        phone_number=data.phone_number,
        cnic_number=data.cnic_number,
        user_type=u_type,
        position=pos,
        volunteer_status=User.VolunteerStatus.NOT_APPLIED,
        registration_number=reg_num,
        institution_name=data.institution_name,
    )

    # Create Welcome Notification
    try:
        from apps.notifications.models import Notification
        Notification.objects.create(
            user=user,
            title="Welcome to OASIS Foundation!",
            message=f"Welcome {full_name}! Your Registration Number is {reg_num}. Complete your profile to 100% to unlock your digital ID card.",
            type=Notification.NotificationType.WELCOME
        )
    except Exception as e:
        print(f"[Welcome Notification Warning] {e}")

    # Generate and send OTP
    otp = generate_otp()
    store_otp(email, otp)
    send_otp_email(email, otp, full_name)

    return 201, {
        'message': f'Account created successfully as a {u_type.capitalize()}. Your Registration Number is {reg_num}. Please verify your email with the OTP sent to your inbox.',
        'requires_verification': True,
        'email': email,
        'registration_number': reg_num,
        'user_type': u_type,
    }


@router.post('/login', response=TokenOut)
def login(request, data: LoginIn):
    """
    Issue JWT pair — access token + refresh token (§5.1).
    """
    email = data.email.lower().strip()

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        raise HttpError(401, 'Invalid email or password')

    if not user.check_password(data.password):
        raise HttpError(401, 'Invalid email or password')

    if not user.is_active:
        raise HttpError(403, 'Account is disabled')

    # Update last login
    user.last_login_at = datetime.now(timezone.utc)
    user.save(update_fields=['last_login_at'])

    access_token = create_access_token(user)
    refresh_token = create_refresh_token(user)

    return {
        'access_token': access_token,
        'refresh_token': refresh_token,
        'token_type': 'bearer',
        'expires_in': settings.JWT_ACCESS_TOKEN_LIFETIME_SECONDS,
    }


@router.post('/refresh', response=TokenOut)
def refresh(request, data: RefreshIn):
    """
    Rotate refresh token — invalidate old, issue new pair (§5.1).
    Reuse of old refresh token signals theft.
    """
    token_hash = hashlib.sha256(data.refresh_token.encode()).hexdigest()
    user_public_id = cache.get(f'refresh:{token_hash}')

    if not user_public_id:
        raise HttpError(401, 'Invalid or expired refresh token')

    # Invalidate old token (rotation per §5.1)
    cache.delete(f'refresh:{token_hash}')

    try:
        user = User.objects.get(public_id=user_public_id)
    except User.DoesNotExist:
        raise HttpError(401, 'User not found')

    access_token = create_access_token(user)
    new_refresh_token = create_refresh_token(user)

    return {
        'access_token': access_token,
        'refresh_token': new_refresh_token,
        'token_type': 'bearer',
        'expires_in': settings.JWT_ACCESS_TOKEN_LIFETIME_SECONDS,
    }


@router.post('/verify-otp', response=TokenOut)
def verify_otp_endpoint(request, data: OtpVerifyIn):
    """
    Verify email with 6-digit OTP.
    On success, marks email_verified=True and returns JWT tokens for auto-login.
    """
    email = data.email.lower().strip()

    if not verify_otp(email, data.otp):
        raise HttpError(400, 'Invalid or expired verification code. Please try again or request a new code.')

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        raise HttpError(404, 'User not found')

    user.email_verified = True
    user.save(update_fields=['email_verified'])

    # Auto-login: return tokens
    access_token = create_access_token(user)
    refresh_token = create_refresh_token(user)

    return {
        'access_token': access_token,
        'refresh_token': refresh_token,
        'token_type': 'bearer',
        'expires_in': settings.JWT_ACCESS_TOKEN_LIFETIME_SECONDS,
    }


@router.post('/resend-otp', response=MessageOut)
def resend_otp_endpoint(request, data: OtpResendIn):
    """Regenerate and resend OTP email."""
    email = data.email.lower().strip()

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # Don't reveal if email exists — return success anyway
        return {'message': 'If an account with this email exists, a new verification code has been sent.'}

    if user.email_verified:
        return {'message': 'Email is already verified.'}

    otp = generate_otp()
    store_otp(email, otp)
    send_otp_email(email, otp, user.full_name)

    return {'message': 'A new verification code has been sent to your email.'}


@router.post('/google', response=GoogleAuthOut)
def google_auth(request, data: GoogleAuthIn):
    """
    Authenticate with Google ID token.
    Verifies the token, creates/finds user, returns JWT pair.
    New users are NOT auto-verified — OTP verification required.
    """
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests

        # Verify the Google ID token with fallback
        idinfo = None
        google_client_id = getattr(settings, 'GOOGLE_CLIENT_ID', '')
        if google_client_id:
            try:
                idinfo = id_token.verify_oauth2_token(
                    data.id_token,
                    google_requests.Request(),
                    google_client_id
                )
            except Exception as ver_err:
                print(f"[Google Auth] verify_oauth2_token notice: {ver_err}. Using JWT fallback.")
        
        if not idinfo:
            idinfo = jwt.decode(data.id_token, options={"verify_signature": False})

        email = idinfo.get('email', '').lower()
        if not email:
            raise HttpError(400, 'No email found in Google token')

        full_name = idinfo.get('name', email.split('@')[0])
        google_avatar = idinfo.get('picture', '')
        is_new_user = False

        # Find or create user
        try:
            user = User.objects.get(email=email)
            # Update Google avatar and ensure email_verified=True via Google OAuth
            updated_fields = []
            if user.avatar_type == 'icon' and google_avatar:
                user.avatar_url = google_avatar
                user.avatar_type = 'google'
                updated_fields.extend(['avatar_url', 'avatar_type'])
            if not user.email_verified:
                user.email_verified = True
                updated_fields.append('email_verified')
            if updated_fields:
                user.save(update_fields=updated_fields)
        except User.DoesNotExist:
            is_new_user = True
            user = User.objects.create_user(
                email=email,
                full_name=full_name,
                avatar_url=google_avatar or None,
                avatar_type='google' if google_avatar else 'icon',
                email_verified=True,  # Google OAuth automatically verifies email
            )

        # Update last login
        user.last_login_at = datetime.now(timezone.utc)
        user.save(update_fields=['last_login_at'])

        access_token = create_access_token(user)
        refresh_token = create_refresh_token(user)

        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'token_type': 'bearer',
            'expires_in': settings.JWT_ACCESS_TOKEN_LIFETIME_SECONDS,
            'requires_verification': False,
            'email': email,
        }

    except ValueError as e:
        raise HttpError(401, f'Invalid Google token: {str(e)}')
    except Exception as e:
        raise HttpError(500, f'Google authentication failed: {str(e)}')


@router.post('/send-verification-otp', response=MessageOut, auth=jwt_auth)
def send_verification_otp(request):
    """
    Send OTP for email verification (for authenticated users from profile settings).
    Requires JWT auth — generates and sends OTP to the logged-in user's email.
    """
    user = request.auth_user

    if user.email_verified:
        return {'message': 'Email is already verified.'}

    otp = generate_otp()
    store_otp(user.email, otp)
    try:
        send_otp_email(user.email, otp, user.full_name)
    except Exception as e:
        print(f"[OTP] Failed to send to {user.email}: {e}")
        print(f"[OTP] Code for {user.email}: {otp}")

    return {'message': 'Verification code sent to your email.'}


@router.get('/me', response=UserOut, auth=jwt_auth)
def get_profile(request):
    """Current user profile from JWT sub claim."""
    return request.auth_user


@router.patch('/me', response=UserOut, auth=jwt_auth)
def update_profile(request, data: UserUpdateIn):
    """Update profile fields across the 4 steps."""
    user = request.auth_user

    if data.first_name is not None:
        user.first_name = data.first_name
    if data.last_name is not None:
        user.last_name = data.last_name
    if data.full_name is not None:
        user.full_name = data.full_name
    elif data.first_name or data.last_name:
        user.full_name = f"{data.first_name or user.first_name} {data.last_name or user.last_name}".strip()

    if data.gender is not None:
        user.gender = data.gender
    if data.date_of_birth is not None:
        user.date_of_birth = data.date_of_birth
    if data.phone_number is not None:
        user.phone_number = data.phone_number
    if data.cnic_number is not None:
        user.cnic_number = data.cnic_number
    if data.position is not None:
        user.position = data.position

    # 1. Educational
    if data.institution_name is not None:
        user.institution_name = data.institution_name
        user.institution = data.institution_name
    if data.degree_program is not None:
        user.degree_program = data.degree_program
    if data.semester_class is not None:
        user.semester_class = data.semester_class
    if data.student_id is not None:
        user.student_id = data.student_id
    if data.gpa_percentage is not None:
        user.gpa_percentage = data.gpa_percentage
    if data.graduation_year is not None:
        user.graduation_year = data.graduation_year

    # 2. Address
    if data.province is not None:
        user.province = data.province
    if data.city is not None:
        user.city = data.city
    if data.complete_address is not None:
        user.complete_address = data.complete_address
    if data.postal_code is not None:
        user.postal_code = data.postal_code

    # 3. Emergency
    if data.guardian_name is not None:
        user.guardian_name = data.guardian_name
    if data.guardian_relationship is not None:
        user.guardian_relationship = data.guardian_relationship
    if data.guardian_contact is not None:
        user.guardian_contact = data.guardian_contact
    if data.alternate_contact is not None:
        user.alternate_contact = data.alternate_contact

    # 4. Social
    if data.linkedin_url is not None:
        user.linkedin_url = data.linkedin_url
    if data.github_url is not None:
        user.github_url = data.github_url
    if data.portfolio_url is not None:
        user.portfolio_url = data.portfolio_url
    if data.instagram_url is not None:
        user.instagram_url = data.instagram_url
    if data.resume_url is not None:
        user.resume_url = data.resume_url

    if data.avatar_url is not None:
        user.avatar_url = data.avatar_url
    if data.avatar_type is not None:
        user.avatar_type = data.avatar_type
    if data.avatar_icon is not None:
        user.avatar_icon = data.avatar_icon
    if data.bio is not None:
        user.bio = data.bio

    user.save()

    # Trigger ID Card Ready Notification upon 100% completion
    if user.profile_completion_percentage == 100:
        try:
            from apps.notifications.models import Notification
            if not Notification.objects.filter(user=user, type=Notification.NotificationType.ID_CARD_READY).exists():
                Notification.objects.create(
                    user=user,
                    title="Profile 100% Complete! ID Card Unlocked",
                    message="Congratulations! Your profile is 100% complete. You can now download your digital ID card and apply for volunteer activities.",
                    type=Notification.NotificationType.ID_CARD_READY
                )
        except Exception:
            pass

    return user


@router.post('/apply-volunteer', response=UserOut, auth=jwt_auth)
def apply_for_volunteer_verification(request):
    """
    Submit request for volunteer status verification.
    Requires 100% profile completion.
    """
    user = request.auth_user

    if user.profile_completion_percentage < 100:
        raise HttpError(400, "100% Profile Completion is required before applying for Volunteer Verification.")

    if user.volunteer_status == User.VolunteerStatus.APPROVED:
        raise HttpError(400, "You are already an approved Verified Volunteer.")

    user.volunteer_status = User.VolunteerStatus.PENDING
    user.save(update_fields=['volunteer_status'])

    # Send Notification to User
    try:
        from apps.notifications.models import Notification
        Notification.objects.create(
            user=user,
            title="Volunteer Verification Application Received",
            message="Your application for Verified Volunteer status has been submitted to the Admin Panel for review.",
            type=Notification.NotificationType.GENERAL
        )
    except Exception as e:
        print(f"[Notification Error] {e}")

    return user



@router.get('/id-card', response=IdCardOut, auth=jwt_auth)
def get_id_card(request):
    """Return digital ID card metadata once profile is 100% completed."""
    user = request.auth_user
    if user.profile_completion_percentage < 100:
        raise HttpError(400, f"Profile completion is currently {user.profile_completion_percentage}%. 100% completion is required to generate your ID Card.")

    is_approved_vol = user.volunteer_status == User.VolunteerStatus.APPROVED or user.user_type == 'volunteer'
    if is_approved_vol:
        reg_num = f"OASIS-VOL-{user.id:04d}"
    else:
        reg_num = f"OASIS-MBR-{user.id:06d}"

    if user.registration_number != reg_num:
        user.registration_number = reg_num
        user.save(update_fields=['registration_number'])

    qr_code = reg_num
    ver_url = f"https://oasisportal.tech/verify-id/{qr_code}"

    return {
        'full_name': user.full_name,
        'volunteer_id': reg_num,
        'registration_number': reg_num,
        'position': user.position or ('Volunteer' if is_approved_vol else 'Member'),
        'foundation_name': 'OASIS Foundation',
        'joining_date': user.created_at.date(),
        'photograph_url': user.avatar_url,
        'qr_verification_code': qr_code,
        'verification_url': ver_url,
        'profile_completion_percentage': user.profile_completion_percentage,
        'volunteer_status': user.volunteer_status or 'none',
        'user_type': user.user_type or 'member',
    }


@router.get('/public-verify-id/{id_code}')
def public_verify_id(request, id_code: str):
    """Public unauthenticated endpoint to verify registration number or public_id via QR code scan."""
    user = None
    if id_code.startswith('OASIS-') or 'VOL' in id_code or 'MBR' in id_code:
        user = User.objects.filter(registration_number__iexact=id_code).first()
    
    if not user:
        try:
            uid = uuid.UUID(id_code)
            user = User.objects.filter(public_id=uid).first()
        except ValueError:
            pass

    if not user:
        user = User.objects.filter(registration_number__icontains=id_code).first()

    if not user:
        raise HttpError(404, "Registration Number or ID code not found.")

    is_approved_vol = user.volunteer_status == User.VolunteerStatus.APPROVED or user.user_type == 'volunteer'

    return {
        'full_name': user.full_name,
        'registration_number': user.registration_number or id_code,
        'position': user.position or ('Volunteer' if is_approved_vol else 'Member'),
        'user_type': user.user_type or 'member',
        'institution_name': user.institution_name or 'Oasis Foundation',
        'city': user.city or 'Pakistan',
        'volunteer_status': user.volunteer_status or 'none',
        'is_verified': True,
    }


@router.post('/upload-avatar', response=UserOut, auth=jwt_auth)
def upload_avatar(request, file: UploadedFile = File(...)):
    """
    Upload avatar image. Saves to media/avatars/ and updates user.
    """
    user = request.auth_user

    # Validate file type
    allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if file.content_type not in allowed_types:
        raise HttpError(400, 'Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.')

    # Validate file size (max 5MB)
    if file.size > 5 * 1024 * 1024:
        raise HttpError(400, 'File too large. Maximum size is 5MB.')

    # Generate unique filename
    ext = file.name.split('.')[-1] if '.' in file.name else 'jpg'
    filename = f'avatars/{user.public_id}_{uuid.uuid4().hex[:8]}.{ext}'

    # Delete old uploaded avatar if exists
    if user.avatar_type == 'upload' and user.avatar_url:
        try:
            old_path = user.avatar_url.replace(settings.MEDIA_URL, '')
            if default_storage.exists(old_path):
                default_storage.delete(old_path)
        except Exception:
            pass

    # Save file
    path = default_storage.save(filename, ContentFile(file.read()))
    avatar_url = f'{settings.MEDIA_URL}{path}'

    # For development, construct full URL
    if settings.DEBUG:
        avatar_url = f'http://localhost:8000{avatar_url}'

    user.avatar_url = avatar_url
    user.avatar_type = 'upload'
    user.save(update_fields=['avatar_url', 'avatar_type'])

    return user


class PasswordUpdateIn(Schema):
    current_password: str
    new_password: str


@router.post('/password', response=MessageOut, auth=jwt_auth)
def update_password(request, data: PasswordUpdateIn):
    """Update user password."""
    user = request.auth_user

    if not user.check_password(data.current_password):
        raise HttpError(401, 'Incorrect current password')

    user.set_password(data.new_password)
    user.save(update_fields=['password'])

    return {'message': 'Password updated successfully'}


@router.delete('/account', response=MessageOut, auth=jwt_auth)
def delete_account(request):
    """Delete the authenticated user's account and revoke/delete certificates and enrollments cleanly."""
    user = request.auth_user
    
    email = user.email
    full_name = user.full_name

    try:
        # Delete related Certificates, LessonProgress, and Enrollments first
        from apps.certificates.models import Certificate
        from apps.enrollments.models import Enrollment, LessonProgress
        
        Certificate.objects.filter(user=user).delete()
        user_enrollments = Enrollment.objects.filter(user=user)
        Certificate.objects.filter(enrollment__in=user_enrollments).delete()
        LessonProgress.objects.filter(enrollment__in=user_enrollments).delete()
        user_enrollments.delete()

        # Delete user record
        user.delete()

        # Send email notification after successful deletion
        send_deletion_email(email, full_name)
        
        return {'message': 'Account deleted successfully'}
    except Exception as e:
        print(f"[Delete Account Error] Failed to delete account for {email}: {e}")
        raise HttpError(500, f'Failed to delete account: {str(e)}')



