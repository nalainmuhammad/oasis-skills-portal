"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { User, LogOut, BookOpen, Settings, ShieldAlert, CreditCard, HeartHandshake, ShieldCheck, Bell, Clock, ChevronRight, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { getAvatarIcon } from "@/components/profile/avatar-icons";
import { getVolunteersFiltered } from "@/lib/api/admin";

export function UserMenu() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [showBellDropdown, setShowBellDropdown] = useState(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const token = session?.accessToken || '';

  const isAdmin = session?.user?.role === 'admin';

  const [regNum, setRegNum] = useState<string>((session?.user as any)?.registrationNumber || '');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setShowBellDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function fetchFreshProfile() {
      if (!token) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://oasis-skills-portal.onrender.com'}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const prof = await res.json();
          if (prof.registration_number) setRegNum(prof.registration_number);
        }
      } catch (err) {}
    }

    async function fetchPending() {
      if (isAdmin && token) {
        try {
          const pending = await getVolunteersFiltered({ volunteer_status: 'pending' }, token);
          setPendingCount(pending.length);
        } catch (e) {
          // Silent fallback
        }
      }
    }

    fetchFreshProfile();
    fetchPending();
  }, [isAdmin, token]);

  if (status === "loading") {
    return <div className="w-8 h-8 rounded-full bg-foreground/10 animate-pulse"></div>;
  }

  if (!session) {
    return (
      <div className="hidden md:flex items-center gap-4">
        <Link href="/login" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
          Sign In
        </Link>
        <Link href="/register" className="inline-flex items-center justify-center h-10 px-6 bg-gradient-to-r from-oasis-emerald to-oasis-emeraldDeep hover:from-oasis-emeraldLight hover:to-oasis-emerald text-black font-medium rounded-full shadow-[0_0_15px_rgba(0,212,126,0.3)] transition-all">
          Join Oasis Foundation
        </Link>
      </div>
    );
  }

  const renderAvatar = () => {
    if (session?.user?.image) {
      return <img src={session.user.image} alt={session.user.name || "User"} className="w-full h-full object-cover" />;
    }
    
    const iconId = session?.user?.avatarIcon || 'default';
    const icon = getAvatarIcon(iconId);
    return (
      <div className="w-full h-full flex items-center justify-center text-oasis-emerald bg-oasis-emerald/10">
        {icon.svg}
      </div>
    );
  };

  return (
    <div className="flex items-center gap-3">
      {/* Admin Notification Bell Icon */}
      {isAdmin && (
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => setShowBellDropdown(!showBellDropdown)}
            className="relative p-2 rounded-full text-foreground/70 hover:text-foreground hover:bg-foreground/5 transition-colors focus:outline-none"
            aria-label="Admin Notifications"
            title="Admin Notifications"
          >
            <Bell size={20} />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white font-black text-[10px] flex items-center justify-center animate-pulse shadow-md">
                {pendingCount}
              </span>
            )}
          </button>

          {/* Bell Dropdown Popup */}
          {showBellDropdown && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 glass-card bg-oasis-bgSecondary rounded-2xl p-4 border border-foreground/15 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-foreground/10 mb-3">
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-oasis-emerald" />
                  <h4 className="text-sm font-bold text-foreground">Admin Notifications</h4>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-oasis-emerald/20 text-oasis-emerald">
                  {pendingCount} Action Required
                </span>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {pendingCount > 0 ? (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left space-y-2">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                      <Clock size={14} /> Pending Volunteer Approvals ({pendingCount})
                    </div>
                    <p className="text-[11px] text-foreground/80">
                      {pendingCount} volunteer application(s) are awaiting admin review.
                    </p>
                    <Link
                      href="/admin/volunteers?volunteer_status=pending"
                      onClick={() => setShowBellDropdown(false)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-oasis-emerald hover:underline pt-1"
                    >
                      Review Approvals Now <ChevronRight size={14} />
                    </Link>
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-oasis-muted">
                    <Check size={20} className="mx-auto mb-1 text-oasis-emerald" />
                    No pending volunteer verification applications.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* User Profile Menu */}
      <div className="relative" ref={menuRef}>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 focus:outline-none"
        >
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-oasis-emerald/10 border border-oasis-emerald/50 flex items-center justify-center overflow-hidden">
              {renderAvatar()}
            </div>
            {!session.user.emailVerified && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center border-2 border-oasis-bgSecondary">
                <ShieldAlert size={10} className="text-black" />
              </div>
            )}
          </div>
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-64 glass-card rounded-2xl border border-foreground/10 shadow-2xl py-2 z-50">
            <div className="px-4 py-3 border-b border-foreground/10 mb-2">
              <p className="text-sm font-bold text-foreground truncate">{session.user?.name}</p>
              <p className="text-xs text-foreground/50 truncate mb-1">{session.user?.email}</p>
              {(regNum || (session.user as any)?.registrationNumber) && (
                <span className="inline-block px-2 py-0.5 rounded bg-oasis-emerald/10 text-oasis-emerald font-mono text-[10px] font-bold">
                  {regNum || (session.user as any).registrationNumber}
                </span>
              )}
            </div>
            
            <div className="flex flex-col gap-1 px-2">
              {isAdmin && (
                <Link 
                  href="/admin" 
                  className="flex items-center gap-3 px-3 py-2 rounded-xl bg-oasis-emerald/10 hover:bg-oasis-emerald/20 text-sm font-bold text-oasis-emerald transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <ShieldCheck size={16} /> Super Admin Portal
                </Link>
              )}
              <Link 
                href="/dashboard" 
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-foreground/5 text-sm text-foreground/80 hover:text-foreground transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <User size={16} className="text-oasis-emerald" /> Dashboard Hub
              </Link>
              <Link 
                href="/dashboard/settings" 
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-foreground/5 text-sm text-foreground/80 hover:text-foreground transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Settings size={16} className="text-blue-400" /> Settings & Profile
              </Link>
              <Link 
                href="/dashboard/id-card" 
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-foreground/5 text-sm text-foreground/80 hover:text-foreground transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <CreditCard size={16} className="text-purple-400" /> Digital ID Card
              </Link>
              <Link 
                href="/opportunities" 
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-foreground/5 text-sm text-foreground/80 hover:text-foreground transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <HeartHandshake size={16} className="text-amber-400" /> Opportunities
              </Link>
              <Link 
                href="/courses" 
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-foreground/5 text-sm text-foreground/80 hover:text-foreground transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <BookOpen size={16} className="text-foreground/60" /> Courses
              </Link>
            </div>
            
            <div className="border-t border-foreground/10 mt-2 pt-2 px-2">
              <button 
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-xl hover:bg-red-500/10 text-sm text-red-400 transition-colors"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
