"use client";

import { useMemo, useState } from "react";
import { formatMoney } from "@/forecasting/money";
import { FORECAST_TYPES, type ForecastRow, type ForecastType } from "@/forecasting/types";
import { formatShortDate } from "@/lib/format";

export function ForecastChart({
  forecasts,
  finals,
}: {
  forecasts: ForecastRow[];
  finals: Partial<Record<ForecastType, number | null>>;
}) {
  const [type, setType] = useState<ForecastType>("opening_weekend");
  const points = useMemo(
    () => forecasts.filter((f) => f.forecast_type === type),
    [forecasts, type]
  );
  const finalValue = finals[type] ?? null;

  const label = FORECAST_TYPES.find((t) => t.id === type)?.label ?? type;

  if (!points.length && finalValue == null) {
    return (
      <div>
        <ChartTabs type={type} onChange={setType} />
        <p className="mt-4 text-sm text-zinc-500">
          No {label.toLowerCase()} forecasts yet.
        </p>
      </div>
    );
  }

  const values = points.map((p) => p.value);
  if (finalValue != null) values.push(finalValue);
  const min = Math.min(...values) * 0.96;
  const max = Math.max(...values) * 1.04 || 1;
  const w = 640;
  const h = 220;
  const pad = { l: 56, r: 16, t: 16, b: 36 };
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;

  function y(v: number) {
    return pad.t + ((max - v) / (max - min || 1)) * ih;
  }
  function x(i: number) {
    if (points.length <= 1) return pad.l + iw / 2;
    return pad.l + (i / (points.length - 1)) * iw;
  }

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`)
    .join(" ");

  const ticks = [max, (max + min) / 2, min];

  return (
    <div>
      <ChartTabs type={type} onChange={setType} />
      <svg viewBox={`0 0 ${w} ${h}`} className="mt-4 w-full" role="img">
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
        {finalValue != null && (
          <g>
            <line
              x1={pad.l}
              x2={w - pad.r}
              y1={y(finalValue)}
              y2={y(finalValue)}
              stroke="#34d399"
              strokeDasharray="4 4"
            />
            <text
              x={w - pad.r}
              y={y(finalValue) - 6}
              textAnchor="end"
              fill="#34d399"
              fontSize="11"
            >
              Final: {formatMoney(finalValue)}
            </text>
          </g>
        )}
        {points.length > 1 && (
          <path d={path} fill="none" stroke="#60a5fa" strokeWidth="2" />
        )}
        {points.map((p, i) => (
          <g key={p.id}>
            <circle cx={x(i)} cy={y(p.value)} r="4" fill="#93c5fd" />
            <text
              x={x(i)}
              y={h - 10}
              textAnchor="middle"
              fill="#71717a"
              fontSize="10"
            >
              {formatShortDate(p.created_at)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function ChartTabs({
  type,
  onChange,
}: {
  type: ForecastType;
  onChange: (t: ForecastType) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {FORECAST_TYPES.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`rounded-md px-3 py-1 text-xs font-medium ${
            type === t.id
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
