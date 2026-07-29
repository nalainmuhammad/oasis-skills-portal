"""
OASIS Foundation — Skills & Certification Platform
Base Django settings shared across all environments.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# ─────────────────────────────────────────────
# PATHS
# ─────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# ─────────────────────────────────────────────
# SECURITY
# ─────────────────────────────────────────────
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'insecure-dev-key-change-in-production')
DEBUG = False
raw_allowed_hosts = os.getenv('ALLOWED_HOSTS', '*')
ALLOWED_HOSTS = [h.strip() for h in raw_allowed_hosts.split(',') if h.strip()]
if '*' not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append('*')

# ─────────────────────────────────────────────
# CUSTOM USER MODEL — set from the very first migration (§6.2)
# ─────────────────────────────────────────────
AUTH_USER_MODEL = 'users.User'

# ─────────────────────────────────────────────
# INSTALLED APPS
# ─────────────────────────────────────────────
INSTALLED_APPS = [
    # Unfold admin must come before django.contrib.admin
    'unfold',
    'unfold.contrib.filters',
    'unfold.contrib.forms',

    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party
    'corsheaders',
    'django_redis',

    # Project apps
    'apps.users',
    'apps.courses',
    'apps.enrollments',
    'apps.certificates',
    'apps.activities',
    'apps.notifications',
    'apps.core',
]

# ─────────────────────────────────────────────
# MIDDLEWARE
# ─────────────────────────────────────────────
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# ─────────────────────────────────────────────
# URL CONFIGURATION
# ─────────────────────────────────────────────
ROOT_URLCONF = 'config.urls'

# ─────────────────────────────────────────────
# TEMPLATES
# ─────────────────────────────────────────────
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# ─────────────────────────────────────────────
# WSGI
# ─────────────────────────────────────────────
WSGI_APPLICATION = 'config.wsgi.application'

# ─────────────────────────────────────────────
# DATABASE — overridden per environment
# ─────────────────────────────────────────────
import urllib.parse

DATABASE_URL = os.getenv('DATABASE_URL')

if DATABASE_URL:
    url = urllib.parse.urlparse(DATABASE_URL)
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': url.path[1:],
            'USER': url.username,
            'PASSWORD': url.password,
            'HOST': url.hostname,
            'PORT': url.port or 5432,
            'OPTIONS': {
                'sslmode': 'require',
            }
        }
    }
else:
    db_host = os.getenv('DB_HOST', 'localhost').strip('"\'')
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('DB_NAME', 'oasis_platform').strip('"\''),
            'USER': os.getenv('DB_USER', 'oasis').strip('"\''),
            'PASSWORD': os.getenv('DB_PASSWORD', '').strip('"\''),
            'HOST': db_host,
            'PORT': os.getenv('DB_PORT', '5432').strip('"\''),
            'OPTIONS': {
                'connect_timeout': 5,
                'sslmode': 'require' if db_host != 'localhost' else 'prefer',
            },
        }
    }

REDIS_URL = os.getenv('REDIS_URL')
if REDIS_URL:
    CACHES = {
        'default': {
            'BACKEND': 'django_redis.cache.RedisCache',
            'LOCATION': REDIS_URL,
            'OPTIONS': {
                'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            },
            'KEY_PREFIX': 'oasis',
            'TIMEOUT': 600,  # 10 minutes default
        }
    }
else:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'oasis-fallback-cache',
        }
    }

# ─────────────────────────────────────────────
# CELERY (Redis DB 1 as broker per §1.4)
# ─────────────────────────────────────────────
CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'redis://127.0.0.1:6379/1')
CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', 'redis://127.0.0.1:6379/1')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'UTC'
CELERY_TASK_TRACK_STARTED = True

# ─────────────────────────────────────────────
# PASSWORD VALIDATION
# ─────────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ─────────────────────────────────────────────
# INTERNATIONALIZATION
# ─────────────────────────────────────────────
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# ─────────────────────────────────────────────
# STATIC & MEDIA FILES
# ─────────────────────────────────────────────
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STORAGES = {
    'default': {
        'BACKEND': 'django.core.files.storage.FileSystemStorage',
    },
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    },
}
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# ─────────────────────────────────────────────
# DEFAULT PRIMARY KEY
# ─────────────────────────────────────────────
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ─────────────────────────────────────────────
# CORS (§5.4 — strict, only platform's own Next.js origin)
# ─────────────────────────────────────────────
FRONTEND_URL = os.getenv('FRONTEND_URL', 'https://oasisportal.tech')

raw_cors = os.getenv('CORS_ALLOWED_ORIGINS', '')
if raw_cors:
    CORS_ALLOWED_ORIGINS = [origin.strip() for origin in raw_cors.split(',') if origin.strip()]
else:
    CORS_ALLOWED_ORIGINS = [
        FRONTEND_URL,
        'https://oasisportal.tech',
        'https://www.oasisportal.tech',
        'https://api.oasisportal.tech',
        'https://oasislearn.vercel.app',
        'https://oasislearn.netlify.app',
        'https://oasis-skills-portal.onrender.com',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
    ]

CORS_ALLOW_CREDENTIALS = True

raw_csrf = os.getenv('CSRF_TRUSTED_ORIGINS', '')
if raw_csrf:
    CSRF_TRUSTED_ORIGINS = [origin.strip() for origin in raw_csrf.split(',') if origin.strip()]
else:
    CSRF_TRUSTED_ORIGINS = [
        'https://oasisportal.tech',
        'https://www.oasisportal.tech',
        'https://*.oasisportal.tech',
        'https://api.oasisportal.tech',
        'https://oasislearn.vercel.app',
        'https://*.vercel.app',
        'https://oasislearn.netlify.app',
        'https://*.netlify.app',
        'https://oasis-skills-portal.onrender.com',
        'https://*.onrender.com',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
    ]

# ─────────────────────────────────────────────
# JWT CONFIGURATION (§5.1 — RS256)
# ─────────────────────────────────────────────
JWT_PRIVATE_KEY_PATH = os.getenv('JWT_PRIVATE_KEY_PATH', str(BASE_DIR / 'keys' / 'private.pem'))
JWT_PUBLIC_KEY_PATH = os.getenv('JWT_PUBLIC_KEY_PATH', str(BASE_DIR / 'keys' / 'public.pem'))
JWT_ACCESS_TOKEN_LIFETIME_SECONDS = 900  # 15 minutes
JWT_REFRESH_TOKEN_LIFETIME_DAYS = 30
JWT_ALGORITHM = 'RS256'

# ─────────────────────────────────────────────
# MUX VIDEO (§5.3)
# ─────────────────────────────────────────────
MUX_TOKEN_ID = os.getenv('MUX_TOKEN_ID', '')
MUX_TOKEN_SECRET = os.getenv('MUX_TOKEN_SECRET', '')
MUX_SIGNING_KEY_ID = os.getenv('MUX_SIGNING_KEY_ID', '')
MUX_SIGNING_PRIVATE_KEY = os.getenv('MUX_SIGNING_PRIVATE_KEY', '')

# ─────────────────────────────────────────────
# EMAIL (Resend + ZeroBounce)
# ─────────────────────────────────────────────
RESEND_API_KEY = os.getenv('RESEND_API_KEY', '')
ZEROBOUNCE_API_KEY = os.getenv('ZEROBOUNCE_API_KEY', '')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'OASIS Academy <noreply@oasisportal.tech>')
EMAIL_TIMEOUT = 5

# ─────────────────────────────────────────────
# GOOGLE OAUTH
# ─────────────────────────────────────────────
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', '')

# ─────────────────────────────────────────────
# AWS S3 (for certificate PDFs and course assets)
# ─────────────────────────────────────────────
AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID', '')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY', '')
AWS_STORAGE_BUCKET_NAME = os.getenv('AWS_STORAGE_BUCKET_NAME', 'oasis-platform-assets')
AWS_S3_REGION_NAME = os.getenv('AWS_S3_REGION_NAME', 'us-east-1')

# ─────────────────────────────────────────────
# REVALIDATION (Next.js webhook for ISR cache busting per §1.3)
# ─────────────────────────────────────────────
NEXTJS_REVALIDATION_URL = os.getenv('NEXTJS_REVALIDATION_URL', 'http://localhost:3000/api/revalidate')
NEXTJS_REVALIDATION_SECRET = os.getenv('NEXTJS_REVALIDATION_SECRET', 'dev-revalidation-secret')

# ─────────────────────────────────────────────
# RATE LIMITING (Redis DB 2 per §1.4)
# ─────────────────────────────────────────────
RATE_LIMIT_REDIS_URL = os.getenv('RATE_LIMIT_REDIS_URL', 'redis://127.0.0.1:6379/2')

# ─────────────────────────────────────────────
# DJANGO UNFOLD ADMIN CONFIGURATION
# ─────────────────────────────────────────────
UNFOLD = {
    "SITE_TITLE": "OASIS Platform Admin",
    "SITE_HEADER": "OASIS Foundation",
    "SITE_SUBHEADER": "Skills & Certification Platform",
    "SITE_SYMBOL": "school",
    "SHOW_HISTORY": True,
    "SHOW_VIEW_ON_SITE": True,
    "COLORS": {
        "primary": {
            "50": "#f0fdf4",
            "100": "#dcfce7",
            "200": "#bbf7d0",
            "300": "#86efac",
            "400": "#4dffb4",
            "500": "#00d47e",
            "600": "#16a34a",
            "700": "#15803d",
            "800": "#166534",
            "900": "#14532d",
            "950": "#052e16",
        },
    },
    "SIDEBAR": {
        "show_search": True,
        "show_all_applications": True,
        "navigation": [
            {
                "title": "User & Volunteer Management",
                "items": [
                    {
                        "title": "Users & Volunteers",
                        "icon": "people",
                        "link": "/admin/users/user/",
                    },
                ],
            },
            {
                "title": "Opportunities & Applications",
                "items": [
                    {
                        "title": "Activity Applications",
                        "icon": "assignment",
                        "link": "/admin/activities/activityapplication/",
                    },
                    {
                        "title": "Manage Activities",
                        "icon": "event",
                        "link": "/admin/activities/activity/",
                    },
                ],
            },
            {
                "title": "Content Management",
                "items": [
                    {
                        "title": "Courses",
                        "icon": "book",
                        "link": "/admin/courses/course/",
                    },
                    {
                        "title": "Categories",
                        "icon": "category",
                        "link": "/admin/courses/category/",
                    },
                    {
                        "title": "Modules",
                        "icon": "view_module",
                        "link": "/admin/courses/module/",
                    },
                    {
                        "title": "Lessons",
                        "icon": "play_circle",
                        "link": "/admin/courses/lesson/",
                    },
                ],
            },
            {
                "title": "Learning & Certificates",
                "items": [
                    {
                        "title": "Enrollments",
                        "icon": "school",
                        "link": "/admin/enrollments/enrollment/",
                    },
                    {
                        "title": "Certificates",
                        "icon": "workspace_premium",
                        "link": "/admin/certificates/certificate/",
                    },
                ],
            },
        ],
    },
}
