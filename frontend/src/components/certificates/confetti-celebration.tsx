"use client";

import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  tilt: number;
  opacity: number;
  speedX: number;
  speedY: number;
  shape: 'rect' | 'circle' | 'star';
}

export function ConfettiCelebration() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const colors = ["#00d47e", "#ffc641", "#ffffff", "#4dffb4", "#ffd700", "#38ef7d", "#00b4d8"];
    const shapes: ('rect' | 'circle' | 'star')[] = ['rect', 'circle', 'star'];
    
    // Increased particle count and longer duration
    const count = 90;
    const initialParticles: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage
      y: Math.random() * -30 - 5, // start above viewport for realistic rain
      size: Math.random() * 9 + 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 360,
      opacity: 1,
      speedX: (Math.random() - 0.5) * 1.5,
      speedY: Math.random() * 1.2 + 0.8, // slower fall for longer celebration
      shape: shapes[Math.floor(Math.random() * shapes.length)],
    }));

    setParticles(initialParticles);

    const interval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            y: p.y + p.speedY * 0.6,
            x: p.x + Math.sin(p.y * 0.05) * 0.5 + p.speedX * 0.4,
            tilt: p.tilt + 8,
            opacity: p.y > 90 ? p.opacity - 0.015 : p.opacity,
          }))
          .filter((p) => p.opacity > 0 && p.y < 110)
      );
    }, 35);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-30">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute transform transition-transform"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.shape !== 'star' ? p.color : 'transparent',
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
            opacity: p.opacity,
            transform: `rotate(${p.tilt}deg)`,
            boxShadow: `0 0 8px ${p.color}aa`,
          }}
        >
          {p.shape === 'star' && (
            <svg viewBox="0 0 24 24" fill={p.color} className="w-full h-full">
              <path d="M12 1.5l3.09 6.26L22 8.77l-5 4.87 1.18 6.88L12 17.27l-6.18 3.25L7 13.64 2 8.77l6.91-1.01L12 1.5z" />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
}
