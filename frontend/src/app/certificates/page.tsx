import { auth } from "@/auth";
import { getMyCertificates } from "@/lib/api/certificates";
import { CertificateCard } from "@/components/certificates/certificate-card";
import { Award, BookOpen } from "lucide-react";
import Link from "next/link";

export default async function CertificatesPage() {
  const session = await auth();
  const certificates = await getMyCertificates();

  return (
    <div className="flex flex-col min-h-screen pt-24 pb-20">
      <section className="py-12 bg-oasis-bgSecondary/30 border-b border-foreground/5">
        <div className="container mx-auto px-4 md:px-6">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2 flex items-center gap-3">
            <Award className="text-oasis-gold" size={36} /> My Certificates
          </h1>
          <p className="text-oasis-muted">
            Manage your earned certificates and verified credentials.
          </p>
        </div>
      </section>

      <section className="py-12 flex-grow">
        <div className="container mx-auto px-4 md:px-6">
          {certificates.length === 0 ? (
            <div className="text-center py-16 bg-foreground/5 rounded-2xl border border-foreground/10 max-w-2xl mx-auto">
              <Award size={64} className="text-foreground/10 mx-auto mb-6" />
              <h3 className="text-xl font-medium text-foreground mb-3">No certificates earned yet</h3>
              <p className="text-oasis-muted mb-8 text-lg">Complete courses and final assessments to earn verified certificates you can share with employers.</p>
              <Link href="/dashboard" className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-oasis-emerald text-black font-semibold hover:bg-oasis-emeraldLight transition-colors">
                <BookOpen size={18} /> Continue Learning
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {certificates.map(cert => (
                <CertificateCard key={cert.verification_uuid} certificate={cert} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
