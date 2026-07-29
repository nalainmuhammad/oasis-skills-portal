"use client";

import MuxPlayer from "@mux/mux-player-react";
import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

interface VideoPlayerProps {
  playbackId: string;
  lessonId: number;
  title?: string;
}

export function VideoPlayer({ playbackId, lessonId, title }: VideoPlayerProps) {
  const { data: session } = useSession();
  const playerRef = useRef<any>(null);

  const watchedSeconds = useRef(new Set<number>());

  useEffect(() => {
    // Implement heartbeat for progress tracking
    const interval = setInterval(() => {
      const player = playerRef.current;
      if (player && !player.paused) {
        // Send heartbeat to backend
        // fetch(`/api/lessons/${lessonId}/progress`, { ... })
      }
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [lessonId]);

  return (
    <div className="w-full h-full relative group">
      <MuxPlayer
        ref={playerRef}
        playbackId={playbackId}
        metadata={{
          video_title: title || "Lesson Video",
        }}
        accentColor="#00d47e"
        className="w-full h-full object-contain bg-black"
        autoPlay
        onTimeUpdate={(e) => {
          const target = e.target as HTMLMediaElement;
          watchedSeconds.current.add(Math.floor(target.currentTime));
          if (target.duration) {
            const pctWatched = (watchedSeconds.current.size / target.duration) * 100;
            if (pctWatched >= 80) {
              window.dispatchEvent(new CustomEvent('video-progress-80'));
            }
          }
        }}
      />
      
      {/* Watermark overlay per security requirements */}
      {session?.user?.email && (
        <div className="absolute inset-0 pointer-events-none flex flex-wrap content-between justify-between overflow-hidden opacity-[0.03] p-10 z-10">
          {Array(10).fill(null).map((_, i) => (
            <div key={i} className="text-foreground/80 font-mono text-sm transform -rotate-12 select-none w-1/3 text-center my-10">
              {session.user.email}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
