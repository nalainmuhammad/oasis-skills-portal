"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Activity, ActivityApplication } from "@/types";
import { getActivities, applyActivity, getMyApplications } from "@/lib/api/activities";
import { getProfile } from "@/lib/api/profile";
import { Button } from "@/components/ui/button";
import { HeartHandshake, Calendar, Users, CheckCircle2, AlertCircle, Search, Filter, Sparkles, X, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function OpportunitiesPage() {
  const { data: session } = useSession();
  const token = session?.accessToken || '';

  const [activities, setActivities] = useState<Activity[]>([]);
  const [myApps, setMyApps] = useState<ActivityApplication[]>([]);
  const [userCompletion, setUserCompletion] = useState<number>(25);
  const [volunteerStatus, setVolunteerStatus] = useState<string>("not_applied");

  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  const [isApplying, setIsApplying] = useState(false);
  const [modalMessage, setModalMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      const acts = await getActivities({
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        search: searchQuery || undefined
      });
      setActivities(acts);

      if (token) {
        const [apps, prof] = await Promise.all([
          getMyApplications(token),
          getProfile(token)
        ]);
        setMyApps(apps);
        if (prof) {
          setUserCompletion(prof.profile_completion_percentage);
          setVolunteerStatus(prof.volunteer_status || 'not_applied');
        }
      }
    }
    loadData();
  }, [categoryFilter, searchQuery, token]);

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity || !selectedPosition || !token) return;

    setIsApplying(true);
    setModalMessage(null);

    try {
      const newApp = await applyActivity(selectedActivity.public_id, selectedPosition, token);
      setMyApps(prev => [...prev, newApp]);
      setModalMessage({ type: 'success', text: `Application submitted successfully for ${selectedPosition}!` });
      setTimeout(() => {
        setSelectedActivity(null);
        setModalMessage(null);
      }, 1500);
    } catch (err: any) {
      setModalMessage({ type: 'error', text: err.message || 'Failed to submit application.' });
    } finally {
      setIsApplying(false);
    }
  };

  const isApplied = (actId: string) => myApps.some(app => app.activity_id === actId);
  const getAppStatus = (actId: string) => myApps.find(app => app.activity_id === actId)?.status;

  return (
    <div className="flex flex-col min-h-screen pt-24 pb-20">
      {/* Header */}
      <section className="py-12 bg-oasis-bgSecondary/30 border-b border-foreground/5">
        <div className="container mx-auto px-4 md:px-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-oasis-emerald/10 border border-oasis-emerald/20 text-oasis-emerald text-xs font-bold uppercase tracking-wider mb-3">
            <HeartHandshake size={14} /> Volunteer Programs & Opportunities
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
            Join Oasis Foundation Activities
          </h1>
          <p className="text-oasis-muted text-sm max-w-2xl">
            Explore open volunteer roles, fellowship programs, workshops, and campaigns.
            (Note: Only volunteers with 100% profile completion can apply).
          </p>
        </div>
      </section>

      {/* Main Section */}
      <section className="py-10 flex-grow">
        <div className="container mx-auto px-4 md:px-6">
          {/* Filters & Search Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 bg-foreground/5 p-4 rounded-2xl border border-foreground/10">
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
              {['all', 'Volunteer Opportunity', 'Program', 'Event', 'Workshop', 'Campaign'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    categoryFilter === cat
                      ? "bg-oasis-emerald text-black shadow-md"
                      : "bg-foreground/5 text-foreground/70 hover:text-foreground hover:bg-foreground/10"
                  }`}
                >
                  {cat === 'all' ? 'All Opportunities' : cat}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40" size={16} />
              <input
                type="text"
                placeholder="Search opportunities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-foreground/5 border border-foreground/10 rounded-xl py-2 pl-9 pr-4 text-xs text-foreground focus:outline-none focus:border-oasis-emerald/50"
              />
            </div>
          </div>

          {/* Activity Cards Grid */}
          {activities.length === 0 ? (
            <div className="text-center py-20 bg-foreground/5 rounded-3xl border border-foreground/10">
              <HeartHandshake size={56} className="text-foreground/20 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-1">No Opportunities Found</h3>
              <p className="text-oasis-muted text-sm">Check back later or try adjusting your search filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activities.map(act => {
                const applied = isApplied(act.public_id);
                const status = getAppStatus(act.public_id);

                return (
                  <div key={act.public_id} className="glass-card rounded-3xl p-6 border border-foreground/10 hover:border-oasis-emerald/40 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-3 py-1 rounded-full bg-oasis-emerald/10 border border-oasis-emerald/20 text-oasis-emerald text-xs font-bold uppercase tracking-wider">
                          {act.category}
                        </span>
                        <span className="text-xs text-oasis-muted font-semibold flex items-center gap-1">
                          <Users size={14} /> {act.remaining_seats} seats left
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-1">{act.title}</h3>
                      <p className="text-xs text-oasis-muted line-clamp-3 mb-4">{act.description}</p>

                      {/* Available Positions */}
                      <div className="mb-4">
                        <div className="text-xs font-semibold text-foreground/70 mb-1.5">Available Positions:</div>
                        <div className="flex flex-wrap gap-1.5">
                          {act.available_positions.map(pos => (
                            <span key={pos} className="px-2.5 py-0.5 rounded-lg bg-foreground/5 border border-foreground/10 text-foreground/80 text-[11px]">
                              {pos}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Dates & Deadline */}
                      <div className="text-xs text-oasis-muted space-y-1 pt-3 border-t border-foreground/10 mb-6">
                        <div className="flex items-center justify-between">
                          <span>Deadline:</span>
                          <span className="font-semibold text-amber-400">{act.deadline}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Program Dates:</span>
                          <span className="font-medium text-foreground">{act.start_date} to {act.end_date}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      {applied ? (
                        <div className="w-full py-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold text-xs text-center flex items-center justify-center gap-2">
                          <CheckCircle2 size={16} /> Applied ({status?.replace('_', ' ')})
                        </div>
                      ) : (
                        <Button
                          onClick={() => {
                            setSelectedActivity(act);
                            setSelectedPosition(act.available_positions[0] || 'Volunteer');
                            setModalMessage(null);
                          }}
                          className="w-full bg-oasis-emerald hover:bg-oasis-emeraldLight text-black font-semibold rounded-xl py-3 text-xs shadow-md"
                        >
                          View Details & Apply <ArrowRight className="ml-1" size={14} />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Application & Details Modal */}
      {selectedActivity && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card bg-oasis-bgSecondary rounded-3xl max-w-xl w-full p-6 md:p-8 border border-foreground/20 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setSelectedActivity(null)}
              className="absolute right-5 top-5 p-2 rounded-full hover:bg-foreground/10 text-foreground/60 hover:text-foreground"
            >
              <X size={20} />
            </button>

            <div className="mb-6">
              <span className="px-3 py-1 rounded-full bg-oasis-emerald/10 text-oasis-emerald text-xs font-bold uppercase tracking-wider">
                {selectedActivity.category}
              </span>
              <h2 className="text-2xl font-bold text-foreground mt-2">{selectedActivity.title}</h2>
              <p className="text-xs text-oasis-muted mt-1">Deadline: {selectedActivity.deadline}</p>
            </div>

            <div className="space-y-4 mb-6 text-sm text-foreground/80">
              <p>{selectedActivity.description}</p>
              
              <div className="p-4 rounded-2xl bg-foreground/5 border border-foreground/10 space-y-2 text-xs">
                <div><strong>Eligibility Criteria:</strong> {selectedActivity.eligibility_criteria}</div>
                <div><strong>Required Skills:</strong> {selectedActivity.required_skills.join(', ') || 'None specified'}</div>
              </div>
            </div>

            {/* Check Profile Completion & Volunteer Verification Status */}
            {userCompletion < 100 ? (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-3">
                <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
                  <AlertCircle size={18} /> 100% Profile Completion Required
                </div>
                <p>
                  Only volunteers with 100% completed profiles can apply for activities. Your profile is currently <strong>{userCompletion}%</strong> complete.
                </p>
                <Link
                  href="/dashboard/profile"
                  className="inline-block px-4 py-2 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition-colors"
                >
                  Complete Profile Now
                </Link>
              </div>
            ) : volunteerStatus !== 'approved' ? (
              <div className="p-4 rounded-2xl bg-oasis-emerald/10 border border-oasis-emerald/30 text-oasis-emerald text-xs space-y-3">
                <div className="flex items-center gap-2 font-bold text-oasis-emerald text-sm">
                  <Sparkles size={18} /> Verified Volunteer Status Required
                </div>
                <p>
                  Your profile is 100% complete! To apply for specific volunteer opportunities, please submit your <strong>Volunteer Verification Application</strong> for admin review on your profile dashboard.
                </p>
                <Link
                  href="/dashboard/profile"
                  className="inline-block px-4 py-2 bg-oasis-emerald text-black font-bold rounded-xl hover:bg-oasis-emeraldLight transition-colors"
                >
                  Apply for Verification on Profile
                </Link>
              </div>
            ) : (
              <form onSubmit={handleApplySubmit} className="space-y-4 pt-4 border-t border-foreground/10">
                {modalMessage && (
                  <div className={`p-3 rounded-xl text-xs font-semibold ${
                    modalMessage.type === 'success' ? 'bg-oasis-emerald/20 text-oasis-emerald' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {modalMessage.text}
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-foreground/70 uppercase">Select Role / Position *</label>
                  <select
                    value={selectedPosition}
                    onChange={(e) => setSelectedPosition(e.target.value)}
                    className="w-full mt-1.5 bg-foreground/5 border border-foreground/10 rounded-xl p-3 text-sm text-foreground focus:outline-none focus:border-oasis-emerald/50"
                  >
                    {selectedActivity.available_positions.map(pos => (
                      <option key={pos} value={pos} className="bg-oasis-bgSecondary">{pos}</option>
                    ))}
                  </select>
                </div>

                <Button
                  type="submit"
                  disabled={isApplying}
                  className="w-full bg-oasis-emerald hover:bg-oasis-emeraldLight text-black font-semibold py-3 rounded-xl shadow-lg shadow-oasis-emerald/20 disabled:opacity-50"
                >
                  {isApplying ? "Submitting Application..." : "Submit Application"}
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
