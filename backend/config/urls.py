"""
URL configuration for the OASIS platform.
Mounts Django Ninja API at /api/ and Django Admin at /admin/.
Serves media uploads (/media/) in development and production.
"""
from django.contrib import admin
from django.urls import path, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve

from apps.core.api import api

# Set the "View site" link in the admin panel to point to the Next.js frontend
admin.site.site_url = getattr(settings, 'FRONTEND_URL', 'https://oasisportal.tech')
admin.site.site_header = 'OASIS Foundation Admin'
admin.site.site_title = 'OASIS Foundation Admin Portal'

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api.urls),
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
