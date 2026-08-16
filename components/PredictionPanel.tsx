import { formatMoney } from "@/forecasting/money";
import { formatDateTime } from "@/lib/format";
import type { PredictionRow } from "@/prediction/types";

function confidenceClass(confidence: string | null): string {
  switch (confidence) {
    case "high":
      return "text-emerald-400";
    case "medium":
      return "text-amber-400";
    default:
      return "text-zinc-400";
  }
}

export function PredictionPanel({
  latest,
  history,
}: {
  latest: PredictionRow | null;
  history: PredictionRow[];
}) {
  if (!latest) {
    return (
      <p className="mt-3 text-sm text-zinc-500">
        No AI prediction yet. Click Predict to research the web and estimate
        opening weekend.
      </p>
    );
  }

  const older = history.filter((p) => p.id !== latest.id);

  return (
    <div className="mt-3 space-y-4">
      <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.06] px-4 py-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-violet-300">
            Latest AI estimate
          </div>
          <div className="text-[11px] text-zinc-500">
            {formatDateTime(latest.created_at)} · {latest.mode.replace(/_/g, " ")}
          </div>
        </div>
        <div className="mt-2 font-mono text-3xl text-white">
          {formatMoney(latest.point_estimate)}
        </div>
        {latest.low != null && latest.high != null && (
          <div className="mt-1 text-sm text-zinc-400">
            Range {formatMoney(latest.low)} – {formatMoney(latest.high)}
          </div>
        )}
        <div
          className={`mt-2 text-xs font-semibold uppercase ${confidenceClass(
            latest.confidence
          )}`}
        >
          {latest.confidence ?? "unknown"} confidence
        </div>
        {latest.rationale && (
          <p className="mt-3 text-sm leading-relaxed text-zinc-300">
            {latest.rationale}
          </p>
        )}
        {latest.signals?.comps && latest.signals.comps.length > 0 && (
          <div className="mt-3">
            <div className="text-[11px] font-semibold uppercase text-zinc-500">
              Comps
            </div>
            <ul className="mt-1 space-y-1 text-sm text-zinc-400">
              {latest.signals.comps.map((c) => (
                <li key={c.title}>
                  {c.title}: {formatMoney(c.opening_weekend)}
                </li>
              ))}
            </ul>
          </div>
        )}
        {latest.citations && latest.citations.length > 0 && (
          <div className="mt-3">
            <div className="text-[11px] font-semibold uppercase text-zinc-500">
              Sources
            </div>
            <ul className="mt-1 space-y-1">
              {latest.citations.slice(0, 6).map((c) => (
                <li key={c.url}>
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-violet-300 hover:underline"
                  >
                    {c.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {older.length > 0 && (
        <details className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium text-zinc-300">
            Previous predictions ({older.length})
          </summary>
          <ul className="mt-3 space-y-2">
            {older.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-baseline justify-between gap-2 border-t border-white/5 pt-2 text-sm"
              >
                <span className="font-mono text-zinc-200">
                  {formatMoney(p.point_estimate)}
                </span>
                <span className="text-xs text-zinc-500">
                  {formatDateTime(p.created_at)}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
