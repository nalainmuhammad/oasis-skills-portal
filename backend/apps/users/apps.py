from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.users'
    verbose_name = 'Users'

    def ready(self):
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
        except Exception:
            pass
