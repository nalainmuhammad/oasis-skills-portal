"""
Enrollments API — enrollment flow and lesson progress/completion.

Endpoints (§3.1):
- POST /api/courses/{slug}/enroll — Create enrollment
- GET /api/me/enrollments — "My courses" dashboard
- GET /api/lessons/{id} — Lesson detail + Mux playback token
- POST /api/lessons/{id}/progress — Watch-position heartbeat (Redis-buffered §2.6)
- POST /api/lessons/{id}/complete — Mark complete, may trigger certificate
"""
from datetime import datetime, timezone
from typing import List, Optional

from django.core.cache import cache
from django.shortcuts import get_object_or_404
from django.db import models
from ninja import Router, Schema
from ninja.errors import HttpError

from apps.courses.models import Course, Lesson
from apps.users.api import jwt_auth
from .models import Enrollment, LessonProgress

router = Router()


# ─────────────────────────────────────────────
# SCHEMAS
# ─────────────────────────────────────────────
class EnrollmentOut(Schema):
    id: int
    course_slug: str
    course_title: str
    course_thumbnail: Optional[str] = None
    status: str
    progress_percent: int
    enrolled_at: datetime
    completed_at: Optional[datetime] = None
    last_accessed_at: Optional[datetime] = None

    @staticmethod
    def resolve_course_slug(obj):
        return obj.course.slug

    @staticmethod
    def resolve_course_title(obj):
        return obj.course.title

    @staticmethod
    def resolve_course_thumbnail(obj):
        return obj.course.thumbnail_url


class LessonDetailOut(Schema):
    id: int
    title: str
    content_type: str
    body: Optional[str] = None
    mux_playback_id: Optional[str] = None
    playback_token: Optional[str] = None
    duration_seconds: Optional[int] = None
    order: int
    is_preview: bool
    watch_seconds: int = 0
    status: str = 'not_started'


class ProgressIn(Schema):
    watch_seconds: int
    status: str = 'in_progress'


class ProgressAccepted(Schema):
    accepted: bool = True


class CompletionOut(Schema):
    message: str
    progress_percent: int
    course_completed: bool
    certificate_pending: bool = False
    verification_uuid: Optional[str] = None


class EnrollmentMessage(Schema):
    message: str
    enrollment_id: int


# ─────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────

@router.post('/courses/{slug}/enroll', response={201: EnrollmentMessage}, auth=jwt_auth)
def enroll(request, slug: str):
    """
    Create enrollment (idempotent via UNIQUE constraint).
    Increments course.enrollment_count (§2.1 denormalized counter).
    Invalidates per-user enrollment cache.
    """
    user = request.auth_user

    # Email verification gate — users must verify before enrolling
    if not user.email_verified:
        raise HttpError(403, 'Please verify your email address before enrolling in a course. Check your inbox for the verification code.')

    course = get_object_or_404(Course, slug=slug, status=Course.Status.PUBLISHED)

    enrollment, created = Enrollment.objects.get_or_create(
        user=user,
        course=course,
        defaults={'status': Enrollment.Status.ACTIVE}
    )

    if created:
        # Update denormalized counter
        Course.objects.filter(id=course.id).update(
            enrollment_count=models.F('enrollment_count') + 1
        )
        # Invalidate per-user cache
        cache.delete(f'enrollments:user:{user.public_id}')

    return 201, {
        'message': 'Enrolled successfully' if created else 'Already enrolled',
        'enrollment_id': enrollment.id,
    }


@router.get('/me/enrollments', response=List[EnrollmentOut], auth=jwt_auth)
def my_enrollments(request):
    """
    "My courses" dashboard.
    Redis cached per-user key, 60s TTL (§3.1).
    """
    user = request.auth_user
    cache_key = f'enrollments:user:{user.public_id}'

    cached = cache.get(cache_key)
    if cached:
        return cached

    enrollments = list(
        Enrollment.objects.filter(user=user)
        .select_related('course')
        .order_by('-last_accessed_at', '-enrolled_at')
    )

    cache.set(cache_key, enrollments, 60)
    return enrollments


@router.get('/lessons/{lesson_id}', response=LessonDetailOut, auth=jwt_auth)
def get_lesson(request, lesson_id: int):
    """
    Lesson detail + fresh signed Mux playback token.
    Token is NEVER cached (§3.1, §5.3).
    """
    user = request.auth_user
    lesson = get_object_or_404(
        Lesson.objects.select_related('module__course'),
        id=lesson_id,
    )

    course = lesson.module.course

    # Check enrollment (unless it's a preview lesson)
    if not lesson.is_preview:
        if not Enrollment.objects.filter(
            user=user, course=course, status=Enrollment.Status.ACTIVE
        ).exists():
            raise HttpError(403, 'Not enrolled in this course')

    # Get progress from Redis first (live value), fall back to DB
    enrollment = Enrollment.objects.filter(user=user, course=course).first()
    watch_seconds = 0
    progress_status = 'not_started'

    if enrollment:
        # Check Redis buffer first (§2.6 — live value)
        redis_key = f'progress:{enrollment.id}:{lesson.id}'
        redis_val = cache.get(redis_key)
        if redis_val:
            watch_seconds = int(redis_val)
            progress_status = 'in_progress'
        else:
            # Fall back to DB
            lp = LessonProgress.objects.filter(
                enrollment=enrollment, lesson=lesson
            ).first()
            if lp:
                watch_seconds = lp.watch_seconds
                progress_status = lp.status

        # Update last_accessed_at
        Enrollment.objects.filter(id=enrollment.id).update(
            last_accessed_at=datetime.now(timezone.utc)
        )

    # Generate signed Mux playback token (§5.3)
    playback_token = None
    if lesson.mux_playback_id:
        playback_token = _generate_mux_playback_token(lesson.mux_playback_id)

    return {
        'id': lesson.id,
        'title': lesson.title,
        'content_type': lesson.content_type,
        'body': lesson.body,
        'mux_playback_id': lesson.mux_playback_id,
        'playback_token': playback_token,
        'duration_seconds': lesson.duration_seconds,
        'order': lesson.order,
        'is_preview': lesson.is_preview,
        'watch_seconds': watch_seconds,
        'status': progress_status,
    }


