"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Activity } from "@/types";
import { getActivities, createActivity } from "@/lib/api/activities";
import { Button } from "@/components/ui/button";
import { HeartHandshake, Plus, Calendar, Users, CheckCircle2, X } from "lucide-react";

export default function AdminActivitiesPage() {
  const { data: session } = useSession();
  const token = session?.accessToken || '';

  const [activities, setActivities] = useState<Activity[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Volunteer Opportunity");
  const [positions, setPositions] = useState("Graphic Designer, Research Volunteer, Event Coordinator");
  const [eligibility, setEligibility] = useState("Profile Completion = 100%");
  const [skills, setSkills] = useState("Research, Communication, Graphic Design");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [totalSeats, setTotalSeats] = useState(15);

  useEffect(() => {
    async function load() {
      const data = await getActivities();
      setActivities(data);
    }
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsSubmitting(true);
    setError("");

    try {
      const posArray = positions.split(",").map(p => p.trim()).filter(Boolean);
      const skillArray = skills.split(",").map(s => s.trim()).filter(Boolean);

      const created = await createActivity(
        {
          title,
          description,
          category,
          available_positions: posArray,
          eligibility_criteria: eligibility,
          required_skills: skillArray,
          start_date: startDate,
          end_date: endDate,
          deadline,
          total_seats: totalSeats,
          status: 'open'
        },
        token
      );

      setActivities(prev => [created, ...prev]);
      setShowCreateModal(false);
    } catch (err: any) {
      setError(err.message || "Failed to create activity.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Activity & Program Management
          </h1>
          <p className="text-oasis-muted text-sm mt-1">
            Create and manage Oasis programs, events, workshops, campaigns, and volunteer opportunities.
          </p>
        </div>

        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-oasis-emerald hover:bg-oasis-emeraldLight text-black font-semibold rounded-xl px-5 py-2.5 shadow-lg shadow-oasis-emerald/20 flex items-center gap-2"
        >
          <Plus size={18} /> Create New Activity
        </Button>
      </div>

      {/* Activities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activities.map(act => (
          <div key={act.public_id} className="glass-card rounded-3xl p-6 border border-foreground/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-3 py-1 rounded-full bg-oasis-emerald/10 text-oasis-emerald text-xs font-bold uppercase tracking-wider">
                  {act.category}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase">
                  {act.status}
                </span>
              </div>

              <h3 className="text-xl font-bold text-foreground mb-2">{act.title}</h3>
              <p className="text-xs text-oasis-muted line-clamp-3 mb-4">{act.description}</p>

              <div className="space-y-2 text-xs text-foreground/80 border-t border-foreground/10 pt-3">
                <div><strong>Seats:</strong> {act.remaining_seats} / {act.total_seats} remaining</div>
                <div><strong>Deadline:</strong> {act.deadline}</div>
                <div><strong>Positions:</strong> {act.available_positions.join(", ")}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Activity Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card bg-oasis-bgSecondary rounded-3xl max-w-2xl w-full p-6 md:p-8 border border-foreground/20 max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute right-5 top-5 p-2 rounded-full hover:bg-foreground/10 text-foreground/60"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-bold text-foreground mb-4">Create Activity / Program</h2>

            <form onSubmit={handleCreate} className="space-y-4">
              {error && <div className="p-3 bg-red-500/20 text-red-400 rounded-xl text-xs">{error}</div>}

              <div>
                <label className="text-xs font-bold uppercase text-foreground/70">Activity Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Summer Fellowship Program 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-oasis-emerald/50"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-foreground/70">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-oasis-emerald/50"
                >
                  <option value="Program" className="bg-oasis-bgSecondary">Program</option>
                  <option value="Event" className="bg-oasis-bgSecondary">Event</option>
                  <option value="Workshop" className="bg-oasis-bgSecondary">Workshop</option>
                  <option value="Campaign" className="bg-oasis-bgSecondary">Campaign</option>
                  <option value="Volunteer Opportunity" className="bg-oasis-bgSecondary">Volunteer Opportunity</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-foreground/70">Description *</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-oasis-emerald/50 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-foreground/70">Available Positions (Comma separated)</label>
                <input
                  type="text"
                  value={positions}
                  onChange={(e) => setPositions(e.target.value)}
                  className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-oasis-emerald/50"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-foreground/70">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-oasis-emerald/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-foreground/70">End Date *</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-oasis-emerald/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-foreground/70">Deadline *</label>
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-oasis-emerald/50"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-oasis-emerald text-black font-bold py-3 rounded-xl shadow-lg mt-4"
              >
                {isSubmitting ? "Creating..." : "Publish Activity"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
