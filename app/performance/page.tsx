import Link from "next/link";
import { getAllMovies } from "@/movie_catalog/repo";
import { listForecastsForMovies } from "@/forecasting/repo";
import { listObservationsForMovies } from "@/canonical_data/repo";
import { isDbConfigured } from "@/lib/db";
import { formatMoney } from "@/forecasting/money";
import { forecastLabel } from "@/forecasting/types";
import {
  formatError,
  resolvePredictions,
  summarizePerformance,
} from "@/analytics";

export const dynamic = "force-dynamic";

export default async function PerformancePage() {
  const configured = isDbConfigured();
  const movies = configured ? await getAllMovies() : [];
  const ids = movies.map((m) => m.id);
  const [forecasts, observations] = configured
    ? await Promise.all([
        listForecastsForMovies(ids),
        listObservationsForMovies(ids),
      ])
    : [[], []];

  const movieById = new Map(movies.map((m) => [m.id, m]));
  const resolved = movies.flatMap((m) =>
    resolvePredictions(
      m.id,
      forecasts.filter((f) => f.movie_id === m.id),
      observations.filter((o) => o.movie_id === m.id)
    )
  );
  const perf = summarizePerformance(resolved);

  return (
    <div className="py-6">
      <h1 className="text-2xl font-bold tracking-tight text-white">
        Performance
      </h1>
      <p className="mt-1 text-sm text-zinc-400">
        How our forecasts compared to canonical results.
      </p>

      <section className="mt-6 grid grid-cols-3 gap-3">
        <Stat label="Resolved predictions" value={String(perf.resolved)} />
        <Stat
          label="Average error"
          value={
            perf.averageError == null
              ? "—"
              : formatError(perf.averageError).replace("+", "")
          }
        />
        <Stat
          label="Best prediction"
          value={
            perf.bestError == null
              ? "—"
              : formatError(perf.bestError).replace("+", "")
          }
        />
      </section>

      {resolved.length === 0 ? (
        <p className="mt-8 text-sm text-zinc-500">
          No resolved predictions yet. Log a forecast, then add a canonical
          Opening Weekend / End of Month / End of Year update (mark Final when
          the number is locked).
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.03] text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3">Movie</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Our forecast</th>
                <th className="px-4 py-3 text-right">Actual</th>
                <th className="px-4 py-3 text-right">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {resolved.map((r) => (
                <tr key={`${r.movieId}-${r.forecastType}`}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/movies/${r.movieId}`}
                      className="text-white hover:underline"
                    >
                      {movieById.get(r.movieId)?.title ?? r.movieId}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {forecastLabel(r.forecastType)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {formatMoney(r.forecastValue)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {formatMoney(r.actualValue)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-300">
                    {formatError(r.errorPct)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div className="mt-1 font-mono text-xl tabular-nums text-white">
        {value}
      </div>
    </div>
  );
}
