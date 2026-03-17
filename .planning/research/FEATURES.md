# Feature Landscape

**Domain:** March Madness bracket analysis and pool picker tool
**Project:** ChalkBuster
**Researched:** 2026-03-17
**Confidence:** MEDIUM — Direct research of ESPN, CBS, PoolGenius, BracketOdds, FiveThirtyEight, NCAA.com bracket structures. WebSearch unavailable; findings triangulated across multiple live sources.

---

## Table Stakes

Features users expect. Missing = product feels incomplete or untrustworthy.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Full 64-team bracket visualization | It IS a bracket tool — no bracket = no product | High | Standard NCAA tournament bracket layout with First Four, R64, R32, S16, E8, F4, Championship |
| Click-to-pick team advancement | Core interaction pattern — every bracket tool has it | Medium | Clicking a team propagates them forward; re-picking a matchup clears downstream picks |
| Region tabs (East, South, Midwest, West) | Mental model users bring from ESPN/CBS | Low | Tabs reduce visual overwhelm for 68-team field |
| Team seeding visible | Seeds are how users talk about the tournament | Low | Seed number displayed prominently with team name |
| Seed records display | "How often does a 5-seed beat a 12-seed?" is the #1 question | Low | Historical seed win rates surface baseline expectations |
| Team name + seed in each slot | Every bracket tool shows this; without it users do not know who they are picking | Low | — |
| Pick percentage data | ESPN, CBS, Yahoo, PoolGenius all show public pick % — users expect to see "how everyone else is picking" | Low | Pre-baked data; no live scraping needed |
| Save bracket state | Users need to leave and return without losing work | Medium | Supabase persistence as defined in PROJECT.md |
| Visual win probability per matchup | Users want to know who is favored — raw "should I pick them?" signal | Low | Single number (e.g. 68% favorite) per matchup |
| Printable/exportable bracket | Users want to share with friends or submit elsewhere | Medium | PDF or image export — PROJECT.md lists this |

## Differentiators

Features that set ChalkBuster apart. Not expected, but valued in a pool-competitive context.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Pre-generated Claude analysis per matchup | No bracket tool offers LLM-written prose rationale for every R1 matchup — genuine differentiation in the casual pool market | Medium | 1-2 sentence reasoning baked into JSON; no runtime AI cost |
| Confidence tier labels (High/Medium/Low) | PoolGenius does this behind a paywall; free version with clear labels is rare | Low | Derived from spread + KenPom differential + public pick discrepancy |
| Contrarian opportunity flags | "The model likes them but only 22% of people pick them" — directly actionable pool strategy signal | Medium | Requires both model confidence and public pick % to compare |
| Upset alert highlights | Surfacing matchups where win probability for the lower seed is >30% focuses attention on high-leverage picks | Low | Visual badge/flag on matchup card; data already exists |
| Pros/cons card per team | Structured talking-points format is more scannable than prose | Medium | Pre-generated; 3-4 bullets each side per matchup |
| KenPom + SOS + spread shown together | Most casual tools show just one metric; showing three in context is more credible | Low | Pre-baked data display; no computation needed |
| Side-by-side matchup analysis card | Visual comparison layout — PoolGenius charges for this; a free clean UI is a real gap | Medium | Card component per matchup with both teams side-by-side |
| Shareable read-only link | Lets Tim share his picks with his pool without everyone needing an account | Low | Public URL param or Supabase public row; PROJECT.md defines this |
| ESPN-style broadcast aesthetic | Signals "serious bracket tool" vs. generic web app | Medium | CSS/design work; builds trust in the analysis |
| Region-by-region strategy narrative | Brief per-region text orients bracket strategy | Low | Optional; baked-in text from Claude |

## Anti-Features

Features to explicitly NOT build. Each costs time and adds risk without MVP value.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Multi-user bracket comparison | Pool has 6-15 people; building proper multi-user comparison requires auth, data models, and UI that doubles scope | Tim shares his bracket link; others build their own separately |
| Pool scoring simulation ("if X wins, I gain Y points") | Interesting but irrelevant when one person needs to pick before Wednesday | Focus analysis on best picks, not score modeling |
| ESPN/Yahoo API integration for direct submission | ESPN and Yahoo both block programmatic bracket submission; auth complexity is prohibitive | Tim manually copies his picks to ESPN after using ChalkBuster |
| Live score updates / in-tournament mode | The app is for pre-tournament picking, not in-progress tracking | Static bracket once filled; no real-time updates needed |
| Real-time AI/Claude API calls | Adds API key management, latency, and cost to a single-user MVP with a 48-hour window | All analysis pre-generated and baked into JSON at build time |
| Historical bracket analysis (multi-year) | One-time use tool for 2026; historical depth adds no value for this deadline | 2026 team data only |
| Mobile-native or PWA | Desktop-first tool for laptop bracket-filling; mobile polish takes time | Desktop-first, iPad-compatible is sufficient |
| Account creation / login | Tim is the only user; Supabase anonymous session or simple key is enough | No auth UI; Supabase row keyed to session or static ID |
| AI chat assistant / interactive Q&A | Pre-generated analysis answers the questions before they are asked | Include all reasoning in the matchup cards upfront |
| Betting integration / live odds feed | Spreads are baked in at data generation time; live odds would need a paid API | Use pre-fetched spread data in JSON |
| Pool leaderboard | Requires multiple users submitting brackets; out of scope for MVP | — |

