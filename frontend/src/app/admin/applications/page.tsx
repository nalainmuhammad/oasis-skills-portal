"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ActivityApplication } from "@/types";
import { listAllApplications, updateApplicationStatus } from "@/lib/api/activities";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, Check, X, Filter } from "lucide-react";

export default function AdminApplicationsPage() {
  const { data: session } = useSession();
  const token = session?.accessToken || '';

  const [applications, setApplications] = useState<ActivityApplication[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!token) return;
      setIsLoading(true);
      const data = await listAllApplications(token, statusFilter !== 'all' ? statusFilter : undefined);
      setApplications(data);
      setIsLoading(false);
    }
    load();
  }, [token, statusFilter]);

  const handleStatusChange = async (appId: number, newStatus: string) => {
    if (!token) return;
    try {
      const updated = await updateApplicationStatus(appId, newStatus, undefined, token);
      setApplications(prev => prev.map(a => a.id === appId ? updated : a));
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Application Management System
          </h1>
          <p className="text-oasis-muted text-sm mt-1">
            Review volunteer activity applicants, accept candidates, move to waiting list, or reject.
          </p>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {['all', 'pending', 'accepted', 'waiting_list', 'rejected'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              statusFilter === status
                ? "bg-oasis-emerald text-black shadow-md"
                : "bg-foreground/5 text-foreground/70 hover:bg-foreground/10"
            }`}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Applications Table */}
      <div className="glass-card rounded-3xl border border-foreground/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-foreground/5 border-b border-foreground/10 text-foreground/70 uppercase tracking-wider font-semibold">
                <th className="p-4">Applicant</th>
                <th className="p-4">Reg Number</th>
                <th className="p-4">Activity Title</th>
                <th className="p-4">Position</th>
                <th className="p-4">Applied Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/5">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-oasis-muted">
                    Loading applications...
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-oasis-muted">
                    No applications found for the selected status.
                  </td>
                </tr>
              ) : (
                applications.map(app => (
                  <tr key={app.id} className="hover:bg-foreground/5 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-foreground">{app.applicant_name}</div>
                      <div className="text-[10px] text-foreground/50">{app.applicant_email}</div>
                    </td>
                    <td className="p-4 font-mono font-semibold text-oasis-emerald">
                      {app.applicant_reg_num || 'N/A'}
                    </td>
                    <td className="p-4 font-semibold text-foreground">
                      {app.activity_title}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-foreground/10 font-medium text-foreground">
                        {app.applied_position}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-foreground/60">
                      {new Date(app.applied_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        app.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        app.status === 'rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        app.status === 'waiting_list' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                        'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {app.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-1.5">
                      <button
                        onClick={() => handleStatusChange(app.id, 'accepted')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 font-semibold text-[11px]"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleStatusChange(app.id, 'waiting_list')}
                        className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 font-semibold text-[11px]"
                      >
                        Waitlist
                      </button>
                      <button
                        onClick={() => handleStatusChange(app.id, 'rejected')}
                        className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 font-semibold text-[11px]"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
