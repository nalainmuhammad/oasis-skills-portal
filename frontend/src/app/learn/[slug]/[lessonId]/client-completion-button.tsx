"use client";

import { useState, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { useFormStatus } from "react-dom";

export function ClientCompletionButton({ isVideo }: { isVideo: boolean }) {
  const [canComplete, setCanComplete] = useState(!isVideo);
  const { pending } = useFormStatus();

  useEffect(() => {
    if (!isVideo) return;
    const handleProgress = () => setCanComplete(true);
    window.addEventListener('video-progress-80', handleProgress);
    return () => window.removeEventListener('video-progress-80', handleProgress);
  }, [isVideo]);

  return (
    <div className="flex flex-col items-end">
      <button 
        type="submit" 
        disabled={!canComplete || pending}
        className={`px-6 py-3 rounded-full border transition-colors font-medium flex items-center gap-2 ${
          !canComplete || pending 
            ? 'bg-foreground/5 text-foreground/40 border-foreground/10 cursor-not-allowed' 
            : 'bg-oasis-emerald/10 text-oasis-emerald border-oasis-emerald/20 hover:bg-oasis-emerald hover:text-black'
        }`}
      >
        <CheckCircle2 size={18} /> {pending ? "Completing..." : "Mark as Complete"}
      </button>
      {!canComplete && <p className="text-xs text-foreground/40 mt-2">Watch at least 80% of the video to complete</p>}
    </div>
  );
}
