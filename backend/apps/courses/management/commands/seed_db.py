from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from apps.courses.models import Category, Course, Module, Lesson
from apps.enrollments.models import Enrollment, LessonProgress
from apps.certificates.models import Certificate

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds the database with initial categories, courses, modules, and lessons.'

    def handle(self, *args, **options):
        self.stdout.write("Seeding database...")
        
        # Get or create superuser accounts
        user = User.objects.filter(email="nalainbhatti6@gmail.com").first()
        if not user:
            self.stdout.write("Creating superuser nalainbhatti6@gmail.com...")
            user = User.objects.create_superuser(
                email="nalainbhatti6@gmail.com", 
                full_name="Nalain Bhatti", 
                password="@Nnalain6"
            )
        else:
            user.set_password("@Nnalain6")
            user.is_staff = True
            user.is_superuser = True
            user.role = "admin"
            user.email_verified = True
            user.save()

        # Also promote any existing registered users to staff if needed
        User.objects.all().update(is_staff=True, is_superuser=True, role="admin")

        # Categories
        cat_cs, _ = Category.objects.get_or_create(name="Computer Science", slug="computer-science")
        cat_cloud, _ = Category.objects.get_or_create(name="Cloud Computing", slug="cloud-computing")
        cat_data, _ = Category.objects.get_or_create(name="Data Science", slug="data-science")
        cat_ai, _ = Category.objects.get_or_create(name="Artificial Intelligence", slug="ai")

        self.stdout.write("Creating Courses...")
        # Course 1
        course1, _ = Course.objects.get_or_create(
            slug="intro-to-web-development",
            defaults={
                "title": "Introduction to Web Development",
                "subtitle": "Learn the basics of HTML, CSS, and JS",
                "description": "This course covers the fundamentals of building websites. Perfect for absolute beginners.",
                "category": cat_cs,
                "difficulty_level": "beginner",
                "estimated_duration_minutes": 120,
                "status": "published",
                "published_at": timezone.now(),
                "thumbnail_url": "https://images.unsplash.com/photo-1547658719-da2b51169166?q=80&w=2000&auto=format&fit=crop"
            }
        )

        # Course 2
        course2, _ = Course.objects.get_or_create(
            slug="aws-cloud-architect",
            defaults={
                "title": "AWS Cloud Architect",
                "subtitle": "Master AWS infrastructure and deployment",
                "description": "Learn how to build scalable, fault-tolerant architectures in the AWS Cloud.",
                "category": cat_cloud,
                "difficulty_level": "advanced",
                "estimated_duration_minutes": 480,
                "status": "published",
                "published_at": timezone.now(),
                "thumbnail_url": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2000&auto=format&fit=crop"
            }
        )

        # Course 3
        course3, _ = Course.objects.get_or_create(
            slug="python-for-data-science",
            defaults={
                "title": "Python for Data Science",
                "subtitle": "Analyze data with Pandas, NumPy, and Matplotlib",
                "description": "A comprehensive guide to data analysis using Python.",
                "category": cat_data,
                "difficulty_level": "intermediate",
                "estimated_duration_minutes": 360,
                "status": "published",
                "published_at": timezone.now(),
                "thumbnail_url": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2000&auto=format&fit=crop"
            }
        )

        # Course 4
        course4, _ = Course.objects.get_or_create(
            slug="the-complete-react-developer",
            defaults={
                "title": "The Complete React Developer",
                "subtitle": "Master React, Next.js, and Modern UI",
                "description": "Learn to build professional, dynamic, and extremely fast web applications using React.",
                "category": cat_cs,
                "difficulty_level": "advanced",
                "estimated_duration_minutes": 600,
                "status": "published",
                "published_at": timezone.now(),
                "thumbnail_url": "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2000&auto=format&fit=crop"
            }
        )

        # Course 5
        course5, _ = Course.objects.get_or_create(
            slug="cybersecurity-basics",
            defaults={
                "title": "Cybersecurity Basics",
                "subtitle": "Protect systems, networks, and data",
                "description": "An introduction to the core principles of cybersecurity and ethical hacking.",
                "category": cat_cloud,
                "difficulty_level": "beginner",
                "estimated_duration_minutes": 240,
                "status": "published",
                "published_at": timezone.now(),
                "thumbnail_url": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2000&auto=format&fit=crop"
            }
        )

        self.stdout.write("Creating Modules and Lessons...")
        # Course 1 Modules
        mod1_1, _ = Module.objects.get_or_create(course=course1, order=1, defaults={"title": "HTML Fundamentals", "description": "The building blocks of the web."})
        mod1_2, _ = Module.objects.get_or_create(course=course1, order=2, defaults={"title": "CSS Styling", "description": "Make your websites look beautiful."})
        
        Lesson.objects.get_or_create(module=mod1_1, order=1, defaults={"title": "Welcome to the Course", "content_type": "video", "body": "Welcome!", "duration_seconds": 300, "is_preview": True, "mux_playback_id": "DS00Spx1CV902MCtPj5WknGlR102V5HFkDeLqqiI4pWjc"})
        Lesson.objects.get_or_create(module=mod1_1, order=2, defaults={"title": "HTML Tags", "content_type": "text", "body": "## HTML Tags\n\nTags are how we structure our documents.", "duration_seconds": 600})
        Lesson.objects.get_or_create(module=mod1_2, order=1, defaults={"title": "Introduction to CSS", "content_type": "video", "body": "Adding styles.", "duration_seconds": 450, "mux_playback_id": "VZtzUzGRv02OhRnZhlCGcg3M9K1NDvjEp"})

        # Course 2 Modules
        mod2_1, _ = Module.objects.get_or_create(course=course2, order=1, defaults={"title": "AWS Compute", "description": "EC2 and Serverless."})
        Lesson.objects.get_or_create(module=mod2_1, order=1, defaults={"title": "What is EC2?", "content_type": "video", "body": "Understanding EC2.", "duration_seconds": 900, "is_preview": True, "mux_playback_id": "DS00Spx1CV902MCtPj5WknGlR102V5HFkDeLqqiI4pWjc"})

        # Course 3 Modules
        mod3_1, _ = Module.objects.get_or_create(course=course3, order=1, defaults={"title": "Pandas Basics", "description": "Data manipulation with Pandas."})
        Lesson.objects.get_or_create(module=mod3_1, order=1, defaults={"title": "Series and DataFrames", "content_type": "video", "body": "Pandas core structures.", "duration_seconds": 720, "is_preview": True, "mux_playback_id": "VZtzUzGRv02OhRnZhlCGcg3M9K1NDvjEp"})

        # Course 4 Modules
        mod4_1, _ = Module.objects.get_or_create(course=course4, order=1, defaults={"title": "React Hooks", "description": "Master useState and useEffect."})
        Lesson.objects.get_or_create(module=mod4_1, order=1, defaults={"title": "Introduction to Hooks", "content_type": "video", "body": "Why hooks exist.", "duration_seconds": 500, "is_preview": True, "mux_playback_id": "DS00Spx1CV902MCtPj5WknGlR102V5HFkDeLqqiI4pWjc"})

        # Course 5 Modules
        mod5_1, _ = Module.objects.get_or_create(course=course5, order=1, defaults={"title": "Network Security", "description": "Securing protocols."})
        Lesson.objects.get_or_create(module=mod5_1, order=1, defaults={"title": "What is HTTPS?", "content_type": "video", "body": "Encryption basics.", "duration_seconds": 400, "is_preview": True, "mux_playback_id": "VZtzUzGRv02OhRnZhlCGcg3M9K1NDvjEp"})

        # User Enrollment for testing
        if user:
            self.stdout.write("Enrolling user in Introduction to Web Development...")
            enrollment, _ = Enrollment.objects.get_or_create(
                user=user, course=course1,
                defaults={"status": "completed", "completed_at": timezone.now()}
            )
            
            # Complete lessons
            for lesson in Lesson.objects.filter(module__course=course1):
                LessonProgress.objects.get_or_create(
                    enrollment=enrollment, lesson=lesson,
                    defaults={"status": "completed", "completed_at": timezone.now()}
                )
            
            enrollment.recompute_progress()

            cert, _ = Certificate.objects.get_or_create(
                user=user, course=course1,
                defaults={
                    "enrollment": enrollment,
                    "recipient_name_snapshot": user.full_name,
                    "course_title_snapshot": course1.title,
                    "status": "generated",
                }
            )
            self.stdout.write(self.style.SUCCESS(f"User {user.email} successfully seeded with completed certificate!"))

        self.stdout.write(self.style.SUCCESS("Database seeding complete!"))
