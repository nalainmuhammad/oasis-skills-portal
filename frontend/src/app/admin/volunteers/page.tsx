"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { getVolunteersFiltered, approveVolunteer, rejectVolunteer } from "@/lib/api/admin";
import { Search, Filter, CheckCircle2, AlertCircle, Eye, ShieldCheck, UserCheck, XCircle, Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VolunteerDirectoryPage() {
  const { data: session } = useSession();
  const token = session?.accessToken || '';

  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters state
  const [userType, setUserType] = useState<string>("all");
  const [volunteerStatus, setVolunteerStatus] = useState<string>("all");
  const [regStatus, setRegStatus] = useState<string>("all");
  const [profileCompletion, setProfileCompletion] = useState<string>("all");
  const [gender, setGender] = useState<string>("all");
  const [institution, setInstitution] = useState<string>("all");
  const [city, setCity] = useState<string>("all");
  const [position, setPosition] = useState<string>("all");
  const [participation, setParticipation] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  const [selectedVolunteer, setSelectedVolunteer] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const loadVolunteers = async () => {
    if (!token) return;
    setIsLoading(true);
    const data = await getVolunteersFiltered(
      {
        user_type: userType,
        volunteer_status: volunteerStatus,
        registration_status: regStatus,
        profile_completion: profileCompletion,
        gender,
        institution,
        city,
        position,
        participation,
        search
      },
      token
    );
    setVolunteers(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadVolunteers();
  }, [token, userType, volunteerStatus, regStatus, profileCompletion, gender, institution, city, position, participation, search]);

  const handleApprove = async (publicId: string, name: string) => {
    if (!token) return;
    setIsProcessing(publicId);
    setActionMessage(null);
    try {
      const res = await approveVolunteer(publicId, token);
      setActionMessage({ type: 'success', text: res.message || `Approved ${name} as Verified Volunteer.` });
      await loadVolunteers();
      if (selectedVolunteer?.public_id === publicId) {
        setSelectedVolunteer((prev: any) => prev ? { ...prev, volunteer_status: 'approved', user_type: 'volunteer' } : null);
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to approve volunteer.' });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReject = async (publicId: string, name: string) => {
    if (!token) return;
    setIsProcessing(publicId);
    setActionMessage(null);
    try {
      const res = await rejectVolunteer(publicId, token);
      setActionMessage({ type: 'success', text: res.message || `Rejected verification request for ${name}.` });
      await loadVolunteers();
      if (selectedVolunteer?.public_id === publicId) {
        setSelectedVolunteer((prev: any) => prev ? { ...prev, volunteer_status: 'rejected' } : null);
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to reject volunteer application.' });
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Volunteer Verification & Directory Portal
          </h1>
          <p className="text-oasis-muted text-sm mt-1">
            Review 100% profile submissions, approve pending volunteer requests, and track active volunteers.
          </p>
        </div>
      </div>

      {actionMessage && (
        <div className={`p-4 rounded-2xl mb-6 font-medium text-sm border ${
          actionMessage.type === 'success' ? 'bg-oasis-emerald/10 border-oasis-emerald/30 text-oasis-emerald' : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {actionMessage.text}
        </div>
      )}

      {/* FILTER DRAWER / CONTROLS */}
      <div className="glass-card rounded-3xl p-6 border border-foreground/10 mb-8 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-oasis-emerald uppercase tracking-wider mb-2">
          <Filter size={16} /> Filter Volunteer Applicants
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Volunteer Status Filter */}
          <div>
            <label className="text-xs font-semibold text-foreground/70">Volunteer Verification Status</label>
            <select
              value={volunteerStatus}
              onChange={(e) => setVolunteerStatus(e.target.value)}
              className="w-full mt-1 bg-foreground/5 border border-oasis-emerald/30 rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-oasis-emerald"
            >
              <option value="all" className="bg-oasis-bgSecondary">All Verification Statuses</option>
              <option value="pending" className="bg-oasis-bgSecondary">⏳ Pending Verification Requests</option>
              <option value="approved" className="bg-oasis-bgSecondary">🏅 Approved Verified Volunteers</option>
              <option value="rejected" className="bg-oasis-bgSecondary">❌ Rejected Applications</option>
              <option value="not_applied" className="bg-oasis-bgSecondary">Not Applied Yet</option>
            </select>
          </div>

          {/* User Type */}
          <div>
            <label className="text-xs font-semibold text-foreground/70">Account Type</label>
            <select
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-oasis-emerald/50"
            >
              <option value="all" className="bg-oasis-bgSecondary">All Types</option>
              <option value="volunteer" className="bg-oasis-bgSecondary">Volunteer</option>
              <option value="member" className="bg-oasis-bgSecondary">Member</option>
            </select>
          </div>

          {/* Profile Completion % */}
          <div>
            <label className="text-xs font-semibold text-foreground/70">Profile Completion</label>
            <select
              value={profileCompletion}
              onChange={(e) => setProfileCompletion(e.target.value)}
              className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-oasis-emerald/50"
            >
              <option value="all" className="bg-oasis-bgSecondary">All Levels</option>
              <option value="100" className="bg-oasis-bgSecondary">100% Fully Completed (Ready)</option>
              <option value="75" className="bg-oasis-bgSecondary">75% Completed</option>
              <option value="50" className="bg-oasis-bgSecondary">50% Completed</option>
              <option value="below_50" className="bg-oasis-bgSecondary">Below 50%</option>
            </select>
          </div>

          {/* Gender */}
          <div>
            <label className="text-xs font-semibold text-foreground/70">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-oasis-emerald/50"
            >
              <option value="all" className="bg-oasis-bgSecondary">All Genders</option>
              <option value="male" className="bg-oasis-bgSecondary">Male</option>
              <option value="female" className="bg-oasis-bgSecondary">Female</option>
              <option value="other" className="bg-oasis-bgSecondary">Other</option>
            </select>
          </div>

          {/* Search Query */}
          <div className="sm:col-span-2 md:col-span-4">
            <label className="text-xs font-semibold text-foreground/70">Search Query</label>
            <div className="relative mt-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40" size={16} />
              <input
                type="text"
                placeholder="Search by Name, Email, Registration Number, CNIC, or Phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-foreground/5 border border-foreground/10 rounded-xl py-2.5 pl-9 pr-4 text-xs text-foreground focus:outline-none focus:border-oasis-emerald/50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* VOLUNTEER TABLE */}
      <div className="glass-card rounded-3xl border border-foreground/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-foreground/5 border-b border-foreground/10 text-foreground/70 uppercase tracking-wider font-semibold">
                <th className="p-4">Reg Number</th>
                <th className="p-4">Name & Contact</th>
                <th className="p-4">Verification Status</th>
                <th className="p-4">Institution / City</th>
                <th className="p-4">Completion %</th>
                <th className="p-4 text-right">Verification Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/5">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-oasis-muted">
                    Loading directory records...
                  </td>
                </tr>
              ) : volunteers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-oasis-muted">
                    No records match the specified filters.
                  </td>
                </tr>
              ) : (
                volunteers.map(v => (
                  <tr key={v.public_id} className="hover:bg-foreground/5 transition-colors">
                    <td className="p-4 font-mono font-semibold text-oasis-emerald">
                      {v.registration_number || 'Unassigned'}
                    </td>
                    <td className="p-4 font-bold text-foreground">
                      {v.full_name}
                      <div className="text-[10px] text-foreground/50 font-normal">{v.email} • {v.phone_number || 'No Phone'}</div>
                    </td>
                    <td className="p-4">
                      {v.volunteer_status === 'approved' && (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 inline-flex items-center gap-1">
                          <Check size={12} /> Verified Volunteer
                        </span>
                      )}
                      {v.volunteer_status === 'pending' && (
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 inline-flex items-center gap-1 animate-pulse">
                          <Clock size={12} /> Pending Approval
                        </span>
                      )}
                      {v.volunteer_status === 'rejected' && (
                        <span className="px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 font-bold border border-red-500/30 inline-flex items-center gap-1">
                          <XCircle size={12} /> Rejected
                        </span>
                      )}
                      {(!v.volunteer_status || v.volunteer_status === 'not_applied') && (
                        <span className="px-2.5 py-1 rounded-full bg-foreground/10 text-foreground/60 font-medium">
                          Member (Not Applied)
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div>{v.institution_name || 'N/A'}</div>
                      <div className="text-[10px] text-foreground/50">{v.city || 'N/A'}, {v.province || ''}</div>
                    </td>
                    <td className="p-4 font-bold">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] ${
                        v.profile_completion_percentage === 100
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {v.profile_completion_percentage}%
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {v.volunteer_status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(v.public_id, v.full_name)}
                            disabled={isProcessing === v.public_id}
                            className="px-3 py-1.5 rounded-xl bg-oasis-emerald hover:bg-oasis-emeraldLight text-black font-bold transition-all shadow-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(v.public_id, v.full_name)}
                            disabled={isProcessing === v.public_id}
                            className="px-3 py-1.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 font-bold transition-all"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {v.volunteer_status !== 'pending' && (
                        <button
                          onClick={() => setSelectedVolunteer(v)}
                          className="px-3 py-1.5 rounded-xl bg-foreground/10 text-foreground hover:bg-foreground/20 font-semibold transition-colors"
                        >
                          Inspect Profile
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INSPECT MODAL */}
      {selectedVolunteer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card rounded-3xl p-6 border border-foreground/10 w-full max-w-xl max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b border-foreground/10 pb-4">
              <div>
                <h3 className="text-xl font-bold text-foreground">{selectedVolunteer.full_name}</h3>
                <p className="text-xs text-oasis-muted">{selectedVolunteer.email}</p>
              </div>
              <button
                onClick={() => setSelectedVolunteer(null)}
                className="p-2 rounded-xl bg-foreground/10 text-foreground/70 hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-foreground/5 p-3 rounded-xl">
                <span className="text-oasis-muted block">Registration Number</span>
                <span className="font-mono font-bold text-oasis-emerald">{selectedVolunteer.registration_number || 'Unassigned'}</span>
              </div>
              <div className="bg-foreground/5 p-3 rounded-xl">
                <span className="text-oasis-muted block">Verification Status</span>
                <span className="font-bold text-foreground capitalize">{selectedVolunteer.volunteer_status || 'not_applied'}</span>
              </div>
              <div className="bg-foreground/5 p-3 rounded-xl">
                <span className="text-oasis-muted block">CNIC / B-Form</span>
                <span className="font-semibold text-foreground">{selectedVolunteer.cnic_number || 'N/A'}</span>
              </div>
              <div className="bg-foreground/5 p-3 rounded-xl">
                <span className="text-oasis-muted block">Phone Number</span>
                <span className="font-semibold text-foreground">{selectedVolunteer.phone_number || 'N/A'}</span>
              </div>
              <div className="bg-foreground/5 p-3 rounded-xl col-span-2">
                <span className="text-oasis-muted block">Institution / City</span>
                <span className="font-semibold text-foreground">{selectedVolunteer.institution_name || 'N/A'} — {selectedVolunteer.city || ''}, {selectedVolunteer.province || ''}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-foreground/10">
              {selectedVolunteer.volunteer_status !== 'approved' && (
                <Button
                  onClick={() => handleApprove(selectedVolunteer.public_id, selectedVolunteer.full_name)}
                  className="bg-oasis-emerald hover:bg-oasis-emeraldLight text-black font-bold rounded-xl px-5"
                >
                  Approve as Volunteer
                </Button>
              )}
              {selectedVolunteer.volunteer_status !== 'rejected' && (
                <Button
                  onClick={() => handleReject(selectedVolunteer.public_id, selectedVolunteer.full_name)}
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl px-5"
                >
                  Reject Request
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
