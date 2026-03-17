# Phase 2: Analysis Layer - Research

**Researched:** 2026-03-17
**Domain:** Pre-generated JSON analysis data, vanilla JS modal/overlay UI, NCAA basketball signal hierarchy
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ANAL-01 | Side-by-side matchup cards with 3 standard metrics (KenPom AdjEM, Last 10, SOS rank) | matchups.json schema section defines per-team metric snapshot; analysis.js renders side-by-side card panel |
| ANAL-02 | 3 pros / 3 cons for each team per matchup | matchups.json pros/cons arrays (3 items each) pre-baked per matchup; card renderer surfaces them as styled lists |
| ANAL-03 | Pick recommendation with confidence tier (High/Medium/Low) per matchup | matchups.json recommendation and confidence fields pre-generated; card shows tier badge + team name |
| ANAL-04 | 1-2 sentence reasoning explanation per recommendation | matchups.json reasoning string field (1-2 sentences); displayed as supporting text beneath confidence badge |
| ANAL-05 | Upset alerts flagged when lower seed has >30% win probability | matchups.json upset_alert boolean derived from win_prob field during generation; card shows visual flag |
| ANAL-06 | Contrarian opportunity flags when model disagrees with public consensus | matchups.json contrarian boolean derived by comparing recommendation.team vs public_consensus_team; card shows flag |
</phase_requirements>

---

## Summary

Phase 2 has two distinct work streams that must execute in order. First, every team in teams.json needs its null fields populated with real 2025-26 season data: KenPom AdjEM, Last 10 record, SOS rank, public pick %, and spread. Second, all 63 matchups need a matchups.json file generated with pre-baked analysis: pros/cons, confidence tiers, reasoning, win probabilities, upset alerts, and contrarian flags. Both are data authoring tasks, not runtime computation tasks. The out-of-scope decision "Runtime Claude API calls — All analysis pre-baked into JSON" means Claude authors all analysis inline during plan execution, not at browser runtime.

The UI work stream (Plan 02-02) is a modal/overlay panel triggered by clicking any matchup card. The existing bracket already handles matchup card clicks for pick selection. Phase 2 adds a secondary click handler (or dedicated info icon) to open a side-by-side analysis drawer. The drawer sources data from matchups.json keyed by game slot id. Since later rounds (R32, S16, E8, F4, CHM) have TBD teams until Tim makes picks, the analysis card must handle two display states: fully resolved (both teams known, show full analysis) and partially/fully unresolved (show a "Pick both teams to see analysis" placeholder).

Signal hierarchy is the critical concept governing how analysis is generated. KenPom AdjEM is the primary signal. Public pick % divergence drives contrarian flags. Spread is a secondary sanity check. Last 10 form catches hot/cold teams the season-long metrics miss. Win probability is computed from the seed matchup base rate adjusted by the AdjEM delta between teams. This hierarchy must be consistently applied across all 63 games so the analysis feels coherent rather than ad hoc.

**Primary recommendation:** Generate teams.json data and matchups.json in one focused Plan 02-01 session with Claude doing all data authoring. Build the analysis card UI in Plan 02-02 using a simple overlay pattern (no library needed) that reads from matchups.json by slot id.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vanilla JS | ES2022+ | All UI logic | Project decision: no build tooling |
| HTML/CSS | - | Card overlay layout | Consistent with Phase 1 |

No new libraries are added in Phase 2. The project constraint (plain HTML/CSS/JS, no build tooling) means all interactivity is native DOM. This is correct for the scope: a modal overlay and data rendering do not require a framework.

**Installation:** None. No new dependencies.

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| CSS custom properties | - | Confidence tier color coding (--color-high, --color-medium, --color-low) | Use for tier badge theming |
| CSS grid | - | Side-by-side team columns in analysis card | Standard two-column layout |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vanilla modal overlay | dialog element | dialog has better native a11y but requires polyfill consideration; vanilla div overlay is simpler given the deadline |
| Pre-baked JSON analysis | Runtime Claude API | Out of scope per project decision; pre-baked works offline/GitHub Pages |

