"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function UntrackButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function untrack() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/movies/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to untrack");
      router.push("/movies");
      router.refresh();
    } catch {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={untrack}
      disabled={busy}
      className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
    >
      {busy ? "Removing…" : "Untrack"}
    </button>
  );
}