@router.post('/lessons/{lesson_id}/progress', response=ProgressAccepted, auth=jwt_auth)
def update_progress(request, lesson_id: int, data: ProgressIn):
    """
    Watch-position heartbeat — Redis-only write (§2.6).
    No Postgres on the hot path. Returns 202 Accepted immediately.
    """
    user = request.auth_user
    lesson = get_object_or_404(Lesson, id=lesson_id)
    course = lesson.module.course

    enrollment = Enrollment.objects.filter(
        user=user, course=course
    ).first()

    if not enrollment:
        raise HttpError(403, 'Not enrolled')

    # Write to Redis only (§2.6) — flushed to DB every 30s by Celery Beat
    cache_key = f'progress:{enrollment.id}:{lesson.id}'
    cache.set(cache_key, data.watch_seconds, timeout=300)  # 5 min TTL safety

    return {'accepted': True}


@router.post('/lessons/{lesson_id}/complete', response=CompletionOut, auth=jwt_auth)
def complete_lesson(request, lesson_id: int):
    """
    Mark lesson complete. Recompute progress. If 100% → create certificate (§4.1).

    This is the synchronous fast path — only indexed writes in one transaction.
    PDF generation happens async via Celery.
    """
    user = request.auth_user
    lesson = get_object_or_404(Lesson, id=lesson_id)
    course = lesson.module.course

    enrollment = get_object_or_404(
        Enrollment, user=user, course=course
    )

    # 1. Mark lesson completed
    lp, _ = LessonProgress.objects.update_or_create(
        enrollment=enrollment,
        lesson=lesson,
        defaults={
            'status': LessonProgress.Status.COMPLETED,
            'completed_at': datetime.now(timezone.utc),
        }
    )

    # 2. Recompute progress_percent
    new_progress = enrollment.recompute_progress()

    # 3. Check if course is now complete
    course_completed = new_progress >= 100
    certificate_pending = False

    verification_uuid = None

    if course_completed:
        enrollment.status = Enrollment.Status.COMPLETED
        enrollment.completed_at = datetime.now(timezone.utc)
        enrollment.save(update_fields=['status', 'completed_at'])

        # 4. Create certificate row (idempotent via UNIQUE constraint per §4.1)
        from apps.certificates.models import Certificate

        # Generate a unique certificate number
        cert_num = f"CERT-OASIS-{datetime.now(timezone.utc).year}-{Certificate.objects.count() + 1001}"

        cert, created = Certificate.objects.get_or_create(
            user=user,
            course=course,
            defaults={
                'enrollment': enrollment,
                'recipient_name_snapshot': user.full_name,
                'title_snapshot': course.title,
                'cert_type': Certificate.CertType.COURSE,
                'certificate_number': cert_num,
                'status': Certificate.Status.GENERATED,
            }
        )

        verification_uuid = str(cert.verification_uuid)

        if created:
            certificate_pending = True
            # Notify the user about their new certificate
            try:
                from apps.notifications.models import Notification
                Notification.objects.create(
                    user=user,
                    title="Course Certificate Earned!",
                    message=f"Congratulations {user.full_name}! You have completed '{course.title}' and earned a verified certificate.",
                    type=Notification.NotificationType.CERTIFICATE_ISSUED
                )
            except Exception:
                pass

    # Invalidate caches
    cache.delete(f'enrollments:user:{user.public_id}')

    return {
        'message': 'Lesson completed',
        'progress_percent': new_progress,
        'course_completed': course_completed,
        'certificate_pending': certificate_pending,
        'verification_uuid': verification_uuid,
    }


def _generate_mux_playback_token(playback_id: str) -> str:
    """
    Generate a short-lived, locally-signed Mux JWT (§5.3).
    Scoped to the specific playback ID, ~2 hour expiry.
    This is a local RS256 signing operation — no call to Mux's API.
    """
    import jwt as pyjwt
    from django.conf import settings
    from datetime import datetime, timedelta, timezone

    if not settings.MUX_SIGNING_PRIVATE_KEY:
        return None  # Dev mode — no Mux configured

    now = datetime.now(timezone.utc)
    payload = {
        'sub': playback_id,
        'aud': 'v',  # video
        'exp': now + timedelta(hours=2),
        'kid': settings.MUX_SIGNING_KEY_ID,
    }

    return pyjwt.encode(
        payload,
        settings.MUX_SIGNING_PRIVATE_KEY,
        algorithm='RS256',
        headers={'kid': settings.MUX_SIGNING_KEY_ID}
    )
