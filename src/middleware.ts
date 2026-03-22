import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/** Legacy slugs used "-"; those URLs 500 on Vercel. Canonical slugs omit ASCII hyphens. */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (!pathname.startsWith("/articles/")) {
    return NextResponse.next();
  }

  const segment = pathname.slice("/articles/".length);
  if (!segment.includes("-")) {
    return NextResponse.next();
  }

  let decoded: string;
  try {
    decoded = decodeURIComponent(segment);
  } catch {
    return NextResponse.next();
  }

  const collapsed = decoded.replace(/-/g, "");
  if (collapsed === decoded || collapsed.length === 0) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `/articles/${encodeURIComponent(collapsed)}`;
  return NextResponse.redirect(url, 301);
}

export const config = {
  matcher: ["/articles/:path*"],
};
