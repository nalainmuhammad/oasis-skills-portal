"""
Course, Module, Lesson, Category models — mirrors DDL from §2.2.

Key design decisions:
- Denormalized counters (module_count, enrollment_count) maintained on write (§2.1)
- Partial index on published courses (§2.4)
- GIN index on metadata JSONB (§2.5)
- Composite unique constraints double as lookup indexes (§2.4)
"""
from django.db import models


class Category(models.Model):
    """Course category for catalog filtering."""
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(max_length=255, unique=True)

    class Meta:
        db_table = 'categories'
        verbose_name_plural = 'categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class Course(models.Model):
    """
    Core course entity with denormalized counters.
    Status workflow: draft → published → archived
    """

    class DifficultyLevel(models.TextChoices):
        BEGINNER = 'beginner', 'Beginner'
        INTERMEDIATE = 'intermediate', 'Intermediate'
        ADVANCED = 'advanced', 'Advanced'

    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        PUBLISHED = 'published', 'Published'
        ARCHIVED = 'archived', 'Archived'

    slug = models.SlugField(max_length=255, unique=True)
    title = models.CharField(max_length=500)
    subtitle = models.CharField(max_length=500, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    thumbnail_url = models.URLField(max_length=2048, blank=True, null=True)
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='courses'
    )
    difficulty_level = models.CharField(
        max_length=20, choices=DifficultyLevel.choices,
        default=DifficultyLevel.BEGINNER
    )
    estimated_duration_minutes = models.IntegerField(blank=True, null=True)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.DRAFT
    )
    published_at = models.DateTimeField(blank=True, null=True)
    metadata = models.JSONField(
        default=dict, blank=True,
        help_text='Objectives, prerequisites, tags[], SEO metadata'
    )

    # Denormalized counters — maintained on write, not computed on read (§2.1)
    module_count = models.IntegerField(default=0, editable=False)
    enrollment_count = models.IntegerField(default=0, editable=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'courses'
        indexes = [
            models.Index(fields=['category'], name='idx_courses_category_id'),
            models.Index(
                fields=['-published_at'],
                name='idx_courses_published',
                condition=models.Q(status='published'),
            ),
        ]
        ordering = ['-published_at', '-created_at']

    def __str__(self):
        return self.title

    @property
    def is_published(self):
        return self.status == self.Status.PUBLISHED


class Module(models.Model):
    """
    Course module — ordered container for lessons.
    UniqueConstraint(course_id, order) doubles as lookup index (§2.4).
    """
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name='modules'
    )
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True, null=True)
    order = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'modules'
        constraints = [
            models.UniqueConstraint(
                fields=['course', 'order'],
                name='unique_module_order_per_course'
            ),
        ]
        ordering = ['order']

    def __str__(self):
        return f'{self.course.title} → {self.title}'


class Lesson(models.Model):
    """
    Individual lesson within a module.
    Content types: video | text | quiz
    """

    class ContentType(models.TextChoices):
        VIDEO = 'video', 'Video'
        TEXT = 'text', 'Text'
        QUIZ = 'quiz', 'Quiz'

    module = models.ForeignKey(
        Module, on_delete=models.CASCADE, related_name='lessons'
    )
    title = models.CharField(max_length=500)
    content_type = models.CharField(
        max_length=20, choices=ContentType.choices, default=ContentType.VIDEO
    )
    body = models.TextField(blank=True, null=True, help_text='Markdown for text lessons')
    mux_asset_id = models.CharField(max_length=255, blank=True, null=True)
    mux_playback_id = models.CharField(max_length=255, blank=True, null=True)
    duration_seconds = models.IntegerField(blank=True, null=True)
    order = models.IntegerField()
    is_preview = models.BooleanField(
        default=False,
        help_text='Viewable without enrollment'
    )
    metadata = models.JSONField(
        default=dict, blank=True,
        help_text='Quiz payload, attachments, transcript'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'lessons'
        constraints = [
            models.UniqueConstraint(
                fields=['module', 'order'],
                name='unique_lesson_order_per_module'
            ),
        ]
        ordering = ['order']

    def __str__(self):
        return f'{self.module.title} → {self.title}'

    @property
    def duration_display(self):
        """Human-readable duration string."""
        if not self.duration_seconds:
            return None
        minutes, seconds = divmod(self.duration_seconds, 60)
        if minutes > 0:
            return f'{minutes}m {seconds}s'
        return f'{seconds}s'
