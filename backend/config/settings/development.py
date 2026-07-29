"""
Development settings — SQLite for zero-setup, console email, relaxed CORS.
"""
from .base import *  # noqa: F401, F403

DEBUG = True

# ─────────────────────────────────────────────
# DATABASE — SQLite for zero-setup local dev
# ─────────────────────────────────────────────
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# ─────────────────────────────────────────────
# CACHE — Local memory cache (no Redis required for dev)
# ─────────────────────────────────────────────
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'oasis-dev-cache',
    }
}

# ─────────────────────────────────────────────
# EMAIL — Console backend for development
# ─────────────────────────────────────────────
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# ─────────────────────────────────────────────
# CORS — Allow localhost for development
# ─────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]

# ─────────────────────────────────────────────
# CELERY — Run tasks synchronously in dev
# ─────────────────────────────────────────────
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True
