"use client";

import { useEffect, useState, useRef } from "react";
import gsap from "gsap";

export function Preloader() {
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const barContainerRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const percentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (sessionStorage.getItem("oasis_preloader_played")) {
      setIsLoaded(true);
      return;
    }
    
    sessionStorage.setItem("oasis_preloader_played", "true");

    const fallbackTimer = setTimeout(() => {
      setIsLoaded(true);
    }, 2000);

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.to(containerRef.current, {
          clipPath: 'inset(0 0 100% 0)',
          duration: 0.4,
          ease: 'power3.inOut',
          onComplete: () => {
            clearTimeout(fallbackTimer);
            setIsLoaded(true);
          }
        });
      }
    });

    const letters = logoRef.current?.querySelectorAll('span');
    if (letters && letters.length > 0) {
      tl.set(logoRef.current, { opacity: 1 });
      tl.to(letters, {
        opacity: 1,
        y: 0,
        rotateX: 0,
        duration: 0.3,
        stagger: 0.04,
        ease: 'back.out(1.5)',
      }, 0.1);
    }

    tl.to(barContainerRef.current, { opacity: 1, duration: 0.2 }, 0.3);
    tl.to(percentRef.current, { opacity: 1, duration: 0.2 }, 0.3);

    tl.to(barRef.current, {
      width: '100%',
      duration: 0.6,
      ease: 'power2.inOut',
      onUpdate: function() {
        if (percentRef.current) {
          const progress = Math.round(this.progress() * 100);
          percentRef.current.textContent = progress + '%';
        }
      }
    }, 0.4);

    if (letters && letters.length > 0) {
      tl.to(letters, {
        opacity: 0,
        y: -20,
        rotateX: 90,
        duration: 0.2,
        stagger: 0.02,
        ease: 'power3.in',
      }, 1.0);
    }

    tl.to(barContainerRef.current, { opacity: 0, duration: 0.2 }, 1.0);
    tl.to(percentRef.current, { opacity: 0, duration: 0.2 }, 1.0);

    return () => {
      clearTimeout(fallbackTimer);
      tl.kill();
    };
  }, []);

  if (isLoaded) return null;

  return (
    <div id="loader" ref={containerRef}>
      <div className="loader-logo" ref={logoRef}>
        <span>O</span><span>A</span><span>S</span><span>I</span><span>S</span>
      </div>
      <div className="loader-bar-container" ref={barContainerRef}>
        <div className="loader-bar" ref={barRef}></div>
      </div>
      <div className="loader-percent" ref={percentRef}>0%</div>
    </div>
  );
}
