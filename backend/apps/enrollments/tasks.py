"""
Celery tasks for progress tracking (§2.6).

flush_progress_to_db: Celery Beat task running every 30 seconds.
Sweeps Redis progress keys and batch-upserts to lesson_progress table.
"""
from celery import shared_task
from django.core.cache import cache
from django.utils import timezone


@shared_task(bind=True, name='apps.enrollments.tasks.flush_progress_to_db')
def flush_progress_to_db(self):
    """
    Flush buffered progress from Redis to PostgreSQL (§2.6).

    Scans Redis for keys matching 'progress:{enrollment_id}:{lesson_id}',
    batch-upserts them into lesson_progress, and clears processed keys.

    This turns thousands of small writes/min into efficient batch writes,
    at the cost of ~30s worst-case lag in persisted resume position.
    """
    from .models import LessonProgress

    # In production, scan Redis for progress:* keys
    # In dev with LocMemCache, this is a no-op (tasks run eagerly)
    try:
        # Get all progress keys from cache
        # Note: django's cache doesn't support key scanning directly.
        # In production with django-redis, use the raw Redis client:
        #
        #   from django_redis import get_redis_connection
        #   redis_conn = get_redis_connection("default")
        #   keys = redis_conn.keys("oasis:progress:*")
        #
        # For now, this is a placeholder that works with the development cache.
        pass
    except Exception as exc:
        self.retry(exc=exc, countdown=10, max_retries=3)
