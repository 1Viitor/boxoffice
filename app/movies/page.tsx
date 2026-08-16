import Link from "next/link";
import { getTrackedMovies } from "@/lib/repo";
import { isDbConfigured } from "@/lib/db";
import { Poster } from "@/components/Poster";
import { formatDate, primaryReleaseRow, releaseTypeClass } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MoviesPage() {
  const configured = isDbConfigured();
  const movies = configured ? await getTrackedMovies() : [];

  return (
    <div className="py-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Tracked movies
          </h1>
          <p className="text-sm text-zinc-400">
            {movies.length} {movies.length === 1 ? "title" : "titles"} in your
            tracker
          </p>
        </div>
        <Link
          href="/"
          className="rounded-lg bg-gradient-to-r from-blue-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:opacity-90"
        >
          Add movie
        </Link>
      </div>

      {!configured && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-5 text-amber-200">
          <p className="font-medium">Supabase isn’t configured yet.</p>
          <p className="mt-1 text-sm text-amber-200/80">
            Add <code className="rounded bg-black/30 px-1">SUPABASE_URL</code> and{" "}
            <code className="rounded bg-black/30 px-1">SUPABASE_ANON_KEY</code>{" "}
            to <code className="rounded bg-black/30 px-1">.env.local</code>, then
            apply the migrations in{" "}
            <code className="rounded bg-black/30 px-1">supabase/migrations/</code>
            .
          </p>
        </div>
      )}

      {configured && movies.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center">
          <p className="text-zinc-300">No movies tracked yet.</p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
          >
            Track your first movie
          </Link>
        </div>
      )}

      {movies.length > 0 && (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {movies.map((m) => {
            const rel = primaryReleaseRow(m.releases);
            return (
              <li key={m.id}>
                <Link
                  href={`/movies/${m.id}`}
                  className="group block overflow-hidden rounded-2xl border border-white/10 bg-ink-900/50 transition hover:border-white/20 hover:bg-ink-900"
                >
                  <div className="relative aspect-[2/3] w-full overflow-hidden">
                    <Poster
                      src={m.thumbnail_url}
                      alt={m.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                    {rel?.release_type && (
                      <span
                        className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ${releaseTypeClass(
                          rel.release_type
                        )}`}
                      >
                        {rel.release_type}
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="truncate font-medium text-white">
                      {m.title}
                    </div>
                    <div className="mt-0.5 text-xs text-zinc-400">
                      {formatDate(rel?.release_date, rel?.release_date_text)}
                    </div>
                    {rel?.distributor && (
                      <div className="mt-0.5 truncate text-xs text-zinc-500">
                        {rel.distributor}
                      </div>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
