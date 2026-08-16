const OPENAI_API = "https://api.openai.com/v1/responses";

export function openAiModel(): string {
  return process.env.OPENAI_MODEL || "gpt-5.6";
}

export function isOpenAiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export interface OpenAiResponse {
  output?: Array<Record<string, unknown>>;
  error?: { message?: string };
}

export async function createResponse(
  body: Record<string, unknown>
): Promise<OpenAiResponse> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not configured.");

  const res = await fetch(OPENAI_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as OpenAiResponse;
  if (!res.ok) {
    const msg =
      data.error?.message || `OpenAI request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

export function extractOutputText(response: OpenAiResponse): string {
  const parts: string[] = [];
  for (const item of response.output ?? []) {
    if (item.type !== "message") continue;
    const content = item.content as Array<Record<string, unknown>> | undefined;
    for (const block of content ?? []) {
      if (block.type === "output_text" && typeof block.text === "string") {
        parts.push(block.text);
      }
    }
  }
  return parts.join("\n").trim();
}

export interface UrlCitation {
  title: string;
  url: string;
}

export function extractCitations(response: OpenAiResponse): UrlCitation[] {
  const out: UrlCitation[] = [];
  const seen = new Set<string>();
  for (const item of response.output ?? []) {
    if (item.type !== "message") continue;
    const content = item.content as Array<Record<string, unknown>> | undefined;
    for (const block of content ?? []) {
      const annotations = block.annotations as
        | Array<Record<string, unknown>>
        | undefined;
      for (const ann of annotations ?? []) {
        if (ann.type !== "url_citation") continue;
        const url = String(ann.url || "");
        if (!url || seen.has(url)) continue;
        seen.add(url);
        out.push({
          title: String(ann.title || url),
          url,
        });
      }
    }
  }
  return out;
}
