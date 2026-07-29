import uuid
from django.db import models
from django.conf import settings


class Activity(models.Model):
    class Category(models.TextChoices):
        PROGRAM = 'Program', 'Program'
        EVENT = 'Event', 'Event'
        WORKSHOP = 'Workshop', 'Workshop'
        CAMPAIGN = 'Campaign', 'Campaign'
        VOLUNTEER_OPPORTUNITY = 'Volunteer Opportunity', 'Volunteer Opportunity'

    class Status(models.TextChoices):
        OPEN = 'open', 'Open'
        CLOSED = 'closed', 'Closed'
        COMPLETED = 'completed', 'Completed'
        DRAFT = 'draft', 'Draft'

    public_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=50, choices=Category.choices, default=Category.VOLUNTEER_OPPORTUNITY)
    
    # Positions e.g. ["Graphic Designer", "Research Volunteer", "Social Media Volunteer"]
    available_positions = models.JSONField(default=list, blank=True)
    eligibility_criteria = models.TextField(blank=True, default='Profile Completion = 100%')
    required_skills = models.JSONField(default=list, blank=True)

    start_date = models.DateField()
    end_date = models.DateField()
    deadline = models.DateField()
    total_seats = models.PositiveIntegerField(default=10)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='created_activities'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'activities'
        ordering = ['-created_at']
        verbose_name = 'Activity & Opportunity'
        verbose_name_plural = 'Activities & Opportunities'

    def __str__(self):
        return f"{self.title} ({self.category})"

    @property
    def remaining_seats(self):
        accepted_count = self.applications.filter(status=ActivityApplication.Status.ACCEPTED).count()
        return max(0, self.total_seats - accepted_count)


class ActivityApplication(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        ACCEPTED = 'accepted', 'Accepted'
        WAITING_LIST = 'waiting_list', 'Waiting List'
        REJECTED = 'rejected', 'Rejected'

    public_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    activity = models.ForeignKey(Activity, on_delete=models.CASCADE, related_name='applications')
    applicant = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='activity_applications')
    applied_position = models.CharField(max_length=150)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    admin_notes = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'activity_applications'
        unique_together = ('activity', 'applicant')
        ordering = ['-applied_at']
        verbose_name = 'Opportunity Application'
        verbose_name_plural = 'Volunteer & Opportunity Applications'

    def __str__(self):
        return f"{self.applicant.full_name} -> {self.activity.title} ({self.applied_position})"
