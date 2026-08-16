import {
  createResponse,
  extractCitations,
  extractOutputText,
  openAiModel,
  type UrlCitation,
} from "./client";
import type { AiSignals, CanonicalSnapshot } from "@/prediction/types";

const SIGNALS_SCHEMA = {
  type: "object",
  properties: {
    multiplier_band: {
      type: "string",
      enum: ["front_loaded", "normal", "leggy"],
    },
    comps: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          opening_weekend: { type: "number" },
          similarity: { type: "number" },
        },
        required: ["title", "opening_weekend", "similarity"],
        additionalProperties: false,
      },
    },
    presale_index: { type: ["number", "null"] },
    social_index: { type: ["number", "null"] },
    rt_critic: { type: ["number", "null"] },
    rt_audience: { type: ["number", "null"] },
    theater_count: { type: ["number", "null"] },
    rationale: { type: "string" },
  },
  required: [
    "multiplier_band",
    "comps",
    "presale_index",
    "social_index",
    "rt_critic",
    "rt_audience",
    "theater_count",
    "rationale",
  ],
  additionalProperties: false,
} as const;

export interface ResearchInput {
  title: string;
  year: number | null;
  distributor: string | null;
  releaseDate: string | null;
  releaseType: string | null;
  status: string;
  canonical: CanonicalSnapshot;
}

export interface ResearchResult {
  researchText: string;
  signals: AiSignals;
  citations: UrlCitation[];
}

function buildResearchPrompt(input: ResearchInput): string {
  const actuals = Object.entries(input.canonical)
    .filter(([, v]) => typeof v === "number" && v > 0)
    .map(([k, v]) => `${k}: $${(v as number / 1_000_000).toFixed(1)}M`)
    .join(", ");

  return `You are a box office analyst. Research the domestic opening weekend outlook for this movie.

Movie: ${input.title}${input.year ? ` (${input.year})` : ""}
Release: ${input.releaseDate || "TBD"} (${input.releaseType || "unknown"})
Distributor: ${input.distributor || "unknown"}
Tracking status: ${input.status}
Our canonical actuals so far: ${actuals || "none yet"}

Find and summarize:
1. Industry tracking / analyst forecasts (Deadline, Variety, Box Office Pro, etc.)
2. Presale velocity or Fandango/AMC chatter if available
3. Rotten Tomatoes critic and audience scores if released
4. Social buzz (TikTok, YouTube, X) relative to similar titles
5. Theater count if reported
6. 3-5 comparable movies with their actual domestic opening weekends

Focus on domestic 3-day opening weekend. Cite sources. Be specific with dollar amounts in millions where possible.`;
}

function normalizeSignals(raw: AiSignals): AiSignals {
  return {
    multiplier_band: raw.multiplier_band || "normal",
    comps: (raw.comps ?? []).map((c) => ({
      title: c.title,
      opening_weekend: Math.round(c.opening_weekend),
      similarity: Math.min(1, Math.max(0.1, c.similarity)),
    })),
    presale_index:
      raw.presale_index == null
        ? null
        : Math.min(1, Math.max(-1, raw.presale_index)),
    social_index:
      raw.social_index == null
        ? null
        : Math.min(1, Math.max(-1, raw.social_index)),
    rt_critic: raw.rt_critic,
    rt_audience: raw.rt_audience,
    theater_count: raw.theater_count,
    rationale: raw.rationale || "",
  };
}

function defaultSignals(rationale: string): AiSignals {
  return {
    multiplier_band: "normal",
    comps: [],
    presale_index: null,
    social_index: null,
    rt_critic: null,
    rt_audience: null,
    theater_count: null,
    rationale,
  };
}

export async function researchMovieSignals(
  input: ResearchInput
): Promise<ResearchResult> {
  const model = openAiModel();
  const prompt = buildResearchPrompt(input);

  const researchResponse = await createResponse({
    model,
    input: prompt,
    tools: [{ type: "web_search" }],
    tool_choice: "required",
  });

  const researchText = extractOutputText(researchResponse);
  const citations = extractCitations(researchResponse);

  if (!researchText) {
    return {
      researchText: "",
      signals: defaultSignals("Web research returned no usable text."),
      citations,
    };
  }

  const extractResponse = await createResponse({
    model,
    input: `Extract structured box office signals from this research report. Use opening_weekend in raw dollars (not millions). presale_index and social_index are -1 to +1 relative to average comp performance.

Research:
${researchText}`,
    text: {
      format: {
        type: "json_schema",
        name: "box_office_signals",
        strict: true,
        schema: SIGNALS_SCHEMA,
      },
    },
  });

  const extractText = extractOutputText(extractResponse);
  let signals = defaultSignals(researchText.slice(0, 500));
  if (extractText) {
    try {
      signals = normalizeSignals(JSON.parse(extractText) as AiSignals);
      if (!signals.rationale) signals.rationale = researchText.slice(0, 500);
    } catch {
      signals = defaultSignals(researchText.slice(0, 500));
    }
  }

  return { researchText, signals, citations };
}
