import uuid
from datetime import date
from typing import List, Optional
from ninja import Router, Schema
from ninja.errors import HttpError
from django.shortcuts import get_object_or_404
from apps.users.api import jwt_auth
from .models import Activity, ActivityApplication

router = Router()


# ─────────────────────────────────────────────
# SCHEMAS
# ─────────────────────────────────────────────
class ActivityOut(Schema):
    public_id: uuid.UUID
    title: str
    description: str
    category: str
    available_positions: List[str]
    eligibility_criteria: str
    required_skills: List[str]
    start_date: date
    end_date: date
    deadline: date
    total_seats: int
    remaining_seats: int
    status: str
    created_at: str


class ApplyIn(Schema):
    applied_position: str


class ApplicationOut(Schema):
    id: int
    public_id: uuid.UUID
    activity_title: str
    activity_id: uuid.UUID
    applicant_name: str
    applicant_email: str
    applicant_reg_num: Optional[str] = None
    applied_position: str
    status: str
    applied_at: str
    admin_notes: Optional[str] = None


class ApplicationStatusUpdateIn(Schema):
    status: str  # 'accepted', 'rejected', 'waiting_list', 'pending'
    admin_notes: Optional[str] = None


class ActivityCreateIn(Schema):
    title: str
    description: str
    category: str = 'Volunteer Opportunity'
    available_positions: List[str] = []
    eligibility_criteria: str = 'Profile Completion = 100%'
    required_skills: List[str] = []
    start_date: date
    end_date: date
    deadline: date
    total_seats: int = 10
    status: str = 'open'


# ─────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────

@router.get('/', response=List[ActivityOut])
def list_activities(request, category: Optional[str] = None, search: Optional[str] = None):
    """List activities (Programs, Events, Workshops, Campaigns, Volunteer Opportunities). Auto-seeds if DB empty."""
    if Activity.objects.count() == 0:
        try:
            import seed_db
            seed_db.run()
        except Exception as err:
            print("Auto-seeding error in activities list:", err)

    qs = Activity.objects.filter(status=Activity.Status.OPEN)
    if category:
        qs = qs.filter(category__iexact=category)
    if search:
        qs = qs.filter(title__icontains=search)
    
    res = []
    for act in qs:
        res.append({
            'public_id': act.public_id,
            'title': act.title,
            'description': act.description,
            'category': act.category,
            'available_positions': act.available_positions or [],
            'eligibility_criteria': act.eligibility_criteria,
            'required_skills': act.required_skills or [],
            'start_date': act.start_date,
            'end_date': act.end_date,
            'deadline': act.deadline,
            'total_seats': act.total_seats,
            'remaining_seats': act.remaining_seats,
            'status': act.status,
            'created_at': act.created_at.isoformat(),
        })
    return res


@router.get('/{public_id}', response=ActivityOut)
def get_activity(request, public_id: uuid.UUID):
    act = get_object_or_404(Activity, public_id=public_id)
    return {
        'public_id': act.public_id,
        'title': act.title,
        'description': act.description,
        'category': act.category,
        'available_positions': act.available_positions or [],
        'eligibility_criteria': act.eligibility_criteria,
        'required_skills': act.required_skills or [],
        'start_date': act.start_date,
        'end_date': act.end_date,
        'deadline': act.deadline,
        'total_seats': act.total_seats,
        'remaining_seats': act.remaining_seats,
        'status': act.status,
        'created_at': act.created_at.isoformat(),
    }


