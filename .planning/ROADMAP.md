# Roadmap: ChalkBuster

## Overview

ChalkBuster ships in 4 phases ordered by dependency: lock the data schema and bracket interaction first, then generate all 63-game analysis, then wire up Supabase persistence and sharing, then apply ESPN polish and optional export. The hard deadline is Wednesday March 19 morning. Phase 4 export is explicitly time-boxed and cuttable.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Data Foundation and Bracket Core** - Lock JSON schema and build working click-to-pick bracket with region tabs (completed 2026-03-17)
- [x] **Phase 2: Analysis Layer** - Generate all 63-game matchup data and render analysis cards (completed 2026-03-17)
- [ ] **Phase 3: Persistence and Sharing** - Save/load picks via Supabase and generate shareable read-only links
- [ ] **Phase 4: Polish and Export** - Apply ESPN aesthetic and optional PDF/image export

## Phase Details

### Phase 1: Data Foundation and Bracket Core
**Goal**: Tim can click through a working bracket with all 68 teams in place, First Four resolved, and picks advancing round by round
**Depends on**: Nothing (first phase)
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04, DATA-05, BRKT-01, BRKT-02, BRKT-03, BRKT-04, BRKT-05, BRKT-06
**Success Criteria** (what must be TRUE):
  1. Tim can click any team in Round of 64 and see it advance to the next round slot
  2. Tim can re-click a different team in any matchup and the downstream picks clear
  3. All 4 region tabs (East, South, Midwest, West) switch the visible bracket section
  4. First Four results are shown as resolved and the correct winners appear in Round of 64 slots
  5. All 68 teams appear with seed, record, KenPom AdjEM, SOS rank, spread, and public pick %
**Plans**: 3 plans

Plans:
- [ ] 01-01-PLAN.md — Create teams.json, bracket.json, first_four.json data schemas + browser console validator
- [ ] 01-02-PLAN.md — Build index.html, CSS, state.js, bracket.js, regions.js, app.js (click-to-pick + tabs)
- [ ] 01-03-PLAN.md — Build firstFour.js with resolve toggle and winner propagation to bracket

### Phase 2: Analysis Layer
**Goal**: Every matchup shows a side-by-side analysis card with stats, confidence tier, pros/cons, upset alerts, and contrarian flags
**Depends on**: Phase 1
**Requirements**: ANAL-01, ANAL-02, ANAL-03, ANAL-04, ANAL-05, ANAL-06
**Success Criteria** (what must be TRUE):
  1. Clicking any matchup opens a card showing both teams' KenPom AdjEM, Last 10, and SOS rank side by side
  2. Every matchup card displays a confidence tier (High/Medium/Low) with a 1-2 sentence reasoning explanation
  3. Every matchup card shows 3 pros and 3 cons for each team
  4. Matchups where the lower seed has >30% win probability are visually flagged as upset alerts
  5. Matchups where the model recommendation diverges from public consensus are flagged as contrarian opportunities
**Plans**: 2 plans

Plans:
- [ ] 02-01-PLAN.md — Populate teams.json stats, resolve First Four, generate matchups.json (63 games)
- [ ] 02-02-PLAN.md — Build analysis card overlay UI and wire to bracket info buttons

### Phase 3: Persistence and Sharing
**Goal**: Tim's picks persist across browser sessions and he can send a read-only link to friends
**Depends on**: Phase 1
**Requirements**: PERS-01, PERS-02, PERS-03, SHAR-01, SHAR-02
**Success Criteria** (what must be TRUE):
  1. Tim's picks auto-save to Supabase and reload correctly on return visit without any manual action
  2. Tim can reset a single region or reset the entire bracket from a clearly labeled control
  3. Tim can copy a shareable URL and open it in a private/incognito window to see his picks in read-only mode
  4. The shared view shows a clear indicator that the viewer cannot make edits
**Plans**: TBD

Plans:
- [ ] 03-01: Set up Supabase project with schema (including share_token), RLS policies, and GitHub Pages origin configured from day one
- [ ] 03-02: Implement debounced auto-save, load on return, reset functions, and read-only share mode

### Phase 4: Polish and Export
**Goal**: The app looks like an ESPN broadcast tool and Tim can export his bracket if time permits
**Depends on**: Phase 3
**Requirements**: PLSH-01, PLSH-02, PLSH-03
**Success Criteria** (what must be TRUE):
  1. The app uses a dark sports broadcast aesthetic with bold accent colors, seed badges, and confident typography
  2. The layout is usable on desktop at 1280px and on iPad/tablet without horizontal scrolling
  3. Tim can export his completed bracket as a PDF or image (or use browser print as fallback)
**Plans**: TBD

Plans:
- [ ] 04-01: Apply ESPN-style dark theme and responsive desktop/tablet layout
- [ ] 04-02: Implement PDF/image export via html-to-image + jsPDF (time-boxed; fall back to window.print() if needed)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Data Foundation and Bracket Core | 3/3 | Complete   | 2026-03-17 |
| 2. Analysis Layer | 2/2 | Complete   | 2026-03-17 |
| 3. Persistence and Sharing | 0/2 | Not started | - |
| 4. Polish and Export | 0/2 | Not started | - |
