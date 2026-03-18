# ChalkBuster 2026

A data-driven March Madness bracket analysis tool for small bracket pools (6-15 friends). Built for the 2026 NCAA Tournament.

**Live:** [https://zuluetat.github.io/ChalkBuster/](https://zuluetat.github.io/ChalkBuster/)

## What It Does

- **Click-to-pick bracket** — Pick winners through all 63 games across 4 regions, Final Four, and Championship
- **Side-by-side analysis cards** — Every matchup shows SRS, eFG%, pace, pros/cons, and a confidence rating
- **Trapezoid of Excellence** — Visual scatterplot showing which teams are in the championship contender zone (SRS +25 floor, calibrated to Ryan Hammer's 2026 data)
- **516 pre-generated matchup analyses** — AI-generated prose for R64/R32/S16, template-generated for E8/F4/CHM. Every number traces to verified Sports Reference stats
- **Momentum sentiment** — 6-tier scale (Ice Cold to On Fire) from ESPN/CBS reporting
- **Contrarian flags** — Highlights where the data pick differs from public consensus
- **Upset alerts** — Flags matchups where the lower seed has >30% win probability
- **Supabase persistence** — Picks auto-save, survive browser close, sync across devices
- **Share links** — Read-only view for friends, tipoff-gated until March 19 at noon ET
- **Edit links** — Full edit access from any device via `?edit=BRACKET_ID`
- **Print/export** — Clean one-page landscape bracket via `window.print()`

## Data Sources

All statistical data is sourced and verified:

| Field | Source | Verified |
|-------|--------|----------|
| SRS, pace, ORtg, eFG%, TOV%, ORB%, FTR, SOS | Sports Reference CSV (2026-03-17) | Field-verified for 5 teams against live ESPN |
| Win probabilities | SRS logistic model: `1/(1+10^(-srs_diff/10))` | Computed programmatically, 0 errors across 516 matchups |
| Records (W-L) | Sports Reference CSV | Cross-checked with ESPN schedule pages |
| Seeds, regions | NCAA.com bracket reveal | Confirmed for all 68 teams |
| Momentum (Last 10) | ESPN/CBS articles (15 teams verified), computed sentiment (53 teams) | Sourced with article citations |
| Team logos | ESPN CDN | Live-loaded |
| Injuries | ESPN, CBS Sports, Yahoo Sports | Sourced with article URLs |

### What's NOT Sourced (labeled in UI)

- KenPom adjEM/adjO/adjD values — carried from original file, never verified against kenpom.com
- Spreads and public pick percentages — original estimates, not from sportsbooks
- A disclaimer appears on every analysis card noting these limitations

## Data Integrity

Every matchup was validated by a 4-team independent validation pipeline:

1. **Quantitative** — win_prob recomputed from SRS, recommendation and confidence verified
2. **Prose-stat cross-check** — every number in reasoning/pros/cons traced to source stats (8,284 numbers, 0 orphans)
3. **Sentiment consistency** — prose tone aligns with recommendation direction
4. **Cross-round consistency** — same team's stats cited identically across all appearances

**Result: 516 matchups validated, 0 errors.**

## Architecture

```
ChalkBuster/
├── index.html              # Single-page app entry
├── css/
│   ├── main.css            # Global styles, hero, toolbar, print
│   ├── bracket.css         # Bracket grid, matchup cards, connectors
│   └── analysis.css        # Analysis overlay, metrics, trapezoid
├── js/
│   ├── app.js              # Entry point, init, toolbar, print bracket
│   ├── state.js            # Reactive state (picks, teams, slots)
│   ├── bracket.js          # Bracket rendering, pick advancement
│   ├── regions.js          # Region tab navigation
│   ├── firstFour.js        # First Four rendering
│   ├── analysis.js         # Analysis cards, trapezoid chart, scenario lookup
│   ├── supabase.js         # Supabase REST API (save/load/share/edit)
│   └── validate.js         # Browser console data integrity checker
├── data/
│   ├── teams.json          # 68 teams with seeds, records, stats
│   ├── bracket.json        # 63-slot bracket structure
│   ├── first_four.json     # 4 First Four games (pre-resolved)
│   ├── matchups.json       # 32 R64 matchups with full analysis
│   ├── real_stats_2026.json # Sports Reference verified stats
│   └── scenario_matchups.json # 484 R32-CHM pre-generated analyses
└── .planning/              # GSD project planning artifacts
```

## Stack

- **Frontend:** Plain HTML/CSS/JS (no build tools, no framework)
- **Persistence:** Supabase REST API (anonymous, no auth)
- **Hosting:** GitHub Pages
- **Data:** Sports Reference CSV + ESPN/CBS narrative context

## Win Probability Model

```
P(team_a wins) = 1 / (1 + 10^(-(srs_a - srs_b) / 10))
```

Where SRS is the Sports Reference Simple Rating System — margin of victory adjusted for strength of schedule. This is a documented, reproducible formula that any analyst can verify independently.

## Trapezoid of Excellence (v3)

The trapezoid visualization is calibrated to Ryan Hammer's published 2026 data:

- **Inside (SRS ≥ 25):** ~8-9 teams — championship contenders
- **Near-edge (SRS 22-25):** Competitive but ceiling capped
- **Near (SRS 15-22):** Deep run possible, title unlikely
- **Outside (SRS < 15):** Cannot win national title (historical precedent)

Calibration anchor: Gonzaga (SRS 25.11) was the lowest confirmed inside team per Hammer's Sweet 16 tweet.

## Attribution

> Statistical data: Sports Reference (sports-reference.com/cbb), retrieved 2026-03-17. © Sports Reference LLC.
> Scores and schedule data: ESPN (espn.com / site.api.espn.com). ESPN is the owner of this data.
> Tournament bracket and seeds: NCAA.com, © National Collegiate Athletic Association.
> Narrative context: CBS Sports, ESPN, Yahoo Sports.

## License

Personal project for a bracket pool. Not for commercial use. Data sources retain their original copyrights.
