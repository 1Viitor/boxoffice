import { NextRequest, NextResponse } from "next/server";
import { addForecast } from "@/forecasting/repo";
import { parseMoney } from "@/forecasting/money";
import type { ForecastType } from "@/forecasting/types";
import { isDbConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

const TYPES = new Set<ForecastType>([
  "opening_weekend",
  "end_of_month",
  "end_of_year",
]);

export async function POST(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }
  const body = (await req.json().catch(() => null)) as {
    movieId?: string;
    forecastType?: string;
    value?: string | number;
    note?: string;
  } | null;

  const movieId = body?.movieId;
  const forecastType = body?.forecastType as ForecastType | undefined;
  if (!movieId || !forecastType || !TYPES.has(forecastType)) {
    return NextResponse.json({ error: "Missing movieId or forecastType." }, { status: 400 });
  }

  const value =
    typeof body?.value === "number"
      ? body.value
      : parseMoney(String(body?.value ?? ""));
  if (value == null) {
    return NextResponse.json(
      { error: "Could not parse estimate. Try 72M or 72000000." },
      { status: 400 }
    );
  }

  try {
    const row = await addForecast({
      movieId,
      forecastType,
      value,
      note: body?.note,
    });
    return NextResponse.json({ forecast: row });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
