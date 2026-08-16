import { NextRequest, NextResponse } from "next/server";
import { fetchMovieDetail } from "@/lib/the-numbers/detail";
import { evaluateEligibility } from "@/lib/eligibility";
import { isDbConfigured } from "@/lib/db";
import { trackMovie } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    url?: string;
    thumbnail?: string | null;
  } | null;

  const url = body?.url;
  if (!url) {
    return NextResponse.json({ error: "Missing 'url'." }, { status: 400 });
  }
  if (!isDbConfigured()) {
    return NextResponse.json(
      {
        error:
          "Database not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in .env.local.",
      },
      { status: 503 }
    );
  }

  try {
    // Re-fetch + re-evaluate server-side so eligibility can't be bypassed.
    const detail = await fetchMovieDetail(url);
    const verdict = evaluateEligibility(detail.domesticReleases);
    if (!verdict.eligible) {
      return NextResponse.json(
        { error: verdict.reason, eligible: false },
        { status: 422 }
      );
    }
    const movieId = await trackMovie(detail, body?.thumbnail ?? null);
    return NextResponse.json({ movieId, eligible: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
