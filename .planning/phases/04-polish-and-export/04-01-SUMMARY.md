---
phase: 04-polish-and-export
plan: "01"
subsystem: ui
tags: [css, typography, bracket, connector-lines, visual-polish]

# Dependency graph
requires:
  - phase: 03-persistence-and-sharing
    provides: bracket region layout and CSS grid structure this polish builds on
provides:
  - Bolder tab/toolbar/team-name typography with 700 font-weight
  - Seed badge depth via gradient + box-shadow + text-shadow
  - Horizontal connector stubs from each matchup card toward next round
  - --color-connector CSS custom property for reusable accent line color

affects: [export, print]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CSS pseudo-elements (::after) on .matchup-card for bracket connector lines"
    - "CSS custom property for connector color (--color-connector) defined in :root, consumed in bracket.css"

key-files:
  created: []
  modified:
    - css/main.css
    - css/bracket.css

key-decisions:
  - "Replaced old vertical gradient bar (.round-column::after) with per-matchup horizontal stubs (.matchup-card::after) for more precise connector positioning"
  - "Connector lines hidden explicitly in both tablet and mobile breakpoints since grid reflows to stacked layout"

patterns-established:
  - "Per-matchup connector pattern: .matchup-card::after with right: -13px, width: 13px, border-top for horizontal stub"

requirements-completed: [PLSH-01, PLSH-02]

# Metrics
duration: 12min
completed: 2026-03-18
---

# Phase 4 Plan 1: Visual Polish Summary

**ESPN-style bracket polish via 700-weight typography on tabs/toolbars/team names, gradient seed badges with depth shadows, and thin accent-colored connector stubs linking matchup cards to next-round slots**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-03-18T~15:10:00Z
- **Completed:** 2026-03-18T~15:22:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Tab buttons and toolbar labels upgraded to font-weight 700 for broadcast-confident feel
- Team names in bracket slots upgraded to font-weight 700 (from 600)
- Seed badges now have a subtle linear-gradient background, box-shadow depth, and text-shadow
- .team-slot.picked .seed-badge gets enhanced box-shadow for selected state depth
- New --color-connector CSS custom property in :root for reusable accent connector color
- Replaced coarse vertical gradient bar between rounds with precise horizontal .matchup-card::after stubs
- Connector lines automatically hidden on tablet (<=1024px) and mobile (<=767px)

## Task Commits

Each task was committed atomically:

1. **Task 1: Bolder typography and seed badge depth** - c7fe059 (feat)
2. **Task 2: Bracket connector lines between rounds** - 21a1825 (feat)

## Files Created/Modified
- css/main.css - Added --color-connector to :root; bumped .tab-btn and .toolbar-label to font-weight 700
- css/bracket.css - Bumped .team-slot to font-weight 700; added gradient/shadow/text-shadow to .seed-badge; replaced old round-column::after vertical bar with .matchup-card::after horizontal connector stubs; hid connectors in tablet and mobile breakpoints

## Decisions Made
- Replaced the old .round-column:not(:last-child)::after vertical gradient bar with per-matchup .matchup-card::after horizontal stubs. The per-matchup approach is more precise -- each card gets its own connector pointing toward the next round slot rather than a single full-height bar per column.
- Connector lines use var(--color-connector, rgba(233, 69, 96, 0.25)) with a fallback, ensuring they degrade gracefully if the CSS variable is somehow missing.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Visual polish complete for the March 19 deadline
- Both CSS files are clean and backward-compatible with existing hover, picked, and print styles
- Export/print pass (if planned) can build on existing @media print rules untouched by this plan

---
*Phase: 04-polish-and-export*
*Completed: 2026-03-18*
