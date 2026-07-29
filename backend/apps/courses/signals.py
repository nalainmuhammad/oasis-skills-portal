"""
Cache invalidation signals (§3.3).

Signal-driven invalidation for admin edits:
- Course save → clear Redis cache + fire Next.js revalidation webhook
- Module save/delete → update course.module_count + invalidate cache
- Enrollment save → update course.enrollment_count
"""
import logging
import requests
from django.conf import settings
from django.core.cache import cache
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

from .models import Course, Module

logger = logging.getLogger(__name__)


def invalidate_course_cache(course: Course):
    """
    Clear all cached data for a course and trigger Next.js ISR revalidation (§1.3).
    Called from admin save and signals.
    """
    # Delete Redis cache keys
    cache.delete(f'courses:detail:{course.slug}')
    # Can't pattern-delete with Django cache API; in production use redis-cli or django-redis
    cache.delete('categories:list')

    # Fire webhook to Next.js for ISR revalidation (§1.3)
    try:
        requests.post(
            settings.NEXTJS_REVALIDATION_URL,
            json={'tag': 'courses'},
            params={'secret': settings.NEXTJS_REVALIDATION_SECRET},
            timeout=5,
        )
    except Exception as e:
        logger.warning(f'Failed to revalidate Next.js cache: {e}')


@receiver(post_save, sender=Module)
def update_module_count_on_save(sender, instance, created, **kwargs):
    """Update denormalized module_count on Course when a Module is saved."""
    if created:
        course = instance.course
        course.module_count = course.modules.count()
        course.save(update_fields=['module_count'])
        invalidate_course_cache(course)


@receiver(post_delete, sender=Module)
def update_module_count_on_delete(sender, instance, **kwargs):
    """Update denormalized module_count on Course when a Module is deleted."""
    try:
        course = instance.course
        course.module_count = course.modules.count()
        course.save(update_fields=['module_count'])
        invalidate_course_cache(course)
    except Course.DoesNotExist:
        pass
