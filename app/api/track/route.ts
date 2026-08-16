import { NextRequest, NextResponse } from "next/server";
import { fetchMovieDetail } from "@/integrations/the-numbers/detail";
import { evaluateEligibility } from "@/movie_catalog/eligibility";
import { isDbConfigured } from "@/lib/db";
import { trackMovie } from "@/movie_catalog/repo";

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
    const detail = await fetchMovieDetail(url);
    const verdict = evaluateEligibility(detail.domesticReleases);
    if (!verdict.eligible) {
      return NextResponse.json(
        { error: verdict.reason, eligible: false },
        { status: 422 }
      );
    }
    const movieId = await trackMovie(detail, body?.thumbnail ?? null);
    const { checkMovie } = await import("@/monitoring/poller");
    await checkMovie({ id: movieId, the_numbers_url: detail.url }).catch(() => {});
    return NextResponse.json({ movieId, eligible: true });
  } catch (e) {
    const message = (e as Error).message;
    const status = message.includes("Tracker is full") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
