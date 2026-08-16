import { NextRequest, NextResponse } from "next/server";
import { checkMovie } from "@/monitoring/poller";
import { getMovieById } from "@/movie_catalog/repo";
import { isDbConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }
  const { id } = await ctx.params;
  const movie = await getMovieById(id);
  if (!movie) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const result = await checkMovie({
    id: movie.id,
    the_numbers_url: movie.the_numbers_url,
  });
  return NextResponse.json(result);
}
