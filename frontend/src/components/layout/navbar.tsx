"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useSession } from "next-auth/react";
import { Menu, X, Sun, Moon, HeartHandshake, ShieldCheck, User, CreditCard, Settings, LogIn, UserPlus, BookOpen, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/layout/user-menu";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#0b132b]/95 backdrop-blur-md border-b border-foreground/10 shadow-lg py-3"
          : "bg-transparent py-4 md:py-5"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between h-14 md:h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 z-50 group">
          <div className="relative w-9 h-9 md:w-10 md:h-10 flex items-center justify-center shrink-0">
            <div className="absolute inset-0 rounded-full border-[1.5px] border-oasis-emerald/40 border-t-oasis-emerald border-b-oasis-gold animate-[spin_3s_linear_infinite]"></div>
            <Image src="/oasis-logo.png" alt="OASIS Logo" width={30} height={30} className="object-contain drop-shadow-[0_0_8px_rgba(0,212,126,0.3)] group-hover:scale-105 transition-transform duration-500" />
          </div>
          <span className="font-display font-bold text-lg md:text-xl tracking-wide text-foreground">
            OASIS <span className="font-light text-oasis-emerald">Foundation</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-7">
          <Link href="/opportunities" className="text-sm font-medium text-foreground/80 hover:text-oasis-emerald transition-colors flex items-center gap-1.5">
            <HeartHandshake size={16} className="text-oasis-emerald" /> Opportunities
          </Link>
          <Link href="/courses" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
            Courses
          </Link>
          <Link href="/categories" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
            Categories
          </Link>
          <Link href="/verify" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
            Verify Certificate
          </Link>
        </nav>

        {/* Desktop & Mobile Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full text-foreground/70 hover:text-foreground hover:bg-foreground/5 transition-colors"
            aria-label="Toggle theme"
          >
            <Sun className="h-4 w-4 md:h-5 md:w-5 hidden dark:block" />
            <Moon className="h-4 w-4 md:h-5 md:w-5 block dark:hidden" />
          </button>
          
          <UserMenu />

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden z-50 p-2 text-foreground/80 hover:text-foreground rounded-lg bg-foreground/5 border border-foreground/10"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-[#0b132b] bg-slate-950 z-[100] flex flex-col justify-between p-6 pt-20 overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-foreground/10 pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-oasis-emerald">
                  Navigation Menu
                </span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-full bg-foreground/10 text-foreground"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="flex flex-col gap-3">
                <Link
                  href="/"
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-base font-bold text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home Page
                </Link>

                <Link
                  href="/opportunities"
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-base font-bold text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <HeartHandshake size={18} className="text-oasis-emerald" /> Volunteer Opportunities
                </Link>

                <Link
                  href="/courses"
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-base font-bold text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <BookOpen size={18} className="text-blue-400" /> Learning Courses
                </Link>

                <Link
                  href="/categories"
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-base font-bold text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Layers size={18} className="text-purple-400" /> Categories
                </Link>

                <Link
                  href="/verify"
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-base font-bold text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <ShieldCheck size={18} className="text-oasis-gold" /> Verify Certificate
                </Link>

                {/* Logged In Specific Links */}
                {session ? (
                  <>
                    <div className="h-px bg-foreground/10 my-2"></div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-oasis-muted px-1">
                      Member Dashboard
                    </span>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-3 p-3.5 rounded-xl bg-oasis-emerald/15 border border-oasis-emerald/40 text-base font-bold text-oasis-emerald transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User size={18} /> My Dashboard
                    </Link>

                    <Link
                      href="/dashboard/settings"
                      className="flex items-center gap-3 p-3.5 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-base font-bold text-foreground transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Settings size={18} className="text-blue-400" /> Settings & Profile
                    </Link>

                    <Link
                      href="/dashboard/id-card"
                      className="flex items-center gap-3 p-3.5 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-base font-bold text-foreground transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <CreditCard size={18} className="text-oasis-emerald" /> Digital ID Card
                    </Link>
                  </>
                ) : (
                  <>
                    <div className="h-px bg-foreground/10 my-2"></div>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <Link
                        href="/login"
                        className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-foreground/10 hover:bg-foreground/20 text-sm font-bold text-foreground text-center"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <LogIn size={16} /> Sign In
                      </Link>

                      <Link
                        href="/register"
                        className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-oasis-emerald hover:bg-oasis-emeraldLight text-sm font-extrabold text-black text-center shadow-lg"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <UserPlus size={16} /> Join Oasis
                      </Link>
                    </div>
                  </>
                )}
              </nav>
            </div>

            <div className="pt-6 border-t border-foreground/10 text-center text-xs text-oasis-muted">
              © {new Date().getFullYear()} OASIS Foundation. All Rights Reserved.
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
