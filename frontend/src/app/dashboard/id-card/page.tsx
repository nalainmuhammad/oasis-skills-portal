"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { IdCardData } from "@/types";
import { getIdCard } from "@/lib/api/profile";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Printer, AlertTriangle, ArrowLeft, CheckCircle2, HeartHandshake, Award } from "lucide-react";
import Link from "next/link";

export default function IdCardPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [idCard, setIdCard] = useState<IdCardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [origin, setOrigin] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    async function load() {
      if (!session?.accessToken) return;
      try {
        const data = await getIdCard(session.accessToken);
        setIdCard(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load ID card.');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [session?.accessToken]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-oasis-emerald border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !idCard) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-xl text-center">
        <div className="glass-card rounded-3xl p-8 border border-amber-500/20 bg-amber-500/5">
          <AlertTriangle size={56} className="text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">ID Card Locked</h2>
          <p className="text-oasis-muted text-sm mb-6">
            {error || 'Your profile must reach 100% completion before your official Oasis Foundation Digital ID Card can be generated.'}
          </p>
          <Link
            href="/dashboard/profile"
            className="inline-flex items-center gap-2 px-6 py-3 bg-oasis-emerald text-black font-semibold rounded-xl hover:bg-oasis-emeraldLight transition-colors"
          >
            Complete Profile Now <ArrowLeft className="rotate-180" size={16} />
          </Link>
        </div>
      </div>
    );
  }

  // Generate live working QR Code URL pointing directly to localhost / domain verify page
  const verificationUrl = origin 
    ? `${origin}/verify-id/${encodeURIComponent(idCard.registration_number || idCard.qr_verification_code)}`
    : idCard.verification_url;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verificationUrl)}&color=00d47e&bgcolor=0f0f23`;

  const isVolunteer = idCard.position?.toLowerCase().includes('volunteer') || idCard.registration_number?.includes('VOL');

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl print:p-0 print:m-0 print:max-w-none">
      {/* Non-print Controls */}
      <div className="flex items-center justify-between mb-8 print:hidden">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-1">
            Official Oasis Digital Identification Card
          </h1>
          <p className="text-oasis-muted text-sm flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-oasis-emerald" /> Verified & Authentic • {idCard.registration_number}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handlePrint}
            className="bg-oasis-emerald hover:bg-oasis-emeraldLight text-black font-extrabold rounded-xl px-6 py-3 shadow-lg shadow-oasis-emerald/20 flex items-center gap-2 transition-all hover:scale-105"
          >
            <Printer size={18} /> Print Card (1-Page Ready)
          </Button>
        </div>
      </div>

      {/* ID Card Display Container */}
      <div className="flex flex-col items-center justify-center">
        <div
          ref={cardRef}
          id="id-card-printable"
          className="w-full max-w-[420px] bg-gradient-to-br from-[#0b132b] via-[#1c2541] to-[#0b132b] rounded-3xl p-7 border-2 border-oasis-emerald/50 shadow-[0_0_50px_rgba(0,212,126,0.2)] relative overflow-hidden text-white font-sans transition-all"
        >
          {/* Decorative Corner Ornaments */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-oasis-emerald/15 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -right-8 -bottom-8 opacity-5 text-white pointer-events-none select-none">
            <ShieldCheck size={180} />
          </div>

          {/* Card Header with Official Website Logo */}
          <div className="flex items-center justify-between border-b border-white/15 pb-4 mb-5 relative z-10">
            <div className="flex items-center gap-3">
              <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
                <div className="absolute inset-0 rounded-full border border-oasis-emerald/50 bg-oasis-emerald/10 shadow-[0_0_12px_rgba(0,212,126,0.3)]"></div>
                <Image
                  src="/oasis-logo.png"
                  alt="OASIS Logo"
                  width={32}
                  height={32}
                  className="object-contain relative z-10 drop-shadow-[0_0_8px_rgba(0,212,126,0.5)]"
                />
              </div>
              <div>
                <h3 className="font-display font-black text-lg leading-none tracking-wider text-white">
                  OASIS FOUNDATION
                </h3>
                <p className="text-[10px] text-oasis-emerald uppercase font-bold tracking-widest mt-1 flex items-center gap-1">
                  <HeartHandshake size={12} /> Official Volunteering Card
                </p>
              </div>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-oasis-emerald/20 border border-oasis-emerald/50 text-oasis-emerald text-[9px] font-black uppercase tracking-widest shadow-sm">
              VERIFIED
            </div>
          </div>

          {/* Main Card Body */}
          <div className="flex flex-col items-center text-center space-y-4 relative z-10">
            {/* User Photograph */}
            <div className="relative">
              <div className="w-28 h-28 rounded-2xl border-2 border-oasis-emerald p-1 bg-black/50 shadow-2xl overflow-hidden relative group">
                {idCard.photograph_url ? (
                  <img
                    src={idCard.photograph_url}
                    alt={idCard.full_name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="w-full h-full bg-oasis-emerald/20 flex items-center justify-center text-oasis-emerald font-black text-3xl rounded-xl">
                    {idCard.full_name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-oasis-emerald text-black text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1 whitespace-nowrap">
                <HeartHandshake size={11} /> Volunteer
              </div>
            </div>

            {/* User Name & Details */}
            <div className="pt-2">
              <h2 className="text-xl font-extrabold text-white tracking-wide">
                {idCard.full_name}
              </h2>
              <p className="text-xs text-white/70 font-mono mt-1">
                REG NO: <span className="text-oasis-emerald font-bold">{idCard.registration_number}</span>
              </p>
            </div>

            {/* Quick Metadata Table */}
            <div className="w-full bg-white/5 rounded-2xl p-3.5 border border-white/10 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-white/50 font-medium">Card Type:</span>
                <span className="font-bold text-oasis-emerald">
                  Volunteering Card
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50 font-medium">Joining Date:</span>
                <span className="font-semibold text-white">{idCard.joining_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50 font-medium">Organization:</span>
                <span className="font-semibold text-white">{idCard.foundation_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50 font-medium">Status:</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={13} /> Active & Verified
                </span>
              </div>
            </div>

            {/* Live QR Code & Authenticity Footer */}
            <div className="w-full flex items-center justify-between pt-2 border-t border-white/15">
              <div className="text-left max-w-[240px]">
                <p className="text-[10px] text-oasis-emerald uppercase tracking-wider font-extrabold flex items-center gap-1">
                  <ShieldCheck size={12} /> Scan QR Code to Verify
                </p>
                <p className="text-[10px] text-white/50 mt-0.5">Scan using phone camera or browser to view official record page.</p>
              </div>
              <div className="w-16 h-16 bg-white p-1 rounded-xl shadow-lg shrink-0 border-2 border-oasis-emerald/40">
                <img src={qrUrl} alt="QR Verification Code" className="w-full h-full object-contain" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
