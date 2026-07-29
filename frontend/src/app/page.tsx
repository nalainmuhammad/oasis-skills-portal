export const dynamic = "force-dynamic";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowRight, ShieldCheck, Users, PlayCircle, ChevronRight } from "lucide-react";
import { getCourses } from "@/lib/api/courses";
import { CourseCard } from "@/components/courses/course-card";
import { ParticleBackground } from "@/components/ui/particle-background";

export default async function Home() {
  const { items: courses } = await getCourses();
  return (
    <div className="flex flex-col min-h-screen bg-oasis-bg">
      {/* Hero Section */}
      <section className="relative pt-32 pb-32 md:pt-48 md:pb-40 overflow-hidden flex flex-col justify-center min-h-[90vh]">
        {/* Particle Canvas Animation */}
        <ParticleBackground />

        {/* Subtle glowing orbs behind text */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-oasis-emerald/15 dark:bg-oasis-emerald/5 blur-[150px] -z-10 pointer-events-none"></div>
        
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            <div data-animate="fade-up" className="inline-flex items-center tracking-[0.2em] text-xs font-semibold text-oasis-emerald uppercase mb-4">
              Igniting the Next Generation
            </div>

            <h1 data-animate="fade-up" className="text-6xl md:text-8xl lg:text-9xl font-display font-extrabold tracking-tight leading-[1.1]">
              <span className="text-foreground block">Empower.</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-oasis-emerald to-oasis-gold block">Lead. Serve.</span>
            </h1>

            <p data-animate="fade-up" className="text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto font-light leading-relaxed mt-8 mb-12">
              Oasis Foundation gives you the ultimate platform to shape the programs and conversations that affect your life. Step up, take charge, and transform your community.
            </p>

            <div data-animate="scale-in" className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-12">
              <Link href="/register" className="inline-flex items-center justify-center w-full sm:w-auto h-14 px-10 bg-oasis-emerald hover:bg-oasis-emeraldLight text-black font-semibold rounded-full shadow-[0_0_30px_rgba(0,212,126,0.3)] transition-all hover:scale-105">
                JOIN THE COMMUNITY <ChevronRight size={18} className="ml-2" />
              </Link>
              <Link href="/courses" className="inline-flex items-center justify-center w-full sm:w-auto h-14 px-10 bg-transparent hover:bg-foreground/5 text-foreground border border-foreground/20 hover:border-foreground/40 font-semibold rounded-full transition-all">
                DISCOVER COURSES
              </Link>
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-foreground/30 text-xs font-medium tracking-[0.2em] uppercase">
          Scroll
          <div className="w-px h-12 bg-gradient-to-b from-white/30 to-transparent"></div>
        </div>
      </section>

      {/* Stats Section with Scroll Animation */}
      <section className="py-12 border-y border-foreground/5 bg-oasis-bgSecondary/30" data-animate="fade-up">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/5" data-grid-animate>
            <div className="text-center px-4">
              <div className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">50+</div>
              <div className="text-sm font-medium text-oasis-muted uppercase tracking-wider">Free Courses</div>
            </div>
            <div className="text-center px-4">
              <div className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">10k+</div>
              <div className="text-sm font-medium text-oasis-muted uppercase tracking-wider">Active Learners</div>
            </div>
            <div className="text-center px-4">
              <div className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">5k+</div>
              <div className="text-sm font-medium text-oasis-muted uppercase tracking-wider">Certificates Issued</div>
            </div>
            <div className="text-center px-4">
              <div className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">100%</div>
              <div className="text-sm font-medium text-oasis-muted uppercase tracking-wider">Free Forever</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses Section with Cascading Scroll Animation */}
      <section className="py-24 bg-oasis-bg relative">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-end justify-between mb-12" data-animate="fade-up">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">Featured Courses</h2>
              <p className="text-oasis-muted">Start learning today with our most popular programs.</p>
            </div>
            <Link 
              href="/courses"
              className={buttonVariants({ variant: "ghost", className: "hidden md:flex text-oasis-emerald hover:text-oasis-emeraldLight hover:bg-oasis-emerald/10" })}
            >
              View all courses <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-grid-animate>
            {courses.slice(0, 3).map((course) => (
              <CourseCard key={course.slug} course={course} />
            ))}
          </div>
          
          <div className="mt-8 text-center md:hidden" data-animate="fade-up">
            <Link 
              href="/courses"
              className={buttonVariants({ variant: "outline", className: "w-full bg-foreground/5 text-foreground border-foreground/20" })}
            >
              View all courses
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section with Scroll Animation */}
      <section className="py-24 bg-oasis-bgSecondary relative overflow-hidden">
        <div className="absolute top-[30%] left-[20%] w-[30%] h-[40%] rounded-full bg-oasis-emerald/5 blur-[100px] pointer-events-none"></div>
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16" data-animate="fade-up">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">Enterprise-Grade Learning</h2>
            <p className="text-oasis-muted text-lg">Everything you need to master new skills and prove your knowledge.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8" data-grid-animate>
            <Card className="glass-card border-none">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-oasis-emerald/10 flex items-center justify-center mb-4">
                  <PlayCircle className="text-oasis-emerald" size={24} />
                </div>
                <h3 className="text-xl font-display font-bold text-foreground">HD Video Lessons</h3>
              </CardHeader>
              <CardContent>
                <p className="text-oasis-muted">High-quality, low-latency video streaming powered by Mux. Learn anywhere, anytime, on any device without buffering.</p>
              </CardContent>
            </Card>
            
            <Card className="glass-card border-none">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-oasis-gold/10 flex items-center justify-center mb-4">
                  <ShieldCheck className="text-oasis-gold" size={24} />
                </div>
                <h3 className="text-xl font-display font-bold text-foreground">Verified Certificates</h3>
              </CardHeader>
              <CardContent>
                <p className="text-oasis-muted">Earn unique, cryptographically verified PDF certificates. Share a public verification link directly on your LinkedIn profile.</p>
              </CardContent>
            </Card>

            <Card className="glass-card border-none">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-oasis-cyan/10 flex items-center justify-center mb-4">
                  <Users className="text-oasis-cyan" size={24} />
                </div>
                <h3 className="text-xl font-display font-bold text-foreground">100% Free</h3>
              </CardHeader>
              <CardContent>
                <p className="text-oasis-muted">No subscriptions, no hidden fees, no paywalls. The Oasis Foundation is committed to making high-quality education accessible to all.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section with Scale-In Scroll Trigger */}
      <section className="py-24 bg-oasis-bg relative">
        <div className="container mx-auto px-4 md:px-6">
          <div className="glass-card rounded-[2rem] p-8 md:p-16 text-center relative overflow-hidden border border-oasis-emerald/20" data-animate="scale-in">
            <div className="absolute inset-0 bg-gradient-to-br from-oasis-emerald/10 to-transparent -z-10"></div>
            
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-6">Ready to start your journey?</h2>
            <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto mb-10">
              Join thousands of learners and take the next step in your career today.
            </p>
            <Link href="/register" className="inline-flex items-center justify-center h-14 px-10 text-base bg-oasis-emerald hover:bg-oasis-emeraldLight text-black border-none rounded-full font-semibold transition-colors">
              Create Your Free Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
