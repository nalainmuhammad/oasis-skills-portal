import uuid
from typing import List, Optional
from ninja import Router, Schema
from ninja.errors import HttpError
from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from apps.users.api import jwt_auth
from apps.activities.models import Activity, ActivityApplication
from apps.certificates.models import Certificate

User = get_user_model()
router = Router()


class AdminStatsOut(Schema):
    total_volunteers: int
    total_members: int
    completed_profiles: int
    incomplete_profiles: int
    active_volunteers: int
    total_programs: int
    total_certificates: int
    pending_applications: int


class VolunteerListItemOut(Schema):
    public_id: uuid.UUID
    registration_number: Optional[str] = None
    full_name: str
    email: str
    phone_number: Optional[str] = None
    cnic_number: Optional[str] = None
    user_type: str
    position: str
    volunteer_status: str
    gender: Optional[str] = None
    institution_name: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    profile_completion_percentage: int
    program_participation_count: int
    created_at: str


@router.get('/stats', response=AdminStatsOut, auth=jwt_auth)
def get_admin_stats(request):
    user = request.auth_user
    if user.role != 'admin' and not user.is_staff:
        raise HttpError(403, "Admin access required.")

    all_users = User.objects.all()
    volunteers = all_users.filter(user_type='volunteer')
    members = all_users.filter(user_type='member')

    # Calculated completed profiles
    completed_count = 0
    incomplete_count = 0
    for u in all_users:
        if u.profile_completion_percentage == 100:
            completed_count += 1
        else:
            incomplete_count += 1

    total_programs = Activity.objects.count()
    total_certs = Certificate.objects.filter(status=Certificate.Status.GENERATED).count()
    pending_apps = ActivityApplication.objects.filter(status=ActivityApplication.Status.PENDING).count()
    active_vols = volunteers.filter(is_active=True).count()

    return {
        'total_volunteers': volunteers.count(),
        'total_members': members.count(),
        'completed_profiles': completed_count,
        'incomplete_profiles': incomplete_count,
        'active_volunteers': active_vols,
        'total_programs': total_programs,
        'total_certificates': total_certs,
        'pending_applications': pending_apps,
    }


@router.get('/volunteers', response=List[VolunteerListItemOut], auth=jwt_auth)
def list_volunteers_filtered(
    request,
    user_type: Optional[str] = None,
    volunteer_status: Optional[str] = None,
    registration_status: Optional[str] = None,
    profile_completion: Optional[str] = None,
    gender: Optional[str] = None,
    institution: Optional[str] = None,
    city: Optional[str] = None,
    position: Optional[str] = None,
    participation: Optional[str] = None,
    search: Optional[str] = None,
):
    user = request.auth_user
    if user.role != 'admin' and not user.is_staff:
        raise HttpError(403, "Admin access required.")

    qs = User.objects.annotate(
        app_count=Count('activity_applications', filter=Q(activity_applications__status='accepted'))
    )

    if user_type and user_type != 'all':
        qs = qs.filter(user_type__iexact=user_type)

    if volunteer_status and volunteer_status != 'all':
        qs = qs.filter(volunteer_status__iexact=volunteer_status)

    if gender and gender != 'all':
        qs = qs.filter(gender__iexact=gender)

    if institution and institution != 'all':
        qs = qs.filter(institution_name__icontains=institution)

    if city and city != 'all':
        qs = qs.filter(city__icontains=city)

    if position and position != 'all':
        qs = qs.filter(position__iexact=position)

    if search:
        qs = qs.filter(
            Q(full_name__icontains=search) |
            Q(email__icontains=search) |
            Q(registration_number__icontains=search) |
            Q(cnic_number__icontains=search) |
            Q(phone_number__icontains=search)
        )

    results = []
    for u in qs:
        comp = u.profile_completion_percentage

        # Profile completion filter
        if profile_completion == 'below_50' and comp >= 50:
            continue
        elif profile_completion == '50' and comp != 50:
            continue
        elif profile_completion == '75' and comp != 75:
            continue
        elif profile_completion == '100' and comp != 100:
            continue

        # Registration status filter
        if registration_status == 'incomplete_profile' and comp == 100:
            continue
        elif registration_status == 'completed_profile' and comp < 100:
            continue

        # Participation filter
        part_count = getattr(u, 'app_count', 0)
        if participation == 'never' and part_count > 0:
            continue
        elif participation == 'once' and part_count != 1:
            continue
        elif participation == 'multiple' and part_count < 2:
            continue

        results.append({
            'public_id': u.public_id,
            'registration_number': u.registration_number,
            'full_name': u.full_name,
            'email': u.email,
            'phone_number': u.phone_number,
            'cnic_number': u.cnic_number,
            'user_type': u.user_type,
            'position': u.position,
            'volunteer_status': u.volunteer_status,
            'gender': u.gender,
            'institution_name': u.institution_name or u.institution,
            'city': u.city,
            'province': u.province,
            'profile_completion_percentage': comp,
            'program_participation_count': part_count,
            'created_at': u.created_at.isoformat(),
        })

    return results


@router.post('/volunteers/{public_id}/approve', auth=jwt_auth)
def approve_volunteer_request(request, public_id: uuid.UUID):
    """Admin approves user volunteer verification application."""
    user = request.auth_user
    if user.role != 'admin' and not user.is_staff:
        raise HttpError(403, "Admin access required.")

    try:
        target_user = User.objects.get(public_id=public_id)
    except User.DoesNotExist:
        raise HttpError(404, "User not found.")

    target_user.approve_as_volunteer()

    # Send Notification to target user
    try:
        from apps.notifications.models import Notification
        Notification.objects.create(
            user=target_user,
            title="Congratulations! Verified Volunteer Approved 🏅",
            message=f"Your Volunteer Verification application has been approved! Your Registration Number is {target_user.registration_number}. You can now access your Digital ID Card and apply for all active opportunities.",
            type=Notification.NotificationType.GENERAL
        )
    except Exception as e:
        print(f"[Notification Error] {e}")

    return {
        'message': f"User {target_user.full_name} has been approved as a Verified Volunteer.",
        'registration_number': target_user.registration_number,
        'volunteer_status': target_user.volunteer_status
    }


@router.post('/volunteers/{public_id}/reject', auth=jwt_auth)
def reject_volunteer_request(request, public_id: uuid.UUID):
    """Admin rejects user volunteer verification application."""
    user = request.auth_user
    if user.role != 'admin' and not user.is_staff:
        raise HttpError(403, "Admin access required.")

    try:
        target_user = User.objects.get(public_id=public_id)
    except User.DoesNotExist:
        raise HttpError(404, "User not found.")

    target_user.volunteer_status = User.VolunteerStatus.REJECTED
    target_user.save(update_fields=['volunteer_status'])

    # Send Notification to target user
    try:
        from apps.notifications.models import Notification
        Notification.objects.create(
            user=target_user,
            title="Volunteer Verification Application Update",
            message="Your application for Verified Volunteer status requires revision. Please review your profile details and re-apply.",
            type=Notification.NotificationType.GENERAL
        )
    except Exception as e:
        print(f"[Notification Error] {e}")

    return {
        'message': f"Volunteer application for {target_user.full_name} marked as rejected.",
        'volunteer_status': target_user.volunteer_status
    }

