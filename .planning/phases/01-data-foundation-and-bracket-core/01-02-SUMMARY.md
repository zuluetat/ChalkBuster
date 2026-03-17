---
phase: 01-data-foundation-and-bracket-core
plan: 02
subsystem: ui
tags: [html, css, javascript, es-modules, localstorage, bracket, vanilla-js]

# Dependency graph
requires:
  - phase: 01-data-foundation-and-bracket-core
    plan: 01
    provides: data/teams.json, data/bracket.json, data/first_four.json

provides:
  - Interactive bracket UI with click-to-pick advancement across all 4 regions
  - Downstream pick clearing when re-selecting in the same matchup
  - Region tab switching (East, South, Midwest, West, Final Four)
  - localStorage persistence under key chalkbuster-picks-v1
  - First Four slot display with matchup label (e.g., "UMBC/Howard") instead of plain TBD
  - Fully working vanilla HTML/CSS/JS app — no build step, runs via python3 http.server

affects:
  - 01-03-first-four-panel
  - 02-analysis-overlay

# Tech tracking
tech-stack:
  added: []
  patterns:
    - ES modules with import/export — no bundler, script type=module
    - Single source of truth in state.js — no direct state mutation from other modules
    - Import direction: app.js imports all; bracket.js imports state.js; state.js imports nothing
    - Click delegation on #bracket-container — one listener for all picks
    - Targeted DOM updates via updateSlotAndDownstream — never full re-render on pick change
    - localStorage with try/catch for pick persistence

key-files:
  created:
    - index.html
    - css/main.css
    - css/bracket.css
    - js/state.js
    - js/bracket.js
    - js/regions.js
    - js/app.js
  modified: []

key-decisions:
  - "ffLabel() shows 'TeamA/TeamB' for unresolved First Four slots instead of generic TBD — Tim sees who could advance into that seed slot"
  - "Click delegation pattern on #bracket-container instead of per-card listeners — cleaner and iPad-safe"
  - "clearDownstream() is recursive — correctly handles multi-round cascade when re-picking R64"

patterns-established:
  - "Pattern: state.js exports state, setPick, clearDownstream, savePicksToStorage, loadPicksFromStorage — all other modules import only what they need"
  - "Pattern: resolveTeam(source) returns null for TBD slots; callers use ffLabel(source) for display text"
  - "Pattern: updateSlotDOM skips silently if card not in DOM — safe during region switches"

requirements-completed: [BRKT-01, BRKT-02, BRKT-03, BRKT-04]

# Metrics
duration: 45min
completed: 2026-03-17
---

# Phase 1 Plan 2: Bracket Renderer and Interactive Pick UI Summary

**Vanilla JS bracket with click-to-pick advancement, downstream clearing, region tabs, localStorage persistence, and First Four matchup labels (e.g., "UMBC/Howard")**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-03-17
- **Completed:** 2026-03-17
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint)
- **Files modified:** 7

## Accomplishments

- Full bracket renderer for all 63 slots across East, South, Midwest, West, Final Four, and Championship
- Click-to-pick with downstream clearing: re-picking in any round clears all later dependent picks recursively
- Region tabs with active state switching — one region visible at a time
- localStorage persistence under chalkbuster-picks-v1 — picks survive page refresh
- First Four slots display team matchup label (e.g., "UMBC/Howard") and seed badge, not generic "TBD"
- Human verification checkpoint approved — all 8 manual checks passed in browser

## Task Commits

Each task was committed atomically:

1. **Task 1: Create index.html, css/main.css, css/bracket.css, js/state.js** - `22ac598` (feat)
2. **Task 2: Create js/bracket.js, js/regions.js, js/app.js** - `a4f97d0` (feat)
3. **Task 3: Human verify + First Four label improvements** - `dc69684` (feat)

## Files Created/Modified

- `index.html` - App shell with region tabs nav, bracket container, script type=module entry
- `css/main.css` - Global styles, CSS custom properties (--color-accent, --color-bg, etc.)
- `css/bracket.css` - Bracket grid layout, matchup card styles, .team-slot.picked and .tbd
- `js/state.js` - Single source of truth: state object, setPick, clearDownstream, savePicksToStorage, loadPicksFromStorage
- `js/bracket.js` - Bracket renderer, resolveTeam, ffLabel, ffSeed, buildMatchupCard, updateSlotAndDownstream, initBracketHandlers
- `js/regions.js` - Region tab renderer and switcher
- `js/app.js` - Entry point: Promise.all fetch, hydrate state, call render functions

## Decisions Made

- Used ffLabel() to show "TeamA/TeamB" for unresolved First Four slots — more informative than "TBD" so Tim sees which teams are competing for that seed slot
- Implemented ffSeed() to pull the seed from the First Four game record for the badge, keeping the display consistent with resolved seed slots
- Click delegation on #bracket-container rather than per-card listeners — simpler and avoids re-attachment overhead during targeted DOM updates

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] First Four TBD slots showed generic "TBD" with no context**
- **Found during:** Task 3 (human-verify checkpoint review)
- **Issue:** Unresolved First Four slots displayed "TBD" with no seed or team info — Tim could not tell which teams were competing for that slot
- **Fix:** Added ffLabel(source) returning "TeamA/TeamB" and ffSeed(source) for the seed badge; updated buildTeamSlotEl and updateSlotDOM to pass source context through
- **Files modified:** js/bracket.js
- **Verification:** Midwest tab shows "UMBC/Howard" (or equivalent) for M1-bot slot with seed badge populated
- **Committed in:** dc69684 (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug fix for First Four display)
**Impact on plan:** Necessary UX improvement — TBD with no context was confusing. No scope creep.

## Issues Encountered

None — data shapes from Plan 01-01 matched exactly as designed. No circular dependency issues encountered.

## User Setup Required

None - no external service configuration required. Run with:
  python3 -m http.server 8000
Then open http://localhost:8000

## Next Phase Readiness

- Bracket UI is fully functional and human-verified
- Plan 01-03 can now wire the First Four panel (aside#first-four-panel placeholder is in place)
- localStorage key chalkbuster-picks-v1 is established — Plan 02+ can read/write without coordination

---
*Phase: 01-data-foundation-and-bracket-core*
*Completed: 2026-03-17*
