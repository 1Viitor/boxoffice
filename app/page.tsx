import { IntakeFlow } from "@/components/IntakeFlow";

export default function Page() {
  return (
    <div className="py-8">
      <section className="mx-auto mb-8 max-w-2xl text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Powered by The Numbers
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Track a theatrical release
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-zinc-400">
          Search a movie, confirm it has a domestic theatrical release, and add
          eligible titles to your tracker.
        </p>
      </section>

      <div className="mx-auto max-w-2xl">
        <IntakeFlow />
      </div>

      <ol className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { n: 1, t: "Search", d: "Find the movie on The Numbers." },
          {
            n: 2,
            t: "Validate",
            d: "Confirm a domestic theatrical release.",
          },
          { n: 3, t: "Track", d: "Save eligible movies to your library." },
        ].map((s) => (
          <li
            key={s.n}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-4"
          >
            <div className="mb-2 grid h-7 w-7 place-items-center rounded-lg bg-white/5 text-sm font-semibold text-zinc-300">
              {s.n}
            </div>
            <div className="font-medium text-white">{s.t}</div>
            <div className="text-sm text-zinc-400">{s.d}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}
