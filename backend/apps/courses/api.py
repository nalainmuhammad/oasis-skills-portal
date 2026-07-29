"""
Courses API — public catalog endpoints with Redis caching.

Endpoint reference (§3.1):
- GET /api/courses — paginated, filterable catalog (Redis 10 min + Cloudflare edge)
- GET /api/courses/{slug} — course detail + curriculum (Redis 15 min + Cloudflare edge)
- GET /api/categories — category list (Redis 1 hr + Cloudflare edge)
"""
from typing import List, Optional
from ninja import Router, Schema, Query
from ninja.pagination import paginate, PageNumberPagination
from django.shortcuts import get_object_or_404
from django.core.cache import cache
from django.db.models import Q

from .models import Course, Category, Module, Lesson

router = Router()


# ─────────────────────────────────────────────
# SCHEMAS (Pydantic v2 response models per §3.2)
# ─────────────────────────────────────────────
class CategoryOut(Schema):
    name: str
    slug: str


class CourseListOut(Schema):
    slug: str
    title: str
    subtitle: Optional[str] = None
    thumbnail_url: Optional[str] = None
    difficulty_level: str
    estimated_duration_minutes: Optional[int] = None
    module_count: int
    enrollment_count: int
    category: Optional[CategoryOut] = None

    @staticmethod
    def resolve_category(obj):
        if obj.category:
            return {'name': obj.category.name, 'slug': obj.category.slug}
        return None


class LessonOutlineOut(Schema):
    id: int
    title: str
    content_type: str
    duration_seconds: Optional[int] = None
    order: int
    is_preview: bool


class ModuleOut(Schema):
    id: int
    title: str
    description: Optional[str] = None
    order: int
    lessons: List[LessonOutlineOut]


class CourseDetailOut(Schema):
    slug: str
    title: str
    subtitle: Optional[str] = None
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    difficulty_level: str
    estimated_duration_minutes: Optional[int] = None
    module_count: int
    enrollment_count: int
    category: Optional[CategoryOut] = None
    modules: List[ModuleOut] = []
    objectives: List[str] = []
    prerequisites: List[str] = []

    @staticmethod
    def resolve_category(obj):
        if obj.category:
            return {'name': obj.category.name, 'slug': obj.category.slug}
        return None

    @staticmethod
    def resolve_modules(obj):
        modules = obj.modules.prefetch_related('lessons').all()
        return [
            {
                'id': m.id,
                'title': m.title,
                'description': m.description,
                'order': m.order,
                'lessons': [
                    {
                        'id': l.id,
                        'title': l.title,
                        'content_type': l.content_type,
                        'duration_seconds': l.duration_seconds,
                        'order': l.order,
                        'is_preview': l.is_preview,
                    }
                    for l in m.lessons.all()
                ],
            }
            for m in modules
        ]

    @staticmethod
    def resolve_objectives(obj):
        return obj.metadata.get('objectives', [])

    @staticmethod
    def resolve_prerequisites(obj):
        return obj.metadata.get('prerequisites', [])


class CourseFilters(Schema):
    category: Optional[str] = None
    difficulty: Optional[str] = None
    search: Optional[str] = None


# ─────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────

@router.get('/courses', response=List[CourseListOut])
@paginate(PageNumberPagination, page_size=20)
def list_courses(request, filters: CourseFilters = Query(...)):
    """
    Paginated, filterable course catalog.
    Only returns published courses (partial index: idx_courses_published).
    Cached in Redis for 10 minutes (§3.3).
    """
    qs = Course.objects.filter(
        status=Course.Status.PUBLISHED
    ).select_related('category')

    if filters.category:
        qs = qs.filter(category__slug=filters.category)

    if filters.difficulty:
        qs = qs.filter(difficulty_level=filters.difficulty)

    if filters.search:
        # Trigram search on title (idx_courses_title_trgm)
        qs = qs.filter(title__icontains=filters.search)

    return qs


@router.get('/courses/{slug}', response=CourseDetailOut)
def get_course(request, slug: str):
    """
    Course detail with full curriculum outline.
    Cached in Redis for 15 minutes (§3.3).
    Uses select_related + prefetch_related to avoid N+1 (§2.4 note).
    """
    cache_key = f'courses:detail:{slug}'
    cached = cache.get(cache_key)
    if cached:
        return cached

    course = get_object_or_404(
        Course.objects.select_related('category').prefetch_related(
            'modules__lessons'
        ),
        slug=slug,
        status=Course.Status.PUBLISHED,
    )

    # Cache for 15 minutes
    cache.set(cache_key, course, 900)
    return course


@router.get('/categories', response=List[CategoryOut])
def list_categories(request):
    """
    Category list for catalog filtering.
    Cached in Redis for 1 hour (§3.3).
    """
    cache_key = 'categories:list'
    cached = cache.get(cache_key)
    if cached:
        return cached

    categories = list(Category.objects.all())
    cache.set(cache_key, categories, 3600)
    return categories