---

## Architecture Patterns

### New Files This Phase
```
data/
  matchups.json        # 63-game analysis records keyed by slot id
js/
  analysis.js          # Analysis card renderer + click handler
css/
  analysis.css         # Card overlay, side-by-side layout, tier badges, alert flags
```

Also: index.html gains the overlay panel markup, and app.js gains matchups.json load + analysis.js import.

### matchups.json Schema

Each entry is keyed by the bracket slot id (e.g., "E1", "S9", "FF1"). R64 entries use real team ids. R32+ entries that are TBD use null team fields.

```json
{
  "schema_version": "v1",
  "matchups": {
    "E1": {
      "slot_id": "E1",
      "round": "R64",
      "region": "East",
      "team_top": "DUKE",
      "team_bot": "MOUNT_ST_MARYS",
      "metrics": {
        "top": { "kenpom_adjEM": 28.4, "last_10": "9-1", "sos_rank": 12 },
        "bot": { "kenpom_adjEM": -3.2, "last_10": "6-4", "sos_rank": 287 }
      },
      "pros": {
        "top": [
          "Best offense in the ACC by AdjO",
          "Only 3 losses all season",
          "Elite perimeter defense vs small schools"
        ],
        "bot": [
          "Momentum off conference tournament win",
          "Experienced backcourt",
          "Plays fast, can steal possessions early"
        ]
      },
      "cons": {
        "top": [
          "Heavy favorite, limited upside in pool",
          "Slow starts in early rounds historically",
          "SOS inflated by conference"
        ],
        "bot": [
          "AdjEM gap of 31.6 points, largest in bracket",
          "Struggles against elite athleticism",
          "Turnover prone in high-pressure games"
        ]
      },
      "recommendation": { "team": "DUKE", "confidence": "High" },
      "reasoning": "Duke's AdjEM advantage of 31.6 points and elite defense leave no realistic path for Mount St. Mary's. High confidence pick with minimal upset risk.",
      "win_prob": { "top": 0.97, "bot": 0.03 },
      "upset_alert": false,
      "contrarian": false,
      "public_consensus_team": "DUKE"
    },
    "E9": {
      "slot_id": "E9",
      "round": "R32",
      "region": "East",
      "team_top": null,
      "team_bot": null,
      "metrics": { "top": null, "bot": null },
      "pros": { "top": null, "bot": null },
      "cons": { "top": null, "bot": null },
      "recommendation": null,
      "reasoning": null,
      "win_prob": null,
      "upset_alert": false,
      "contrarian": false,
      "public_consensus_team": null
    }
  }
}
```

**Key schema rules:**
- team_top and team_bot match the bracket slot top/bot positions exactly
- For First Four destination slots (M1, S1, M5, W5): generate AFTER First Four winners are confirmed; use the actual winner team id
- win_prob values must sum to 1.0
- upset_alert is true when the lower-seeded team's win_prob > 0.30
- contrarian is true when recommendation.team differs from public_consensus_team
- public_consensus_team is the team with the higher public_pick_pct in teams.json for that matchup
- R32+ null entries are valid; the card renderer handles them with a placeholder

### Pattern 1: Analysis Card Overlay

The analysis panel is a hidden overlay div appended to #app. It is shown/hidden via a CSS class toggle. No library needed.

