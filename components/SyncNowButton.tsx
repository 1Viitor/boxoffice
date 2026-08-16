"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SyncNowButton({ movieId }: { movieId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch(`/api/movies/${movieId}/sync`, { method: "POST" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={run}
      disabled={busy}
      className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5 disabled:opacity-40"
    >
      {busy ? "Checking…" : "Check The Numbers now"}
    </button>
  );
}
