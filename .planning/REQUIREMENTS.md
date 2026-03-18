# Requirements: ChalkBuster

**Defined:** 2026-03-17
**Core Value:** Tim can complete his bracket using data-driven analysis that surfaces non-obvious upset picks before the Wednesday March 19 deadline.

## v1 Requirements

### Data Foundation

- [x] **DATA-01**: All 68 teams pre-loaded with seed, region, record, KenPom metrics (AdjO, AdjD, AdjEM, tempo), SOS rank
- [x] **DATA-02**: Public pick % available for each team
- [x] **DATA-03**: Betting spread available for each matchup
- [x] **DATA-04**: First Four games tracked with resolution status (played/unplayed) and winner field
- [x] **DATA-05**: First Four winners automatically slot into main bracket when marked as resolved

### Bracket UI

- [x] **BRKT-01**: Visual 64-team bracket with click-to-pick advancement
- [x] **BRKT-02**: Region-by-region view with tabs (East, South, Midwest, West, Final Four)
- [x] **BRKT-03**: Visual feedback for selected winners (color/highlight)
- [x] **BRKT-04**: Undo/change picks by clicking a different team
- [x] **BRKT-05**: First Four view showing all 4 play-in matchups with pick-to-advance (pre-game) or results (post-game)
- [x] **BRKT-06**: Manual toggle to mark each First Four game as resolved and enter winner

### Analysis

- [x] **ANAL-01**: Side-by-side matchup cards with 3 standard metrics (KenPom AdjEM, Last 10, SOS rank)
- [x] **ANAL-02**: 3 pros / 3 cons for each team per matchup
- [x] **ANAL-03**: Pick recommendation with confidence tier (High/Medium/Low) per matchup
- [x] **ANAL-04**: 1-2 sentence reasoning explanation per recommendation
- [x] **ANAL-05**: Upset alerts flagged when lower seed has >30% win probability
- [x] **ANAL-06**: Contrarian opportunity flags when model disagrees with public consensus

### Data Integrity

- [x] **DINT-01**: Data fields are classified into two trust tiers:
  - **Verified/Reproducible (SR-sourced):** `srs`, `pace`, `ortg`, `efg_pct`, `tov_pct`, `orb_pct`, `ftr`, `sos`, `records` — sourced from Sports Reference CSV, independently verifiable by any AI against the same SR data.
  - **Unverified/Non-reproducible (LLM-generated):**
    - KenPom values (`kenpom_adjEM`, `kenpom_adjO`, `kenpom_adjD`) — carried from original fabricated file, never sourced from KenPom
    - Win probabilities (`win_prob`) — no documented model
    - Spreads (`spreads`) — no sportsbook source
    - Public pick percentages (`public_pick_pct`) — no source (ESPN Tournament Challenge was not scraped)
    - Last-10 records (`last_10`) — marked "UNVERIFIED", no game-by-game data used
    - Matchup reasoning prose — written against pre-correction metrics, not regenerated after data fix
- [x] **DINT-02**: The UI must use verified SR-sourced fields (`srs`, `pace`, `ortg`, `efg_pct`, `tov_pct`, `orb_pct`, `ftr`, `sos`) as the primary display metrics in matchup cards and team comparisons
- [x] **DINT-03**: Unverified fields (`kenpom_adjEM`, `kenpom_adjO`, `kenpom_adjD`, `win_prob`, `spreads`, `public_pick_pct`, `last_10`) must either be clearly labeled as "Estimate" or "Unverified" in the UI, or replaced with verified alternatives where possible
- [x] **DINT-04**: The trapezoid/radar visualization must use SRS (verified) rather than `kenpom_adjEM` (unverified) as its efficiency metric — already implemented in code
- [ ] **DINT-05**: Any future data pipeline must trace every numeric claim to a source URL and fetch date, ensuring full reproducibility

### Persistence

- [ ] **PERS-01**: Save bracket picks to Supabase
- [ ] **PERS-02**: Load picks on return visit
- [x] **PERS-03**: Reset region and reset all functions

### Sharing

- [ ] **SHAR-01**: Shareable public URL for friends to view picks (read-only)
- [ ] **SHAR-02**: Clear indicator that viewer cannot edit

### Polish

- [ ] **PLSH-01**: ESPN-style sports broadcast aesthetic (dark theme, bold colors)
- [ ] **PLSH-02**: Desktop-first, iPad/tablet compatible layout
- [ ] **PLSH-03**: Export bracket to PDF or image

## v2 Requirements

### Live Updates
- **LIVE-01**: Auto-refresh scores/results as tournament progresses
- **LIVE-02**: Lock completed games (no more picking)
- **LIVE-03**: Advance bracket based on actual results

### Enhanced Features
- **ENHN-01**: Team logos and colors
- **ENHN-02**: Animated bracket progression
- **ENHN-03**: Historical upset data by seed matchup
- **ENHN-04**: Game times/dates on hover or inline

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multi-user bracket comparison | MVP is single user (Tim) |
| Pool scoring simulation | Complexity vs. 48hr deadline |
| ESPN/Yahoo API integration | Manual copy sufficient |
| Mobile-native app | Web-only |
| Historical analysis across years | One-time tool |
| AI chat assistant | Pre-generated analysis sufficient |
| Runtime Claude API calls | All analysis pre-baked into JSON |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | Phase 1 | Complete |
| DATA-02 | Phase 1 | Complete |
| DATA-03 | Phase 1 | Complete |
| DATA-04 | Phase 1 | Complete |
| DATA-05 | Phase 1 | Complete |
| BRKT-01 | Phase 1 | Complete |
| BRKT-02 | Phase 1 | Complete |
| BRKT-03 | Phase 1 | Complete |
| BRKT-04 | Phase 1 | Complete |
| BRKT-05 | Phase 1 | Complete |
| BRKT-06 | Phase 1 | Complete |
| ANAL-01 | Phase 2 | Complete |
| ANAL-02 | Phase 2 | Complete |
| ANAL-03 | Phase 2 | Complete |
| ANAL-04 | Phase 2 | Complete |
| ANAL-05 | Phase 2 | Complete |
| ANAL-06 | Phase 2 | Complete |
| DINT-01 | Phase 2 | Complete |
| DINT-02 | Phase 2 | Complete |
| DINT-03 | Phase 3 | Complete |
| DINT-04 | Phase 2 | Complete |
| DINT-05 | Future | Pending |
| PERS-01 | Phase 3 | Pending |
| PERS-02 | Phase 3 | Pending |
| PERS-03 | Phase 3 | Complete |
| SHAR-01 | Phase 3 | Pending |
| SHAR-02 | Phase 3 | Pending |
| PLSH-01 | Phase 4 | Pending |
| PLSH-02 | Phase 4 | Pending |
| PLSH-03 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0

---
*Requirements defined: 2026-03-17*
*Last updated: 2026-03-18 after adding DINT (Data Integrity) requirements*
