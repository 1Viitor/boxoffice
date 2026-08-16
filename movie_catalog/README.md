# movie_catalog

What this module does: movie selection, eligibility, and the active tracked list (max 20).

What data enters: The Numbers search/detail payloads (via `integrations/`) plus user track/untrack actions.

What it outputs: tracked movie records, release rows, and lifecycle status (`PRE_RELEASE` / `WEEKEND_LIVE` / `POST_OPENING` / `COMPLETED`).

What can be changed independently: eligibility rules, the 20-title cap, and how status is derived from the release date.
