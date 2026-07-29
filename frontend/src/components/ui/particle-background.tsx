"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let mouse = { x: width / 2, y: height / 2 };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    window.addEventListener("mousemove", handleMouseMove);
    
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const particles: any[] = [];
    
    // Use slightly different colors based on theme
    const isLight = resolvedTheme === "light";
    const colors = isLight 
      ? ["#00c96d", "#f5c842", "#0099cc", "#8a9eb5"] // Bolder colors for light mode
      : ["#00d47e", "#ffc641", "#00d4ff", "#f0f4f8"];

    for (let i = 0; i < 500; i++) { // Increased to 500
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.8, // Slightly faster drifting
        vy: (Math.random() - 0.5) * 0.8,
        size: Math.random() * 3 + 1.5, // Larger base size
        color: colors[Math.floor(Math.random() * colors.length)],
        baseX: Math.random() * width,
        baseY: Math.random() * height,
      });
    }

    let animationId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        let p = particles[i];

        // Normal drifting
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Cursor interaction (repel)
        let dx = mouse.x - p.x;
        let dy = mouse.y - p.y;
        let dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 180) { // Increased interaction radius
          p.x -= dx * 0.03;
          p.y -= dy * 0.03;
        }

        ctx.fillStyle = p.color;
        // Drawing glitters as small squares matching the oasis aesthetic
        // Increased base opacity for better visibility
        ctx.globalAlpha = Math.max(0.25, 1 - (dist / 400));
        
        // Add a subtle glow effect
        ctx.shadowBlur = isLight ? 2 : 5;
        ctx.shadowColor = p.color;
        
        // Draw square
        ctx.fillRect(p.x, p.y, p.size, p.size);
        
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
    };
  }, [resolvedTheme]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0 opacity-80 dark:opacity-100 transition-opacity duration-700"
    />
  );
}
