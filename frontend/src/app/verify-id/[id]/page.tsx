import { ShieldCheck, CheckCircle2, AlertCircle, School, MapPin } from "lucide-react";

async function getVerificationData(regOrUuid: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://oasis-skills-portal.onrender.com';
    const res = await fetch(`${apiUrl}/api/users/public-verify-id/${encodeURIComponent(regOrUuid)}`, {
      cache: 'no-store'
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

export default async function VerifyIdPage({ params }: { params: { id: string } }) {
  const data = await getVerificationData(params.id);

  return (
    <div className="flex flex-col min-h-screen pt-24 pb-20 justify-center items-center px-4">
      <div className="glass-card bg-oasis-bgSecondary rounded-3xl max-w-md w-full p-8 border border-oasis-emerald/40 text-center shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-oasis-emerald/10 rounded-full blur-2xl"></div>

        {data ? (
          <div className="space-y-5 relative z-10">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg">
              <ShieldCheck size={36} />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full bg-oasis-emerald/20 text-oasis-emerald text-[11px] font-bold uppercase tracking-wider">
                Official Authentic ID
              </span>
              <h1 className="text-2xl font-bold text-foreground mt-2">{data.full_name}</h1>
              <p className="text-xs text-oasis-emerald font-mono font-semibold mt-1">
                {data.registration_number}
              </p>
            </div>

            <div className="bg-foreground/5 rounded-2xl p-4 border border-foreground/10 text-left text-xs space-y-2.5">
              <div className="flex justify-between border-b border-foreground/5 pb-2">
                <span className="text-oasis-muted">Position:</span>
                <span className="font-bold text-foreground">{data.position || 'Volunteer'}</span>
              </div>
              <div className="flex justify-between border-b border-foreground/5 pb-2">
                <span className="text-oasis-muted">User Type:</span>
                <span className="font-bold text-foreground capitalize">{data.user_type}</span>
              </div>
              <div className="flex justify-between border-b border-foreground/5 pb-2">
                <span className="text-oasis-muted">Institution:</span>
                <span className="font-medium text-foreground">{data.institution_name || 'Oasis Foundation'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-oasis-muted">City / Location:</span>
                <span className="font-medium text-foreground">{data.city || 'Pakistan'}</span>
              </div>
            </div>

            <div className="pt-2 text-xs text-emerald-400 font-medium flex items-center justify-center gap-1.5">
              <CheckCircle2 size={16} /> This member is active and verified by OASIS Foundation.
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center mx-auto">
              <AlertCircle size={36} />
            </div>
            <h2 className="text-2xl font-bold text-foreground">ID Not Found</h2>
            <p className="text-xs text-oasis-muted">
              The requested Registration Number or ID code could not be verified in the Oasis record database.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
