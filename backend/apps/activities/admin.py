from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import Activity, ActivityApplication


@admin.register(Activity)
class ActivityAdmin(ModelAdmin):
    list_display = ('title', 'category', 'start_date', 'deadline', 'total_seats', 'status')
    list_filter = ('category', 'status', 'start_date')
    search_fields = ('title', 'description')


@admin.register(ActivityApplication)
class ActivityApplicationAdmin(ModelAdmin):
    list_display = ('applicant', 'activity', 'applied_position', 'status', 'applied_at')
    list_filter = ('status', 'applied_at')
    search_fields = ('applicant__full_name', 'applicant__email', 'activity__title')
