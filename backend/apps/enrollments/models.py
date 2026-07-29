"""
Enrollment and LessonProgress models — mirrors DDL from §2.2.

Key design decisions:
- UniqueConstraint(user_id, course_id) prevents double enrollment (§2.4)
- Partial index on completed enrollments for fast certificate lookups
- progress_percent is SmallIntegerField (0-100), recomputed on lesson complete
- watch_seconds tracked via Redis buffer, flushed to DB every 30s (§2.6)
"""
from django.conf import settings
from django.db import models


class Enrollment(models.Model):
    """
    Tracks a user's enrollment in a course.
    Status workflow: active → completed | dropped
    """

    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        COMPLETED = 'completed', 'Completed'
        DROPPED = 'dropped', 'Dropped'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='enrollments'
    )
    course = models.ForeignKey(
        'courses.Course', on_delete=models.CASCADE,
        related_name='enrollments'
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.ACTIVE
    )
    progress_percent = models.SmallIntegerField(default=0)
    enrolled_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    last_accessed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'enrollments'
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'course'],
                name='unique_enrollment_per_user_course'
            ),
        ]
        indexes = [
            models.Index(
                fields=['course'],
                name='idx_enroll_course_comp',
                condition=models.Q(status='completed'),
            ),
        ]
        ordering = ['-enrolled_at']

    def __str__(self):
        return f'{self.user.full_name} → {self.course.title} ({self.progress_percent}%)'

    def recompute_progress(self):
        """
        Recompute progress_percent from completed lessons.
        Called after marking a lesson complete (§4.1).
        """
        from apps.courses.models import Lesson

        total_lessons = Lesson.objects.filter(
            module__course=self.course
        ).count()

        if total_lessons == 0:
            self.progress_percent = 0
        else:
            completed_lessons = self.lesson_progress.filter(
                status=LessonProgress.Status.COMPLETED
            ).count()
            self.progress_percent = int((completed_lessons / total_lessons) * 100)

        self.save(update_fields=['progress_percent'])
        return self.progress_percent


class LessonProgress(models.Model):
    """
    Per-lesson progress tracking.
    watch_seconds is the write-heavy field (§2.6) — buffered in Redis,
    flushed to DB every 30s by Celery Beat.
    """

    class Status(models.TextChoices):
        NOT_STARTED = 'not_started', 'Not Started'
        IN_PROGRESS = 'in_progress', 'In Progress'
        COMPLETED = 'completed', 'Completed'

    enrollment = models.ForeignKey(
        Enrollment, on_delete=models.CASCADE,
        related_name='lesson_progress'
    )
    lesson = models.ForeignKey(
        'courses.Lesson', on_delete=models.CASCADE,
        related_name='progress_records'
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.NOT_STARTED
    )
    watch_seconds = models.IntegerField(default=0)
    completed_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'lesson_progress'
        constraints = [
            models.UniqueConstraint(
                fields=['enrollment', 'lesson'],
                name='unique_progress_per_enrollment_lesson'
            ),
        ]
        indexes = [
            # Explicit index on FK — Postgres doesn't auto-index FKs (§2.4)
            models.Index(fields=['lesson'], name='idx_lesson_progress_lesson_id'),
        ]

    def __str__(self):
        return f'{self.enrollment.user.full_name} → {self.lesson.title} ({self.status})'
