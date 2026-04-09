import type { CloudTier } from "@/lib/tag-cloud-weights";

export type CloudLayoutInput = {
  tag: string;
  articleCount: number;
  w: number;
  h: number;
  tier: CloudTier;
};

export type CloudLayoutPlaced = CloudLayoutInput & {
  x: number;
  y: number;
};

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function rectsOverlap(
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

function collidesPlaced(
  x: number,
  y: number,
  w: number,
  h: number,
  placed: Array<{ x: number; y: number; w: number; h: number }>,
  gap: number,
): boolean {
  for (const p of placed) {
    if (rectsOverlap(x, y, w, h, p.x, p.y, p.w, p.h, gap)) return true;
  }
  return false;
}

/** FNV-1a 32-bit — deterministic seed from tag set + width bucket. */
export function hashCloudSeed(parts: string[]): number {
  let h = 0x811c9dc5;
  const s = parts.join("\0");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Largest-first center-out spiral placement. Deterministic given inputs.
 */
export function layoutTagCloud(
  items: CloudLayoutInput[],
  cw: number,
  ch: number,
  options: { gap: number; seed: number },
): CloudLayoutPlaced[] {
  const { gap, seed } = options;
  if (items.length === 0 || cw < 24 || ch < 24) return [];

  const sorted = [...items].sort((a, b) => {
    const area = b.w * b.h - a.w * a.h;
    if (area !== 0) return area;
    return b.articleCount - a.articleCount || a.tag.localeCompare(b.tag);
  });

  const placed: Array<{ x: number; y: number; w: number; h: number }> = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  const cx = cw * 0.5;
  const cy = ch * 0.5;
  const maxR = Math.hypot(cw, ch) * 0.55;
  const seedAngle = (seed % 360) * (Math.PI / 180);

  const result: CloudLayoutPlaced[] = [];

  for (const item of sorted) {
    const { w, h } = item;
    const maxX = Math.max(0, cw - w);
    const maxY = Math.max(0, ch - h);
    let best: { x: number; y: number } | null = null;

    const attempts = Math.min(2400, Math.ceil((cw * ch) / Math.max(360, w * h)));

    for (let i = 0; i < attempts; i++) {
      const t = (i + 1) / attempts;
      const radius = Math.sqrt(t) * maxR;
      const angle = seedAngle + i * golden;
      let x = cx - w * 0.5 + Math.cos(angle) * radius;
      let y = cy - h * 0.5 + Math.sin(angle) * radius;
      x = clamp(x, 0, maxX);
      y = clamp(y, 0, maxY);
      if (!collidesPlaced(x, y, w, h, placed, gap)) {
        best = { x, y };
        break;
      }
    }

    if (!best) {
      const step = Math.max(6, Math.min(14, Math.floor(Math.min(cw, ch) / 36)));
      outer: for (let y = 0; y <= maxY; y += step) {
        for (let x = 0; x <= maxX; x += step) {
          if (!collidesPlaced(x, y, w, h, placed, gap)) {
            best = { x, y };
            break outer;
          }
        }
      }
    }

    if (best) {
      placed.push({ x: best.x, y: best.y, w, h });
      result.push({ ...item, x: best.x, y: best.y });
    }
  }

  return result;
}
