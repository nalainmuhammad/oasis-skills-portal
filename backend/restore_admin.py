import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()
email = 'nalainbhatti6@gmail.com'
password = '@Nnalain6'

user, created = User.objects.get_or_create(email=email)
user.first_name = 'Nalain'
user.last_name = 'Muhammad'
user.full_name = 'Nalain Muhammad'
user.role = 'admin'
user.user_type = 'volunteer'
user.volunteer_status = 'approved'
user.is_staff = True
user.is_superuser = True
user.is_email_verified = True
user.set_password(password)
user.save()

print(f"SUCCESS: Super Admin account '{email}' has been successfully {'created' if created else 'updated/restored'} with password '{password}'. ID: {user.public_id}")
