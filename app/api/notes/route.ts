import { NextRequest, NextResponse } from "next/server";
import { addNote } from "@/notes/repo";
import { isDbConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }
  const body = (await req.json().catch(() => null)) as {
    movieId?: string;
    body?: string;
  } | null;

  const movieId = body?.movieId;
  const text = (body?.body || "").trim();
  if (!movieId || !text) {
    return NextResponse.json({ error: "Missing movieId or note body." }, { status: 400 });
  }

  try {
    const row = await addNote(movieId, text);
    return NextResponse.json({ note: row });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