---

## Feature Dependencies

```
Bracket visualization
  └── Click-to-pick (requires bracket to exist)
       └── Save/load state (requires picks to exist)
            └── Shareable link (requires saved state)

Team data JSON (KenPom, SOS, record, spread, pick%)
  └── Matchup analysis cards (require team data)
       └── Confidence tiers (derived from team data)
            └── Contrarian flags (require confidence + pick%)
                 └── Upset alerts (require win probability)

Pros/cons text (pre-generated, standalone)
  └── Reasoning explanations (pre-generated, standalone)

Export to PDF/image
  └── Populated bracket (requires completed picks)
```

Key dependency chain: Team data JSON must be complete before any analysis features work. Pre-generate and validate the JSON before building any UI.

---

## MVP Recommendation

### Prioritize (must ship by March 19)

1. Full bracket visualization with click-to-pick (core interaction)
2. Team data JSON loaded for all 68 teams (foundation for everything)
3. Matchup analysis cards with KenPom + SOS + spread side-by-side
4. Confidence tiers (High/Medium/Low) per pick recommendation
5. Contrarian flags (model vs. public pick %)
6. Upset alerts (>30% win probability for lower seed)
7. Pros/cons bullets per team per matchup
8. Save/load via Supabase
9. Shareable read-only link
10. Region tabs

### Defer (nice-to-have, not MVP-blocking)

- PDF/image export (can use browser print dialog as fallback)
- Region-by-region strategy narrative text
- ESPN broadcast aesthetic polish (get it working first, style second)
- First Four handling: the First Four runs March 17-18. If winners are resolved before build time, bake them in. If not, show the two play-in teams and let Tim pick the R64 entrant manually.

---

## Feature Complexity Summary

| Feature | Complexity | Rough Estimate |
|---------|------------|----------------|
| Bracket visualization (click-to-pick, 68 teams) | High | 4-6 hours |
| Team data JSON (pre-generated, 68 teams) | Medium | 2-3 hours Claude generation + validation |
| Matchup analysis cards | Medium | 2-3 hours |
| Region tabs | Low | 30 min |
| Confidence tiers + labels | Low | 1 hour |
| Contrarian flags | Low | 1 hour (data-driven) |
| Upset alerts | Low | 30 min |
| Pros/cons + reasoning text | Low (display) | 1 hour UI; generation in data step |
| Save/load (Supabase) | Medium | 2 hours |
| Shareable link | Low | 1 hour |
| Export to PDF/image | Medium | 2-3 hours |
| ESPN aesthetic | Medium | 2-4 hours |

Estimated total: 18-26 hours. Achievable in 48-hour window if data generation and bracket visualization are parallelized.

---

## Sources

- PoolGenius by TeamRankings (https://poolgenius.teamrankings.com/ncaa-bracket-picks/) — pool strategy tools, round survival odds, data grid, matchup predictor. MEDIUM confidence (live fetch).
- FiveThirtyEight March Madness methodology (https://fivethirtyeight.com/methodology/how-our-march-madness-predictions-work/) — power rating components (KenPom, BPI, Sagarin, etc.), game-level probabilities, advancement odds. HIGH confidence (official methodology page).
- BracketOdds at Illinois (https://bracketodds.cs.illinois.edu) — seed performance data, AI bracket fill, historical distribution. MEDIUM confidence (live fetch).
- ESPN Tournament Bracket (https://www.espn.com/mens-college-basketball/tournament/bracket) — betting lines on bracket, print bracket, Tournament Challenge integration. MEDIUM confidence (live fetch, limited feature visibility).
- CBS Sports Bracket (https://www.cbssports.com/college-basketball/ncaa-tournament/bracket/) — live bracket, printable bracket, expert picks, team stats. MEDIUM confidence (live fetch).
- NCAA.com (https://www.ncaa.com/march-madness-live/bracket) — seeds/statistics, tournament scoring, matchup analysis schedule. MEDIUM confidence (live fetch, limited detail).
- PROJECT.md requirements list — validated source of intended features for ChalkBuster. HIGH confidence.
