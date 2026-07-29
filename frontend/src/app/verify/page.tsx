"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifySearchPage() {
  const [uuid, setUuid] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (uuid.trim()) {
      router.push(`/verify/${uuid.trim()}`);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 bg-oasis-bg flex items-center justify-center px-4">
      <div className="w-full max-w-2xl text-center">
        
        <div className="inline-flex items-center justify-center p-4 bg-oasis-gold/10 rounded-3xl mb-8">
          <ShieldCheck className="text-oasis-gold" size={56} />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6">Verify a Certificate</h1>
        <p className="text-oasis-muted text-lg mb-12 max-w-xl mx-auto">
          Enter the unique Certificate ID located at the bottom of the certificate to verify its authenticity.
        </p>
        
        <form onSubmit={handleSearch} className="relative max-w-xl mx-auto">
          <div className="relative flex items-center">
            <Search className="absolute left-6 text-foreground/40" size={24} />
            <input 
              type="text" 
              value={uuid}
              onChange={(e) => setUuid(e.target.value)}
              placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
              className="w-full h-16 bg-foreground/5 border border-foreground/10 rounded-full pl-16 pr-36 text-foreground focus:outline-none focus:border-oasis-gold/50 focus:bg-foreground/10 transition-colors font-mono text-sm"
              required
            />
            <Button 
              type="submit" 
              className="absolute right-2 h-12 px-6 bg-oasis-gold hover:bg-yellow-400 text-black font-semibold rounded-full shadow-[0_0_15px_rgba(255,198,65,0.3)] transition-all"
            >
              Verify
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
}
