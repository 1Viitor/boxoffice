import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured } from "@/lib/db";
import { isOpenAiConfigured } from "@/integrations/openai/client";
import { predictOpeningWeekend } from "@/prediction/predict";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }
  if (!isOpenAiConfigured()) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured." },
      { status: 503 }
    );
  }

  const { id } = await ctx.params;
  try {
    const prediction = await predictOpeningWeekend(id);
    return NextResponse.json({ ok: true, prediction });
  } catch (e) {
    const message = (e as Error).message;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
