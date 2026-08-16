import Link from "next/link";
import { getTrackedMovies } from "@/movie_catalog/repo";
import { listObservationsForMovies, latestByMetric } from "@/canonical_data/repo";
import { isDbConfigured } from "@/lib/db";
import { formatShortDate, primaryReleaseRow, timeAgo } from "@/lib/format";
import { formatMoney } from "@/forecasting/money";
import { MAX_TRACKED } from "@/movie_catalog/types";
import { LiveRefresh } from "@/components/LiveRefresh";
import type { ObservationRow } from "@/canonical_data/types";

export const dynamic = "force-dynamic";

function recent(iso: string | null | undefined) {
  if (!iso) return false;
  return Date.now() - new Date(iso).getTime() < 2 * 60 * 60 * 1000;
}

function OpeningWeekendCell({ obs }: { obs?: ObservationRow }) {
  if (!obs) return <span className="text-zinc-500">Waiting</span>;
  const moved = recent(obs.observed_at) && obs.previous_value != null;
  const pct =
    obs.percentage_change == null
      ? ""
      : `${obs.percentage_change > 0 ? "+" : ""}${obs.percentage_change.toFixed(1)}%`;
  return (
    <div className="text-right">
      <div className="font-mono tabular-nums text-zinc-100">
        {formatMoney(obs.value)}
        {moved && (obs.absolute_change ?? 0) > 0 ? (
          <span className="ml-1 text-emerald-400">↑</span>
        ) : moved && (obs.absolute_change ?? 0) < 0 ? (
          <span className="ml-1 text-red-400">↓</span>
        ) : null}
      </div>
      {moved && (
        <div className="text-[11px] text-zinc-500">
          {formatMoney(obs.previous_value)} → {formatMoney(obs.value)} {pct}
        </div>
      )}
    </div>
  );
}

export default async function DashboardPage() {
  const configured = isDbConfigured();
  const movies = configured ? await getTrackedMovies() : [];
  const observations = configured
    ? await listObservationsForMovies(movies.map((m) => m.id))
    : [];

  return (
    <div className="py-6">
      <LiveRefresh />
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Movies
          </h1>
          <p className="text-sm text-zinc-400">
            {movies.length} / {MAX_TRACKED} tracked · synced from The Numbers
          </p>
        </div>
        <Link
          href="/add"
          className="rounded-lg bg-gradient-to-r from-blue-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20"
        >
          Add movie
        </Link>
      </div>

      {!configured && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-5 text-amber-200">
          Supabase isn’t configured yet.
        </div>
      )}

      {configured && movies.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center">
          <p className="text-zinc-300">No movies tracked yet.</p>
          <Link
            href="/add"
            className="mt-4 inline-block rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
          >
            Track your first movie
          </Link>
        </div>
      )}

      {movies.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-white/[0.03] text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3">Movie</th>
                <th className="px-4 py-3">Release</th>
                <th className="px-4 py-3 text-right">Opening Weekend</th>
                <th className="px-4 py-3 text-right">Last update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {movies.map((m) => {
                const rel = primaryReleaseRow(m.releases);
                const latest = latestByMetric(
                  observations.filter((o) => o.movie_id === m.id)
                );
                return (
                  <tr key={m.id} className="hover:bg-white/[0.03]">
                    <td className="px-4 py-3">
                      <Link
                        href={`/movies/${m.id}`}
                        className="font-medium text-white hover:underline"
                      >
                        {m.title}
                      </Link>
                      {m.year ? (
                        <span className="ml-1 text-zinc-500">({m.year})</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {formatShortDate(rel?.release_date)}
                    </td>
                    <td className="px-4 py-3">
                      <OpeningWeekendCell obs={latest.opening_weekend} />
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-400">
                      {timeAgo(
                        m.last_canonical_change_at || m.last_successful_check_at
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
