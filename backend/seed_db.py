import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.utils import timezone
from django.contrib.auth import get_user_model
from apps.courses.models import Category, Course, Module, Lesson
from apps.enrollments.models import Enrollment, LessonProgress
from apps.certificates.models import Certificate

User = get_user_model()

def run():
    print("Seeding database...")
    
    # Get or create an admin user to own enrollments
    user = User.objects.first()
    if not user:
        print("Creating default user...")
        user = User.objects.create_user(email="demo@example.com", full_name="Demo User", password="password")

    # Categories
    cat_cs, _ = Category.objects.get_or_create(name="Computer Science", slug="computer-science")
    cat_cloud, _ = Category.objects.get_or_create(name="Cloud Computing", slug="cloud-computing")
    cat_data, _ = Category.objects.get_or_create(name="Data Science", slug="data-science")
    cat_ai, _ = Category.objects.get_or_create(name="Artificial Intelligence", slug="ai")

    print("Creating Courses...")
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

    print("Creating Modules and Lessons...")
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
        print("Enrolling user in Introduction to Web Development...")
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
                "title_snapshot": course1.title,
                "status": "generated",
            }
        )
        print(f"User {user.email} successfully seeded with completed certificate!")

    # Activities / Opportunities Seeding
    print("Creating Activities across all categories...")
    from apps.activities.models import Activity
    from datetime import date, timedelta

    today = date.today()

    activities_data = [
        {
            "title": "National Flood Relief & Community Support Drive",
            "description": "Join our emergency relief team providing food distribution, medical supplies, and shelter coordination for affected communities.",
            "category": Activity.Category.CAMPAIGN,
            "available_positions": ["Relief Coordinator", "Medical Assistant", "Logistics Volunteer", "Field Reporter"],
            "eligibility_criteria": "Profile Completion = 100%, Age 18+",
            "required_skills": ["First Aid", "Community Outreach", "Logistics"],
            "total_seats": 25,
            "start_date": today + timedelta(days=5),
            "end_date": today + timedelta(days=20),
            "deadline": today + timedelta(days=4),
            "status": Activity.Status.OPEN,
        },
        {
            "title": "Oasis Youth Leadership Fellowship 2026",
            "description": "A 3-month intensive leadership and social impact fellowship designed to empower upcoming youth changemakers across Pakistan.",
            "category": Activity.Category.PROGRAM,
            "available_positions": ["Fellowship Candidate", "Youth Ambassador"],
            "eligibility_criteria": "Profile Completion = 100%, University Student or Recent Graduate",
            "required_skills": ["Leadership", "Project Management", "Public Speaking"],
            "total_seats": 50,
            "start_date": today + timedelta(days=15),
            "end_date": today + timedelta(days=105),
            "deadline": today + timedelta(days=10),
            "status": Activity.Status.OPEN,
        },
        {
            "title": "Annual Oasis Tech & Innovation Summit",
            "description": "Participate as an event organizer or technical usher for our nationwide technology, AI, and green energy summit.",
            "category": Activity.Category.EVENT,
            "available_positions": ["Event Manager", "Technical Usher", "Media & Documentation Lead", "Registration Desk Lead"],
            "eligibility_criteria": "Profile Completion = 100%",
            "required_skills": ["Event Management", "Communication", "Photography"],
            "total_seats": 30,
            "start_date": today + timedelta(days=12),
            "end_date": today + timedelta(days=14),
            "deadline": today + timedelta(days=8),
            "status": Activity.Status.OPEN,
        },
        {
            "title": "Full-Stack Web & AI Bootcamp Workshop",
            "description": "Hands-on weekend workshop teaching React, Django, and AI API integrations to high school and college students.",
            "category": Activity.Category.WORKSHOP,
            "available_positions": ["Teaching Assistant", "Code Mentor", "Workshop Moderator"],
            "eligibility_criteria": "Profile Completion = 100%, Basic Python/JS knowledge",
            "required_skills": ["Python", "JavaScript", "Mentorship"],
            "total_seats": 15,
            "start_date": today + timedelta(days=7),
            "end_date": today + timedelta(days=9),
            "deadline": today + timedelta(days=5),
            "status": Activity.Status.OPEN,
        },
        {
            "title": "Digital Skills & Education Volunteer Mentor",
            "description": "Volunteer as an online or hybrid mentor teaching basic digital literacy, graphic design, and coding to underserved youth.",
            "category": Activity.Category.VOLUNTEER_OPPORTUNITY,
            "available_positions": ["Digital Mentor", "Curriculum Assistant", "Student Evaluator"],
            "eligibility_criteria": "Profile Completion = 100%",
            "required_skills": ["Teaching", "Digital Literacy", "Patience"],
            "total_seats": 40,
            "start_date": today + timedelta(days=10),
            "end_date": today + timedelta(days=40),
            "deadline": today + timedelta(days=6),
            "status": Activity.Status.OPEN,
        },
    ]

    for act in activities_data:
        Activity.objects.get_or_create(
            title=act["title"],
            defaults=act
        )

    print("Database seeding complete!")

if __name__ == '__main__':
    run()
