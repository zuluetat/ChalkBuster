# Requirements: ChalkBuster

**Defined:** 2026-03-17
**Core Value:** Tim can complete his bracket using data-driven analysis that surfaces non-obvious upset picks before the Wednesday March 19 deadline.

## v1 Requirements

### Data Foundation

- [ ] **DATA-01**: All 68 teams pre-loaded with seed, region, record, KenPom metrics (AdjO, AdjD, AdjEM, tempo), SOS rank
- [ ] **DATA-02**: Public pick % available for each team
- [ ] **DATA-03**: Betting spread available for each matchup
- [ ] **DATA-04**: First Four games tracked with resolution status (played/unplayed) and winner field
- [ ] **DATA-05**: First Four winners automatically slot into main bracket when marked as resolved

### Bracket UI

- [ ] **BRKT-01**: Visual 64-team bracket with click-to-pick advancement
- [ ] **BRKT-02**: Region-by-region view with tabs (East, South, Midwest, West, Final Four)
- [ ] **BRKT-03**: Visual feedback for selected winners (color/highlight)
- [ ] **BRKT-04**: Undo/change picks by clicking a different team
- [ ] **BRKT-05**: First Four view showing all 4 play-in matchups with pick-to-advance (pre-game) or results (post-game)
- [ ] **BRKT-06**: Manual toggle to mark each First Four game as resolved and enter winner

### Analysis

- [ ] **ANAL-01**: Side-by-side matchup cards with 3 standard metrics (KenPom AdjEM, Last 10, SOS rank)
- [ ] **ANAL-02**: 3 pros / 3 cons for each team per matchup
- [ ] **ANAL-03**: Pick recommendation with confidence tier (High/Medium/Low) per matchup
- [ ] **ANAL-04**: 1-2 sentence reasoning explanation per recommendation
- [ ] **ANAL-05**: Upset alerts flagged when lower seed has >30% win probability
- [ ] **ANAL-06**: Contrarian opportunity flags when model disagrees with public consensus

### Persistence

- [ ] **PERS-01**: Save bracket picks to Supabase
- [ ] **PERS-02**: Load picks on return visit
- [ ] **PERS-03**: Reset region and reset all functions

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
| (populated during roadmap creation) | | |

**Coverage:**
- v1 requirements: 22 total
- Mapped to phases: 0
- Unmapped: 22 ⚠️

---
*Requirements defined: 2026-03-17*
*Last updated: 2026-03-17 after initial definition*
