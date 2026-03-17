---
phase: 01-data-foundation-and-bracket-core
plan: 01
subsystem: database
tags: [json, schema, bracket, ncaa, march-madness, vanilla-js]

requires: []
provides:
  - "68-team roster in data/teams.json with all required fields (seed, region, kenpom fields, sos_rank, public_pick_pct, spread, first_four, ff_game)"
  - "63-game bracket slot schema in data/bracket.json with explicit source references"
  - "4 First Four games in data/first_four.json with feeds_game cross-references"
  - "Browser-console validator js/validate.js with validateBracketSlotGraph and runDataIntegrityChecks"
affects:
  - 01-02-PLAN
  - 01-03-PLAN
  - phase-02
  - phase-03
  - phase-04

tech-stack:
  added: []
  patterns:
    - "Explicit source references for bracket slots (type: seed | first_four | winner) eliminates off-by-one arithmetic bugs"
    - "schema_version: v1 on all JSON data files for localStorage cache invalidation"
    - "Null placeholder pattern for Phase 2 stats (kenpom_*, sos_rank, record, spread, public_pick_pct)"

key-files:
  created:
    - data/teams.json
    - data/bracket.json
    - data/first_four.json
    - js/validate.js
  modified: []

key-decisions:
  - "Spread stored at team level (not game level) as R64 value; null for First Four participants until Phase 2 populates"
  - "First Four destination slots (M1-bot, M5-bot, S1-bot, W5-bot) use first_four source type; seed type reserved for direct 64 entrants only"
  - "Final Four pairing locked: FF1=East(E15) vs West(W15), FF2=South(S15) vs Midwest(M15)"
  - "All 8 First Four participants included as full team objects in teams.json with first_four:true and ff_game reference"

patterns-established:
  - "Pattern: Bracket slot source types { type: seed, seed, region } | { type: first_four, ff_id } | { type: winner, game }"
  - "Pattern: First Four game schema with id, region, seed, feeds_game, feeds_position, team_top, team_bot, resolved, winner, date"

requirements-completed: [DATA-01, DATA-02, DATA-03, DATA-04, DATA-05]

duration: 3min
completed: 2026-03-17
---

# Phase 01 Plan 01: Data Foundation Summary

**Static JSON schema locked for all 68 teams, 63 bracket slots with explicit source references, and 4 First Four games with cross-linked feeds_game pointers**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-17T18:22:56Z
- **Completed:** 2026-03-17T18:25:58Z
- **Tasks:** 3
- **Files created:** 4

## Accomplishments

- 68-team roster with all 15 required fields (null placeholders for Phase 2 stats), 8 First Four participants correctly tagged with ff_game references
- 63-slot bracket with explicit source references; no arithmetic, no off-by-one risk; FF1=East vs West, FF2=South vs Midwest
- 4 First Four games with correct region/feeds_game assignments (verified via athletics department sources), cross-referenced to bracket slots
- Browser-console validator with 8 invariant checks covering slot count, FF pairings, First Four source types, R32 winner types, team count/fields, and cross-file feeds_game integrity

## Task Commits

Each task was committed atomically:

1. **Task 1: Create project structure and teams.json** - `cca517c` (feat)
2. **Task 2: Create bracket.json with 63 slots** - `4c617a0` (feat)
3. **Task 3: Create first_four.json and js/validate.js** - `3210a06` (feat)

## Files Created

- `data/teams.json` - 68 teams keyed by ID, all 15 required fields, 8 first_four:true entries
- `data/bracket.json` - 63 game slots with explicit seed/first_four/winner source references
- `data/first_four.json` - 4 play-in games with resolved:false defaults, feeds_game cross-references
- `js/validate.js` - ES module exporting validateBracketSlotGraph and runDataIntegrityChecks

## Decisions Made

- Spread stored at team level (not game level) as a single R64 value per team; First Four participants get null until Phase 2 populates
- All 8 First Four participants included as full team objects to support Phase 2 stat population even for eliminated teams
- No external dependencies in this plan: pure JSON data files and vanilla JS module

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All three JSON schemas locked and cross-validated; Phase 2 (stats population) can begin immediately
- js/validate.js ready for browser-console use after Plan 01-02 adds index.html and app.js
- First Four game results must be entered via UI after tonight's games (UMBC vs Howard, Texas vs NC State); resolved:false defaults are correct until then

---
*Phase: 01-data-foundation-and-bracket-core*
*Completed: 2026-03-17*
