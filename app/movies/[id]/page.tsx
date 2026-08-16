import Link from "next/link";
import { notFound } from "next/navigation";
import { getMovieById } from "@/lib/repo";
import { Poster } from "@/components/Poster";
import { UntrackButton } from "@/components/UntrackButton";
import { formatDate, releaseTypeClass } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MovieDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const movie = await getMovieById(id);
  if (!movie) notFound();

  const releases = [...(movie.releases || [])].sort((a, b) =>
    (a.release_date || "9999-12-31").localeCompare(b.release_date || "9999-12-31")
  );

  return (
    <div className="py-8">
      <div className="mb-6">
        <Link
          href="/movies"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 transition hover:text-white"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to tracker
        </Link>
      </div>

      <div className="flex flex-col gap-6 sm:flex-row">
        <Poster
          src={movie.thumbnail_url}
          alt={movie.title}
          className="h-80 w-56 flex-none self-center rounded-2xl object-cover shadow-2xl shadow-black/40 sm:self-start"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              {movie.title}
              {movie.year ? (
                <span className="ml-2 text-xl font-normal text-zinc-500">
                  ({movie.year})
                </span>
              ) : null}
            </h1>
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-inset ring-emerald-500/30">
              {movie.status}
            </span>
          </div>

          <h2 className="mt-6 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Domestic releases
          </h2>
          {releases.length ? (
            <ul className="mt-2 space-y-2">
              {releases.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3"
                >
                  <span className="font-medium text-white">
                    {formatDate(r.release_date, r.release_date_text)}
                  </span>
                  {r.release_type && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${releaseTypeClass(
                        r.release_type
                      )}`}
                    >
                      {r.release_type}
                      {r.is_re_release ? " · re-release" : ""}
                    </span>
                  )}
                  {r.distributor && (
                    <span className="text-sm text-zinc-400">{r.distributor}</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-zinc-500">No releases recorded.</p>
          )}

          <div className="mt-8 flex flex-wrap gap-2">
            <a
              href={movie.the_numbers_url}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/5"
            >
              View on The Numbers
            </a>
            <UntrackButton id={movie.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
