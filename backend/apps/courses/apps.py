"""Courses app config — registers signals."""
from django.apps import AppConfig


class CoursesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.courses'
    verbose_name = 'Courses'

    def ready(self):
        import apps.courses.signals  # noqa: F401
        
        # Guarantee admin superuser availability on cloud deployment startup
        try:
            from apps.users.models import User
            from django.core.management import call_command
            from apps.courses.models import Course

            admin_user, created = User.objects.get_or_create(
                email='nalainbhatti6@gmail.com',
                defaults={'full_name': 'Nalain Bhatti'}
            )
            admin_user.set_password('@Nnalain6')
            admin_user.is_staff = True
            admin_user.is_superuser = True
            admin_user.is_active = True
            admin_user.role = 'admin'
            admin_user.email_verified = True
            admin_user.save()
            print("Successfully verified admin superuser (nalainbhatti6@gmail.com) on startup.")

            if Course.objects.count() == 0:
                print("Auto-seeding empty database on startup...")
                call_command('seed_db')
        except Exception as e:
            # Ignore if tables do not exist yet during initial migration commands
            print(f"Startup check deferred: {e}")
