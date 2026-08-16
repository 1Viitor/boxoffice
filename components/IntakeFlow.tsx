"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Poster } from "@/components/Poster";
import { formatDate, releaseTypeClass } from "@/lib/format";
import type { Candidate, ValidationResult } from "@/lib/types";

type Phase = "search" | "validating" | "result" | "tracked";

export function IntakeFlow() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Candidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [phase, setPhase] = useState<Phase>("search");
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [tracking, setTracking] = useState(false);
  const [trackedId, setTrackedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounced live search.
  useEffect(() => {
    if (phase !== "search") return;
    const q = query.trim();
    if (!q) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: ctrl.signal,
        });
        const data = await res.json();
        setResults(Array.isArray(data.results) ? data.results : []);
        setError(data.error ?? null);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setError("Search failed. Try again.");
        }
      } finally {
        setSearching(false);
      }
    }, 220);
    return () => clearTimeout(timer);
  }, [query, phase]);

  async function selectCandidate(c: Candidate) {
    setSelected(c);
    setResults([]);
    setValidation(null);
    setError(null);
    setPhase("validating");
    try {
      const res = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: c.url, thumbnail: c.thumbnail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Validation failed");
      setValidation(data as ValidationResult);
      setPhase("result");
    } catch (e) {
      setError((e as Error).message);
      setPhase("result");
    }
  }

  async function track() {
    if (!validation) return;
    setTracking(true);
    setError(null);
    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: validation.url,
          thumbnail: validation.thumbnail,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not track movie");
      setTrackedId(data.movieId);
      setPhase("tracked");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setTracking(false);
    }
  }

  function reset() {
    setQuery("");
    setResults([]);
    setSelected(null);
    setValidation(null);
    setTrackedId(null);
    setError(null);
    setPhase("search");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  return (
    <div className="w-full">
      {(phase === "search" || phase === "validating") && (
        <div className="relative">
          <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={phase === "validating"}
            placeholder="Search for a movie…  e.g. The Cat in the Hat"
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-11 pr-4 text-base text-white placeholder:text-zinc-500 outline-none transition focus:border-blue-400/50 focus:bg-white/[0.07] focus:ring-4 focus:ring-blue-500/10"
          />
          {searching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <Spinner />
            </div>
          )}
        </div>
      )}

      {error && phase === "search" && (
        <p className="mt-3 text-sm text-red-400">{error}</p>
      )}

      {/* Candidate results */}
      {phase === "search" && results.length > 0 && (
        <ul className="mt-3 divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/10 bg-ink-900/60 backdrop-blur">
          {results.map((c) => (
            <li key={c.slug || c.url}>
              <button
                onClick={() => selectCandidate(c)}
                className="flex w-full items-center gap-4 px-4 py-3 text-left transition hover:bg-white/5"
              >
                <Poster
                  src={c.thumbnail}
                  alt={c.displayName}
                  className="h-16 w-11 flex-none rounded-md object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-white">
                    {c.displayName}
                    {c.year ? (
                      <span className="ml-1.5 font-normal text-zinc-500">
                        ({c.year})
                      </span>
                    ) : null}
                  </div>
                  {c.leadCast && (
                    <div className="truncate text-sm text-zinc-400">
                      {c.leadCast}
                    </div>
                  )}
                  {c.director && (
                    <div className="truncate text-xs text-zinc-500">
                      Dir: {c.director}
                    </div>
                  )}
                </div>
                <span className="flex-none text-zinc-600">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {phase === "search" &&
        !searching &&
        query.trim().length > 0 &&
        results.length === 0 &&
        !error && (
          <p className="mt-4 text-sm text-zinc-500">
            No movies found for “{query.trim()}”.
          </p>
        )}

      {/* Validating */}
      {phase === "validating" && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-ink-900/60 p-5 text-zinc-300">
          <Spinner />
          <span>
            Checking The Numbers for a domestic theatrical release…
          </span>
        </div>
      )}

      {/* Result / validation card */}
      {phase === "result" && validation && (
        <ValidationCard
          validation={validation}
          onTrack={track}
          tracking={tracking}
          onBack={reset}
          error={error}
        />
      )}
      {phase === "result" && !validation && error && (
        <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
          <p className="text-red-300">{error}</p>
          <button
            onClick={reset}
            className="mt-3 rounded-lg border border-white/10 px-3 py-1.5 text-sm text-zinc-300 hover:bg-white/5"
          >
            Search again
          </button>
        </div>
      )}

      {/* Tracked success */}
      {phase === "tracked" && validation && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-6">
          <div className="flex items-center gap-2 text-emerald-300">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            <span className="text-lg font-semibold">Now tracking</span>
          </div>
          <p className="mt-1 text-zinc-300">
            <span className="font-medium text-white">{validation.title}</span>{" "}
            was added to your tracker.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {trackedId && (
              <Link
                href={`/movies/${trackedId}`}
                className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
              >
                View movie
              </Link>
            )}
            <Link
              href="/"
              className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
            >
              View tracker
            </Link>
            <button
              onClick={reset}
              className="rounded-lg bg-gradient-to-r from-blue-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:opacity-90"
            >
              Track another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ValidationCard({
  validation,
  onTrack,
  tracking,
  onBack,
  error,
}: {
  validation: ValidationResult;
  onTrack: () => void;
  tracking: boolean;
  onBack: () => void;
  error: string | null;
}) {
  const { title, year, thumbnail, domesticReleases, eligible, reason } = validation;
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-ink-900/60">
      <div className="flex flex-col gap-5 p-5 sm:flex-row">
        <Poster
          src={thumbnail}
          alt={title}
          className="h-52 w-36 flex-none self-center rounded-xl object-cover sm:self-start"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-white">
                {title}
                {year ? (
                  <span className="ml-2 font-normal text-zinc-500">({year})</span>
                ) : null}
              </h2>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                eligible
                  ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/30"
                  : "bg-red-500/15 text-red-300 ring-1 ring-inset ring-red-500/30"
              }`}
            >
              {eligible ? "Eligible to track" : "Not eligible"}
            </span>
          </div>

          <p
            className={`mt-2 text-sm ${
              eligible ? "text-emerald-300/90" : "text-red-300/90"
            }`}
          >
            {reason}
          </p>

          <div className="mt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Domestic releases
            </h3>
            {domesticReleases.length ? (
              <ul className="mt-2 space-y-2">
                {domesticReleases.map((r, i) => (
                  <li
                    key={i}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-white/[0.03] px-3 py-2"
                  >
                    <span className="font-medium text-white">
                      {formatDate(r.date, r.dateText)}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${releaseTypeClass(
                        r.type
                      )}`}
                    >
                      {r.type}
                      {r.isReRelease ? " · re-release" : ""}
                      {r.isCanceled ? " · canceled" : ""}
                    </span>
                    {r.distributor && (
                      <span className="text-sm text-zinc-400">
                        {r.distributor}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-zinc-500">
                No domestic release listed.
              </p>
            )}
          </div>

          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={onTrack}
              disabled={!eligible || tracking}
              className="rounded-lg bg-gradient-to-r from-blue-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {tracking ? "Tracking…" : "Track this movie"}
            </button>
            <a
              href={validation.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/5"
            >
              View on The Numbers
            </a>
            <button
              onClick={onBack}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/5"
            >
              Search again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="h-5 w-5 animate-spin text-blue-400"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
