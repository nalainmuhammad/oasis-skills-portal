"""Enrollments admin (Unfold themed)."""
from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import Enrollment, LessonProgress


@admin.register(Enrollment)
class EnrollmentAdmin(ModelAdmin):
    list_display = ('user', 'course', 'status', 'progress_percent', 'enrolled_at', 'completed_at')
    list_filter = ('status', 'enrolled_at')
    search_fields = ('user__email', 'user__full_name', 'course__title')
    readonly_fields = ('enrolled_at',)


@admin.register(LessonProgress)
class LessonProgressAdmin(ModelAdmin):
    list_display = ('enrollment', 'lesson', 'status', 'watch_seconds', 'completed_at')
    list_filter = ('status',)
    search_fields = ('enrollment__user__email', 'lesson__title')
