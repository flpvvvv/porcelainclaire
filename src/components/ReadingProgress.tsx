"use client";

import { useEffect, useState } from "react";
import type { ArticleHeading } from "@/lib/reading";

type ReadingProgressProps = {
  /** Element that spans from article start through readable body (for progress range). */
  targetId: string;
  headings?: ArticleHeading[];
  homeHref?: string;
  articleTitle?: string;
};

/**
 * Reader chrome for long-form reading: top progress, mobile reader dock,
 * optional outline sheet, and a subtle desktop return-to-top control.
 */
export function ReadingProgress({
  targetId,
  headings = [],
  homeHref = "/",
  articleTitle = "文章",
}: ReadingProgressProps) {
  const [progress, setProgress] = useState(0);
  const [showChrome, setShowChrome] = useState(false);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReduceMotion(media.matches);

    updatePreference();
    media.addEventListener?.("change", updatePreference);

    return () => media.removeEventListener?.("change", updatePreference);
  }, []);

  useEffect(() => {
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
      setShowChrome(window.scrollY > elTop - viewH * 0.35);
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
  }, [reduceMotion, targetId]);

  useEffect(() => {
    if (!outlineOpen) return;

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [outlineOpen]);

  useEffect(() => {
    if (!outlineOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOutlineOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [outlineOpen]);

  const progressLabel = `${Math.round(progress)}%`;

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  return (
    <>
      <div className="top-reading-progress" aria-hidden="true">
        <span
          className="motion-safe:transition-[transform] motion-safe:duration-150 motion-safe:ease-out"
          style={{
            transform: `scaleX(${progress / 100})`,
          }}
        />
      </div>

      <div
        className={`reader-dock lg:hidden transition-all duration-300 ${
          showChrome
            ? "translate-y-0 opacity-100"
            : "translate-y-8 opacity-0 motion-reduce:translate-y-0"
        }`}
      >
        <div className="reader-dock-inner">
          {headings.length > 0 ? (
            <button
              type="button"
              className="reader-dock-button px-3 text-sm font-medium"
              onClick={() => setOutlineOpen(true)}
              aria-label="打开目录"
            >
              目录
            </button>
          ) : (
            <a
              href={homeHref}
              className="reader-dock-button px-3 text-sm font-medium"
            >
              首页
            </a>
          )}

          <div className="reader-dock-progress">
            <div className="flex items-center justify-between gap-3">
              <span className="truncate text-xs font-medium text-foreground-secondary">
                阅读进度
              </span>
              <span className="text-xs tabular-nums text-foreground">
                {progressLabel}
              </span>
            </div>
            <div className="reader-dock-progress-track mt-2">
              <div
                className="reader-dock-progress-fill motion-safe:transition-[width] motion-safe:duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            className="reader-dock-button px-3 text-sm font-medium"
            onClick={scrollToTop}
            aria-label="返回顶部"
          >
            顶部
          </button>
        </div>
      </div>

      <button
        type="button"
        className={`desktop-back-top fixed bottom-6 right-6 z-[64] hidden lg:inline-flex ${
          showChrome && progress > 8 ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={scrollToTop}
        aria-label="返回顶部"
      >
        回到顶部
        <span className="text-xs tabular-nums text-foreground-tertiary">
          {progressLabel}
        </span>
      </button>

      {outlineOpen && headings.length > 0 && (
        <div
          className="reader-sheet lg:hidden"
          role="presentation"
          onClick={() => setOutlineOpen(false)}
        >
          <div
            className="reader-sheet-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reader-outline-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 border-b border-border/70 bg-surface/95 px-5 py-4 backdrop-blur-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="section-kicker">阅读目录</p>
                  <h2
                    id="reader-outline-title"
                    className="font-display mt-2 text-lg font-semibold text-foreground"
                  >
                    {articleTitle}
                  </h2>
                </div>
                <button
                  type="button"
                  className="reader-dock-button border border-border/70 px-3 text-sm"
                  onClick={() => setOutlineOpen(false)}
                  aria-label="关闭目录"
                >
                  关闭
                </button>
              </div>
            </div>

            <nav
              className="space-y-1 px-3 py-3"
              aria-label={`${articleTitle} 目录`}
            >
              {headings.map((heading) => (
                <a
                  key={heading.id}
                  href={`#${heading.id}`}
                  className="article-outline-link"
                  data-level={heading.level}
                  onClick={() => setOutlineOpen(false)}
                >
                  {heading.text}
                </a>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
