# analytics

What this module does: simple scorekeeping — forecast error, average error, best prediction, source revision %.

What data enters: forecast history + canonical observations for the same movie/metric.

What it outputs: per-movie resolved results and a one-user performance summary (resolved count, average error, best error).

What can be changed independently: error formula, what counts as “resolved”, extra stats later. No ML here.
