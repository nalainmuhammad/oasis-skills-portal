import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { enrollInCourse } from "@/lib/api/enrollments";

export default async function EnrollPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const { slug } = await params;
  
  if (!session) {
    redirect(`/login?callbackUrl=/courses/${slug}/enroll`);
  }

  // Prevent unverified users from enrolling — redirect to course page with error
  if (!(session.user as any)?.emailVerified) {
    redirect(`/courses/${slug}?error=unverified`);
  }

  let success = false;
  try {
    await enrollInCourse(slug);
    success = true;
  } catch (error) {
    console.error("Enrollment error:", error);
  }

  if (success) {
    redirect(`/learn/${slug}/continue`);
  } else {
    redirect(`/courses/${slug}`); // Fallback to course page on error
  }
}
