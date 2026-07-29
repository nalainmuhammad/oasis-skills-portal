import { auth } from "@/auth";

export interface LessonProgress {
  lesson_id: number;
  status: 'not_started' | 'in_progress' | 'completed';
  watch_seconds: number;
}

export interface Enrollment {
  id: number;
  course_slug: string;
  course_title: string;
  course_thumbnail_url: string | null;
  status: 'active' | 'completed' | 'dropped';
  progress_percent: number;
  last_accessed_at: string;
}

export async function getMyEnrollments(): Promise<Enrollment[]> {
  const session = await auth();
  if (!session) return [];

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    // Return mock
    return [
      {
        id: 1,
        course_slug: 'intro-data-analysis',
        course_title: 'Introduction to Data Analysis',
        course_thumbnail_url: null,
        status: 'active',
        progress_percent: 45,
        last_accessed_at: new Date().toISOString()
      },
      {
        id: 2,
        course_slug: 'modern-frontend-frameworks',
        course_title: 'Modern Frontend Frameworks',
        course_thumbnail_url: null,
        status: 'completed',
        progress_percent: 100,
        last_accessed_at: new Date(Date.now() - 86400000).toISOString()
      }
    ];
  }

  try {
    const res = await fetch(`${apiUrl}/api/me/enrollments`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`
      },
      next: { tags: ['enrollments', `user:${session.user?.id}`], revalidate: 0 }
    });

    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error("Error fetching enrollments:", err);
    return [];
  }
}

export async function enrollInCourse(slug: string): Promise<boolean> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return true; // mock success

  const session = await auth();
  if (!session?.accessToken) {
    throw new Error('Not authenticated');
  }

  const res = await fetch(`${apiUrl}/api/courses/${slug}/enroll`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json'
    },
  });

  if (!res.ok) {
    // If it's 400, they might already be enrolled
    if (res.status === 400) return true;
    throw new Error('Failed to enroll');
  }

  return true;
}