```javascript
// js/analysis.js
import { state } from "./state.js";

let matchups = {};

export async function loadMatchups() {
  const data = await fetch("./data/matchups.json").then(r => r.json());
  matchups = data.matchups;
}

export function openAnalysisCard(slotId) {
  const matchup = matchups[slotId];
  if (!matchup) return;

  const slot = state.slots[slotId];
  const topTeam = matchup.team_top ? state.teams[matchup.team_top] : null;
  const botTeam = matchup.team_bot ? state.teams[matchup.team_bot] : null;

  const panel = document.getElementById("analysis-panel");
  if (!topTeam || !botTeam) {
    panel.innerHTML = buildPlaceholderHTML(slotId);
  } else {
    panel.innerHTML = buildCardHTML(matchup, topTeam, botTeam);
  }

  document.getElementById("analysis-overlay").classList.add("visible");
}

export function closeAnalysisCard() {
  document.getElementById("analysis-overlay").classList.remove("visible");
}

export function initAnalysisHandlers() {
  // Escape key
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeAnalysisCard();
  });
  // Backdrop click
  document.getElementById("analysis-overlay").addEventListener("click", e => {
    if (e.target === e.currentTarget) closeAnalysisCard();
  });
  // Close button (event delegation, panel is rebuilt on each open)
  document.getElementById("analysis-panel").addEventListener("click", e => {
    if (e.target.closest(".analysis-close")) closeAnalysisCard();
  });
}
```

### Pattern 2: Wiring Analysis Click to Bracket

Add an info button to each matchup card in bracket.js. This avoids ambiguity with team-slot pick clicks.

```javascript
// In buildMatchupCard() in bracket.js, after building team slots:
const infoBtn = document.createElement("button");
infoBtn.className = "analysis-trigger";
infoBtn.dataset.game = slot.id;
infoBtn.setAttribute("aria-label", "View matchup analysis");
infoBtn.textContent = "i";
card.appendChild(infoBtn);
```

Then in initBracketHandlers(), add one delegated listener for analysis triggers:

```javascript
container.addEventListener("click", (event) => {
  const trigger = event.target.closest(".analysis-trigger");
  if (trigger) {
    const { openAnalysisCard } = await import("./analysis.js");
    openAnalysisCard(trigger.dataset.game);
  }
});
```

Or, since dynamic import inside event handlers is complex, import analysis.js statically in app.js and pass openAnalysisCard as a callback to initBracketHandlers().

### Pattern 3: Signal Hierarchy for Data Generation

Apply signals in this order when authoring matchup analysis:

1. **KenPom AdjEM delta** — primary predictor. Delta >8 = High confidence for favored team. Delta 4-8 = Medium. Delta <4 = Low.
2. **Last 10 record** — form signal. A 9-1 team vs 5-5 team raises confidence half a tier when AdjEM delta is in the Medium range.
3. **SOS rank** — context. If the better-AdjEM team played a weak schedule, temper confidence slightly.
4. **Spread** — market signal. If spread disagrees with AdjEM recommendation direction, note in reasoning.
5. **Public pick %** — contrarian trigger only. If model recommendation team has <40% public pick, set contrarian: true. Does not affect confidence tier.

**Upset alert threshold:** win_prob for the lower seed > 0.30. This is a mechanical check applied after generating win_prob values.

### Pattern 4: Win Probability Estimation

Use these base rates by seed matchup (lower seed win probability), then adjust by AdjEM delta:

| Matchup | Lower Seed Base Win Prob |
|---------|--------------------------|
| 1 vs 16 | 0.02 |
| 2 vs 15 | 0.06 |
| 3 vs 14 | 0.15 |
| 4 vs 13 | 0.21 |
| 5 vs 12 | 0.35 |
| 6 vs 11 | 0.37 |
| 7 vs 10 | 0.39 |
| 8 vs 9  | 0.49 |

Adjustment: for every 3 AdjEM points the lower seed exceeds its historical expected position, add 0.05 to its win_prob (cap at 0.70). For every 3 AdjEM points the higher seed exceeds expectations, subtract 0.05 from lower seed's win_prob (floor at 0.01). Round to 2 decimal places. top win_prob = 1.0 - bot win_prob.

### Anti-Patterns to Avoid

