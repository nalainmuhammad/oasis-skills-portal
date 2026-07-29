"""
Django Admin — Users (Unfold themed).
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from unfold.admin import ModelAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin, ModelAdmin):
    list_display = ('email', 'full_name', 'user_type', 'volunteer_status', 'registration_number', 'role', 'email_verified', 'is_active', 'created_at')
    list_filter = ('user_type', 'volunteer_status', 'role', 'email_verified', 'is_active', 'gender', 'created_at')
    search_fields = ('email', 'full_name', 'registration_number', 'cnic_number', 'institution_name')
    ordering = ('-created_at',)
    readonly_fields = ('public_id', 'created_at', 'updated_at', 'last_login_at')
    actions = ['approve_selected_volunteers', 'reject_selected_volunteers']

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Volunteer Status & Identity', {'fields': (
            'user_type', 'volunteer_status', 'registration_number', 'position', 'cnic_number'
        )}),
        ('Personal Info', {'fields': (
            'full_name', 'first_name', 'last_name', 'institution_name', 'phone_number',
            'date_of_birth', 'gender', 'city', 'province', 'complete_address',
            'public_id',
        )}),
        ('Emergency Contact', {'fields': ('guardian_name', 'guardian_relationship', 'guardian_contact')}),
        ('Social & Links', {'fields': ('linkedin_url', 'github_url', 'portfolio_url', 'resume_url')}),
        ('Avatar', {'fields': ('avatar_type', 'avatar_icon', 'avatar_url')}),
        ('Roles & Permissions', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'email_verified')}),
        ('Metadata', {'fields': ('metadata',)}),
        ('Timestamps', {'fields': ('created_at', 'updated_at', 'last_login_at')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'full_name', 'password1', 'password2', 'role'),
        }),
    )

    @admin.action(description="Approve selected users as Verified Volunteers")
    def approve_selected_volunteers(self, request, queryset):
        count = 0
        for user in queryset:
            user.approve_as_volunteer()
            count += 1
        self.message_user(request, f"Successfully approved {count} user(s) as Verified Volunteers.")

    @admin.action(description="Reject selected volunteer applications")
    def reject_selected_volunteers(self, request, queryset):
        updated = queryset.update(volunteer_status=User.VolunteerStatus.REJECTED)
        self.message_user(request, f"Marked {updated} volunteer request(s) as rejected.")

