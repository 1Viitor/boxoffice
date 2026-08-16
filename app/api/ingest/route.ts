import { NextResponse } from "next/server";
import { ingestSchedule } from "@/lib/repo";
import { isDbConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Refresh the local release-schedule cache (used as a search fallback).
export async function POST() {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: "Database not configured." },
      { status: 503 }
    );
  }
  try {
    const count = await ingestSchedule();
    return NextResponse.json({ ok: true, count });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