- **Generating R32+ matchups with projected real team ids:** Later rounds must use null team fields. Show TBD placeholder. Never pre-assign teams to later-round slots.
- **Attaching analysis click handlers inside renderBracket():** renderBracket() is called on every tab switch. Always use initBracketHandlers() or analysis.js initAnalysisHandlers() for one-time registration. Use event delegation on a stable container.
- **Reading team stats from teams.json at card render time for metrics:** The matchups.json metrics snapshot is the single source of truth for card display. Do not re-read teams.json fields in the card renderer; use matchup.metrics.top/bot directly.
- **Using innerHTML = "" before close animation:** Just toggle the overlay class. Wipe and rebuild panel.innerHTML only when opening a new card.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Win probability model | Statistical regression or Elo system | Pre-computed values authored with base rate table + AdjEM adjustment | Deadline; 63 games is manageable by hand |
| Public consensus data | Scraping ESPN or web APIs | Manual copy from ESPN bracket challenge % | Out of scope: "Manual copy sufficient" |
| Spread data | Odds API integration | Manual entry per team in teams.json | Same reason, single-use |
| Modal library | Micromodal.js, Floating UI, etc. | Plain div + CSS class toggle | No build tooling; overlay is 20 lines of CSS |
| Confidence calculation engine | Rule-based scoring function | Author confidence directly per game | Pre-baked approach; the engine is Claude's judgment |

**Key insight:** Every data problem in Phase 2 is solved by careful JSON authoring, not runtime computation. The browser reads, finds the matchup by slot id, and renders. That is fewer than 150 lines of JavaScript total for analysis.js.

---

## Common Pitfalls

### Pitfall 1: Generating Later-Round Matchups With Real Team Ids

**What goes wrong:** Plan 02-01 assigns real team ids (e.g., DUKE) to R32 slot team_top/team_bot fields. The analysis card shows Duke's analysis even when Ohio State advances from R64.

**Why it happens:** It's tempting to project likely matchups into later rounds. But the app must work regardless of Tim's picks.

**How to avoid:** For R32+ slots, team_top and team_bot must be null. The renderer shows a placeholder. Win probability, pros/cons, and reasoning are also null for these slots.

**Warning signs:** Analysis card shows a team name that does not match what Tim picked to advance.

### Pitfall 2: Duplicate Click Handlers on Tab Switch

**What goes wrong:** renderBracket() is called on every region tab switch. If the analysis-trigger click handler is attached inside renderBracket(), it gets duplicated on every switch, leading to multiple openAnalysisCard() calls per click.

**Why it happens:** Following the same pattern as pick selection, but pick handlers use event delegation on the stable #bracket-container and are registered once in initBracketHandlers().

**How to avoid:** Register the analysis trigger handler once, using event delegation on #bracket-container, in initBracketHandlers() or analysis.js initAnalysisHandlers(). Never inside renderBracket().

**Warning signs:** Analysis panel flashes or opens multiple times on a single click.

### Pitfall 3: teams.json Null Fields Not Populated Before matchups.json Generation

**What goes wrong:** matchups.json metrics section captures values that are still null because teams.json was not fully populated first.

**Why it happens:** Plan 02-01 has two sub-tasks: fill teams.json data, then generate matchups.json. If executed out of order or incompletely, null values propagate.

**How to avoid:** Complete and validate teams.json for all 68 teams before generating any matchups.json entries. Run the DevTools validation snippet to confirm zero null kenpom_adjEM values before proceeding.

**Warning signs:** Analysis card metrics column shows "null" or "undefined".

### Pitfall 4: First Four Slot Analysis Generated Before Winners Confirmed

**What goes wrong:** Matchups M1, S1, M5, W5 are R64 games involving First Four winners. If matchups.json is generated before First Four resolves, those 4 slots reference wrong or null team ids.

**Why it happens:** STATE.md explicitly notes: "First Four games play March 17-18: data generation must handle these 4 slots as resolved/resolved-with-winner before generating the rest of matchups.json."

