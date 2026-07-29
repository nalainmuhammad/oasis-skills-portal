"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { AdminStats } from "@/types";
import { getAdminStats } from "@/lib/api/admin";
import { Users, CheckCircle2, AlertCircle, Award, HeartHandshake, FileText, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const token = session?.accessToken || '';

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!token) return;
      const data = await getAdminStats(token);
      setStats(data);
      setIsLoading(false);
    }
    load();
  }, [token]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-oasis-emerald border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-oasis-emerald/10 border border-oasis-emerald/20 text-oasis-emerald text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck size={14} /> Super Admin Portal
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Foundation Statistics & Management
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/volunteers"
            className="px-4 py-2.5 rounded-xl bg-oasis-emerald text-black font-semibold text-xs hover:bg-oasis-emeraldLight transition-all shadow-md"
          >
            Volunteer Directory & Filters
          </Link>
          <Link
            href="/admin/applications"
            className="px-4 py-2.5 rounded-xl bg-foreground/5 border border-foreground/10 text-foreground font-semibold text-xs hover:bg-foreground/10 transition-colors"
          >
            Applications ({stats?.pending_applications || 0})
          </Link>
        </div>
      </div>

      {/* Analytics Counter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <div className="glass-card rounded-3xl p-6 border border-foreground/10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-oasis-muted uppercase tracking-wider">Total Volunteers</span>
            <div className="p-3 rounded-2xl bg-oasis-emerald/10 text-oasis-emerald">
              <Users size={22} />
            </div>
          </div>
          <div className="text-3xl font-bold text-foreground">{stats?.total_volunteers || 0}</div>
          <p className="text-xs text-oasis-muted mt-1">+ Members: {stats?.total_members || 0}</p>
        </div>

        <div className="glass-card rounded-3xl p-6 border border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Completed Profiles (100%)</span>
            <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 size={22} />
            </div>
          </div>
          <div className="text-3xl font-bold text-emerald-400">{stats?.completed_profiles || 0}</div>
          <p className="text-xs text-emerald-400/70 mt-1">Eligible for ID Cards & Activities</p>
        </div>

        <div className="glass-card rounded-3xl p-6 border border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Incomplete Profiles (&lt;100%)</span>
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400">
              <AlertCircle size={22} />
            </div>
          </div>
          <div className="text-3xl font-bold text-amber-400">{stats?.incomplete_profiles || 0}</div>
          <p className="text-xs text-amber-400/70 mt-1">Pending profile step details</p>
        </div>

        <div className="glass-card rounded-3xl p-6 border border-purple-500/20 bg-purple-500/5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Certificates Issued</span>
            <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-400">
              <Award size={22} />
            </div>
          </div>
          <div className="text-3xl font-bold text-purple-400">{stats?.total_certificates || 0}</div>
          <p className="text-xs text-purple-400/70 mt-1">Individual & Program awards</p>
        </div>
      </div>

      {/* Admin Modules Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/admin/volunteers"
          className="glass-card rounded-3xl p-6 border border-foreground/10 hover:border-oasis-emerald/40 transition-all group"
        >
          <div className="p-4 rounded-2xl bg-oasis-emerald/10 text-oasis-emerald w-fit mb-4 group-hover:scale-110 transition-transform">
            <Users size={28} />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Volunteer & Member Management</h3>
          <p className="text-xs text-oasis-muted mb-4">
            Filter volunteers by profile completion, institution, city, position, gender, and program participation.
          </p>
          <span className="text-xs font-bold text-oasis-emerald flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Open Directory <ArrowRight size={14} />
          </span>
        </Link>

        <Link
          href="/admin/activities"
          className="glass-card rounded-3xl p-6 border border-foreground/10 hover:border-oasis-emerald/40 transition-all group"
        >
          <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-400 w-fit mb-4 group-hover:scale-110 transition-transform">
            <HeartHandshake size={28} />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Activity & Program Management</h3>
          <p className="text-xs text-oasis-muted mb-4">
            Create and edit programs, workshops, campaigns, and volunteer opportunities.
          </p>
          <span className="text-xs font-bold text-blue-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Manage Programs <ArrowRight size={14} />
          </span>
        </Link>

        <Link
          href="/admin/certificates"
          className="glass-card rounded-3xl p-6 border border-foreground/10 hover:border-oasis-emerald/40 transition-all group"
        >
          <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-400 w-fit mb-4 group-hover:scale-110 transition-transform">
            <Award size={28} />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Certificate Management System</h3>
          <p className="text-xs text-oasis-muted mb-4">
            Drag-and-drop template position editor, issue individual awards, and generate bulk program certificates.
          </p>
          <span className="text-xs font-bold text-amber-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Certificate Studio <ArrowRight size={14} />
          </span>
        </Link>
      </div>
    </div>
  );
}
