import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

function timingSafeEqualUtf8(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATION_SECRET;
  if (!secret) {
    return NextResponse.json(
      { message: "Revalidation is not configured" },
      { status: 503 },
    );
  }

  const headerSecret = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "")
    .trim();
  const querySecret = request.nextUrl.searchParams.get("secret");

  let body: {
    path?: unknown;
    slug?: unknown;
    secret?: unknown;
  } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    // empty body
  }

  const bodySecret = typeof body.secret === "string" ? body.secret : "";
  const provided = headerSecret ?? querySecret ?? bodySecret ?? "";

  if (!timingSafeEqualUtf8(provided, secret)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let path = "/";
  if (typeof body.slug === "string" && body.slug.length > 0) {
    path = `/articles/${encodeURIComponent(body.slug)}`;
  } else if (typeof body.path === "string" && body.path.startsWith("/")) {
    path = body.path;
  }

  revalidatePath(path);
  return NextResponse.json({ revalidated: true, path });
}
