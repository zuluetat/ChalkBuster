# Phase 4: Polish and Export - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers the final visual polish and export capability for ChalkBuster. The app already has a dark theme, team logos, seed badges, and responsive breakpoints. This phase refines typography, adds bracket connector lines, polishes print styles, and adds a tipoff gate for shared brackets.

</domain>

<decisions>
## Implementation Decisions

### Visual Polish
- Keep system-ui font stack but add bolder weights (700/800) for headers and key stats for broadcast confidence
- Keep current red (#e94560) + blue accent palette — already reads broadcast-style
- Existing seed badges are fine — add subtle gradient or text-shadow for depth
- Add thin connector lines between matchup winners and next round slots for visual bracket flow

### Export Strategy
- Keep window.print() with polished @media print styles — zero dependencies, already works
- Full bracket on one landscape page using existing buildPrintBracket() function
- Add tipoff gate: shared bracket view (via ?share= URL) hides picks until 2026-03-19 12:00 ET. Before tipoff, show a message like "Picks revealed at tipoff — Thursday 3/19 at 12pm ET"

### Claude's Discretion
- Exact connector line styling (color, thickness, dashing)
- Print layout spacing and font size adjustments
- Tipoff gate UI copy and styling
- Any additional responsive tweaks for iPad

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- CSS custom properties in :root (--color-bg, --color-accent, --color-border, etc.)
- buildPrintBracket() in app.js — generates full NCAA-style print layout
- @media print block in main.css (lines 437+) — existing print styles
- Responsive breakpoints at 1024px and 767px in all 3 CSS files

### Established Patterns
- Dark theme with radial gradient backgrounds
- ESPN team logos via a.espncdn.com/combiner
- Hero header with accent border-bottom
- Tab navigation for regions
- Analysis overlay with canvas-based trapezoid chart

### Integration Points
- bracket.css — connector lines go here (matchup-to-matchup connections)
- main.css — typography weight changes, print polish
- app.js — tipoff gate logic in the shared bracket code path (line 371-379)

</code_context>

<specifics>
## Specific Ideas

- Tipoff time: 2026-03-19T12:00:00-04:00 (Eastern Time, noon)
- User wants shared brackets to hide picks before tipoff so friends can't copy them early
- The "Export" button already exists and calls window.print() — just needs print CSS polish

</specifics>

<deferred>
## Deferred Ideas

- html-to-image + jsPDF export (adds dependencies, not needed with good print styles)
- Mobile-first responsive redesign (desktop/tablet is sufficient for bracket pool use case)

</deferred>

---
*Phase: 04-polish-and-export*
*Context gathered: 2026-03-18 via Smart Discuss (autonomous mode)*
