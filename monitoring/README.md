# monitoring

What this module does: periodically checks active tracked movies against the canonical source.

What data enters: the list of active movies (from `movie_catalog`) and a poll interval (`THE_NUMBERS_POLL_INTERVAL_MINUTES`).

What it outputs: a check record for every fetch, and a call into `canonical_data` when a snapshot arrives.

What can be changed independently: how often we poll, overlap/skip rules, and how the scheduler is started. It does not parse HTML.
