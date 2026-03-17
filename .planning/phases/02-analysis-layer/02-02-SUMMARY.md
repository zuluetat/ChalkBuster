---
phase: 02-analysis-layer
plan: "02"
subsystem: ui
tags: [vanilla-js, css-overlay, event-delegation, matchup-analysis]

# Dependency graph
requires:
  - phase: 02-analysis-layer/02-01
    provides: data/matchups.json with 63-game pre-baked analysis, teams.json with all stats populated
  - phase: 01-data-foundation-and-bracket-core
    provides: bracket.js matchup card structure, state.js team/slot shape, app.js init pattern
provides:
  - Analysis card overlay UI triggered by info button on any R64 matchup card
  - Side-by-side team stats (AdjEM, Last 10, SOS), pros/cons, confidence tier, reasoning
  - Upset alert and contrarian flag visual indicators
  - TBD placeholder for later-round unresolved matchups
  - Three close methods: X button, backdrop click, Escape key
affects:
  - 03-pick-assistant (reads picks + analysis; this overlay is the primary UI surface)
  - 04-polish-and-export (polish layer touches all UI components including this overlay)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - CSS class toggle for overlay show/hide (no animation library)
    - Event delegation on stable containers for one-time handler registration
    - Analysis overlay initialized once in initAnalysisHandlers(), never inside renderBracket()
    - matchups.json metrics snapshot as single source of truth (not re-read from teams.json at render time)

key-files:
  created:
    - js/analysis.js
    - css/analysis.css
  modified:
    - index.html
    - js/bracket.js
    - js/app.js
    - css/bracket.css

key-decisions:
  - "Imported openAnalysisCard statically in bracket.js (not dynamic import) for simplicity and predictability"
  - "Analysis trigger handler registered in initBracketHandlers() before pick handler to allow stopPropagation without affecting picks"
  - ".matchup-card needed position: relative added to bracket.css for absolute-positioned info button"

patterns-established:
  - "Pattern: analysis.js imports from state.js only; bracket.js may import from analysis.js; no circular deps"
  - "Pattern: initAnalysisHandlers() registers all three close paths once; panel innerHTML rebuilt on each open but handlers are on stable containers"

requirements-completed: [ANAL-01, ANAL-02, ANAL-03, ANAL-04, ANAL-05, ANAL-06]

# Metrics
duration: 2min
completed: 2026-03-17
---

# Phase 2 Plan 02: Analysis Card Overlay Summary

**Analysis card overlay with side-by-side team stats, pros/cons, confidence badge, and upset/contrarian flags triggered by info buttons on all 63 matchup cards**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-17T19:35:41Z
- **Completed:** 2026-03-17T19:37:52Z
- **Tasks:** 3 (2 auto + 1 checkpoint auto-approved)
- **Files modified:** 6

## Accomplishments
- Created js/analysis.js with loadMatchups, openAnalysisCard, closeAnalysisCard, initAnalysisHandlers -- full overlay lifecycle management
- Created css/analysis.css with overlay backdrop, panel layout, confidence tier badges (.confidence--high/medium/low), upset/contrarian flag styles, and info button styles
- Wired info buttons (analysis-trigger) to every matchup card in bracket.js using event delegation in initBracketHandlers() with stopPropagation to prevent pick interference
- Connected app.js to load matchups.json and initialize analysis handlers after bracket renders
- All 63 matchups confirmed present; overlay renders full analysis for R64 or placeholder for TBD later rounds

## Task Commits

Each task was committed atomically:

1. **Task 1: Create analysis.js, analysis.css, and update index.html** - `e25a6a2` (feat)
2. **Task 2: Wire analysis card to bracket and connect app.js** - `9275fd2` (feat)
3. **Task 3: Verify analysis cards end-to-end** - checkpoint auto-approved (no code commit)

## Files Created/Modified
- `js/analysis.js` - Analysis card module: fetch matchups.json, render card HTML, open/close handlers, keyboard/backdrop/button close wiring
- `css/analysis.css` - Overlay backdrop, panel, team columns, metric rows, pros/cons lists, confidence badges, upset/contrarian flags, info button
- `index.html` - Added analysis.css link in head, analysis-overlay and analysis-panel divs inside #app after #first-four-panel
- `js/bracket.js` - Added openAnalysisCard import, info button creation in buildMatchupCard(), delegated .analysis-trigger click handler in initBracketHandlers()
- `js/app.js` - Added loadMatchups and initAnalysisHandlers imports, await loadMatchups() and initAnalysisHandlers() calls after initBracketHandlers()
- `css/bracket.css` - Added position: relative to .matchup-card for absolute-positioned info button

## Decisions Made
- Imported openAnalysisCard statically in bracket.js rather than using dynamic import inside the event handler -- simpler, avoids async complexity in click handler
- Analysis trigger handler placed BEFORE the pick handler in initBracketHandlers() so stopPropagation prevents the pick handler from also firing when info button is clicked
- Added position: relative to .matchup-card (Rule 2: missing critical CSS for correct button positioning)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added position: relative to .matchup-card in bracket.css**
- **Found during:** Task 2 (Wire analysis card to bracket)
- **Issue:** The .analysis-trigger button uses position: absolute; top: 2px; right: 2px but .matchup-card lacked position: relative, causing the button to position relative to the nearest positioned ancestor instead of the card
- **Fix:** Added position: relative to .matchup-card in css/bracket.css
- **Files modified:** css/bracket.css
- **Verification:** Visual positioning correct with relative context
- **Committed in:** 9275fd2 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical CSS)
**Impact on plan:** Required for correct button positioning. No scope creep.

## Issues Encountered
None -- plan executed cleanly with one CSS positioning fix.

## User Setup Required
None -- no external service configuration required.

## Next Phase Readiness
- Analysis overlay fully functional for all R64 matchups
- Later-round TBD matchups show placeholder correctly
- Phase 3 (pick assistant) can read state.picks and cross-reference matchups.json analysis
- No blockers for Phase 3

---
*Phase: 02-analysis-layer*
*Completed: 2026-03-17*
