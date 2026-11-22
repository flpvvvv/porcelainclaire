import { NextResponse } from "next/server";
import { getRequestSignals, utcDateString } from "@/lib/request-signals";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const MIN_VISIBLE_MS = 10_000;
const MIN_SCROLL_PCT = 25;
const MAX_VISIBLE_MS = 3_600_000;
const MAX_SLUG_LENGTH = 200;

type Body = {
  slug?: unknown;
  visibleMs?: unknown;
  scrollPct?: unknown;
};

export async function POST(request: Request) {
  const body = await readJson(request);
  const slug =
    typeof body.slug === "string"
      ? body.slug.trim().slice(0, MAX_SLUG_LENGTH)
      : "";
  const visibleMs = clampInt(body.visibleMs, 0, MAX_VISIBLE_MS);
  const scrollPct = clampInt(body.scrollPct, 0, 100);

  if (!slug || visibleMs < MIN_VISIBLE_MS || scrollPct < MIN_SCROLL_PCT) {
    return noContent();
  }

  const signals = getRequestSignals(request);

  try {
    const { error } = await getSupabaseAdmin().from("reading_events").upsert(
      {
        slug,
        visible_ms: visibleMs,
        scroll_pct: scrollPct,
        user_agent: signals.userAgent,
        referer: signals.referer,
        country: signals.country,
        ip_hash: signals.ipHash,
        read_date: utcDateString(),
      },
      {
        onConflict: "slug,ip_hash,read_date",
        ignoreDuplicates: true,
      },
    );

    if (error) {
      console.error("reading_events upsert failed:", error.message);
    }
  } catch (error) {
    console.error("reading_events upsert failed:", error);
  }

  return noContent();
}

async function readJson(request: Request): Promise<Body> {
  try {
    const parsed: unknown = await request.json();
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Body)
      : {};
  } catch {
    return {};
  }
}

function clampInt(value: unknown, min: number, max: number): number {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, Math.round(number)));
}

function noContent(): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}
