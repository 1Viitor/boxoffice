"use client";

import { useMemo, useState } from "react";
import {
  formatMoney,
  formatMoneyExact,
  formatSignedMoney,
} from "@/forecasting/money";
import { formatDateTime, formatTheatricalDay } from "@/lib/format";
import { formatError } from "@/analytics";
import type { ObservationRow } from "@/canonical_data/types";
import { CANONICAL_METRICS, metricLabel } from "@/canonical_data/types";

export function CanonicalChart({
  observations,
}: {
  observations: ObservationRow[];
}) {
  const [metric, setMetric] = useState("opening_weekend");
  const [hover, setHover] = useState<number | null>(null);
  const points = useMemo(
    () => observations.filter((o) => o.metric === metric),
    [observations, metric]
  );
  const label = metricLabel(metric);

  if (!points.length) {
    return (
      <div>
        <MetricTabs metric={metric} onChange={setMetric} />
        <p className="mt-4 text-sm text-zinc-500">
          Waiting for {label.toLowerCase()} from The Numbers.
        </p>
      </div>
    );
  }

  const values = points.map((p) => p.value);
  const min = Math.min(...values) * 0.96;
  const max = Math.max(...values) * 1.04 || 1;
  const w = 720;
  const h = 260;
  const pad = { l: 64, r: 20, t: 20, b: 40 };
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;
  const y = (v: number) => pad.t + ((max - v) / (max - min || 1)) * ih;
  const x = (i: number) =>
    points.length <= 1 ? pad.l + iw / 2 : pad.l + (i / (points.length - 1)) * iw;
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`)
    .join(" ");
  const ticks = [max, (max + min) / 2, min];
  const active = hover != null ? points[hover] : points[points.length - 1];

  return (
    <div>
      <MetricTabs metric={metric} onChange={setMetric} />
      <div className="relative mt-3">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img">
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={pad.l}
                x2={w - pad.r}
                y1={y(t)}
                y2={y(t)}
                stroke="rgba(255,255,255,0.06)"
              />
              <text
                x={pad.l - 8}
                y={y(t) + 4}
                textAnchor="end"
                fill="#a1a1aa"
                fontSize="11"
                fontFamily="ui-monospace, monospace"
              >
                {formatMoney(t)}
              </text>
            </g>
          ))}
          {points.length > 1 && (
            <path d={path} fill="none" stroke="#60a5fa" strokeWidth="2" />
          )}
          {points.map((p, i) => (
            <g key={p.id}>
              <circle
                cx={x(i)}
                cy={y(p.value)}
                r={i === points.length - 1 ? 5.5 : 4}
                fill={i === hover ? "#fff" : "#93c5fd"}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
              <text
                x={x(i)}
                y={h - 12}
                textAnchor="middle"
                fill="#71717a"
                fontSize="10"
              >
                {formatDateTime(p.observed_at).replace(/,?\s*\d{4}/, "")}
              </text>
            </g>
          ))}
        </svg>
        {active && (
          <div className="pointer-events-none absolute right-2 top-2 rounded-xl border border-white/10 bg-ink-900/90 px-3 py-2 text-xs text-zinc-300">
            <div className="font-semibold text-white">{label}</div>
            <div className="mt-1 font-mono text-sm text-white">
              {formatMoneyExact(active.value)}
            </div>
            <div className="mt-1 text-zinc-500">
              {active.theatrical_date ? (
                <>
                  Theatrical: {formatTheatricalDay(active.theatrical_date)}
                  <br />
                  Ingested: {formatDateTime(active.observed_at)}
                </>
              ) : (
                <>Ingested: {formatDateTime(active.observed_at)}</>
              )}
            </div>
            {active.previous_value != null && (
              <>
                <div className="mt-1">
                  Previous: {formatMoneyExact(active.previous_value)}
                </div>
                <div>
                  Change: {formatSignedMoney(active.absolute_change)}{" "}
                  {formatError(active.percentage_change)}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <table className="mt-4 w-full text-left text-sm">
        <thead className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="py-2">Theatrical day</th>
            <th className="py-2">Ingested</th>
            <th className="py-2 text-right">Value</th>
            <th className="py-2 text-right">Change</th>
            <th className="py-2 text-right">Change %</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {points.map((row) => (
            <tr key={row.id}>
              <td className="py-2 text-zinc-300">
                {row.theatrical_date
                  ? formatTheatricalDay(row.theatrical_date)
                  : "—"}
              </td>
              <td className="py-2 text-zinc-400">{formatDateTime(row.observed_at)}</td>
              <td className="py-2 text-right font-mono">{formatMoney(row.value)}</td>
              <td className="py-2 text-right font-mono text-zinc-300">
                {row.previous_value == null
                  ? "New"
                  : formatSignedMoney(row.absolute_change)}
              </td>
              <td className="py-2 text-right font-mono text-zinc-400">
                {row.previous_value == null
                  ? "—"
                  : formatError(row.percentage_change)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MetricTabs({
  metric,
  onChange,
}: {
  metric: string;
  onChange: (m: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {CANONICAL_METRICS.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`rounded-md px-3 py-1 text-xs font-medium ${
            metric === t.id
              ? "bg-white/10 text-white"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
