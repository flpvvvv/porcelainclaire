"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  type CloudLayoutPlaced,
  hashCloudSeed,
  layoutTagCloud,
} from "@/lib/tag-cloud-layout";
import {
  cloudCountBounds,
  estimateChipSize,
  TAG_CLOUD_TIER_CLASSES,
  tierFromCount,
} from "@/lib/tag-cloud-weights";
import type { TagCloudItem } from "@/lib/tags";

const TAG_GAP = 6;
const MAX_TAGS_NARROW = 40;
const MAX_TAGS_WIDE = 64;
const WIDTH_BUCKET = 72;
const HEIGHT_BUCKET = 80;

const DRAG_THRESHOLD_PX = 10;
const REPULSION_RADIUS_PX = 168;
const REPULSION_MAX_PUSH_PX = 44;
const COLLISION_RESOLVE_ITERS = 22;

function rectsCloudOverlap(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
  gap: number,
): boolean {
  const pad = gap * 0.5;
  return !(
    ax + aw + pad <= bx ||
    bx + bw + pad <= ax ||
    ay + ah + pad <= by ||
    by + bh + pad <= ay
  );
}

/** Move rect B only; A stays fixed. Same gap semantics as layoutTagCloud. */
function separationDeltaMoveBOnly(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
  gap: number,
): { dx: number; dy: number } {
  const pad = gap * 0.5;
  const ar = ax + aw;
  const ab = ay + ah;
  const br = bx + bw;
  const bb = by + bh;
  const overlapX = Math.min(ar, br) - Math.max(ax, bx);
  const overlapY = Math.min(ab, bb) - Math.max(ay, by);
  if (overlapX <= 0 || overlapY <= 0) return { dx: 0, dy: 0 };

  if (overlapX < overlapY) {
    const midA = ax + aw * 0.5;
    const midB = bx + bw * 0.5;
    if (midB <= midA) {
      return { dx: -(overlapX + pad), dy: 0 };
    }
    return { dx: overlapX + pad, dy: 0 };
  }
  const midAy = ay + ah * 0.5;
  const midBy = by + bh * 0.5;
  if (midBy <= midAy) {
    return { dx: 0, dy: -(overlapY + pad) };
  }
  return { dx: 0, dy: overlapY + pad };
}

/** Equal-and-opposite nudge on the shallow overlap axis so both rects separate. */
function separationPairShift(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
  gap: number,
): { dxa: number; dya: number; dxb: number; dyb: number } {
  const pad = gap * 0.5;
  const ar = ax + aw;
  const ab = ay + ah;
  const br = bx + bw;
  const bb = by + bh;
  const overlapX = Math.min(ar, br) - Math.max(ax, bx);
  const overlapY = Math.min(ab, bb) - Math.max(ay, by);
  if (overlapX <= 0 || overlapY <= 0) {
    return { dxa: 0, dya: 0, dxb: 0, dyb: 0 };
  }

  const halfPad = pad * 0.5;
  if (overlapX < overlapY) {
    const s = overlapX * 0.5 + halfPad;
    const midA = ax + aw * 0.5;
    const midB = bx + bw * 0.5;
    if (midA < midB) {
      return { dxa: -s, dya: 0, dxb: s, dyb: 0 };
    }
    return { dxa: s, dya: 0, dxb: -s, dyb: 0 };
  }
  const s = overlapY * 0.5 + halfPad;
  const midAy = ay + ah * 0.5;
  const midBy = by + bh * 0.5;
  if (midAy < midBy) {
    return { dxa: 0, dya: -s, dxb: 0, dyb: s };
  }
  return { dxa: 0, dya: s, dxb: 0, dyb: -s };
}

function computeSoftRepulsionOffsets(
  placed: CloudLayoutPlaced[],
  draggedTag: string,
  dragDx: number,
  dragDy: number,
  cw: number,
  ch: number,
): Record<string, { x: number; y: number }> {
  const dragged = placed.find((p) => p.tag === draggedTag);
  if (!dragged) return {};

  const cx = dragged.x + dragDx + dragged.w * 0.5;
  const cy = dragged.y + dragDy + dragged.h * 0.5;
  const out: Record<string, { x: number; y: number }> = {};

  for (const p of placed) {
    if (p.tag === draggedTag) continue;
    const ox = p.x + p.w * 0.5;
    const oy = p.y + p.h * 0.5;
    const vx = ox - cx;
    const vy = oy - cy;
    const dist = Math.hypot(vx, vy);
    if (dist < 1e-3 || dist >= REPULSION_RADIUS_PX) continue;
    const falloff = (1 - dist / REPULSION_RADIUS_PX) ** 2;
    const push = falloff * REPULSION_MAX_PUSH_PX;
    const rx = (vx / dist) * push;
    const ry = (vy / dist) * push;
    const nx = Math.min(Math.max(0, p.x + rx), Math.max(0, cw - p.w));
    const ny = Math.min(Math.max(0, p.y + ry), Math.max(0, ch - p.h));
    out[p.tag] = { x: nx - p.x, y: ny - p.y };
  }
  return out;
}

