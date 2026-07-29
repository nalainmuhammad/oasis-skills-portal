"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function GsapAnimations() {
  const pathname = usePathname();

  useEffect(() => {
    // Delay slightly to let Next.js hydrate dynamic content & components
    const timer = setTimeout(() => {
      const observerCallback: IntersectionObserverCallback = (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            // Unobserve once animated for zero ongoing overhead
            observer.unobserve(entry.target);
          }
        });
      };

      const observerOptions: IntersectionObserverInit = {
        root: null,
        rootMargin: "0px 0px -40px 0px",
        threshold: 0.08,
      };

      const observer = new IntersectionObserver(observerCallback, observerOptions);

      // 1. Explicit elements with data-animate
      const explicitElements = document.querySelectorAll("[data-animate]");
      explicitElements.forEach((el) => {
        const type = el.getAttribute("data-animate") || "fade-up";
        el.classList.add("scroll-reveal");
        if (type !== "fade-up") {
          el.classList.add(type);
        }
        observer.observe(el);
      });

      // 2. Automatically observe cards
      const cards = document.querySelectorAll(".glass-card, .scroll-card, article.group");
      cards.forEach((card) => {
        if (!card.classList.contains("scroll-reveal")) {
          card.classList.add("scroll-reveal");
          observer.observe(card);
        }
      });

      // 3. Automatically observe grid containers with staggered children delay
      const gridContainers = document.querySelectorAll(".grid-animate, [data-grid-animate]");
      gridContainers.forEach((grid) => {
        Array.from(grid.children).forEach((child, idx) => {
          const htmlChild = child as HTMLElement;
          if (!htmlChild.classList.contains("scroll-reveal")) {
            htmlChild.classList.add("scroll-reveal");
            htmlChild.style.transitionDelay = `${Math.min(idx * 70, 350)}ms`;
            observer.observe(htmlChild);
          }
        });
      });

    }, 200);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
