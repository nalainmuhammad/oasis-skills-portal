import { ShieldCheck, CheckCircle2, AlertCircle, Building2, MapPin, Calendar, HeartHandshake, UserCheck } from "lucide-react";
import Image from "next/image";

async function getVerificationData(regOrUuid: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://oasis-skills-portal.onrender.com';
    const res = await fetch(`${apiUrl}/api/auth/public-verify-id/${encodeURIComponent(regOrUuid)}`, {
      cache: 'no-store'
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

export default async function VerifyIdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getVerificationData(id);
  const isApprovedVolunteer = data?.volunteer_status === 'approved' || data?.user_type === 'volunteer' || data?.registration_number?.includes('VOL');

  return (
    <div className="flex flex-col min-h-screen pt-24 pb-20 justify-center items-center px-4 bg-[#080d1a]">
      <div className="glass-card bg-[#0b132b] rounded-3xl max-w-lg w-full p-8 border-2 border-oasis-emerald/40 text-center shadow-[0_0_50px_rgba(0,212,126,0.15)] relative overflow-hidden text-white">
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-oasis-emerald/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {data ? (
          <div className="space-y-6 relative z-10">
            {/* Verification Header Badge */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <Image src="/oasis-logo.png" alt="OASIS" width={28} height={28} className="object-contain" />
                <span className="font-display font-bold text-sm tracking-wider text-white">OASIS FOUNDATION</span>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                <ShieldCheck size={14} /> OFFICIALLY VERIFIED
              </div>
            </div>

            {/* User Profile DP Avatar */}
            <div className="flex flex-col items-center">
              <div className="relative w-28 h-28 rounded-full border-2 border-oasis-emerald p-1 bg-black/50 shadow-2xl overflow-hidden mb-3">
                {data.avatar_url ? (
                  <img
                    src={data.avatar_url}
                    alt={data.full_name}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div className="w-full h-full bg-oasis-emerald/20 flex items-center justify-center text-oasis-emerald font-black text-3xl rounded-full">
                    {data.full_name?.charAt(0) || 'O'}
                  </div>
                )}
              </div>

              {/* Certified Role Badge */}
              <div className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-md ${
                isApprovedVolunteer ? 'bg-oasis-emerald text-black' : 'bg-blue-500 text-white'
              }`}>
                {isApprovedVolunteer ? <HeartHandshake size={14} /> : <UserCheck size={14} />}
                {isApprovedVolunteer ? 'Verified Volunteer' : 'Certified Official Member'}
              </div>

              <h1 className="text-2xl font-bold text-white mt-3 font-display">{data.full_name}</h1>
              <p className="text-xs text-oasis-emerald font-mono font-semibold tracking-wider mt-0.5">
                REG NO: {data.registration_number}
              </p>
            </div>

            {/* Credential Meta Card */}
            <div className="bg-foreground/5 rounded-2xl p-5 border border-white/10 text-left text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <span className="text-oasis-muted flex items-center gap-1.5"><UserCheck size={14} /> Role / Position:</span>
                <span className="font-bold text-white">{data.position || (isApprovedVolunteer ? 'Volunteer' : 'Member')}</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <span className="text-oasis-muted flex items-center gap-1.5"><Building2 size={14} /> Organization:</span>
                <span className="font-semibold text-white">{data.institution_name || 'OASIS Foundation'}</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <span className="text-oasis-muted flex items-center gap-1.5"><MapPin size={14} /> Location:</span>
                <span className="font-semibold text-white">{data.city || 'Pakistan'}</span>
              </div>
              {data.joining_date && (
                <div className="flex items-center justify-between">
                  <span className="text-oasis-muted flex items-center gap-1.5"><Calendar size={14} /> Member Since:</span>
                  <span className="font-semibold text-white">{data.joining_date}</span>
                </div>
              )}
            </div>

            {/* Security Guarantee Notice */}
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-[11px] font-medium flex items-center justify-center gap-2">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>This record has been officially verified by the OASIS Foundation central registry.</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-6">
            <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center mx-auto shadow-lg">
              <AlertCircle size={36} />
            </div>
            <h2 className="text-2xl font-bold text-white">ID Not Found</h2>
            <p className="text-xs text-oasis-muted max-w-sm mx-auto">
              The requested Registration Number or ID code could not be verified in the Oasis record database. Please verify the QR code URL.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