@router.post('/{public_id}/apply', response=ApplicationOut, auth=jwt_auth)
def apply_activity(request, public_id: uuid.UUID, data: ApplyIn):
    """
    Apply for an activity. Strictly requires 100% profile completion!
    """
    user = request.auth_user
    if user.profile_completion_percentage < 100:
        raise HttpError(400, f"Only volunteers with 100% completed profiles can apply for activities. Your profile is currently {user.profile_completion_percentage}% complete.")

    if user.volunteer_status != User.VolunteerStatus.APPROVED and user.user_type != 'volunteer':
        raise HttpError(403, "Only Verified Volunteers can apply for opportunities. Please submit your Volunteer Verification Application from your Profile Dashboard.")

    act = get_object_or_404(Activity, public_id=public_id)
    if act.status != Activity.Status.OPEN:
        raise HttpError(400, "This activity is not currently open for applications.")

    if ActivityApplication.objects.filter(activity=act, applicant=user).exists():
        raise HttpError(409, "You have already applied for this activity.")

    app = ActivityApplication.objects.create(
        activity=act,
        applicant=user,
        applied_position=data.applied_position,
        status=ActivityApplication.Status.PENDING
    )

    # Notify user
    try:
        from apps.notifications.models import Notification
        Notification.objects.create(
            user=user,
            title=f"Application Submitted: {act.title}",
            message=f"Your application for {data.applied_position} in '{act.title}' has been received and is under review.",
            type=Notification.NotificationType.ACTIVITY_UPDATE
        )
    except Exception:
        pass

    return {
        'id': app.id,
        'public_id': app.public_id,
        'activity_title': act.title,
        'activity_id': act.public_id,
        'applicant_name': user.full_name,
        'applicant_email': user.email,
        'applicant_reg_num': user.registration_number,
        'applied_position': app.applied_position,
        'status': app.status,
        'applied_at': app.applied_at.isoformat(),
        'admin_notes': app.admin_notes,
    }


@router.post('/{public_id}/withdraw', auth=jwt_auth)
def withdraw_application(request, public_id: uuid.UUID):
    user = request.auth_user
    act = get_object_or_404(Activity, public_id=public_id)
    try:
        app = ActivityApplication.objects.get(activity=act, applicant=user)
        app.delete()
        return {'message': f'Application for {act.title} withdrawn successfully.'}
    except ActivityApplication.DoesNotExist:
        raise HttpError(404, "Application not found.")


@router.get('/my-applications/list', response=List[ApplicationOut], auth=jwt_auth)
def get_my_applications(request):
    user = request.auth_user
    apps = ActivityApplication.objects.filter(applicant=user)
    res = []
    for app in apps:
        res.append({
            'id': app.id,
            'public_id': app.public_id,
            'activity_title': app.activity.title,
            'activity_id': app.activity.public_id,
            'applicant_name': user.full_name,
            'applicant_email': user.email,
            'applicant_reg_num': user.registration_number,
            'applied_position': app.applied_position,
            'status': app.status,
            'applied_at': app.applied_at.isoformat(),
            'admin_notes': app.admin_notes,
        })
    return res


# ── ADMIN ENDPOINTS ──

@router.post('/admin/create', response=ActivityOut, auth=jwt_auth)
def create_activity(request, data: ActivityCreateIn):
    user = request.auth_user
    if user.role != 'admin' and not user.is_staff:
        raise HttpError(403, "Admin access required.")

    act = Activity.objects.create(
        title=data.title,
        description=data.description,
        category=data.category,
        available_positions=data.available_positions,
        eligibility_criteria=data.eligibility_criteria,
        required_skills=data.required_skills,
        start_date=data.start_date,
        end_date=data.end_date,
        deadline=data.deadline,
        total_seats=data.total_seats,
        status=data.status,
        created_by=user
    )

    return {
        'public_id': act.public_id,
        'title': act.title,
        'description': act.description,
        'category': act.category,
        'available_positions': act.available_positions or [],
        'eligibility_criteria': act.eligibility_criteria,
        'required_skills': act.required_skills or [],
        'start_date': act.start_date,
        'end_date': act.end_date,
        'deadline': act.deadline,
        'total_seats': act.total_seats,
        'remaining_seats': act.remaining_seats,
        'status': act.status,
        'created_at': act.created_at.isoformat(),
    }