**How to avoid:** Plan 02-01 must update first_four.json with resolved: true and winner: "TEAM_ID" for all 4 First Four games first, then generate the 4 affected R64 matchup entries. The other 28 R64 matchups can be generated before First Four resolves.

**Warning signs:** M1, S1, M5, or W5 analysis card shows wrong team names.

### Pitfall 5: Analysis Overlay Not Dismissible

**What goes wrong:** Panel opens but Tim cannot close it, blocking all bracket interaction.

**Why it happens:** Close triggers not fully wired: missing backdrop click, missing Escape key, or close button event listener not re-attached after panel innerHTML is rebuilt.

**How to avoid:** Use event delegation on stable containers (overlay div for backdrop, document for Escape key, analysis-panel for close button). All three close paths use closeAnalysisCard(). Wire once in initAnalysisHandlers(), not per card open.

---

## Code Examples

### Overlay HTML (add to index.html)

```html
<!-- Add inside <div id="app">, after <aside id="first-four-panel"> -->
<div id="analysis-overlay" class="analysis-overlay">
  <div id="analysis-panel" class="analysis-panel">
    <!-- Populated by analysis.js on each open -->
  </div>
</div>
```

### Card Inner HTML (analysis.js buildCardHTML)

```javascript
function buildCardHTML(matchup, topTeam, botTeam) {
  const upsetFlag = matchup.upset_alert
    ? `<span class="flag flag--upset">UPSET ALERT</span>`
    : "";
  const contrarianFlag = matchup.contrarian
    ? `<span class="flag flag--contrarian">CONTRARIAN</span>`
    : "";
  const confidenceLower = matchup.recommendation.confidence.toLowerCase();
  const recTeamName = matchup.recommendation.team === topTeam.id
    ? topTeam.name
    : botTeam.name;

  return `
    <div class="card-header">
      <button class="analysis-close" aria-label="Close">&times;</button>
      <span class="card-round">${matchup.round} · ${matchup.region}</span>
      <div class="card-flags">${upsetFlag}${contrarianFlag}</div>
    </div>
    <div class="card-teams">
      <div class="team-col">
        <div class="team-title">
          <span class="seed-badge">${topTeam.seed}</span>
          <span class="team-name">${topTeam.name}</span>
        </div>
        <div class="metrics">
          <div class="metric"><span class="label">AdjEM</span><span class="value">${matchup.metrics.top.kenpom_adjEM}</span></div>
          <div class="metric"><span class="label">Last 10</span><span class="value">${matchup.metrics.top.last_10}</span></div>
          <div class="metric"><span class="label">SOS</span><span class="value">#${matchup.metrics.top.sos_rank}</span></div>
        </div>
        <ul class="pros">${matchup.pros.top.map(p => `<li>${p}</li>`).join("")}</ul>
        <ul class="cons">${matchup.cons.top.map(c => `<li>${c}</li>`).join("")}</ul>
      </div>
      <div class="team-col">
        <div class="team-title">
          <span class="seed-badge">${botTeam.seed}</span>
          <span class="team-name">${botTeam.name}</span>
        </div>
        <div class="metrics">
          <div class="metric"><span class="label">AdjEM</span><span class="value">${matchup.metrics.bot.kenpom_adjEM}</span></div>
          <div class="metric"><span class="label">Last 10</span><span class="value">${matchup.metrics.bot.last_10}</span></div>
          <div class="metric"><span class="label">SOS</span><span class="value">#${matchup.metrics.bot.sos_rank}</span></div>
        </div>
        <ul class="pros">${matchup.pros.bot.map(p => `<li>${p}</li>`).join("")}</ul>
        <ul class="cons">${matchup.cons.bot.map(c => `<li>${c}</li>`).join("")}</ul>
      </div>
    </div>
    <div class="card-recommendation">
      <span class="confidence-badge confidence--${confidenceLower}">${matchup.recommendation.confidence} Confidence</span>
      <span class="rec-pick">Pick: ${recTeamName}</span>
      <p class="reasoning">${matchup.reasoning}</p>
    </div>
  `;
}
```