/**
 * Neighbor offsets while dragging: soft repulsion + iterative separation so the
 * dragged chip never overlaps others (layout gap semantics).
 */
function computeRepulsionOffsets(
  placed: CloudLayoutPlaced[],
  draggedTag: string,
  dragDx: number,
  dragDy: number,
  cw: number,
  ch: number,
): Record<string, { x: number; y: number }> {
  const dragged = placed.find((p) => p.tag === draggedTag);
  if (!dragged) return {};

  const soft = computeSoftRepulsionOffsets(
    placed,
    draggedTag,
    dragDx,
    dragDy,
    cw,
    ch,
  );

  const off: Record<string, { x: number; y: number }> = {};
  for (const p of placed) {
    if (p.tag === draggedTag) continue;
    const s = soft[p.tag];
    off[p.tag] = s ? { x: s.x, y: s.y } : { x: 0, y: 0 };
  }

  const dragX = Math.min(
    Math.max(0, dragged.x + dragDx),
    Math.max(0, cw - dragged.w),
  );
  const dragY = Math.min(
    Math.max(0, dragged.y + dragDy),
    Math.max(0, ch - dragged.h),
  );

  const chipWorld = (p: CloudLayoutPlaced) => {
    const o = off[p.tag] ?? { x: 0, y: 0 };
    const wx = Math.min(Math.max(0, p.x + o.x), Math.max(0, cw - p.w));
    const wy = Math.min(Math.max(0, p.y + o.y), Math.max(0, ch - p.h));
    return { x: wx, y: wy, w: p.w, h: p.h };
  };

  const syncOffsetFromWorld = (
    p: CloudLayoutPlaced,
    wx: number,
    wy: number,
  ) => {
    const cx = Math.min(Math.max(0, wx), Math.max(0, cw - p.w));
    const cy = Math.min(Math.max(0, wy), Math.max(0, ch - p.h));
    off[p.tag] = { x: cx - p.x, y: cy - p.y };
  };

  const others = placed.filter((q) => q.tag !== draggedTag);

  for (let iter = 0; iter < COLLISION_RESOLVE_ITERS; iter++) {
    for (const p of others) {
      const w = chipWorld(p);
      if (
        !rectsCloudOverlap(
          dragX,
          dragY,
          dragged.w,
          dragged.h,
          w.x,
          w.y,
          w.w,
          w.h,
          TAG_GAP,
        )
      ) {
        continue;
      }
      const { dx, dy } = separationDeltaMoveBOnly(
        dragX,
        dragY,
        dragged.w,
        dragged.h,
        w.x,
        w.y,
        w.w,
        w.h,
        TAG_GAP,
      );
      syncOffsetFromWorld(p, w.x + dx, w.y + dy);
    }

    for (let i = 0; i < others.length; i++) {
      for (let j = i + 1; j < others.length; j++) {
        const pa = others[i];
        const pb = others[j];
        const ra = chipWorld(pa);
        const rb = chipWorld(pb);
        if (
          !rectsCloudOverlap(
            ra.x,
            ra.y,
            ra.w,
            ra.h,
            rb.x,
            rb.y,
            rb.w,
            rb.h,
            TAG_GAP,
          )
        ) {
          continue;
        }
        const { dxa, dya, dxb, dyb } = separationPairShift(
          ra.x,
          ra.y,
          ra.w,
          ra.h,
          rb.x,
          rb.y,
          rb.w,
          rb.h,
          TAG_GAP,
        );
        syncOffsetFromWorld(pa, ra.x + dxa, ra.y + dya);
        syncOffsetFromWorld(pb, rb.x + dxb, rb.y + dyb);
      }
    }
  }

  const result: Record<string, { x: number; y: number }> = {};
  for (const p of others) {
    const o = off[p.tag];
    if (o && (o.x !== 0 || o.y !== 0)) {
      result[p.tag] = o;
    }
  }
  return result;
}

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

type PointerDragSession = {
  tag: string;
  grabX: number;
  grabY: number;
  originX: number;
  originY: number;
  layoutGen: number;
  pointerId: number;
};