class ActivityUpdateIn(Schema):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    available_positions: Optional[List[str]] = None
    eligibility_criteria: Optional[str] = None
    required_skills: Optional[List[str]] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    deadline: Optional[date] = None
    total_seats: Optional[int] = None
    status: Optional[str] = None


@router.patch('/admin/{public_id}/update', response=ActivityOut, auth=jwt_auth)
def update_activity(request, public_id: uuid.UUID, data: ActivityUpdateIn):
    user = request.auth_user
    if user.role != 'admin' and not user.is_staff:
        raise HttpError(403, "Admin access required.")

    act = get_object_or_404(Activity, public_id=public_id)
    for field, val in data.dict(exclude_unset=True).items():
        setattr(act, field, val)
    act.save()

    return {
        'public_id': act.public_id,
        'title': act.title,
        'description': act.description,
        'category': act.category,
        'available_positions': act.available_positions or [],
        'eligibility_criteria': act.eligibility_criteria,
        'required_skills': act.required_skills or [],
        'start_date': act.start_date,
        'end_date': act.end_date,
        'deadline': act.deadline,
        'total_seats': act.total_seats,
        'remaining_seats': act.remaining_seats,
        'status': act.status,
        'created_at': act.created_at.isoformat(),
    }


@router.delete('/admin/{public_id}/delete', auth=jwt_auth)
def delete_activity(request, public_id: uuid.UUID):
    user = request.auth_user
    if user.role != 'admin' and not user.is_staff:
        raise HttpError(403, "Admin access required.")

    act = get_object_or_404(Activity, public_id=public_id)
    act.delete()
    return {'message': 'Activity deleted successfully'}


@router.get('/admin/applications/all', response=List[ApplicationOut], auth=jwt_auth)
def list_all_applications(request, status_filter: Optional[str] = None):
    user = request.auth_user
    if user.role != 'admin' and not user.is_staff:
        raise HttpError(403, "Admin access required.")

    qs = ActivityApplication.objects.select_related('activity', 'applicant').all()
    if status_filter:
        qs = qs.filter(status__iexact=status_filter)

    res = []
    for app in qs:
        res.append({
            'id': app.id,
            'public_id': app.public_id,
            'activity_title': app.activity.title,
            'activity_id': app.activity.public_id,
            'applicant_name': app.applicant.full_name,
            'applicant_email': app.applicant.email,
            'applicant_reg_num': app.applicant.registration_number,
            'applied_position': app.applied_position,
            'status': app.status,
            'applied_at': app.applied_at.isoformat(),
            'admin_notes': app.admin_notes,
        })
    return res


@router.patch('/admin/applications/{app_id}/status', response=ApplicationOut, auth=jwt_auth)
def update_application_status(request, app_id: int, data: ApplicationStatusUpdateIn):
    user = request.auth_user
    if user.role != 'admin' and not user.is_staff:
        raise HttpError(403, "Admin access required.")

    app = get_object_or_404(ActivityApplication, id=app_id)
    app.status = data.status
    if data.admin_notes is not None:
        app.admin_notes = data.admin_notes
    app.save()

    # Notify applicant
    try:
        from apps.notifications.models import Notification
        msg = f"Your application for {app.applied_position} in '{app.activity.title}' has been updated to: {app.status.replace('_', ' ').title()}."
        Notification.objects.create(
            user=app.applicant,
            title=f"Application Update: {app.activity.title}",
            message=msg,
            type=Notification.NotificationType.ACTIVITY_UPDATE
        )
    except Exception:
        pass

    return {
        'id': app.id,
        'public_id': app.public_id,
        'activity_title': app.activity.title,
        'activity_id': app.activity.public_id,
        'applicant_name': app.applicant.full_name,
        'applicant_email': app.applicant.email,
        'applicant_reg_num': app.applicant.registration_number,
        'applied_position': app.applied_position,
        'status': app.status,
        'applied_at': app.applied_at.isoformat(),
        'admin_notes': app.admin_notes,
    }
