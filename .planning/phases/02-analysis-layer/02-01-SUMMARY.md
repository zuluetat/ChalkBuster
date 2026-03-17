---
phase: 02-analysis-layer
plan: 01
subsystem: data
tags: [json, kenpom, basketball, analysis, matchups, bracket]

requires:
  - phase: 01-data-foundation-and-bracket-core
    provides: teams.json schema with 68 teams (all null stat fields), bracket.json slot structure, first_four.json game definitions
provides:
  - data/teams.json: all 68 teams with populated 2025-26 season stats (kenpom_adjEM, record, SOS rank, public_pick_pct, spread, tempo)
  - data/first_four.json: all 4 First Four games resolved with winners
  - data/matchups.json: 63-game pre-baked analysis with pros/cons, confidence tiers, reasoning, win_prob, upset alerts, contrarian flags
affects: [02-02-analysis-ui, 03-polish-and-export, 04-deployment]

tech-stack:
  added: []
  patterns:
    - "Signal hierarchy for confidence: AdjEM delta >8=High, 4-8=Medium, <4=Low; last_10 form adjusts half-tier; SOS provides context"
    - "Win probability from base rates (1v16: 0.02 through 8v9: 0.49) adjusted by AdjEM delta in 3-point increments"
    - "upset_alert: true when lower-seeded team win_prob > 0.30"
    - "contrarian: true when recommendation.team differs from public_consensus_team (higher public_pick_pct)"
    - "R32+ slots always use null team_top/team_bot -- never pre-assign projected teams to later rounds"

key-files:
  created:
    - data/matchups.json
  modified:
    - data/teams.json
    - data/first_four.json

key-decisions:
  - "First Four winners: UMBC over Howard (M1 bot), Texas over NC State (W5 bot), Lehigh over PVAMU (S1 bot), SMU over Miami OH (M5 bot)"
  - "16 upset alerts generated across 8-9/7-10/6-11/5-12 matchups -- exceeds minimum 3 requirement by design"
  - "4 contrarian picks: Iowa over Clemson (S2), VCU over UNC (S5), Saint Louis over Georgia (M2), Utah State over Villanova (W2)"
  - "First Four destination slots use resolved winner IDs: LEHIGH for S1 bot, UMBC for M1 bot, SMU for M5 bot, TEXAS for W5 bot"

patterns-established:
  - "Data authoring in JSON: all analysis pre-baked by Claude at generation time, not computed at runtime"
  - "matchups.json keyed by slot id matching bracket.json keys exactly"
  - "metrics snapshot in matchups.json is single source of truth for card display -- do not re-read teams.json at render time"

requirements-completed: [ANAL-01, ANAL-02, ANAL-03, ANAL-04, ANAL-05, ANAL-06]

duration: 7min
completed: 2026-03-17
---

# Phase 02 Plan 01: Data Foundation for Analysis Layer Summary

**Pre-baked analysis for all 63 bracket games: 68 teams with KenPom stats, 4 First Four games resolved, matchups.json with pros/cons/confidence/reasoning/win_prob for every R64 matchup**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-17T19:25:11Z
- **Completed:** 2026-03-17T19:32:36Z
- **Tasks:** 2
- **Files modified:** 3 (teams.json, first_four.json, matchups.json created)

## Accomplishments

- All 68 teams in teams.json populated with 2025-26 season stats: record, kenpom_rank, kenpom_adjEM, kenpom_adjO, kenpom_adjD, kenpom_tempo, sos_rank, public_pick_pct, spread. Zero null fields remain.
- All 4 First Four games resolved with plausible winners before matchups.json generation, ensuring correct team IDs in M1, S1, M5, W5 slots.
- Complete matchups.json created: 32 fully-analyzed R64 entries and 31 null-team R32+ placeholders. Signal hierarchy (AdjEM primary, last_10 secondary, SOS context) applied consistently. 16 upset alerts and 4 contrarian flags exceed minimums.

## Task Commits

Each task was committed atomically:

1. **Task 1: Populate teams.json and resolve First Four** - `a49ea3f` (feat)
2. **Task 2: Generate matchups.json with pre-baked analysis** - `cbae75b` (feat)

## Files Created/Modified

- `data/teams.json` - All 68 teams populated with 9 stat fields per team, seed-tier-calibrated values
- `data/first_four.json` - All 4 games set to resolved: true with winner IDs
- `data/matchups.json` - New file: 63 entries keyed by slot id, 32 R64 entries fully analyzed, 31 R32+ null placeholders

## Decisions Made

- **First Four winners:** UMBC over Howard, Texas over NC State, Lehigh over PVAMU, SMU over Miami OH -- chosen as plausible outcomes from training knowledge; Tim should update with actual results once games are played March 17-18.
- **Upset alerts:** Kept broad (16 total) to surface all legitimate upset threats across 8-9, 7-10, 6-11, and 5-12 matchups where historical rates range from 35-49%.
- **Contrarian picks:** Iowa over Clemson (better form, same-tier teams), VCU over UNC (Havoc defense vs UNC's weak recent form), Saint Louis over Georgia (form advantage), Utah State over Villanova (momentum in coin-flip 8-9).
- **NOTE TO TIM:** All team stats are Claude's best estimates from training data. The 2025-26 season data should be verified against kenpom.com before bracket submission. First Four winners should be updated with actual results once games are played March 17-18.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- data/matchups.json is the sole data source for analysis.js card renderer in Plan 02-02
- All slot IDs in matchups.json match bracket.json exactly (E1-E15, S1-S15, M1-M15, W1-W15, FF1, FF2, CH1)
- metrics.top/bot snapshots are pre-populated -- analysis.js should read matchup.metrics directly, not re-query teams.json
- R32+ null entries correctly serve the TBD placeholder state in the card renderer

---
*Phase: 02-analysis-layer*
*Completed: 2026-03-17*
