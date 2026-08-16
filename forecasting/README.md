# forecasting

What this module does: our box-office estimates (Opening Weekend, End of Month, End of Year) and their history.

What data enters: a movie id, a forecast type, a dollar value, and an optional reasoning note.

What it outputs: append-only forecast rows. The latest row per type is the current estimate. Older rows are never overwritten.

What can be changed independently: forecast types, money parsing/display, and how “current” vs history is chosen.
