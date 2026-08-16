# prediction

What this module does: runs AI-assisted opening weekend forecasts for tracked movies.

What data enters: movie metadata, canonical observations (preview/friday/saturday), and web research signals from OpenAI.

What it outputs: append-only rows in `predictions` with point estimate, range, confidence, rationale, signals, and citations.

What can be changed independently: the deterministic model (`model.ts`), OpenAI research prompts, and UI presentation. It does not scrape The Numbers directly.
