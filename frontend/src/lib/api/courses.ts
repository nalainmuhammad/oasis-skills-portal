import { Course, CourseDetail, PaginatedResponse, Category } from '@/types';

// Fallback mock data if API is not running or NEXT_PUBLIC_API_URL is missing
const MOCK_COURSES: Course[] = [
  {
    slug: 'intro-data-analysis',
    title: 'Introduction to Data Analysis',
    subtitle: 'Learn the fundamentals of working with data, from collection to visualization, using modern industry tools.',
    thumbnail_url: null,
    difficulty_level: 'beginner',
    estimated_duration_minutes: 180,
    module_count: 4,
    enrollment_count: 1250,
    category: { name: 'Data & Analytics', slug: 'data-analytics' }
  },
  {
    slug: 'modern-frontend-frameworks',
    title: 'Modern Frontend Frameworks',
    subtitle: 'Master React, Next.js, and modern CSS to build blazing fast, accessible, and beautiful user interfaces.',
    thumbnail_url: null,
    difficulty_level: 'intermediate',
    estimated_duration_minutes: 320,
    module_count: 6,
    enrollment_count: 850,
    category: { name: 'Web Development', slug: 'web-development' }
  },
  {
    slug: 'aws-cloud-architecture',
    title: 'AWS Cloud Architecture',
    subtitle: 'Design highly scalable, fault-tolerant, and secure systems on AWS. Prepares you for the Solutions Architect exam.',
    thumbnail_url: null,
    difficulty_level: 'advanced',
    estimated_duration_minutes: 480,
    module_count: 8,
    enrollment_count: 420,
    category: { name: 'Cloud Computing', slug: 'cloud-computing' }
  }
];

export async function getCourses(params?: { category_slug?: string, difficulty_level?: string, search?: string }): Promise<PaginatedResponse<Course>> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    // Return mock
    return {
      count: MOCK_COURSES.length,
      next: null,
      previous: null,
      items: MOCK_COURSES
    };
  }

  const searchParams = new URLSearchParams();
  if (params?.category_slug) searchParams.set('category', params.category_slug);
  if (params?.difficulty_level) searchParams.set('difficulty', params.difficulty_level);
  if (params?.search) searchParams.set('search', params.search);

  try {
    const res = await fetch(`${apiUrl}/api/courses?${searchParams.toString()}`, {
      next: { revalidate: 600, tags: ['courses'] },
      signal: AbortSignal.timeout(4000)
    });

    if (!res.ok) throw new Error('Failed to fetch courses');
    return res.json();
  } catch (error) {
    console.error('Error fetching courses:', error);
    return {
      count: MOCK_COURSES.length,
      next: null,
      previous: null,
      items: MOCK_COURSES
    };
  }
}

export async function getCourseBySlug(slug: string): Promise<CourseDetail> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    const course = MOCK_COURSES.find(c => c.slug === slug);
    if (!course) throw new Error('Course not found');
    return {
      ...course,
      description: 'Course description markdown content goes here...',
      metadata: {},
      modules: []
    };
  }

  try {
    const res = await fetch(`${apiUrl}/api/courses/${slug}`, {
      next: { revalidate: 0, tags: ['courses', `course:${slug}`] },
      signal: AbortSignal.timeout(4000)
    });

    if (!res.ok) {
      if (res.status === 404) throw new Error('Course not found');
      throw new Error('Failed to fetch course');
    }
    return res.json();
  } catch (error) {
    console.error(`Error fetching course ${slug}:`, error);
    const course = MOCK_COURSES.find(c => c.slug === slug);
    if (!course) throw new Error('Course not found');
    return {
      ...course,
      description: 'Course description markdown content goes here...',
      metadata: {},
      modules: []
    };
  }
}

export async function getCategories(): Promise<Category[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    return [
      { name: 'Data & Analytics', slug: 'data-analytics' },
      { name: 'Web Development', slug: 'web-development' },
      { name: 'Cloud Computing', slug: 'cloud-computing' }
    ];
  }

  try {
    const res = await fetch(`${apiUrl}/api/categories`, {
      next: { revalidate: 0, tags: ['categories'] },
      signal: AbortSignal.timeout(4000)
    });

    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [
      { name: 'Data & Analytics', slug: 'data-analytics' },
      { name: 'Web Development', slug: 'web-development' },
      { name: 'Cloud Computing', slug: 'cloud-computing' }
    ];
  }
}
