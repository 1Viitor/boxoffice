import { NextRequest, NextResponse } from "next/server";
import { fetchMovieDetail } from "@/integrations/the-numbers/detail";
import { evaluateEligibility } from "@/movie_catalog/eligibility";
import type { ValidationResult } from "@/movie_catalog/types";

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

  try {
    const detail = await fetchMovieDetail(url);
    const verdict = evaluateEligibility(detail.domesticReleases);
    const result: ValidationResult = {
      url: detail.url,
      slug: detail.slug,
      title: detail.title,
      year: detail.year,
      thumbnail: body?.thumbnail ?? detail.thumbnail ?? null,
      domesticReleases: detail.domesticReleases,
      eligible: verdict.eligible,
      reason: verdict.reason,
      primaryRelease: verdict.primary,
    };
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
