import Link from "next/link";
import { notFound } from "next/navigation";
import { getMovieById } from "@/movie_catalog/repo";
import { listForecasts, latestByType } from "@/forecasting/repo";
import { listNotes } from "@/notes/repo";
import { listObservations, latestByMetric } from "@/canonical_data/repo";
import { Poster } from "@/components/Poster";
import { UntrackButton } from "@/components/UntrackButton";
import { ForecastEditor } from "@/components/ForecastEditor";
import { NoteForm } from "@/components/NoteForm";
import { CanonicalChart } from "@/components/CanonicalChart";
import { CanonicalChangeFeed } from "@/components/CanonicalChangeFeed";
import { LiveRefresh } from "@/components/LiveRefresh";
import { SyncNowButton } from "@/components/SyncNowButton";
import { formatDate, formatDateTime, formatTheatricalDay, primaryReleaseRow, timeAgo } from "@/lib/format";
import { formatMoney, formatSignedMoney } from "@/forecasting/money";
import { FORECAST_TYPES } from "@/forecasting/types";
import { CANONICAL_METRICS } from "@/canonical_data/types";
import { statusClass, statusLabel } from "@/movie_catalog/status";
import { formatError } from "@/analytics";

export const dynamic = "force-dynamic";

export default async function MovieDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const movie = await getMovieById(id);
  if (!movie) notFound();

  const [forecasts, notes, observations] = await Promise.all([
    listForecasts(id),
    listNotes(id),
    listObservations(id),
  ]);

  const latestForecast = latestByType(forecasts);
  const latestCanon = latestByMetric(observations);
  const ow = latestCanon.opening_weekend;
  const rel = primaryReleaseRow(movie.releases);

  return (
    <div className="py-8">
      <LiveRefresh />
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 transition hover:text-white"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to movies
        </Link>
      </div>

      <div className="flex flex-col gap-6 sm:flex-row">
        <Poster
          src={movie.thumbnail_url}
          alt={movie.title}
          className="h-64 w-44 flex-none self-center rounded-2xl object-cover shadow-2xl shadow-black/40 sm:self-start"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                {movie.title}
                {movie.year ? (
                  <span className="ml-2 text-xl font-normal text-zinc-500">
                    ({movie.year})
                  </span>
                ) : null}
              </h1>
              <p className="mt-1 text-zinc-400">
                {formatDate(rel?.release_date, rel?.release_date_text)}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                movie.status
              )}`}
            >
              {statusLabel(movie.status)}
            </span>
          </div>

          {ow ? (
            <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Opening Weekend · current
              </div>
              <div className="mt-1 font-mono text-2xl text-white">
                {formatMoney(ow.value)}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-zinc-400">
                {ow.previous_value != null && (
                  <span>
                    Previous {formatMoney(ow.previous_value)} ·{" "}
                    {formatSignedMoney(ow.absolute_change)}{" "}
                    {formatError(ow.percentage_change)}
                  </span>
                )}
                <span>
                  First{" "}
                  {formatMoney(
                    observations.find((o) => o.metric === "opening_weekend")
                      ?.value
                  )}
                </span>
                <span>
                  {observations.filter((o) => o.metric === "opening_weekend").length}{" "}
                  update
                  {observations.filter((o) => o.metric === "opening_weekend").length === 1
                    ? ""
                    : "s"}
                </span>
              </div>
            </div>
          ) : (
            <p className="mt-5 text-sm text-zinc-500">
              Waiting for Opening Weekend from The Numbers.
            </p>
          )}

          <dl className="mt-4 grid grid-cols-2 gap-2 text-xs text-zinc-500 sm:grid-cols-3">
            <div>
              Last checked
              <div className="text-zinc-300">{timeAgo(movie.last_checked_at)}</div>
            </div>
            <div>
              Last successful update
              <div className="text-zinc-300">
                {timeAgo(movie.last_successful_check_at)}
              </div>
            </div>
            {movie.status !== "WEEKEND_LIVE" && (
              <div>
                Last canonical change
                <div className="text-zinc-300">
                  {timeAgo(movie.last_canonical_change_at)}
                </div>
              </div>
            )}
          </dl>

          {movie.status === "WEEKEND_LIVE" && (
            <div className="mt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Canonical changes
              </h3>
              <CanonicalChangeFeed observations={observations} />
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            <SyncNowButton movieId={movie.id} />
            <a
              href={movie.the_numbers_url}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
            >
              Source: The Numbers
            </a>
            {movie.is_active && <UntrackButton id={movie.id} />}
          </div>
        </div>
      </div>

      <h2 className="mt-10 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Latest canonical values
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {CANONICAL_METRICS.map((m) => {
          const row = latestCanon[m.id];
          return (
            <div
              key={m.id}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
            >
              <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                {m.label}
              </div>
              <div className="mt-1 font-mono text-lg text-white">
                {row ? formatMoney(row.value) : "—"}
              </div>
              {row?.theatrical_date && (
                <div className="mt-1 text-[11px] text-zinc-400">
                  {formatTheatricalDay(row.theatrical_date)}
                </div>
              )}
              {row?.observed_at && (
                <div className="mt-0.5 text-[11px] text-zinc-500">
                  Ingested {formatDateTime(row.observed_at)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <h2 className="mt-10 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Canonical history
      </h2>
      <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <CanonicalChart observations={observations} />
      </div>

      <h2 className="mt-10 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Our forecasts
      </h2>
      <div className="mt-3 grid gap-4 md:grid-cols-3">
        {FORECAST_TYPES.map((t) => (
          <ForecastEditor
            key={t.id}
            movieId={id}
            type={t.id}
            label={t.label}
            current={latestForecast[t.id] ?? null}
            history={forecasts.filter((f) => f.forecast_type === t.id)}
          />
        ))}
      </div>

      <h2 className="mt-10 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Notes
      </h2>
      <NoteForm movieId={id} />
      <ul className="mt-4 space-y-3">
        {notes.map((n) => (
          <li
            key={n.id}
            className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3"
          >
            <div className="text-xs text-zinc-500">
              {formatDateTime(n.created_at)}
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-200">
              {n.body}
            </p>
          </li>
        ))}
        {notes.length === 0 && (
          <li className="text-sm text-zinc-500">No notes yet.</li>
        )}
      </ul>
    </div>
  );
}
