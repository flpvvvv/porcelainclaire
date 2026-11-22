import { NextResponse } from "next/server";
import { getRequestSignals, utcDateString } from "@/lib/request-signals";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const signals = getRequestSignals(request);
  const path = new URL(request.url).pathname.slice(0, 500);

  try {
    const { error } = await getSupabaseAdmin().from("bot_trap_hits").upsert(
      {
        path,
        user_agent: signals.userAgent,
        referer: signals.referer,
        country: signals.country,
        ip_hash: signals.ipHash,
        hit_date: utcDateString(),
      },
      {
        onConflict: "ip_hash,path,hit_date",
        ignoreDuplicates: true,
      },
    );

    if (error) {
      console.error("bot_trap_hits upsert failed:", error.message);
    }
  } catch (error) {
    console.error("bot_trap_hits upsert failed:", error);
  }

  return new NextResponse(null, {
    status: 204,
    headers: {
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
