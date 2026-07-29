import Link from "next/link";
import { getCourseBySlug } from "@/lib/api/courses";
import { AlertTriangle, BookOpen, Clock, PlayCircle, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";
import { getMyEnrollments } from "@/lib/api/enrollments";
import { auth } from "@/auth";

export default async function CourseDetailPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ error?: string }>;
}) {
  try {
    const { slug } = await params;
    const resolvedSearchParams = searchParams ? await searchParams : {};
    const course = await getCourseBySlug(slug);
    
    // Check if user is already enrolled
    const session = await auth();
    let isEnrolled = false;
    
    if (session) {
      const enrollments = await getMyEnrollments().catch(() => []);
      isEnrolled = enrollments.some((e: any) => e.course_slug === slug);
    }
    
    return (
      <div className="flex flex-col min-h-screen pt-20">
        {/* Course Hero */}
        <section className="relative py-20 lg:py-32 overflow-hidden border-b border-foreground/5">
          {course.thumbnail_url ? (
            <div className="absolute inset-0 z-0">
              <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover opacity-20 blur-sm" />
              <div className="absolute inset-0 bg-gradient-to-t from-oasis-primary via-oasis-primary/80 to-transparent"></div>
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-oasis-emerald/10 via-oasis-primary to-oasis-secondary z-0"></div>
          )}
          
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-8">
                {course.category && (
                  <Link href={`/courses?category=${course.category.slug}`} className="text-oasis-emerald font-medium hover:underline mb-4 inline-block">
                    {course.category.name}
                  </Link>
                )}
                <h1 className="text-4xl lg:text-6xl font-display font-bold text-foreground mb-6 leading-tight">
                  {course.title}
                </h1>
                <p className="text-xl text-foreground/70 mb-8 max-w-3xl leading-relaxed">
                  {course.subtitle}
                </p>
                
                <div className="flex flex-wrap items-center gap-6 text-sm text-foreground/60 mb-8">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-foreground/10 text-foreground border-foreground/20 hover:bg-foreground/20 capitalize px-3 py-1">
                      {course.difficulty_level}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={18} className="text-oasis-emerald" />
                    <span>{Math.floor(course.estimated_duration_minutes / 60)}h {course.estimated_duration_minutes % 60}m</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PlayCircle size={18} className="text-oasis-gold" />
                    <span>{course.module_count} Modules</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={18} className="text-oasis-cyan" />
                    <span>Verified Certificate</span>
                  </div>
                </div>
              </div>
              
              <div className="lg:col-span-4">
                <div className="glass-card rounded-2xl p-8 border border-oasis-emerald/20 shadow-[0_0_40px_rgba(0,212,126,0.1)]">
                  <div className="text-3xl font-display font-bold text-foreground mb-2">Free</div>
                  <p className="text-sm text-foreground/60 mb-6">Start learning immediately. No credit card required.</p>
                  
                  {resolvedSearchParams.error === 'unverified' && (
                    <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs space-y-2">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <AlertTriangle size={16} /> Verification Required
                      </div>
                      <p>You must verify your email address before you can enroll in courses.</p>
                      <Link 
                        href={`/verify-email?email=${encodeURIComponent(session?.user?.email || '')}`}
                        className="inline-block font-semibold text-oasis-emerald hover:underline text-xs"
                      >
                        Verify Email Now →
                      </Link>
                    </div>
                  )}

                  {isEnrolled ? (
                    <Link href={`/learn/${course.slug}/continue`} className="inline-flex items-center justify-center w-full bg-oasis-emerald hover:bg-oasis-emeraldLight text-black font-semibold h-14 text-lg rounded-xl mb-4 shadow-[0_0_20px_rgba(0,212,126,0.3)] transition-all">
                      Continue Learning
                    </Link>
                  ) : (
                    <Link href={`/courses/${course.slug}/enroll`} className="inline-flex items-center justify-center w-full bg-oasis-emerald hover:bg-oasis-emeraldLight text-black font-semibold h-14 text-lg rounded-xl mb-4 shadow-[0_0_20px_rgba(0,212,126,0.3)] transition-all">
                      Enroll Now
                    </Link>
                  )}
                  
                  <div className="text-center text-xs text-foreground/40 flex items-center justify-center gap-1">
                    <CheckCircle2 size={14} className="text-oasis-emerald" /> 
                    {course.enrollment_count.toLocaleString()}+ learners enrolled
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Course Content Area */}
        <section className="py-20 flex-grow">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              
              {/* Main Content */}
              <div className="lg:col-span-8 space-y-16">
                
                {/* Description */}
                <div>
                  <h2 className="text-2xl font-display font-bold text-foreground mb-6 border-b border-foreground/10 pb-4">About this course</h2>
                  <div className="prose prose-invert prose-emerald max-w-none text-foreground/70">
                    <p>{course.description}</p>
                    {/* In a real app, render Markdown here */}
                  </div>
                </div>

                {/* Curriculum */}
                <div>
                  <h2 className="text-2xl font-display font-bold text-foreground mb-6 border-b border-foreground/10 pb-4">Curriculum</h2>
                  <div className="space-y-4">
                    {course.modules.length > 0 ? course.modules.map((module) => (
                      <div key={module.id} className="border border-foreground/10 rounded-xl overflow-hidden bg-foreground/5">
                        <div className="p-6">
                          <h3 className="text-lg font-bold text-foreground mb-2">Module {module.order}: {module.title}</h3>
                          <p className="text-sm text-oasis-muted mb-4">{module.description}</p>
                          
                          <div className="space-y-2 mt-4 pt-4 border-t border-foreground/5">
                            {module.lessons.map(lesson => (
                              <div key={lesson.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-foreground/5 transition-colors group cursor-pointer">
                                <div className="flex items-center gap-3">
                                  {lesson.content_type === 'video' ? <PlayCircle size={18} className="text-oasis-emerald opacity-70 group-hover:opacity-100" /> : <BookOpen size={18} className="text-oasis-gold opacity-70 group-hover:opacity-100" />}
                                  <span className="text-foreground/80 group-hover:text-foreground text-sm">{lesson.title}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  {lesson.is_preview && <Badge variant="outline" className="text-xs bg-oasis-emerald/10 text-oasis-emerald border-oasis-emerald/20">Preview</Badge>}
                                  {lesson.duration_seconds && <span className="text-xs text-foreground/40">{Math.floor(lesson.duration_seconds / 60)}:{String(lesson.duration_seconds % 60).padStart(2, '0')}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="p-8 text-center bg-foreground/5 rounded-xl border border-foreground/10">
                        <p className="text-oasis-muted">Curriculum is being updated.</p>
                      </div>
                    )}
                  </div>
                </div>
                
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  } catch (error) {
    notFound();
  }
}
