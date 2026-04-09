import type { TagCloudItem } from "@/lib/tags";

/** Visual / layout tiers: 1 = smallest, 7 = dominant head tags. */
export type CloudTier = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/**
 * Drop very low-frequency tags relative to the corpus maximum.
 * Keeps the cloud readable; relaxes thresholds if the result would be too sparse.
 */
export function filterTagCloudItems(items: TagCloudItem[]): TagCloudItem[] {
  if (items.length === 0) return [];
  const sorted = [...items].sort(
    (a, b) => b.articleCount - a.articleCount || a.tag.localeCompare(b.tag),
  );
  const maxCount = sorted[0]!.articleCount;
  if (maxCount <= 0) return sorted;

  const tryThreshold = (share: number) =>
    Math.max(2, Math.ceil(maxCount * share));

  let minKeep = tryThreshold(0.11);
  let filtered = sorted.filter((i) => i.articleCount >= minKeep);

  if (filtered.length < 10) {
    minKeep = tryThreshold(0.07);
    filtered = sorted.filter((i) => i.articleCount >= minKeep);
  }
  if (filtered.length < 8) {
    minKeep = tryThreshold(0.05);
    filtered = sorted.filter((i) => i.articleCount >= minKeep);
  }
  if (filtered.length < 6) {
    filtered = sorted.slice(0, Math.min(40, sorted.length));
  }

  return filtered;
}

export function cloudCountBounds(items: TagCloudItem[]): {
  minC: number;
  maxC: number;
} {
  if (items.length === 0) return { minC: 0, maxC: 0 };
  const counts = items.map((i) => i.articleCount);
  return { minC: Math.min(...counts), maxC: Math.max(...counts) };
}

const ln1p = (n: number) => Math.log1p(Math.max(0, n));

/**
 * Normalized strength in [0, 1] using log counts and a gamma curve so
 * top tags pull visibly away from the long tail.
 */
export function tagStrength(
  count: number,
  minC: number,
  maxC: number,
): number {
  if (maxC <= minC) return 0.5;
  const t =
    (ln1p(count) - ln1p(minC)) / (ln1p(maxC) - ln1p(minC) || 1);
  const clamped = Math.min(1, Math.max(0, t));
  const gamma = 0.55;
  return Math.min(1, Math.max(0, Math.pow(clamped, gamma)));
}

export function strengthToTier(s: number): CloudTier {
  const n = 7;
  const idx = Math.min(n - 1, Math.floor(s * n));
  return (idx + 1) as CloudTier;
}

export function tierFromCount(
  count: number,
  minC: number,
  maxC: number,
): CloudTier {
  return strengthToTier(tagStrength(count, minC, maxC));
}

/** Pixel metrics for collision sizing (approximate CJK/Latin mix). */
const TIER_LAYOUT: Record<
  CloudTier,
  { fs: number; padX: number; padY: number; line: number }
> = {
  1: { fs: 11, padX: 11, padY: 8, line: 1.38 },
  2: { fs: 12, padX: 12, padY: 8, line: 1.36 },
  3: { fs: 13, padX: 13, padY: 9, line: 1.34 },
  4: { fs: 15, padX: 14, padY: 10, line: 1.32 },
  5: { fs: 17, padX: 15, padY: 10, line: 1.28 },
  6: { fs: 20, padX: 17, padY: 11, line: 1.22 },
  7: { fs: 24, padX: 19, padY: 12, line: 1.18 },
};

export function estimateChipSize(
  label: string,
  tier: CloudTier,
): { w: number; h: number } {
  const m = TIER_LAYOUT[tier];
  const textW = label.length * m.fs * 0.92;
  const w = Math.min(320, Math.ceil(m.padX * 2 + textW));
  const h = Math.max(44, Math.ceil(m.fs * m.line + m.padY * 2));
  return { w, h };
}

export const TAG_CLOUD_TIER_CLASSES: Record<CloudTier, string> = {
  1: "px-2.5 py-2 text-[0.6875rem] leading-snug tracking-wide",
  2: "px-2.5 py-2 text-[0.75rem] leading-snug",
  3: "px-3 py-2 text-[0.8125rem] leading-snug sm:text-[0.84375rem]",
  4: "px-3 py-2.5 text-sm font-medium leading-snug sm:text-[0.9375rem]",
  5: "px-3.5 py-2.5 text-[0.9375rem] font-semibold leading-snug sm:text-base",
  6: "px-4 py-3 text-base font-semibold leading-snug sm:text-lg",
  7: "px-4 py-3.5 text-lg font-bold leading-tight sm:text-xl sm:py-4",
};
