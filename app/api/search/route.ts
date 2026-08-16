import { NextRequest, NextResponse } from "next/server";
import { searchMovies } from "@/lib/the-numbers/search";
import { searchScheduleCache } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json({ results: [] });

  try {
    let results = await searchMovies(q, 10);
    if (!results.length) {
      results = await searchScheduleCache(q, 10).catch(() => []);
    }
    return NextResponse.json({ results });
  } catch (e) {
    // If the live search fails, try the cached schedule as a fallback.
    const fallback = await searchScheduleCache(q, 10).catch(() => []);
    if (fallback.length) {
      return NextResponse.json({ results: fallback, degraded: true });
    }
    return NextResponse.json(
      { error: (e as Error).message, results: [] },
      { status: 502 }
    );
  }
}