export function MagneticTagCloud({ items, activeTag }: MagneticTagCloudProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [placed, setPlaced] = useState<CloudLayoutPlaced[] | null>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });
  const [hoveredTag, setHoveredTag] = useState<string | null>(null);
  const [drag, setDrag] = useState<{
    tag: string;
    dx: number;
    dy: number;
  } | null>(null);
  const [settledTags, setSettledTags] = useState<string[]>([]);
  const lastKeyRef = useRef<string>("");
  const layoutGenRef = useRef(0);
  const pointerSessionRef = useRef<PointerDragSession | null>(null);
  const movedPastThresholdRef = useRef(false);
  const blockNextClickRef = useRef(false);
  const settleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Stable identity: parent often passes a new array from filter() each render. */
  const itemsContentSig = items
    .map((i) => `${i.tag}:${i.articleCount}`)
    .join("\u001f");

  // Keep the latest items available to the layout effect without making
  // `items` a dependency; only a content change should trigger relayout.
  const itemsRef = useRef(items);
  useLayoutEffect(() => {
    itemsRef.current = items;
  });

  const canDragTag = (tag: string) =>
    activeTag == null || activeTag === "" || tag === activeTag;

  useLayoutEffect(() => {
    const currentItems = itemsRef.current;
    const el = containerRef.current;
    if (!el) return;

    lastKeyRef.current = "";

    const layoutKeyFor = (cw: number, ch: number) => {
      const wB = Math.floor(cw / WIDTH_BUCKET);
      const hB = Math.floor(ch / HEIGHT_BUCKET);
      const breakpoint = cw < 640 ? "sm" : "md";
      return `${itemsContentSig}|${wB}|${hB}|${breakpoint}`;
    };

    const compute = () => {
      if (currentItems.length === 0) {
        lastKeyRef.current = "";
        setCanvasSize({ w: 0, h: 0 });
        setPlaced([]);
        if (settleTimeoutRef.current) {
          clearTimeout(settleTimeoutRef.current);
          settleTimeoutRef.current = null;
        }
        setSettledTags([]);
        return;
      }
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      if (cw < 40 || ch < 40) return;

      setCanvasSize({ w: cw, h: ch });

      const key = layoutKeyFor(cw, ch);
      if (key === lastKeyRef.current) return;

      if (settleTimeoutRef.current) {
        clearTimeout(settleTimeoutRef.current);
        settleTimeoutRef.current = null;
      }
      setSettledTags([]);

      const next = computeLayout(currentItems, cw, ch);
      lastKeyRef.current = key;
      layoutGenRef.current += 1;
      setPlaced(next);
    };

    compute();

    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      compute();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [itemsContentSig]);

  const repulsion = useMemo(() => {
    if (!drag || !placed || canvasSize.w < 40) return {};
    return computeRepulsionOffsets(
      placed,
      drag.tag,
      drag.dx,
      drag.dy,
      canvasSize.w,
      canvasSize.h,
    );
  }, [drag, placed, canvasSize.w, canvasSize.h]);

  useEffect(() => {
    return () => {
      if (settleTimeoutRef.current) {
        clearTimeout(settleTimeoutRef.current);
        settleTimeoutRef.current = null;
      }
    };
  }, []);

  const endDragSession = (
    el: HTMLElement | null,
    pointerId: number | null,
    options?: { commit?: boolean },
  ) => {
    if (el != null && pointerId != null) {
      try {
        el.releasePointerCapture(pointerId);
      } catch {
        /* already released */
      }
    }

    const commit = options?.commit === true;
    if (
      commit &&
      drag &&
      placed &&
      canvasSize.w >= 40 &&
      movedPastThresholdRef.current
    ) {
      const rep = computeRepulsionOffsets(
        placed,
        drag.tag,
        drag.dx,
        drag.dy,
        canvasSize.w,
        canvasSize.h,
      );
      setPlaced((prev) => {
        if (!prev) return prev;
        return prev.map((p) => {
          if (p.tag === drag.tag) {
            return { ...p, x: p.x + drag.dx, y: p.y + drag.dy };
          }
          const r = rep[p.tag];
          if (r) {
            return { ...p, x: p.x + r.x, y: p.y + r.y };
          }
          return p;
        });
      });
      const settled = new Set<string>([drag.tag, ...Object.keys(rep)]);
      if (settleTimeoutRef.current) {
        clearTimeout(settleTimeoutRef.current);
      }
      setSettledTags([...settled]);
      settleTimeoutRef.current = setTimeout(() => {
        settleTimeoutRef.current = null;
        setSettledTags([]);
      }, 320);
    }

    pointerSessionRef.current = null;
    movedPastThresholdRef.current = false;
    setDrag(null);
  };

  const ordered = placed ? [...placed].sort(readingOrder) : [];

  const spotlightTag = drag?.tag ?? hoveredTag;
  const isDragSession = drag !== null;

  return (
    <section
      ref={containerRef}
      className={[
        "tag-cloud-canvas relative z-[1] h-[min(65vh,600px)] min-h-[400px] w-full touch-pan-y sm:min-h-[480px] sm:h-[min(65vh,700px)]",
        isDragSession ? "is-drag-session touch-none" : "",
      ]
        .filter(Boolean)
        .join(" ")}
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
        .tag-cloud-canvas.is-drag-session .tag-cloud-item-wrapper:not(.is-dragging) {
          transition:
            transform 0.14s cubic-bezier(0.22, 1, 0.36, 1),
            opacity 400ms ease,
            filter 400ms ease;
        }
        .tag-cloud-item-wrapper.is-dragging {
          transition:
            opacity 400ms ease,
            filter 400ms ease;
        }
        .tag-cloud-item-wrapper.is-dragging {
          z-index: 220 !important;
        }
        .tag-cloud-item-wrapper.just-settled {
          transition:
            transform 0.3s cubic-bezier(0.22, 1, 0.36, 1),
            opacity 400ms ease,
            filter 400ms ease;
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
          touch-action: manipulation;
        }
        .tag-cloud-link.tag-cloud-link--draggable {
          cursor: grab;
        }
        .tag-cloud-canvas.is-drag-session .tag-cloud-link.tag-cloud-link--draggable {
          cursor: grabbing;
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
        .tag-cloud-item-wrapper.is-dragging .tag-cloud-link {
          transform: rotate(0deg) scale(1.06) !important;
          box-shadow: var(--float-shadow);
        }
        .tag-cloud-canvas.is-drag-session .tag-cloud-link:hover:not(.tag-cloud-link--active) {
          transform: rotate(0deg) scale(1.02) !important;
          background: var(--surface);
          color: var(--foreground);
          border-color: color-mix(in srgb, var(--border) 60%, transparent);
        }
        .tag-cloud-canvas.is-drag-session .tag-cloud-item-wrapper.is-dragging .tag-cloud-link:hover {
          background: var(--foreground);
          color: var(--surface);
          border-color: transparent;
        }
        @media (prefers-reduced-motion: reduce) {
          .tag-cloud-canvas.is-drag-session .tag-cloud-item-wrapper:not(.is-dragging) {
            transition: opacity 400ms ease, filter 400ms ease !important;
          }
          .tag-cloud-item-wrapper.just-settled {
            transition: opacity 400ms ease, filter 400ms ease !important;
          }
        }
      `}</style>
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
        aria-hidden
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,var(--accent-soft)_0%,transparent_65%)] opacity-60" />
        {/* Add some subtle noise texture */}
        <div
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
          }}
        ></div>
      </div>

      <ul
        className="relative h-full w-full list-none overflow-hidden"
        style={{
          opacity: placed && placed.length > 0 ? 1 : 0,
          transition: "opacity 400ms ease",
        }}
        onMouseLeave={() => {
          if (!isDragSession) setHoveredTag(null);
        }}
      >
        {ordered.map((p, i) => {
          const isActive = activeTag === p.tag;
          const isHovered = hoveredTag === p.tag;
          const isDragged = drag?.tag === p.tag;
          const isSettled = settledTags.includes(p.tag);
          const isDimmed =
            spotlightTag !== null && p.tag !== spotlightTag && !isActive;
          const href = isActive ? "/" : `/?tag=${encodeURIComponent(p.tag)}`;
          const draggable = canDragTag(p.tag);
          const rep = repulsion[p.tag];
          const ox = isDragged ? (drag?.dx ?? 0) : (rep?.x ?? 0);
          const oy = isDragged ? (drag?.dy ?? 0) : (rep?.y ?? 0);

          // Generate deterministic random values based on index
          const rand = Math.sin(i * 1234.5) * 10000;
          const randVal = rand - Math.floor(rand);
          const rotation = (randVal - 0.5) * 12; // -6 to 6 degrees
          const animDelay = randVal * -4; // 0 to -4s

          return (
            <li
              key={p.tag}
              className={[
                "tag-cloud-item-wrapper",
                isDimmed ? "dimmed" : "",
                isHovered || isActive || isDragged ? "highlighted" : "",
                isDragged ? "is-dragging" : "",
                isSettled && !isDragged ? "just-settled" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={{
                transform: `translate3d(${p.x + ox}px, ${p.y + oy}px, 0)`,
                zIndex: isDragged ? 220 : p.tier,
                maxWidth: "min(100%, 18rem)",
              }}
            >
              <div
                style={{
                  animation: isDragged
                    ? "none"
                    : `tag-breathe ${4 + randVal * 2}s ease-in-out ${animDelay}s infinite alternate`,
                }}
              >
                <Link
                  href={href}
                  scroll={false}
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  data-tier={p.tier}
                  data-active={isActive ? "true" : undefined}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={`标签 ${p.tag}，${p.articleCount} 篇${isActive ? "，已选中" : ""}${draggable ? "。可拖动" : ""}`}
                  onMouseEnter={() => setHoveredTag(p.tag)}
                  onFocus={() => setHoveredTag(p.tag)}
                  onBlur={() => {
                    if (!isDragSession) setHoveredTag(null);
                  }}
                  onClick={(e) => {
                    if (blockNextClickRef.current) {
                      e.preventDefault();
                      blockNextClickRef.current = false;
                    }
                  }}
                  onPointerDown={(e) => {
                    if (e.button !== 0 || !draggable) return;
                    if (pointerSessionRef.current) return;
                    const root = containerRef.current;
                    if (!root) return;
                    const rect = root.getBoundingClientRect();
                    const localX = e.clientX - rect.left;
                    const localY = e.clientY - rect.top;
                    pointerSessionRef.current = {
                      tag: p.tag,
                      grabX: localX - p.x,
                      grabY: localY - p.y,
                      originX: e.clientX,
                      originY: e.clientY,
                      layoutGen: layoutGenRef.current,
                      pointerId: e.pointerId,
                    };
                    movedPastThresholdRef.current = false;
                    e.currentTarget.setPointerCapture(e.pointerId);
                  }}
                  onPointerMove={(e) => {
                    const s = pointerSessionRef.current;
                    if (!s || e.pointerId !== s.pointerId) return;
                    if (s.layoutGen !== layoutGenRef.current) {
                      endDragSession(e.currentTarget, s.pointerId, {
                        commit: false,
                      });
                      return;
                    }
                    const root = containerRef.current;
                    const list = placed ?? [];
                    if (!root || list.length === 0) return;
                    const chip = list.find((x) => x.tag === s.tag);
                    if (!chip) return;

                    if (!movedPastThresholdRef.current) {
                      const d = Math.hypot(
                        e.clientX - s.originX,
                        e.clientY - s.originY,
                      );
                      if (d < DRAG_THRESHOLD_PX) return;
                      movedPastThresholdRef.current = true;
                      blockNextClickRef.current = true;
                    }

                    const cw = root.clientWidth;
                    const ch = root.clientHeight;
                    const r = root.getBoundingClientRect();
                    const localX = e.clientX - r.left;
                    const localY = e.clientY - r.top;
                    const rawX = localX - s.grabX;
                    const rawY = localY - s.grabY;
                    const dx =
                      Math.min(Math.max(0, rawX), Math.max(0, cw - chip.w)) -
                      chip.x;
                    const dy =
                      Math.min(Math.max(0, rawY), Math.max(0, ch - chip.h)) -
                      chip.y;
                    setDrag({ tag: s.tag, dx, dy });
                  }}
                  onPointerUp={(e) => {
                    const s = pointerSessionRef.current;
                    if (!s || e.pointerId !== s.pointerId) return;
                    endDragSession(e.currentTarget, s.pointerId, {
                      commit: true,
                    });
                  }}
                  onPointerCancel={(e) => {
                    const s = pointerSessionRef.current;
                    if (!s || e.pointerId !== s.pointerId) return;
                    endDragSession(e.currentTarget, s.pointerId, {
                      commit: false,
                    });
                  }}
                  style={{
                    transform: `rotate(${rotation}deg)`,
                  }}
                  className={[
                    "tag-cloud-link motion-reduce:transition-none motion-reduce:animation-none",
                    draggable ? "tag-cloud-link--draggable" : "",
                    TAG_CLOUD_TIER_CLASSES[p.tier],
                    isActive ? "tag-cloud-link--active" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <span className="break-words">{p.tag}</span>
                </Link>
              </div>
            </li>
          );
        })}
      </ul>

      {!placed || placed.length === 0 ? (
        <span className="sr-only" aria-live="polite">
          标签云布局中
        </span>
      ) : null}
    </section>
  );
}
