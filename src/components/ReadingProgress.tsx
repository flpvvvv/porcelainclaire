"use client";

import { useEffect, useState } from "react";

type ReadingProgressProps = {
  /** Element that spans from article start through readable body (for progress range). */
  targetId: string;
};

/**
 * Minimal top progress bar for long-form reading.
 */
export function ReadingProgress({ targetId }: ReadingProgressProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const compute = () => {
      const el = document.getElementById(targetId);
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const elTop = window.scrollY + rect.top;
      const height = el.offsetHeight;
      const viewH = window.innerHeight;
      const scrollable = Math.max(height - viewH, 1);
      const scrolled = window.scrollY - elTop + viewH * 0.12;
      const ratio = scrolled / scrollable;
      const next = Math.min(100, Math.max(0, ratio * 100));
      setProgress(next);
    };

    let raf = 0;
    const onScroll = () => {
      if (reduceMotion) {
        compute();
        return;
      }
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(compute);
    };

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [targetId]);

  return (
    <div
      className="pointer-events-none fixed left-0 right-0 top-0 z-[70] h-[2px] bg-transparent"
      aria-hidden="true"
    >
      <div
        className="h-full origin-left bg-accent motion-safe:transition-[transform] motion-safe:duration-150 motion-safe:ease-out"
        style={{
          transform: `scaleX(${progress / 100})`,
          transformOrigin: "left center",
        }}
      />
    </div>
  );
}
