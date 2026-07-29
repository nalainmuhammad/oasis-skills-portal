import uuid
from django.db import models
from django.conf import settings


class Notification(models.Model):
    class NotificationType(models.TextChoices):
        WELCOME = 'welcome', 'Welcome'
        ACTIVITY_UPDATE = 'activity_update', 'Activity Update'
        CERTIFICATE_ISSUED = 'certificate_issued', 'Certificate Issued'
        ID_CARD_READY = 'id_card_ready', 'ID Card Ready'
        GENERAL = 'general', 'General'

    public_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    type = models.CharField(max_length=30, choices=NotificationType.choices, default=NotificationType.GENERAL)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.user.full_name}: {self.title}"
