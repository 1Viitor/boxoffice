"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function NoteForm({ movieId }: { movieId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (busy || !body.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movieId, body }),
      });
      if (!res.ok) throw new Error("Failed");
      setBody("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="Friday performance is better than expected…"
        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-blue-400/50"
      />
      <button
        onClick={save}
        disabled={busy || !body.trim()}
        className="mt-2 rounded-lg border border-white/10 px-3 py-1.5 text-sm text-zinc-300 hover:bg-white/5 disabled:opacity-40"
      >
        {busy ? "Adding…" : "Add note"}
      </button>
    </div>
  );
}
