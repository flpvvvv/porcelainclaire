import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { secret, slug } = body;

  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
  }

  revalidatePath("/");
  if (slug) {
    revalidatePath(`/articles/${slug}`);
  }

  return NextResponse.json({ revalidated: true, now: Date.now() });
}
