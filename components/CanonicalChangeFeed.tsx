import { formatMoney, formatSignedMoney } from "@/forecasting/money";
import { formatDateTime, formatTheatricalDay } from "@/lib/format";
import { formatError } from "@/analytics";
import type { ObservationRow } from "@/canonical_data/types";
import { metricLabel } from "@/canonical_data/types";

export function CanonicalChangeFeed({
  observations,
}: {
  observations: ObservationRow[];
}) {
  const changes = [...observations].sort(
    (a, b) => new Date(b.observed_at).getTime() - new Date(a.observed_at).getTime()
  );

  if (!changes.length) {
    return (
      <p className="mt-2 text-sm text-zinc-500">
        No canonical changes yet. Numbers will appear as The Numbers updates.
      </p>
    );
  }

  return (
    <ul className="mt-2 max-h-64 space-y-2 overflow-y-auto pr-1">
      {changes.map((row) => (
        <li
          key={row.id}
          className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <span className="text-xs font-semibold text-zinc-300">
              {metricLabel(row.metric)}
            </span>
            <span className="text-[11px] text-zinc-500">
              {formatDateTime(row.observed_at)}
            </span>
          </div>
          <div className="mt-1 font-mono text-sm text-white">
            {row.previous_value == null ? (
              <>First: {formatMoney(row.value)}</>
            ) : (
              <>
                {formatMoney(row.previous_value)} → {formatMoney(row.value)}
              </>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap gap-x-3 text-[11px] text-zinc-500">
            {row.theatrical_date && (
              <span>{formatTheatricalDay(row.theatrical_date)}</span>
            )}
            {row.previous_value != null && (
              <span>
                {formatSignedMoney(row.absolute_change)}{" "}
                {formatError(row.percentage_change)}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
