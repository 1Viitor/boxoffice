import { NextResponse } from "next/server";
import { getTrackedMovies } from "@/movie_catalog/repo";
import { isDbConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ movies: [], dbConfigured: false });
  }
  try {
    const movies = await getTrackedMovies();
    return NextResponse.json({ movies, dbConfigured: true });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message, movies: [] },
      { status: 500 }
    );
  }
}
