"""
Production settings — PostgreSQL, Redis, S3, hardened security.
"""
import os
from .base import *  # noqa: F401, F403

DEBUG = False

# ─────────────────────────────────────────────
# SECURITY HARDENING (§5.4)
# ─────────────────────────────────────────────
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
USE_X_FORWARDED_HOST = True
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'

# ─────────────────────────────────────────────
# EMAIL — Gmail SMTP over IPv4 for production
# ─────────────────────────────────────────────
EMAIL_BACKEND = 'apps.users.email_backend.IPv4EmailBackend'
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '587'))
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True').lower() in ('true', '1', 't')
EMAIL_USE_SSL = os.getenv('EMAIL_USE_SSL', 'False').lower() in ('true', '1', 't')
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '').strip()
# Auto-remove spaces from App Passwords in case user pasted with spaces
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '').strip().replace(' ', '')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', EMAIL_HOST_USER or 'OASIS Academy <noreply@oasisportal.tech>')
EMAIL_TIMEOUT = 10

# Database, Redis, and other production settings come from
# environment variables defined in base.py
