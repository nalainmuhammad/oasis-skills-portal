"""
Django Admin — Courses, Modules, Lessons, Categories (Unfold themed).
Inline editing for Modules within Courses and Lessons within Modules.
"""
from django.contrib import admin
from django.utils import timezone
from unfold.admin import ModelAdmin, TabularInline
from .models import Category, Course, Module, Lesson


class LessonInline(TabularInline):
    model = Lesson
    extra = 1
    fields = ('title', 'content_type', 'order', 'duration_seconds', 'is_preview', 'mux_playback_id')
    ordering = ('order',)


class ModuleInline(TabularInline):
    model = Module
    extra = 1
    fields = ('title', 'order', 'description')
    ordering = ('order',)
    show_change_link = True


@admin.register(Category)
class CategoryAdmin(ModelAdmin):
    list_display = ('name', 'slug')
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Course)
class CourseAdmin(ModelAdmin):
    list_display = (
        'title', 'category', 'status', 'difficulty_level',
        'module_count', 'enrollment_count', 'published_at'
    )
    list_filter = ('status', 'difficulty_level', 'category')
    search_fields = ('title', 'slug')
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ('module_count', 'enrollment_count', 'created_at', 'updated_at')
    inlines = [ModuleInline]

    fieldsets = (
        (None, {'fields': ('title', 'slug', 'subtitle', 'description')}),
        ('Media', {'fields': ('thumbnail_url',)}),
        ('Classification', {'fields': ('category', 'difficulty_level', 'estimated_duration_minutes')}),
        ('Status', {'fields': ('status', 'published_at')}),
        ('Metadata', {'fields': ('metadata',)}),
        ('Statistics', {'fields': ('module_count', 'enrollment_count')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )

    actions = ['publish_courses', 'archive_courses']

    @admin.action(description='Publish selected courses')
    def publish_courses(self, request, queryset):
        queryset.update(status='published', published_at=timezone.now())
        self.message_user(request, f'{queryset.count()} course(s) published.')

    @admin.action(description='Archive selected courses')
    def archive_courses(self, request, queryset):
        queryset.update(status='archived')
        self.message_user(request, f'{queryset.count()} course(s) archived.')

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        # Trigger cache invalidation on save (§3.3)
        from .signals import invalidate_course_cache
        invalidate_course_cache(obj)


@admin.register(Module)
class ModuleAdmin(ModelAdmin):
    list_display = ('title', 'course', 'order')
    list_filter = ('course',)
    search_fields = ('title',)
    ordering = ('course', 'order')
    inlines = [LessonInline]


@admin.register(Lesson)
class LessonAdmin(ModelAdmin):
    list_display = ('title', 'module', 'content_type', 'order', 'duration_seconds', 'is_preview')
    list_filter = ('content_type', 'is_preview')
    search_fields = ('title',)
    ordering = ('module__course', 'module__order', 'order')
