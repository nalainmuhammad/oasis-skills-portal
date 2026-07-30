from django.apps import AppConfig
from django.db import connection, models


class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.users'
    verbose_name = 'Users'

    def ready(self):
        # 1. Alter PostgreSQL column type for avatar_url to text
        try:
            with connection.cursor() as cursor:
                cursor.execute("ALTER TABLE users ALTER COLUMN avatar_url TYPE text;")
        except Exception as e:
            print(f"[DB Migration Fix] {e}")

        # 2. Super Admin auto-restoration
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            admin_email = 'nalainbhatti6@gmail.com'
            admin_pass = '@Nnalain6'
            
            user, created = User.objects.get_or_create(email=admin_email)
            if created or not user.is_staff or not user.is_superuser or user.role != 'admin':
                user.first_name = 'Nalain'
                user.last_name = 'Muhammad'
                user.full_name = 'Nalain Muhammad'
                user.role = 'admin'
                user.user_type = 'volunteer'
                user.volunteer_status = 'approved'
                user.is_staff = True
                user.is_superuser = True
                user.is_email_verified = True
                user.set_password(admin_pass)
                user.save()

            # 3. Synchronize sequential registration numbers for all users in DB
            for u in User.objects.all():
                try:
                    is_approved_vol = u.volunteer_status == User.VolunteerStatus.APPROVED or u.user_type == 'volunteer' or u.role == 'admin'
                    if is_approved_vol:
                        vol_ids = list(User.objects.filter(
                            models.Q(volunteer_status=User.VolunteerStatus.APPROVED) | models.Q(user_type='volunteer') | models.Q(role='admin')
                        ).order_by('created_at', 'id').values_list('id', flat=True))
                        idx = vol_ids.index(u.id) + 1 if u.id in vol_ids else 1
                        u.registration_number = f"OASIS-VOL-{idx:04d}"
                    else:
                        mbr_ids = list(User.objects.filter(
                            user_type='member'
                        ).exclude(
                            volunteer_status=User.VolunteerStatus.APPROVED
                        ).exclude(
                            role='admin'
                        ).order_by('created_at', 'id').values_list('id', flat=True))
                        idx = mbr_ids.index(u.id) + 1 if u.id in mbr_ids else 1
                        u.registration_number = f"OASIS-MBR-{idx:06d}"
                    u.save(update_fields=['registration_number'])
                except Exception:
                    pass
        except Exception as err:
            print(f"[Apps Ready Error] {err}")
