"""
Celery configuration for the OASIS platform.
Redis DB 1 as broker (§1.4).
"""
import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

app = Celery('oasis')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# ─────────────────────────────────────────────
# CELERY BEAT SCHEDULE
# Progress flush task runs every 30 seconds (§2.6)
# ─────────────────────────────────────────────
app.conf.beat_schedule = {
    'flush-progress-to-db': {
        'task': 'apps.enrollments.tasks.flush_progress_to_db',
        'schedule': 30.0,  # Every 30 seconds
    },
}
