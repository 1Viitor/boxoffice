"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatMoney } from "@/forecasting/money";
import { formatShortDate } from "@/lib/format";
import type { ForecastRow, ForecastType } from "@/forecasting/types";

export function ForecastEditor({
  movieId,
  type,
  label,
  current,
  history,
}: {
  movieId: string;
  type: ForecastType;
  label: string;
  current: ForecastRow | null;
  history: ForecastRow[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/forecasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movieId,
          forecastType: type,
          value,
          note,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setValue("");
      setNote("");
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {label}
          </div>
          <div className="mt-1 font-mono text-2xl font-semibold tabular-nums text-white">
            {formatMoney(current?.value)}
          </div>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-zinc-300 hover:bg-white/5"
        >
          Edit
        </button>
      </div>

      {open && (
        <div className="mt-4 space-y-3 border-t border-white/5 pt-4">
          <p className="text-sm text-zinc-400">
            Current:{" "}
            <span className="font-mono text-white">
              {formatMoney(current?.value)}
            </span>
          </p>
          <label className="block text-sm text-zinc-400">
            New estimate
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="72M"
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-white outline-none focus:border-blue-400/50"
            />
          </label>
          <label className="block text-sm text-zinc-400">
            Note
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Friday numbers came in stronger than expected"
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-blue-400/50"
            />
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            onClick={save}
            disabled={busy || !value.trim()}
            className="rounded-lg bg-gradient-to-r from-blue-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      )}

      {history.length > 0 && (
        <ol className="mt-4 space-y-1 border-t border-white/5 pt-3 text-sm">
          {[...history].reverse().map((row) => (
            <li
              key={row.id}
              className="flex items-baseline justify-between gap-3 text-zinc-400"
            >
              <span>{formatShortDate(row.created_at)}</span>
              <span className="font-mono tabular-nums text-zinc-200">
                {formatMoney(row.value)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
