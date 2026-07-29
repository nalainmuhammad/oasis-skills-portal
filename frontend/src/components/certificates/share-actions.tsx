"use client";

import { useState } from "react";
import { Share2, Check, ExternalLink, Award } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShareActionsProps {
  recipientName: string;
  courseTitle: string;
  verificationUuid: string;
}

export function ShareActions({ recipientName, courseTitle, verificationUuid }: ShareActionsProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/verify/${verificationUuid}`
    : `https://oasislearn.netlify.app/verify/${verificationUuid}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleLinkedInShare = () => {
    const linkedInUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(courseTitle)}&organizationName=${encodeURIComponent("OASIS Foundation")}&issueYear=${new Date().getFullYear()}&issueMonth=${new Date().getMonth() + 1}&certUrl=${encodeURIComponent(shareUrl)}&certId=${encodeURIComponent(verificationUuid)}`;
    window.open(linkedInUrl, "_blank");
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 pt-6 border-t border-foreground/10">
      <Button
        onClick={handleLinkedInShare}
        className="bg-[#0A66C2] hover:bg-[#004182] text-white font-medium rounded-xl h-10 px-4 flex items-center gap-2 transition-all shadow-md"
      >
        <Award size={16} /> Add to LinkedIn Profile
      </Button>

      <Button
        onClick={handleCopyLink}
        variant="outline"
        className="border-foreground/20 hover:bg-foreground/10 text-foreground font-medium rounded-xl h-10 px-4 flex items-center gap-2 transition-all"
      >
        {copied ? (
          <>
            <Check size={16} className="text-oasis-emerald" /> Link Copied!
          </>
        ) : (
          <>
            <Share2 size={16} /> Share Verification Link
          </>
        )}
      </Button>
    </div>
  );
}
