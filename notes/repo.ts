import { getSupabaseAdmin } from "@/lib/db";
import type { NoteRow } from "./types";

export async function listNotes(movieId: string): Promise<NoteRow[]> {
  const db = getSupabaseAdmin();
  if (!db) return [];
  const { data, error } = await db
    .from("notes")
    .select("*")
    .eq("movie_id", movieId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as NoteRow[]) ?? [];
}

export async function addNote(movieId: string, body: string): Promise<NoteRow> {
  const db = getSupabaseAdmin();
  if (!db) throw new Error("Database is not configured.");
  const { data, error } = await db
    .from("notes")
    .insert({ movie_id: movieId, body: body.trim() })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as NoteRow;
}
