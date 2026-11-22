import { createHash } from "node:crypto";

const MAX_USER_AGENT_LENGTH = 500;
const MAX_REFERER_LENGTH = 500;
const MAX_COUNTRY_LENGTH = 8;

export type RequestSignals = {
  ipHash: string;
  userAgent: string | null;
  referer: string | null;
  country: string | null;
};

/** Server-only; derives the audit fields stored with traffic probes. */
export function getRequestSignals(request: Request): RequestSignals {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || null;
  const salt =
    process.env.ANALYTICS_SALT ??
    process.env.REVALIDATION_SECRET ??
    "local-development-salt";

  return {
    ipHash: createHash("sha256")
      .update(`${salt}:${ip ?? "unknown"}`)
      .digest("hex"),
    userAgent: truncate(
      request.headers.get("user-agent"),
      MAX_USER_AGENT_LENGTH,
    ),
    referer: truncate(request.headers.get("referer"), MAX_REFERER_LENGTH),
    country: truncate(
      request.headers.get("x-vercel-ip-country"),
      MAX_COUNTRY_LENGTH,
    ),
  };
}

export function utcDateString(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function truncate(value: string | null, maxLength: number): string | null {
  if (!value) return null;
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}
