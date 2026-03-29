import { NextResponse } from "next/server";
import {
  getSearchSuggestions,
  parseSearchQuery,
  searchArticles,
} from "@/lib/article-search";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const suggestionsOnly = searchParams.get("suggestions") === "1";
  const limitRaw = searchParams.get("limit");
  const limit = limitRaw ? Number.parseInt(limitRaw, 10) : undefined;

  if (suggestionsOnly) {
    try {
      const data = await getSearchSuggestions();
      return NextResponse.json(data);
    } catch (e) {
      console.error(e);
      return NextResponse.json(
        { error: "suggestions_failed" },
        { status: 500 },
      );
    }
  }

  const trimmed = q.trim();
  const parsed = parseSearchQuery(trimmed);
  if (parsed.q === null && parsed.tagFilter === null) {
    return NextResponse.json({ results: [] });
  }
  if (parsed.tagFilter === null && parsed.q !== null && parsed.q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchArticles(trimmed, limit);
    return NextResponse.json({ results });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "search_failed" }, { status: 500 });
  }
}
