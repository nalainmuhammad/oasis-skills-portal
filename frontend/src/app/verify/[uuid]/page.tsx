import { verifyCertificate } from "@/lib/api/certificates";
import { ShieldCheck, Calendar, BookOpen, AlertTriangle, Sparkles, Award, Clock, CheckCircle2, FileCheck2 } from "lucide-react";
import Link from "next/link";
import { PdfDownloader } from "@/components/certificates/pdf-downloader";
import { ConfettiCelebration } from "@/components/certificates/confetti-celebration";
import { ShareActions } from "@/components/certificates/share-actions";
import { getAvatarIcon } from "@/components/profile/avatar-icons";

export default async function VerifyCertificatePage({ params }: { params: Promise<{ uuid: string }> }) {
  let certificate = null;
  let error = false;

  try {
    const { uuid } = await params;
    certificate = await verifyCertificate(uuid);
  } catch (e) {
    error = true;
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 pb-20 bg-oasis-bg px-4">
        <div className="glass-card rounded-[2rem] p-8 md:p-12 max-w-lg w-full text-center border border-red-500/20">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="text-red-500" size={40} />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-4">Invalid Certificate</h1>
          <p className="text-foreground/60 mb-8">
            The certificate you are trying to verify does not exist in our records or the verification link is invalid.
          </p>
          <Link href="/verify" className="inline-flex items-center justify-center h-10 px-4 w-full bg-foreground/10 hover:bg-foreground/20 text-foreground rounded-xl transition-colors">
            Try Another ID
          </Link>
        </div>
      </div>
    );
  }

  // Determine avatar representation
  const avatarIcon = getAvatarIcon(certificate.recipient_avatar_icon || 'default');

  return (
    <div className="min-h-screen pt-24 pb-20 bg-oasis-bg relative overflow-hidden">
      {/* Extended Visual Celebration Confetti Burst */}
      <ConfettiCelebration />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          
          {/* Top Verification Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-oasis-gold/10 border border-oasis-gold/30 rounded-full mb-3 shadow-[0_0_15px_rgba(255,198,65,0.15)]">
              <Sparkles className="text-oasis-gold" size={16} />
              <span className="text-xs font-bold text-oasis-gold tracking-widest uppercase">Verified Statement of Accomplishment</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight mb-2">
              Official Credential
            </h1>
            <p className="text-oasis-muted text-sm md:text-base max-w-lg mx-auto">
              Issued and cryptographically verified by the OASIS Foundation.
            </p>
          </div>

          {/* Statement of Accomplishment Certificate Card (DataCamp / Coursera Style) */}
          <div className="glass-card rounded-[2rem] overflow-hidden border border-oasis-gold/30 shadow-[0_0_90px_rgba(0,212,126,0.08)] relative">
            
            {/* Top Accent Gradient Line */}
            <div className="h-2 w-full bg-gradient-to-r from-oasis-emerald via-oasis-gold to-oasis-cyan"></div>

            <div className="p-8 md:p-14 text-center relative">

              {/* Background Seal Watermark */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
                <ShieldCheck size={380} className="text-oasis-emerald" />
              </div>

              {/* Organization Header */}
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-oasis-emerald/20 border border-oasis-emerald flex items-center justify-center text-oasis-emerald">
                  <FileCheck2 size={22} />
                </div>
                <span className="text-xl font-display font-bold tracking-wider text-foreground uppercase">
                  OASIS <span className="text-oasis-emerald">ACADEMY</span>
                </span>
              </div>

              {/* Formal Statement Heading */}
              <p className="text-xs md:text-sm font-semibold tracking-[0.25em] text-foreground/50 uppercase mb-6">
                THIS IS TO CERTIFY THAT
              </p>

              {/* Recipient Profile Avatar & Name */}
              <div className="inline-flex items-center justify-center gap-4 px-6 py-3 rounded-full bg-foreground/5 border border-foreground/10 mb-8 max-w-full">
                {certificate.recipient_avatar_url ? (
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-oasis-gold shadow-md flex-shrink-0 relative">
                    {/* Standard img tag handles Google OAuth photos and S3 URLs flawlessly without Next.js domain restrictions */}
                    {/* eslint-disable-next-html-element-suppression */}
                    <img 
                      src={certificate.recipient_avatar_url} 
                      alt={certificate.recipient_name_snapshot} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-full bg-oasis-gold/10 border-2 border-oasis-gold flex items-center justify-center text-oasis-gold flex-shrink-0">
                    <div className="w-8 h-8">
                      {avatarIcon.svg}
                    </div>
                  </div>
                )}

                <div className="text-left">
                  <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground tracking-tight leading-tight">
                    {certificate.recipient_name_snapshot}
                  </h2>
                  <div className="flex items-center gap-1.5 text-xs text-oasis-emerald font-semibold mt-0.5">
                    <CheckCircle2 size={13} /> Verified Student Profile
                  </div>
                </div>
              </div>

              {/* Accomplishment Details */}
              <p className="text-xs md:text-sm font-semibold tracking-[0.2em] text-foreground/50 uppercase mb-3">
                HAS SUCCESSFULLY COMPLETED THE COURSE
              </p>

              <h3 className="text-2xl md:text-4xl font-display font-bold text-oasis-gold mb-6 max-w-2xl mx-auto leading-snug">
                {certificate.course_title_snapshot}
              </h3>

              {/* Metadata Pills */}
              <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
                {certificate.difficulty_level && (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-oasis-emerald/10 text-oasis-emerald border border-oasis-emerald/30 text-xs font-bold rounded-lg capitalize">
                    <Award size={14} /> {certificate.difficulty_level} Level
                  </span>
                )}

                {certificate.estimated_duration_minutes && (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-foreground/10 text-foreground/80 border border-foreground/10 text-xs font-medium rounded-lg">
                    <Clock size={14} /> {Math.round(certificate.estimated_duration_minutes / 60)} Hours Coursework
                  </span>
                )}

                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-oasis-gold/10 text-oasis-gold border border-oasis-gold/30 text-xs font-bold rounded-lg">
                  <ShieldCheck size={14} /> Cryptographically Verified
                </span>
              </div>

              {/* Certificate Footer Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-foreground/10 text-center md:text-left items-center">
                <div>
                  <p className="text-xs text-foreground/40 uppercase tracking-wider mb-1">Issue Date</p>
                  <p className="text-sm font-semibold text-foreground flex items-center justify-center md:justify-start gap-1.5">
                    <Calendar size={14} className="text-oasis-emerald" />
                    {new Date(certificate.issued_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-foreground/40 uppercase tracking-wider mb-1">Verification ID</p>
                  <p className="text-xs font-mono text-foreground/80 bg-foreground/5 px-2.5 py-1 rounded-md inline-block border border-foreground/10 truncate max-w-full">
                    {certificate.verification_uuid}
                  </p>
                </div>

                <div className="md:text-right">
                  <p className="text-xs text-foreground/40 uppercase tracking-wider mb-1">Authority</p>
                  <p className="text-sm font-bold text-oasis-gold flex items-center justify-center md:justify-end gap-1">
                    <ShieldCheck size={16} /> OASIS Foundation
                  </p>
                </div>
              </div>

              {/* LinkedIn & Social Share Action Row */}
              <div className="mt-8">
                <ShareActions 
                  recipientName={certificate.recipient_name_snapshot}
                  courseTitle={certificate.course_title_snapshot}
                  verificationUuid={certificate.verification_uuid}
                />
              </div>

            </div>
            
            {/* PDF Download Section */}
            {certificate.pdf_url && (
              <div className="bg-oasis-gold/5 p-6 border-t border-oasis-gold/10 text-center flex justify-center">
                <PdfDownloader 
                  verificationUuid={certificate.verification_uuid}
                  recipientName={certificate.recipient_name_snapshot}
                  courseTitle={certificate.course_title_snapshot}
                  issuedAt={certificate.issued_at}
                  hostUrl={process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}
                />
              </div>
            )}
          </div>

          {/* Verify Another Credential Footer */}
          <div className="mt-8 text-center">
            <Link href="/verify" className="inline-flex items-center justify-center h-10 px-6 border border-foreground/20 text-foreground hover:bg-foreground/10 rounded-full transition-colors text-sm font-medium">
              Verify Another Credential
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
