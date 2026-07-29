from ninja import NinjaAPI
from django.core.handlers.wsgi import WSGIRequest
from apps.users.api import router as auth_router
from apps.courses.api import router as courses_router
from apps.enrollments.api import router as enrollments_router
from apps.certificates.api import router as certificates_router
from apps.activities.api import router as activities_router
from apps.notifications.api import router as notifications_router
from apps.admin_portal.api import router as admin_portal_router

api = NinjaAPI(
    title='OASIS Platform API',
    version='2.0.0',
    description='API for the OASIS Foundation Volunteer, Member & Learning Platform.',
)

@api.get("/health", tags=["System"])
def health_check(request: WSGIRequest):
    return {"status": "ok", "service": "oasis-platform-api"}

# Mount routers
api.add_router('', courses_router)
api.add_router('/auth', auth_router, tags=['Authentication'], url_name_prefix='auth')
api.add_router('', enrollments_router)
api.add_router('', certificates_router)
api.add_router('/activities', activities_router, tags=['Activities'])
api.add_router('/notifications', notifications_router, tags=['Notifications'])
api.add_router('/admin', admin_portal_router, tags=['Admin Portal'])
