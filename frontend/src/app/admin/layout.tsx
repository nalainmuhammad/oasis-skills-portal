"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ShieldAlert, ArrowLeft, Bell, Users, Clock, ExternalLink, ShieldCheck, FileText, Sparkles, Check, ChevronRight } from "lucide-react";
import Link from "next/link";
import { getVolunteersFiltered } from "@/lib/api/admin";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const token = session?.accessToken || '';

  const [pendingVolunteersCount, setPendingVolunteersCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin");
    }
  }, [status, router]);

  useEffect(() => {
    async function loadNotifications() {
      if (!token) return;
      try {
        const pending = await getVolunteersFiltered({ volunteer_status: 'pending' }, token);
        setPendingVolunteersCount(pending.length);
      } catch (err) {
        console.error("Error loading notification counts", err);
      }
    }
    if (session?.user?.role === "admin") {
      loadNotifications();
      const interval = setInterval(loadNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [token, session]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-8 h-8 border-4 border-oasis-emerald border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (session && session.user?.role !== "admin") {
    return (
      <div className="container mx-auto px-4 py-20 max-w-md text-center">
        <div className="glass-card rounded-3xl p-8 border border-red-500/20 bg-red-500/5 space-y-4">
          <ShieldAlert size={56} className="text-red-400 mx-auto" />
          <h2 className="text-2xl font-bold text-foreground">Super Admin Access Required</h2>
          <p className="text-xs text-oasis-muted">
            Your account ({session.user.email}) does not have Super Admin permissions to access the Oasis Foundation Management Portal.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-oasis-emerald text-black font-semibold rounded-xl text-xs hover:bg-oasis-emeraldLight transition-colors"
          >
            <ArrowLeft size={16} /> Return to Member Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const navLinks = [
    { name: "Overview", href: "/admin" },
    { name: "Volunteer Verification", href: "/admin/volunteers" },
    { name: "Opportunity Applications", href: "/admin/applications" },
    { name: "Manage Opportunities", href: "/admin/activities" },
    { name: "Certificates", href: "/admin/certificates" },
  ];

  return (
    <div className="pt-16 min-h-screen">
      {/* Top Admin Sub-Header */}
      <div className="bg-oasis-bgSecondary/90 border-b border-foreground/10 backdrop-blur-md sticky top-16 z-40">
        <div className="container mx-auto px-4 max-w-7xl flex items-center justify-between h-14">
          {/* Nav Items */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-xs font-bold text-oasis-emerald uppercase tracking-wider px-2.5 py-1 rounded-lg bg-oasis-emerald/10 border border-oasis-emerald/20 shrink-0 mr-2 flex items-center gap-1">
              <ShieldCheck size={14} /> Admin Portal
            </span>
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isActive
                      ? "bg-oasis-emerald text-black shadow-sm"
                      : "text-foreground/70 hover:text-foreground hover:bg-foreground/5"
                  }`}
                >
                  {link.name}
                  {link.href === "/admin/volunteers" && pendingVolunteersCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-black font-black text-[9px] flex items-center justify-center">
                      {pendingVolunteersCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Action Tools: Notifications Bell & Django Admin Link */}
          <div className="flex items-center gap-3 shrink-0 relative">
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/admin`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-foreground/70 hover:text-oasis-emerald font-semibold flex items-center gap-1 px-3 py-1.5 rounded-xl bg-foreground/5 hover:bg-foreground/10 transition-colors"
            >
              Django Admin <ExternalLink size={13} />
            </a>

            {/* Notification Bell Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-foreground/80 hover:text-foreground transition-all"
                title="Admin Notifications"
              >
                <Bell size={18} />
                {pendingVolunteersCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white font-black text-[10px] flex items-center justify-center animate-pulse shadow-md">
                    {pendingVolunteersCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Panel */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 glass-card bg-oasis-bgSecondary rounded-2xl p-4 border border-foreground/15 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-foreground/10 mb-3">
                    <div className="flex items-center gap-2">
                      <Bell size={16} className="text-oasis-emerald" />
                      <h4 className="text-sm font-bold text-foreground">Admin Notifications</h4>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-oasis-emerald/20 text-oasis-emerald">
                      {pendingVolunteersCount} Action Required
                    </span>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {pendingVolunteersCount > 0 ? (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left space-y-2">
                        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                          <Clock size={14} /> Pending Volunteer Approvals ({pendingVolunteersCount})
                        </div>
                        <p className="text-[11px] text-foreground/80">
                          {pendingVolunteersCount} volunteer(s) have submitted 100% completed profiles and are waiting for your approval.
                        </p>
                        <Link
                          href="/admin/volunteers?volunteer_status=pending"
                          onClick={() => setShowNotifications(false)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-oasis-emerald hover:underline pt-1"
                        >
                          Review Applications Now <ChevronRight size={14} />
                        </Link>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-xs text-oasis-muted">
                        <Check size={20} className="mx-auto mb-1 text-oasis-emerald" />
                        No pending volunteer verification applications right now.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}
