"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Menu, X, Sun, Moon, HeartHandshake, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/layout/user-menu";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();

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
          ? "bg-oasis-bgSecondary/90 backdrop-blur-md border-b border-foreground/5 shadow-lg"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 z-50 group">
          <div className="relative w-10 h-10 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-[1.5px] border-oasis-emerald/40 border-t-oasis-emerald border-b-oasis-gold animate-[spin_3s_linear_infinite]"></div>
            <Image src="/oasis-logo.png" alt="OASIS Logo" width={32} height={32} className="object-contain drop-shadow-[0_0_8px_rgba(0,212,126,0.3)] group-hover:scale-105 transition-transform duration-500" />
          </div>
          <span className="font-display font-bold text-xl tracking-wide text-foreground">
            OASIS <span className="font-light text-oasis-emerald">Foundation</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
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
        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full text-foreground/70 hover:text-foreground hover:bg-foreground/5 transition-colors"
            aria-label="Toggle theme"
          >
            <Sun className="h-5 w-5 hidden dark:block" />
            <Moon className="h-5 w-5 block dark:hidden" />
          </button>
          
          <UserMenu />

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden z-50 p-2 text-foreground/80 hover:text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-oasis-bg/95 backdrop-blur-xl z-40 flex flex-col justify-center items-center gap-8 px-6">
            <nav className="flex flex-col items-center gap-6 w-full text-center max-w-sm">
              <Link href="/opportunities" className="text-2xl font-display font-medium text-foreground hover:text-oasis-emerald transition-colors" onClick={() => setMobileMenuOpen(false)}>
                Volunteer Opportunities
              </Link>
              <Link href="/courses" className="text-2xl font-display font-medium text-foreground hover:text-oasis-emerald transition-colors" onClick={() => setMobileMenuOpen(false)}>
                Learning Courses
              </Link>
              <Link href="/dashboard/profile" className="text-2xl font-display font-medium text-foreground hover:text-oasis-emerald transition-colors" onClick={() => setMobileMenuOpen(false)}>
                Progressive Profile
              </Link>
              <Link href="/dashboard/id-card" className="text-2xl font-display font-medium text-foreground hover:text-oasis-emerald transition-colors" onClick={() => setMobileMenuOpen(false)}>
                Digital ID Card
              </Link>

              <div className="w-full h-px bg-foreground/10 my-2"></div>

              <Link href="/dashboard" className="text-lg font-medium text-foreground/80 hover:text-oasis-emerald transition-colors" onClick={() => setMobileMenuOpen(false)}>
                My Dashboard
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
