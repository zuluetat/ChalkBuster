---
phase: 03-persistence-and-sharing
plan: "02"
subsystem: ui
tags: [toolbar, reset, analysis, disclaimer, data-integrity]
dependency_graph:
  requires: []
  provides: [per-region-reset, dint-03-disclaimer]
  affects: [js/app.js, js/analysis.js, css/main.css, css/analysis.css]
tech_stack:
  added: []
  patterns: [conditional-toolbar-render, template-literal-injection]
key_files:
  created: []
  modified:
    - js/app.js
    - js/analysis.js
    - css/main.css
    - css/analysis.css
decisions:
  - Per-region reset button conditionally rendered (hidden on FinalFour tab and read-only mode) via showRegionReset flag
  - Data disclaimer appended to each analysis card before .card-nav using inline HTML template
metrics:
  duration_seconds: 74
  completed_date: "2026-03-18"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 4
---

# Phase 03 Plan 02: Per-Region Reset + Data Disclaimer Summary

**One-liner:** Per-region reset button added to toolbar (amber style, hidden on Final Four/read-only) and DINT-03 data disclaimer appended to every analysis card.

## Tasks Completed

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | Add per-region reset button to toolbar | fee6775 | js/app.js, css/main.css |
| 2 | Add DINT-03 data disclaimer to analysis cards | 1ad1384 | js/analysis.js, css/analysis.css |

## What Was Built

### Task 1: Per-Region Reset Button

- Added resetRegionPicks to the import from state.js in app.js
- Computed showRegionReset flag: true when state.activeRegion is not "FinalFour"
- Inserted conditional btn-reset-region button between Export and Share in toolbar HTML
- Wired click handler with confirm() dialog, calls resetRegionPicks(state.activeRegion), re-renders bracket, shows toast
- Button is automatically hidden in read-only mode (existing guard at top of renderToolbar() returns early)
- Added .toolbar-btn--secondary CSS rule: amber text (#fbbf24), dark amber border (#78350f), solid amber background on hover

### Task 2: Data Disclaimer (DINT-03)

- Inserted data-disclaimer div block immediately before .card-nav in buildCardHTML() return template
- Disclaimer text: "* Upset alerts and contrarian flags are based on model-estimated win probabilities, not official sportsbook lines. Last-10 records are unverified estimates."
- Added .data-disclaimer CSS: 8px/16px padding, top border separator, italic 0.7rem muted (#888) text

## Decisions Made

1. Secondary button color: Used amber (#fbbf24) to be visually distinct from primary (blue) and danger (red) while matching the existing toolbar-label amber color already in main.css.

2. Disclaimer placement: Before .card-nav so it sits between action buttons and navigation, making it visible without being intrusive.

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

- js/app.js contains resetRegionPicks import: confirmed (line 9)
- js/app.js contains btn-reset-region: confirmed (lines 215, 256)
- js/app.js contains resetRegionPicks(state.activeRegion): confirmed (line 260)
- js/app.js contains state.activeRegion !== "FinalFour": confirmed (line 212)
- css/main.css contains .toolbar-btn--secondary: confirmed (line 191)
- css/main.css contains color: #fbbf24: confirmed
- js/analysis.js contains class="data-disclaimer": confirmed (line 377)
- js/analysis.js contains model-estimated win probabilities: confirmed (line 378)
- js/analysis.js contains Last-10 records are unverified: confirmed (line 378)
- css/analysis.css contains .data-disclaimer: confirmed (line 402)
- css/analysis.css contains font-size: 0.7rem: confirmed (line 408)
- css/analysis.css contains font-style: italic: confirmed (line 412)
- Commits fee6775 and 1ad1384: verified in git log
