"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import type { TagCloudItem } from "@/lib/tags";
import {
  hashCloudSeed,
  layoutTagCloud,
  type CloudLayoutPlaced,
} from "@/lib/tag-cloud-layout";
import {
  cloudCountBounds,
  estimateChipSize,
  TAG_CLOUD_TIER_CLASSES,
  tierFromCount,
} from "@/lib/tag-cloud-weights";

const TAG_GAP = 6;
const MAX_TAGS_NARROW = 40;
const MAX_TAGS_WIDE = 64;
const WIDTH_BUCKET = 72;
const HEIGHT_BUCKET = 80;

type MagneticTagCloudProps = {
  items: TagCloudItem[];
  activeTag?: string | null;
};

function computeLayout(
  items: TagCloudItem[],
  cw: number,
  ch: number,
): CloudLayoutPlaced[] {
  if (items.length === 0 || cw < 40 || ch < 40) return [];

  const isNarrow = cw < 640;
  const maxTags = isNarrow ? MAX_TAGS_NARROW : MAX_TAGS_WIDE;
  const visible = items.slice(0, Math.min(maxTags, items.length));
  const { minC, maxC } = cloudCountBounds(visible);

  const inputs = visible.map((item) => {
    const tier = tierFromCount(item.articleCount, minC, maxC);
    const { w, h } = estimateChipSize(item.tag, tier);
    return {
      tag: item.tag,
      articleCount: item.articleCount,
      w,
      h,
      tier,
    };
  });

  const bucket = Math.floor(cw / WIDTH_BUCKET);
  const seed = hashCloudSeed([...visible.map((i) => i.tag), String(bucket)]);

  return layoutTagCloud(inputs, cw, ch, { gap: TAG_GAP, seed });
}

function readingOrder(a: CloudLayoutPlaced, b: CloudLayoutPlaced) {
  const dy = a.y - b.y;
  if (Math.abs(dy) > 6) return dy;
  return a.x - b.x;
}

export function MagneticTagCloud({ items, activeTag }: MagneticTagCloudProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [placed, setPlaced] = useState<CloudLayoutPlaced[] | null>(null);
  const [hoveredTag, setHoveredTag] = useState<string | null>(null);
  const lastKeyRef = useRef<string>("");

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    lastKeyRef.current = "";

    const layoutKeyFor = (cw: number, ch: number) => {
      const wB = Math.floor(cw / WIDTH_BUCKET);
      const hB = Math.floor(ch / HEIGHT_BUCKET);
      const breakpoint = cw < 640 ? "sm" : "md";
      const itemSig = items.map((i) => `${i.tag}:${i.articleCount}`).join("|");
      return `${itemSig}|${wB}|${hB}|${breakpoint}`;
    };

    const compute = () => {
      if (items.length === 0) {
        lastKeyRef.current = "";
        setPlaced([]);
        return;
      }
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      if (cw < 40 || ch < 40) return;

      const key = layoutKeyFor(cw, ch);
      if (key === lastKeyRef.current) return;

      const next = computeLayout(items, cw, ch);
      lastKeyRef.current = key;
      setPlaced(next);
    };

    compute();

    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      compute();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [items]);

  const ordered = placed ? [...placed].sort(readingOrder) : [];

  return (
    <div
      ref={containerRef}
      className="tag-cloud-canvas relative z-[1] h-[min(65vh,600px)] min-h-[400px] w-full touch-pan-y sm:min-h-[480px] sm:h-[min(65vh,700px)]"
      role="region"
      aria-label="主题标签云"
    >
      <style>{`
        @keyframes tag-breathe {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .tag-cloud-item-wrapper {
          position: absolute;
          left: 0;
          top: 0;
          transition: opacity 400ms ease, filter 400ms ease;
        }
        .tag-cloud-item-wrapper.dimmed {
          opacity: 0.72;
          filter: grayscale(18%);
        }
        .tag-cloud-item-wrapper.highlighted {
          z-index: 100 !important;
        }
        .tag-cloud-link {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.3rem; /* sharp, museum-label like */
          background: var(--surface);
          color: var(--foreground);
          font-family: var(--font-serif);
          border: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
          box-shadow: 0 4px 12px rgba(0,0,0,0.03), 0 1px 3px rgba(0,0,0,0.02);
          transition: all 400ms cubic-bezier(0.25, 1, 0.5, 1);
          transform-origin: center center;
          cursor: pointer;
          text-decoration: none;
          pointer-events: auto;
          user-select: none;
          max-width: 100%;
        }
        .tag-cloud-link::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          box-shadow: 0 12px 32px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04);
          opacity: 0;
          transition: opacity 400ms ease;
          pointer-events: none;
        }
        .tag-cloud-link:hover {
          transform: scale(1.08) rotate(0deg) !important;
          background: var(--foreground);
          color: var(--surface);
          border-color: transparent;
        }
        .tag-cloud-link:hover::before {
          opacity: 1;
        }
        .tag-cloud-link--active {
          background: var(--accent);
          color: var(--accent-foreground);
          border-color: transparent;
          box-shadow: var(--float-shadow);
        }
      `}</style>
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
        aria-hidden
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,var(--accent-soft)_0%,transparent_65%)] opacity-60" />
        {/* Add some subtle noise texture */}
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>
      </div>

      <div
        className="relative h-full w-full overflow-hidden"
        role="list"
        style={{
          opacity: placed && placed.length > 0 ? 1 : 0,
          transition: "opacity 400ms ease",
        }}
        onMouseLeave={() => setHoveredTag(null)}
      >
        {ordered.map((p, i) => {
          const isActive = activeTag === p.tag;
          const isHovered = hoveredTag === p.tag;
          const isDimmed = hoveredTag !== null && !isHovered && !isActive;
          const href = isActive ? "/" : `/?tag=${encodeURIComponent(p.tag)}`;
          
          // Generate deterministic random values based on index
          const rand = Math.sin(i * 1234.5) * 10000;
          const randVal = rand - Math.floor(rand);
          const rotation = (randVal - 0.5) * 12; // -6 to 6 degrees
          const animDelay = randVal * -4; // 0 to -4s

          return (
            <div
              key={p.tag}
              className={`tag-cloud-item-wrapper ${isDimmed ? 'dimmed' : ''} ${isHovered || isActive ? 'highlighted' : ''}`}
              style={{
                transform: `translate3d(${p.x}px, ${p.y}px, 0)`,
                zIndex: p.tier,
                maxWidth: "min(100%, 18rem)",
              }}
            >
              <div 
                style={{ 
                  animation: `tag-breathe ${4 + randVal * 2}s ease-in-out ${animDelay}s infinite alternate` 
                }}
              >
                <Link
                  href={href}
                  scroll={false}
                  role="listitem"
                  data-tier={p.tier}
                  data-active={isActive ? "true" : undefined}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={`标签 ${p.tag}，${p.articleCount} 篇${isActive ? "，已选中" : ""}`}
                  onMouseEnter={() => setHoveredTag(p.tag)}
                  onFocus={() => setHoveredTag(p.tag)}
                  onBlur={() => setHoveredTag(null)}
                  style={{
                    transform: `rotate(${rotation}deg)`,
                  }}
                  className={[
                    "tag-cloud-link motion-reduce:transition-none motion-reduce:animation-none",
                    TAG_CLOUD_TIER_CLASSES[p.tier],
                    isActive ? "tag-cloud-link--active" : "",
                  ].join(" ")}
                >
                  <span className="break-words">{p.tag}</span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {!placed || placed.length === 0 ? (
        <span className="sr-only" aria-live="polite">
          标签云布局中
        </span>
      ) : null}
    </div>
  );
}
