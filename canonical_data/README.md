# canonical_data

What this module does: stores official/source box-office observations and fetch checks.

What data enters: a normalized snapshot from `integrations` (never HTML).

What it outputs: append-only `canonical_observations` (only when a value changes) and `canonical_checks` (every fetch). Latest value, history table, and chart all read the same observations.

What can be changed independently: change-detection rules, extra metrics, how “latest” is chosen. Never UPDATE an old observation.
