import { auth } from "@/auth";
import { getProfile } from "@/lib/api/profile";
import { getMyApplications } from "@/lib/api/activities";
import { getMyCertificates } from "@/lib/api/certificates";
import { getMyEnrollments } from "@/lib/api/enrollments";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { 
  PlayCircle, Trophy, Sparkles, CheckCircle2, ShieldCheck, 
  HeartHandshake, BookOpen, AlertCircle, ArrowRight, User, Award, CreditCard 
} from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  const token = session?.accessToken || '';

  const [profile, applications, certificates, enrollments] = await Promise.all([
    getProfile(token),
    getMyApplications(token),
    getMyCertificates(token),
    getMyEnrollments()
  ]);

  const completion = profile?.profile_completion_percentage || 25;
  const isComplete = completion === 100;
  const activeCourses = enrollments.filter(e => e.status !== 'completed');

  return (
    <div className="flex flex-col min-h-screen pt-24 pb-20">
      {/* Header Banner */}
      <section className="py-10 bg-oasis-bgSecondary/30 border-b border-foreground/5">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full bg-oasis-emerald/10 border border-oasis-emerald/20 text-oasis-emerald text-xs font-bold uppercase tracking-wider">
                  {profile?.user_type === 'volunteer' ? 'Oasis Volunteer' : 'Oasis Member'}
                </span>
                {profile?.registration_number && (
                  <span className="px-3 py-1 rounded-full bg-foreground/5 border border-foreground/10 text-foreground/70 font-mono text-xs font-bold">
                    {profile.registration_number}
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                Welcome back, {session?.user?.name || 'Member'}!
              </h1>
              <p className="text-oasis-muted text-sm mt-1">
                Manage your volunteer activities, progressive profile, ID card, and learning courses.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/profile"
                className="px-5 py-2.5 rounded-xl bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 text-foreground text-sm font-semibold transition-colors"
              >
                Edit Profile
              </Link>
              {isComplete ? (
                <Link
                  href="/dashboard/id-card"
                  className="px-5 py-2.5 rounded-xl bg-oasis-emerald hover:bg-oasis-emeraldLight text-black text-sm font-semibold transition-all shadow-lg shadow-oasis-emerald/20 flex items-center gap-2"
                >
                  <CreditCard size={16} /> View ID Card
                </Link>
              ) : (
                <Link
                  href="/dashboard/profile"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold transition-all flex items-center gap-2"
                >
                  <AlertCircle size={16} /> Complete Profile ({completion}%)
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-10 flex-grow">
        <div className="container mx-auto px-4 md:px-6 space-y-12">
          
          {/* PROFILE COMPLETION WIDGET */}
          <div className="glass-card rounded-3xl p-6 md:p-8 border border-foreground/10 relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 flex-grow">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-oasis-emerald" size={20} />
                  <h2 className="text-xl font-bold text-foreground">Profile Completion System</h2>
                </div>
                <p className="text-sm text-oasis-muted max-w-xl">
                  {isComplete 
                    ? "Your profile is 100% complete! Your digital ID card is unlocked, and you are fully eligible to apply for all volunteer opportunities."
                    : "Complete all remaining sections to unlock your verified Digital ID Card and apply for volunteer activities."}
                </p>
                <div className="pt-2 flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-lg bg-oasis-emerald/20 text-oasis-emerald text-xs font-semibold">
                    ✓ Personal Info (25%)
                  </span>
                  <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${profile?.is_educational_complete ? 'bg-oasis-emerald/20 text-oasis-emerald' : 'bg-foreground/5 text-foreground/40'}`}>
                    {profile?.is_educational_complete ? '✓ Educational Info (50%)' : '○ Educational Info (50%)'}
                  </span>
                  <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${profile?.is_address_complete ? 'bg-oasis-emerald/20 text-oasis-emerald' : 'bg-foreground/5 text-foreground/40'}`}>
                    {profile?.is_address_complete ? '✓ Address Info (75%)' : '○ Address Info (75%)'}
                  </span>
                  <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${profile?.is_emergency_social_complete ? 'bg-oasis-emerald/20 text-oasis-emerald' : 'bg-foreground/5 text-foreground/40'}`}>
                    {profile?.is_emergency_social_complete ? '✓ Emergency & Social (100%)' : '○ Emergency & Social (100%)'}
                  </span>
                </div>
              </div>

              <div className="shrink-0 w-full md:w-56 text-center bg-foreground/5 p-4 rounded-2xl border border-foreground/10">
                <div className="text-2xl font-bold text-oasis-emerald mb-1">{completion}%</div>
                <Progress value={completion} className="h-2.5 mb-3 bg-foreground/10" />
                <Link
                  href="/dashboard/profile"
                  className="inline-flex items-center justify-center w-full py-2 px-3 rounded-xl bg-oasis-emerald/20 text-oasis-emerald hover:bg-oasis-emerald/30 font-semibold text-xs transition-colors"
                >
                  {isComplete ? "Review Profile" : "Continue Completion"} <ArrowRight className="ml-1" size={14} />
                </Link>
              </div>
            </div>
          </div>

          {/* MY ACTIVITY APPLICATIONS */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
                <HeartHandshake className="text-oasis-emerald" /> Volunteer Opportunities & Applications
              </h2>
              <Link href="/opportunities" className="text-oasis-emerald hover:underline text-sm font-medium flex items-center gap-1">
                Browse Opportunities <ArrowRight size={14} />
              </Link>
            </div>

            {applications.length === 0 ? (
              <div className="text-center py-12 bg-foreground/5 rounded-2xl border border-foreground/10 p-6">
                <HeartHandshake size={44} className="text-foreground/20 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-foreground mb-1">No Activity Applications Yet</h3>
                <p className="text-oasis-muted text-sm mb-4">Explore open volunteer opportunities, events, and workshops.</p>
                <Link href="/opportunities" className="inline-flex px-5 py-2.5 rounded-xl bg-oasis-emerald text-black font-semibold text-sm hover:bg-oasis-emeraldLight transition-colors">
                  Explore Volunteer Opportunities
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {applications.map(app => (
                  <div key={app.id} className="glass-card rounded-2xl p-5 border border-foreground/10 hover:border-oasis-emerald/30 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        app.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        app.status === 'rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        app.status === 'waiting_list' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                        'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {app.status.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] text-foreground/40 font-mono">
                        {new Date(app.applied_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-foreground line-clamp-1 mb-1">{app.activity_title}</h3>
                    <p className="text-xs text-oasis-muted mb-4">Applied Position: <strong className="text-foreground">{app.applied_position}</strong></p>

                    {app.admin_notes && (
                      <p className="text-xs p-2.5 rounded-xl bg-foreground/5 text-foreground/70 italic mb-3">
                        Note: {app.admin_notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MY CERTIFICATES */}
          {certificates.length > 0 && (
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-6 flex items-center gap-2">
                <Award className="text-oasis-gold" /> My Earned Certificates ({certificates.length})
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {certificates.map(cert => (
                  <div key={cert.verification_uuid} className="glass-card rounded-2xl p-5 border border-oasis-gold/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-oasis-gold bg-oasis-gold/10 px-2.5 py-0.5 rounded-full">
                        {cert.cert_type}
                      </span>
                      <span className="text-xs text-foreground/50 font-mono">{cert.certificate_number}</span>
                    </div>

                    <h3 className="text-base font-bold text-foreground line-clamp-1 mb-1">{cert.title_snapshot}</h3>
                    <p className="text-xs text-oasis-muted mb-4">Issued to {cert.recipient_name_snapshot}</p>

                    <div className="flex items-center justify-between pt-2 border-t border-foreground/10 text-xs font-semibold">
                      <a href={cert.verification_url} target="_blank" rel="noopener noreferrer" className="text-oasis-gold hover:underline">
                        Verify QR
                      </a>
                      <a href={`/api/certificates/${cert.verification_uuid}/download`} className="text-foreground/70 hover:text-foreground">
                        Download PDF
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* COURSES (INTEGRATED LEARNING PORTAL) */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
                <PlayCircle className="text-oasis-emerald" /> Enrolled Learning Courses
              </h2>
              <Link href="/courses" className="text-oasis-emerald hover:underline text-sm font-medium flex items-center gap-1">
                Explore Courses <ArrowRight size={14} />
              </Link>
            </div>

            {activeCourses.length === 0 ? (
              <div className="text-center py-12 bg-foreground/5 rounded-2xl border border-foreground/10 p-6">
                <BookOpen size={44} className="text-foreground/20 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-foreground mb-1">No Active Course Enrollments</h3>
                <p className="text-oasis-muted text-sm mb-4">Enhance your skills with our free learning catalog.</p>
                <Link href="/courses" className="inline-flex px-5 py-2.5 rounded-xl bg-oasis-emerald text-black font-semibold text-sm hover:bg-oasis-emeraldLight transition-colors">
                  Explore Learning Portal
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {activeCourses.map(enrollment => (
                  <div key={enrollment.id} className="glass-card rounded-2xl p-5 border border-foreground/10 hover:border-oasis-emerald/30 transition-all">
                    <h3 className="text-base font-bold text-foreground line-clamp-1 mb-2">{enrollment.course_title}</h3>
                    <div className="mt-4 mb-2 flex items-center justify-between text-xs">
                      <span className="text-oasis-emerald font-semibold">{enrollment.progress_percent}% Complete</span>
                    </div>
                    <Progress value={enrollment.progress_percent} className="h-2 mb-4 bg-foreground/10" />
                    <Link href={`/learn/${enrollment.course_slug}/continue`} className="flex items-center justify-center w-full py-2.5 rounded-xl bg-foreground/5 text-foreground hover:bg-foreground/10 transition-colors font-medium text-xs">
                      Continue Learning
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </section>
    </div>
  );
}
