import { notFound } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";
import { getCourseBySlug } from "@/lib/api/courses";
import { BrainCircuit, PlayCircle, BookOpen, CheckCircle2, ArrowLeft } from "lucide-react";
import { VideoPlayer } from "@/components/player/video-player";
import { ClientCompletionButton } from "./client-completion-button";
import ReactMarkdown from 'react-markdown';
import { TutorChat } from "@/components/chat/tutor-chat";

export default async function LessonPage({ params }: { params: Promise<{ slug: string, lessonId: string }> }) {
  const session = await auth();
  if (!session) {
    // Handled by middleware but double check
    return null;
  }

  const { slug, lessonId } = await params;
  const course = await getCourseBySlug(slug).catch(() => null);
  if (!course) notFound();

  // Find the current lesson from the course modules
  let currentLesson = null;
  let currentModule = null;
  let nextLesson = null;
  
  let found = false;
  
  if (lessonId === 'continue') {
    // Just pick the first lesson for now if "continue" is passed
    if (course.modules.length > 0 && course.modules[0].lessons.length > 0) {
      currentLesson = course.modules[0].lessons[0];
      currentModule = course.modules[0];
    }
  } else {
    for (const module of course.modules) {
      for (let i = 0; i < module.lessons.length; i++) {
        const lesson = module.lessons[i];
        if (found) {
          nextLesson = lesson;
          break;
        }
        if (lesson.id.toString() === lessonId) {
          currentLesson = lesson;
          currentModule = module;
          found = true;
        }
      }
      if (nextLesson) break;
    }
  }

  if (!currentLesson) notFound();

  return (
    <div className="flex flex-col h-screen overflow-hidden pt-16">
      <header className="h-14 border-b border-foreground/5 bg-oasis-bg flex items-center px-4 flex-shrink-0 z-10">
        <Link href="/dashboard" className="text-foreground/60 hover:text-foreground transition-colors flex items-center gap-2 mr-6 text-sm">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <div className="h-4 w-px bg-foreground/10 mr-6"></div>
        <h1 className="text-foreground font-medium text-sm truncate">{course.title}</h1>
      </header>
      
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Main Content Area */}
        <main className="flex-1 bg-black overflow-y-auto relative">
          {currentLesson.content_type === 'video' ? (
            <div className="w-full aspect-video max-h-[85vh] bg-black">
              {/* Mock playback ID for now, in reality fetch from lesson details */}
              <VideoPlayer 
                playbackId="DS00Spx1CV902MCtPj5WknGlR102V5HFkDe" 
                lessonId={currentLesson.id}
                title={currentLesson.title} 
              />
            </div>
          ) : (
            <div className="max-w-4xl mx-auto py-12 px-8">
              <h1 className="text-3xl font-display font-bold text-foreground mb-8">{currentLesson.title}</h1>
              <div className="prose prose-invert prose-emerald max-w-none prose-headings:font-display prose-a:text-oasis-emerald hover:prose-a:text-oasis-gold transition-colors">
                {currentLesson.body ? (
                  <ReactMarkdown>{currentLesson.body}</ReactMarkdown>
                ) : (
                  <p className="text-foreground/40 italic">No content provided for this lesson.</p>
                )}
              </div>
            </div>
          )}

          <div className="max-w-6xl mx-auto p-6 md:p-8 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">{currentLesson.title}</h2>
              {currentModule && <p className="text-foreground/60 text-sm">Module {currentModule.order}: {currentModule.title}</p>}
            </div>
            
            <form action={async () => {
              "use server";
              const session = await auth();
              if (!session) return;
              const apiUrl = process.env.NEXT_PUBLIC_API_URL;
              let courseCompleted = false;
              let verificationUuid: string | null = null;
              if (apiUrl) {
                const res = await fetch(`${apiUrl}/api/lessons/${currentLesson.id}/complete`, {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${session.accessToken}` }
                });
                if (res.ok) {
                  const data = await res.json();
                  courseCompleted = data.course_completed;
                  verificationUuid = data.verification_uuid;
                }
                const { revalidateTag } = await import('next/cache');
                // @ts-ignore
                revalidateTag('enrollments');
              }
              const { redirect } = await import('next/navigation');
              if (courseCompleted && verificationUuid) {
                redirect(`/verify/${verificationUuid}`);
              } else if (nextLesson) {
                redirect(`/learn/${course.slug}/${nextLesson.id}`);
              } else {
                redirect('/dashboard');
              }
            }}>
              <ClientCompletionButton isVideo={currentLesson.content_type === 'video'} />
            </form>
          </div>
        </main>

        {/* Sidebar Curriculum */}
        <aside className="w-80 border-l border-foreground/5 bg-oasis-bgSecondary/50 flex-shrink-0 flex flex-col h-full hidden lg:flex">
          <div className="p-4 border-b border-foreground/5">
            <h2 className="font-semibold text-foreground">Course Curriculum</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {course.modules.map(module => (
              <div key={module.id} className="space-y-2">
                <h3 className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-3">Module {module.order}: {module.title}</h3>
                
                <div className="space-y-1">
                  {module.lessons.map(lesson => {
                    const isActive = lesson.id === currentLesson?.id;
                    const isCompleted = false; // Mock completion
                    
                    return (
                      <Link 
                        key={lesson.id} 
                        href={`/learn/${course.slug}/${lesson.id}`}
                        className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${isActive ? 'bg-oasis-emerald/10 border border-oasis-emerald/20' : 'hover:bg-foreground/5 border border-transparent'}`}
                      >
                        <div className="mt-0.5">
                          {isCompleted ? (
                            <CheckCircle2 size={16} className="text-oasis-emerald" />
                          ) : (
                            lesson.content_type === 'video' ? <PlayCircle size={16} className={isActive ? 'text-oasis-emerald' : 'text-foreground/40'} /> 
                            : lesson.content_type === 'quiz' ? <BrainCircuit size={16} className={isActive ? 'text-oasis-emerald' : 'text-foreground/40'} /> 
                            : <BookOpen size={16} className={isActive ? 'text-oasis-emerald' : 'text-foreground/40'} />
                          )}
                        </div>
                        <div>
                          <p className={`text-sm ${isActive ? 'text-foreground font-medium' : 'text-foreground/70'}`}>{lesson.title}</p>
                          {lesson.duration_seconds && (
                            <p className="text-xs text-foreground/40 mt-1">{Math.floor(lesson.duration_seconds / 60)}:{String(lesson.duration_seconds % 60).padStart(2, '0')}</p>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
      <TutorChat 
        courseTitle={course.title}
        lessonTitle={currentLesson.title}
        lessonContent={currentLesson.body}
      />
    </div>
  );
}
