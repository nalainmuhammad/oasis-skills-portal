import { Certificate } from "@/lib/api/certificates";
import { Download, ExternalLink, ShieldCheck, RefreshCw, XCircle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { PdfDownloader } from "./pdf-downloader";

export function CertificateCard({ certificate }: { certificate: Certificate }) {
  const isGenerated = certificate.status === 'generated';
  const isPending = certificate.status === 'pending';
  const isFailed = certificate.status === 'failed';
  const isRevoked = certificate.status === 'revoked';

  return (
    <div className={`glass-card rounded-2xl overflow-hidden border ${isGenerated ? 'border-oasis-gold/30 hover:shadow-[0_0_30px_rgba(255,198,65,0.15)]' : 'border-foreground/10'} transition-all flex flex-col`}>
      <div className="p-6 border-b border-foreground/5 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3">
            {isGenerated && <Badge className="bg-oasis-gold text-black hover:bg-oasis-gold"><ShieldCheck size={14} className="mr-1" /> Verified</Badge>}
            {isPending && <Badge variant="outline" className="text-oasis-emerald border-oasis-emerald/50 animate-pulse"><RefreshCw size={14} className="mr-1 animate-spin" /> Generating</Badge>}
            {isFailed && <Badge variant="destructive" className="bg-red-500/20 text-red-500 hover:bg-red-500/20"><XCircle size={14} className="mr-1" /> Failed</Badge>}
            {isRevoked && <Badge variant="outline" className="text-foreground/40 border-foreground/20 line-through">Revoked</Badge>}
          </div>
          <h3 className="text-xl font-display font-bold text-foreground leading-tight mb-1">{certificate.course_title_snapshot || certificate.title_snapshot || 'Certificate'}</h3>
          <p className="text-sm text-oasis-muted">Issued on {new Date(certificate.issued_at).toLocaleDateString()}</p>
        </div>
      </div>
      
      <div className="p-4 bg-foreground/[0.02] mt-auto">
        <div className="flex flex-col sm:flex-row gap-3">
          {isGenerated ? (
            <>
              <PdfDownloader 
                verificationUuid={certificate.verification_uuid}
                recipientName={certificate.recipient_name_snapshot || "Student"}
                courseTitle={certificate.course_title_snapshot || certificate.title_snapshot || 'Certificate'}
                issuedAt={certificate.issued_at}
                hostUrl={typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}
              />
              <Link 
                href={`/verify/${certificate.verification_uuid}`}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-foreground/5 text-foreground hover:bg-foreground/10 transition-colors font-medium text-sm border border-foreground/10"
              >
                <ExternalLink size={16} /> Public Link
              </Link>
            </>
          ) : (
            <div className="w-full text-center py-2.5 text-sm text-foreground/40">
              {isPending ? "Your certificate will be ready shortly." : "Certificate unavailable."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
