# integrations

What this module does: talks to external sources. Today that is only The Numbers (search, movie pages, release schedule, box office).

What data enters: a title query or a movie URL.

What it outputs: candidate titles, domestic-release facts, and a normalized box-office snapshot:

`preview`, `friday`, `saturday`, `sunday`, `opening_weekend`, `domestic_total`

Nothing about *our* forecasts lives here. The rest of the app never parses The Numbers HTML.

What can be changed independently: swap The Numbers for another source without touching monitoring, canonical_data, or the UI.
