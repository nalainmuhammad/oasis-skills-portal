import uuid
from typing import List
from ninja import Router, Schema
from ninja.errors import HttpError
from django.shortcuts import get_object_or_404
from apps.users.api import jwt_auth
from .models import Notification

router = Router()


class NotificationOut(Schema):
    public_id: uuid.UUID
    title: str
    message: str
    type: str
    is_read: bool
    created_at: str


@router.get('/', response=List[NotificationOut], auth=jwt_auth)
def list_notifications(request):
    user = request.auth_user
    notes = Notification.objects.filter(user=user)
    return [
        {
            'public_id': n.public_id,
            'title': n.title,
            'message': n.message,
            'type': n.type,
            'is_read': n.is_read,
            'created_at': n.created_at.isoformat(),
        }
        for n in notes
    ]


@router.post('/{public_id}/read', auth=jwt_auth)
def mark_read(request, public_id: uuid.UUID):
    user = request.auth_user
    n = get_object_or_404(Notification, public_id=public_id, user=user)
    n.is_read = True
    n.save(update_fields=['is_read'])
    return {'message': 'Notification marked as read.'}


@router.post('/read-all', auth=jwt_auth)
def mark_all_read(request):
    user = request.auth_user
    Notification.objects.filter(user=user, is_read=False).update(is_read=True)
    return {'message': 'All notifications marked as read.'}
