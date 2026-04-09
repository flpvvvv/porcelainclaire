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
      className="tag-cloud-canvas relative z-[1] h-[min(62vh,520px)] min-h-[320px] w-full touch-pan-y sm:min-h-[380px] sm:h-[min(56vh,600px)]"
      role="region"
      aria-label="主题标签云"
    >
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
        aria-hidden
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,var(--accent-soft)_0%,transparent_58%)] opacity-45" />
      </div>

      <div
        className="relative h-full w-full overflow-hidden"
        role="list"
        style={{
          opacity: placed && placed.length > 0 ? 1 : 0,
          transition: "opacity 200ms ease",
        }}
      >
        {ordered.map((p) => {
          const isActive = activeTag === p.tag;
          const href = isActive ? "/" : `/?tag=${encodeURIComponent(p.tag)}`;
          return (
            <Link
              key={p.tag}
              href={href}
              scroll={false}
              role="listitem"
              data-tier={p.tier}
              data-active={isActive ? "true" : undefined}
              aria-current={isActive ? "page" : undefined}
              aria-label={`标签 ${p.tag}，${p.articleCount} 篇${isActive ? "，已选中" : ""}`}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                transform: `translate3d(${p.x}px, ${p.y}px, 0)`,
                zIndex: p.tier,
                maxWidth: "min(100%, 18rem)",
              }}
              className={[
                "tag-cloud-link pointer-events-auto inline-flex min-h-11 max-w-full cursor-pointer select-none items-center justify-center rounded-full border text-center shadow-sm transition-[border-color,background-color,color,box-shadow] duration-200 motion-reduce:transition-none",
                TAG_CLOUD_TIER_CLASSES[p.tier],
                isActive
                  ? "tag-cloud-link--active border-transparent bg-accent text-accent-foreground shadow-[var(--float-shadow)] hover:bg-accent-hover hover:text-accent-foreground"
                  : "border-border/70 bg-surface/80 text-accent hover:border-border-strong hover:bg-accent-soft/90 hover:text-accent-hover",
              ].join(" ")}
            >
              <span className="break-words">{p.tag}</span>
            </Link>
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