### Overlay CSS Pattern

```css
/* css/analysis.css */
.analysis-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  z-index: 100;
  align-items: center;
  justify-content: center;
}
.analysis-overlay.visible {
  display: flex;
}
.analysis-panel {
  background: #1a1a2e;
  border: 1px solid #333;
  border-radius: 8px;
  max-width: 720px;
  width: 90%;
  max-height: 85vh;
  overflow-y: auto;
  padding: 1.5rem;
}
.card-teams {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}
.confidence-badge.confidence--high   { background: #1a7a1a; color: #fff; }
.confidence-badge.confidence--medium { background: #7a5a1a; color: #fff; }
.confidence-badge.confidence--low    { background: #5a1a1a; color: #fff; }
.flag--upset      { background: #c00; color: #fff; padding: 2px 6px; border-radius: 4px; }
.flag--contrarian { background: #a04000; color: #fff; padding: 2px 6px; border-radius: 4px; }
```

### DevTools Validation Script (paste in browser console after loading page)

```javascript
fetch("./data/matchups.json").then(r => r.json()).then(data => {
  const m = data.matchups;
  let errors = 0;
  Object.entries(m).forEach(([id, entry]) => {
    if (entry.team_top === null) return; // TBD slot, skip
    if (Math.abs((entry.win_prob?.top ?? 0) + (entry.win_prob?.bot ?? 0) - 1.0) > 0.01) {
      console.error(id + ": win_prob does not sum to 1.0");
      errors++;
    }
    if (entry.pros?.top?.length !== 3 || entry.pros?.bot?.length !== 3) {
      console.warn(id + ": pros not exactly 3 items each");
      errors++;
    }
    if (entry.cons?.top?.length !== 3 || entry.cons?.bot?.length !== 3) {
      console.warn(id + ": cons not exactly 3 items each");
      errors++;
    }
    if (!entry.recommendation?.confidence) {
      console.warn(id + ": missing confidence tier");
      errors++;
    }
  });
  console.log("Validation complete. Errors: " + errors);
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Bracket tools fetch live stats APIs | Pre-baked JSON authored by Claude | Project decision 2026-03-17 | No API keys, works on GitHub Pages, faster to ship |
| Separate analysis page or route | Inline overlay panel on bracket page | Phase 2 design | Zero navigation friction; Tim never leaves the bracket |
| Runtime confidence computation | Authored confidence tier per game | Project decision 2026-03-17 | Eliminates formula maintenance; analysis is judgment-driven |

**Deprecated/outdated for this project:**
- Fetching KenPom at runtime: not needed, data is authored once into teams.json
- Numeric confidence score engines: not needed, confidence is authored per game during generation

---

## Open Questions

1. **Click target for opening the analysis card**
   - What we know: Team-slot clicks are already claimed for pick selection
   - What's unclear: Card-background click vs dedicated info icon button
   - Recommendation: Add a small info icon ("i" button) to each matchup card in bracket.js. Clicking it opens analysis. This is unambiguous, avoids accidental analysis opens, and is easy to style. Plan 02-02 should codify this choice.

2. **Later-round projected matchup analysis**
   - What we know: 32 of 63 matchups are TBD at generation time
   - What's unclear: Should matchups.json include a projected sub-object for likely R32 matchups (1-vs-8/9 winner, etc.)?
   - Recommendation: Keep it simple for the deadline. Null-out all R32+ entries. Show the TBD placeholder. The 32 R64 analyses alone surface all the useful contrarian and upset data Tim needs for his initial picks. Plan 02-01 should make this scope decision explicit.

3. **Data sourcing accuracy for teams.json null fields**
   - What we know: All 68 teams have null KenPom AdjEM, SOS rank, record, spread, public_pick_pct
   - What's unclear: Claude's training data extends through August 2025; 2025-26 season stats will need verification
   - Recommendation: Plan 02-01 instructs Claude to author values from best available training knowledge, then flags each team's data with a note that Tim should verify any values that look wrong before bracket submission. KenPom values in particular change throughout the season.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None (plain HTML/CSS/JS, no build tooling) |
| Config file | none |
| Quick run command | python3 -m http.server 8000 + manual browser check |
| Full suite command | Same plus DevTools validation script |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ANAL-01 | Click matchup, card shows AdjEM + Last 10 + SOS side by side | manual | Open browser, click info icon on E1 | No — Wave 0 |
| ANAL-02 | Card shows exactly 3 pros and 3 cons per team | manual + console script | DevTools validation script | No — Wave 0 |
| ANAL-03 | Card shows High/Medium/Low confidence badge | manual | Verify badge text on known High confidence game (1-seed matchup) | No — Wave 0 |
| ANAL-04 | Card shows 1-2 sentence reasoning text | manual | Read reasoning field in panel | No — Wave 0 |
| ANAL-05 | Upset alert flag visible on qualifying games | manual | Check a 5-vs-12 or 8-vs-9 matchup card | No — Wave 0 |
| ANAL-06 | Contrarian flag visible when model diverges from public | manual | Find a contrarian: true entry in matchups.json, verify flag shows | No — Wave 0 |

### Sampling Rate
- **Per task commit:** Load page, click one matchup info button, verify panel opens and shows data
- **Per wave merge:** Full manual walkthrough: one matchup per region (4 total), verify a known High/Medium/Low confidence game each, verify at least one upset alert and one contrarian flag, verify TBD placeholder on one R32+ slot
- **Phase gate:** All 6 success criteria from ROADMAP.md verified manually before /gsd:verify-work

### Wave 0 Gaps
- No: data/matchups.json — source for all ANAL-01 through ANAL-06
- No: js/analysis.js — card renderer and open/close handlers
- No: css/analysis.css — overlay, card layout, tier badge colors, flag styles

No automated test framework needed. This project has no test runner by design.

---

## Sources

### Primary (HIGH confidence)
- Project source code (Phase 1 complete): /Users/tzulueta/ChalkBuster/ — direct inspection of teams.json schema (68 teams, all null data fields), bracket.js patterns (matchup card structure, click delegation), state.js module boundaries, app.js initialization flow
- .planning/REQUIREMENTS.md — exact requirement text and out-of-scope decisions
- .planning/STATE.md — locked architectural decisions (pre-baked JSON, no runtime AI, plain HTML/CSS/JS)
- .planning/ROADMAP.md — Phase 2 plans and success criteria with exact wording

### Secondary (MEDIUM confidence)
- Historical NCAA Tournament upset rates by seed matchup: broadly consistent across sports analytics sources (FiveThirtyEight, KenPom blog, ESPN analytics); specific percentages are rounded estimates appropriate for pre-baked win probability
- KenPom AdjEM interpretation ranges: directional thresholds based on community usage norms; not a formula from official KenPom documentation

### Tertiary (LOW confidence)
- Specific 2025-26 team stats: Claude's training extends through August 2025. Full 2025-26 season KenPom rankings, records, and SOS ranks require manual verification against current kenpom.com data. Plan 02-01 should instruct Tim to sanity-check any values that look incorrect.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — project constraint eliminates all library choices
- Architecture: HIGH — patterns derived directly from existing Phase 1 code; overlay modal is proven vanilla JS pattern
- matchups.json schema: HIGH — designed to match the exact slot id keying system already in bracket.json
- Pitfalls: HIGH — identified from direct code inspection (duplicate handler risk, null propagation, First Four timing)
- Data values (team stats): LOW to MEDIUM — training knowledge covers most teams but 2025-26 season data needs verification

**Research date:** 2026-03-17
**Valid until:** 2026-03-19 (hard deadline) — project is time-bounded; research is stable for its duration
