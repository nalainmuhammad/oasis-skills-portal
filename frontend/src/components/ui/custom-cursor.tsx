"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only run on desktop
    if (typeof window !== "undefined" && window.innerWidth <= 768) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let cursorX = 0, cursorY = 0;
    let dotX = 0, dotY = 0;
    let ringX = 0, ringY = 0;

    const onMouseMove = (e: MouseEvent) => {
      cursorX = e.clientX;
      cursorY = e.clientY;
    };

    window.addEventListener('mousemove', onMouseMove);

    // Magnetic elements logic - query all buttons and links
    const setupMagnetic = () => {
      const magneticEls = document.querySelectorAll('button, a, [data-magnetic]');
      magneticEls.forEach(el => {
        // Prevent multiple listeners if re-running
        const hEl = el as HTMLElement;
        if (hEl.dataset.magneticInit) return;
        hEl.dataset.magneticInit = "true";

        hEl.addEventListener('mouseenter', () => {
          ring.classList.add('hover');
          dot.classList.add('hover');
        });
        
        hEl.addEventListener('mouseleave', () => {
          ring.classList.remove('hover');
          dot.classList.remove('hover');
        });
      });
    };

    const setupTextHover = () => {
      document.querySelectorAll('h1, h2, h3, p, .section-desc').forEach(el => {
        const hEl = el as HTMLElement;
        if (hEl.dataset.textInit) return;
        hEl.dataset.textInit = "true";

        hEl.addEventListener('mouseenter', () => ring.classList.add('text-hover'));
        hEl.addEventListener('mouseleave', () => ring.classList.remove('text-hover'));
      });
    };

    // Run setup initially
    setupMagnetic();
    setupTextHover();

    // Re-run setup occasionally or observe mutations if dynamic content
    const observer = new MutationObserver(() => {
      setupMagnetic();
      setupTextHover();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    let animationFrameId: number;
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const animateCursor = () => {
      dotX = lerp(dotX, cursorX, 0.2);
      dotY = lerp(dotY, cursorY, 0.2);
      ringX = lerp(ringX, cursorX, 0.1);
      ringY = lerp(ringY, cursorY, 0.1);

      dot.style.transform = `translate(${dotX}px, ${dotY}px) translate(-50%, -50%)`;
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;

      animationFrameId = requestAnimationFrame(animateCursor);
    };
    
    animateCursor();

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <div className="cursor-dot" ref={dotRef}></div>
      <div className="cursor-ring" ref={ringRef}></div>
    </>
  );
}
