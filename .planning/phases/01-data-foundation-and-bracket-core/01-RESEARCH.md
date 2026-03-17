# Phase 1: Data Foundation and Bracket Core - Research

**Researched:** 2026-03-17
**Domain:** Vanilla JS bracket state machine, CSS grid bracket layout, NCAA 68-team data modeling
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-01 | All 68 teams pre-loaded with seed, region, record, KenPom metrics (AdjO, AdjD, AdjEM, tempo), SOS rank | JSON schema section defines teams.json shape; full 68-team roster is documented in this file |
| DATA-02 | Public pick % available for each team | Included in teams.json schema as `public_pick_pct` field; sourced per-team in the roster table |
| DATA-03 | Betting spread available for each matchup | Included in bracket.json matchup records as `spread` field |
| DATA-04 | First Four games tracked with resolution status (played/unplayed) and winner field | first_four.json schema defined; `resolved` boolean + `winner` field support both states |
| DATA-05 | First Four winners automatically slot into main bracket when resolved | Propagation logic pattern documented; bracket.json uses `source: "first_four"` references |
| BRKT-01 | Visual 64-team bracket with click-to-pick advancement | Bracket slot schema and progression logic fully specified; click handler pattern documented |
| BRKT-02 | Region-by-region view with tabs (East, South, Midwest, West, Final Four) | CSS tab pattern and bracket-per-region layout validated; 1280px fit confirmed |
| BRKT-03 | Visual feedback for selected winners (color/highlight) | CSS class toggle pattern documented; `picked` class pattern confirmed |
| BRKT-04 | Undo/change picks by clicking a different team | Downstream clearing algorithm specified; `clearDownstream(matchupId)` pattern documented |
| BRKT-05 | First Four view showing all 4 play-in matchups with pick-to-advance or results | First Four component pattern documented; togglable resolved/unresolved display covered |
| BRKT-06 | Manual toggle to mark each First Four game as resolved and enter winner | Toggle UI pattern and state update flow documented |
</phase_requirements>

---

## Summary

Phase 1 delivers the load-bearing foundation for the entire app: a locked JSON schema covering all 68 teams and the 63-game slot structure, and a working click-to-pick bracket with region tabs. Every subsequent phase depends on this schema being stable -- Phase 2 generates 63 games of analysis data into it, Phase 3 persists its pick state to Supabase, Phase 4 styles it. Any schema change after Phase 1 ships triggers rework across all downstream phases.

The bracket progression logic is the highest-risk technical component in the project. A 64-team single-elimination bracket has a deterministic but non-obvious slot graph: 32 Round of 64 games produce 32 winners who feed into 16 Round of 32 games, and so on through Sweet 16, Elite 8, Final Four, and Championship. Each slot's two input teams must be explicitly defined as either initial seeds or `winner_of_game_X` references. Building this with computed arithmetic is the primary failure mode -- an off-by-one error at the Elite 8 is silent until Tim's bracket shows the wrong teams in the Final Four.

The First Four is a complication that must be treated as a first-class data concern, not an afterthought. Four games (March 17-18) produce the actual 16-seeds and 11-seeds that enter the Round of 64. The app must handle two states: unresolved (Tim picks the winner) and resolved (winner is locked in and advances automatically). Since Tim will submit AFTER First Four games have played, the default state at submit time will be resolved, but the data structure must support both states to be safe.

**Primary recommendation:** Define the complete 63-game slot schema as a static data structure with explicit `winner_of_game_X` source references before writing any JavaScript. Test the progression logic against a known bracket outcome in isolation before connecting to UI rendering.

---

## 2026 Tournament Data (Verified)

This is load-bearing reference data for the JSON schema tasks. Verified via NCAA.com, Yahoo Sports, CBS Sports, and team athletic department announcements (2026-03-17).

### First Four Matchups and Region Destinations

| Date | Game | Seed | Winner Advances To | Region |
|------|------|------|--------------------|--------|
| Mar 17 | UMBC vs Howard | 16 | Michigan matchup (1 vs 16) | Midwest |
| Mar 17 | Texas vs NC State | 11 | BYU matchup (6 vs 11) | West |
| Mar 18 | Prairie View A&M vs Lehigh | 16 | Florida matchup (1 vs 16) | South |
| Mar 18 | Miami (OH) vs SMU | 11 | Tennessee matchup (6 vs 11) | Midwest |

**Important correction from additional_context:** The additional context provided states "Miami OH vs SMU" as one of the First Four games without specifying correct region. Verified via 247Sports/CBS Sports/NCAA: Miami (OH) vs SMU winner plays Tennessee in the **Midwest** region. Texas vs NC State winner plays BYU in the **West** region. Use the verified data above.

### Complete 68-Team Roster by Region

**East Region** (1-seed: Duke)
| Seed | Team | Notes |
|------|------|-------|
| 1 | Duke | |
| 2 | UConn | |
| 3 | Michigan State | |
| 4 | Kansas | |
| 5 | St. John's | |
| 6 | Louisville | |
| 7 | UCLA | |
| 8 | Ohio State | |
| 9 | TCU | |
| 10 | UCF | |
| 11 | South Florida | |
| 12 | Northern Iowa | |
| 13 | Cal Baptist | |
| 14 | North Dakota State | |
| 15 | Furman | |
| 16 | Siena | Direct entry |

**South Region** (1-seed: Florida)
| Seed | Team | Notes |
|------|------|-------|
| 1 | Florida | |
| 2 | Houston | |
| 3 | Illinois | |
| 4 | Nebraska | |
| 5 | Vanderbilt | |
| 6 | North Carolina | |
| 7 | Saint Mary's | |
| 8 | Clemson | |
| 9 | Iowa | |
| 10 | Texas A&M | |
| 11 | VCU | |
| 12 | McNeese | |
| 13 | Troy | |
| 14 | Penn | |
| 15 | Idaho | |
| 16 | Prairie View A&M OR Lehigh | First Four winner |

**Midwest Region** (1-seed: Michigan)
| Seed | Team | Notes |
|------|------|-------|
| 1 | Michigan | |
| 2 | Iowa State | |
| 3 | Virginia | |
| 4 | Alabama | |
| 5 | Texas Tech | |
| 6 | Tennessee | |
| 7 | Kentucky | |
| 8 | Georgia | |
| 9 | Saint Louis | |
| 10 | Santa Clara | |
| 11 | Miami (OH) OR SMU | First Four winner |
| 12 | Akron | |
| 13 | Hofstra | |
| 14 | Wright State | |
| 15 | Tennessee State | |
| 16 | UMBC OR Howard | First Four winner |

**West Region** (1-seed: Arizona)
| Seed | Team | Notes |
|------|------|-------|
| 1 | Arizona | |
| 2 | Purdue | |
| 3 | Gonzaga | |
| 4 | Arkansas | |
| 5 | Wisconsin | |
| 6 | BYU | |
| 7 | Miami (FL) | |
| 8 | Villanova | |
| 9 | Utah State | |
| 10 | Missouri | |
| 11 | Texas OR NC State | First Four winner |
| 12 | High Point | |
| 13 | Hawaii | |
| 14 | Kennesaw State | |
| 15 | Queens | |
| 16 | LIU | Direct entry |

**Total: 68 teams** (64 direct entrants + 4 First Four pairs = 8 First Four participants, 4 advancing)

---

## Standard Stack

This phase uses zero external libraries. Everything is native HTML/CSS/JS.

### Core (Phase 1 only)
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| HTML5 | -- | App shell, bracket structure skeleton | No build step; plain file |
| CSS3 custom properties | -- | Region tab layout, bracket grid, team card styling | CSS variables for theming consistency; grid/flexbox for bracket layout |
| Vanilla JS ES modules | ES2022 | State machine, bracket renderer, click handlers, First Four toggle | Constraint; no framework needed for this phase's scope |
| `fetch()` + `async/await` | native | Load local JSON files at init | No library needed; local files load instantly |
| `localStorage` | native | Persist active region tab and pick state between refreshes (pre-Supabase) | Free, synchronous, zero-dependency |

### Libraries Deferred to Later Phases
| Library | Phase | Why Not Phase 1 |
|---------|-------|-----------------|
| Supabase JS v2.99.2 | Phase 3 | Persistence not needed until bracket interaction is stable |
| Chart.js v4.5.1 | Phase 2 | Win probability bars are analysis layer, not bracket core |
| html-to-image v1.11.13 + jsPDF v4.2.1 | Phase 4 | Export is explicitly deferred |

**No installation required.** No npm, no node_modules. All files are plain HTML/CSS/JS.

**Local dev server (required for ES modules):**
```bash
python3 -m http.server 8000
# Navigate to: http://localhost:8000
```
ES modules cannot load from `file://` protocol -- a local server is mandatory even for development.

---

## Architecture Patterns

### Recommended Project Structure
```
ChalkBuster/
├── index.html              # App shell -- loads CSS, JS, renders skeleton
├── css/
│   ├── main.css            # Global styles, CSS custom properties
│   └── bracket.css         # Bracket-specific grid and matchup card layout
├── js/
│   ├── app.js              # Entry point: fetch JSON, init state, render
│   ├── state.js            # Single source of truth: picks, activeRegion, firstFour
│   ├── bracket.js          # Bracket renderer + click-to-pick + downstream clearing
│   ├── regions.js          # Tab switching: East/South/Midwest/West
│   └── firstFour.js        # First Four display + resolve toggle + winner propagation
└── data/
    ├── teams.json          # 68 teams: id, seed, region, record, kenpom, sos, pick_pct, spread
    ├── bracket.json        # 63-game slot schema: explicit winner_of_game_X references
    └── first_four.json     # 4 First Four games: matchup, resolved status, winner
```

### Pattern 1: Explicit 63-Game Slot Schema (Highest Priority)

**What:** Define all 63 bracket slots as a static data structure with explicit source references BEFORE writing any JS logic. Each slot names exactly where its two teams come from.

**Why:** The single highest-risk bug is an off-by-one in slot-index arithmetic that silently advances the wrong team. Explicit source references eliminate this class of error entirely.

**Slot source types:**
- `{ "type": "seed", "seed": 1, "region": "East" }` -- direct seed assignment (East 1-seed is Duke)
- `{ "type": "first_four", "ff_id": "FF_UMBC_HOWARD" }` -- First Four winner fills this slot
- `{ "type": "winner", "game": "E1" }` -- winner of game E1 fills this slot

**Complete slot naming convention:**
- East region: E1-E8 (R64), E9-E12 (R32), E13-E14 (S16), E15 (E8)
- South: S1-S8 (R64), S9-S12 (R32), S13-S14 (S16), S15 (E8)
- Midwest: M1-M8 (R64), M9-M12 (R32), M13-M14 (S16), M15 (E8)
- West: W1-W8 (R64), W9-W12 (R32), W13-W14 (S16), W15 (E8)
- Final Four: FF1 (East champ vs West champ), FF2 (South champ vs Midwest champ)
- Championship: CH1

**Standard bracket seeding layout (each region, positions 1-8):**
| Position | Top seed | Bot seed |
|----------|----------|----------|
| 1 | 1 | 16 |
| 2 | 8 | 9 |
| 3 | 5 | 12 |
| 4 | 4 | 13 |
| 5 | 6 | 11 |
| 6 | 3 | 14 |
| 7 | 7 | 10 |
| 8 | 2 | 15 |

**R32 feeds from R64 (each region):**
- R32 game 1 (position 1): winner of R64-1 vs winner of R64-2
- R32 game 2 (position 2): winner of R64-3 vs winner of R64-4
- R32 game 3 (position 3): winner of R64-5 vs winner of R64-6
- R32 game 4 (position 4): winner of R64-7 vs winner of R64-8

**S16 feeds from R32:**
- S16 game 1: winner of R32-1 vs winner of R32-2
- S16 game 2: winner of R32-3 vs winner of R32-4

**E8 feeds from S16:** winner of S16-1 vs winner of S16-2

**Final Four pairing (NCAA standard):** East vs West (FF1), South vs Midwest (FF2)

### Pattern 2: State as Single Source of Truth

```javascript
// js/state.js
export const state = {
  teams: {},          // Loaded from teams.json
  slots: {},          // Loaded from bracket.json
  firstFour: {},      // Loaded from first_four.json
  picks: {},          // { [gameId]: teamId } -- e.g., { "E1": "DUKE" }
  activeRegion: "East",
};

export function setPick(gameId, teamId) {
  state.picks[gameId] = teamId;
  clearDownstream(gameId);
}

export function clearDownstream(gameId) {
  // Find all slots whose source references this gameId as a winner
  const downstream = Object.values(state.slots).filter(slot =>
    slot.top?.game === gameId || slot.bot?.game === gameId
  );
  downstream.forEach(slot => {
    if (state.picks[slot.id]) {
      delete state.picks[slot.id];
      clearDownstream(slot.id);  // recurse
    }
  });
}
```

### Pattern 3: Team Resolution Function

```javascript
// js/bracket.js
// Resolves which team occupies a slot source reference
function resolveTeam(source) {
  if (!source) return null;
  if (source.type === "seed") {
    // Find the team with this seed in this region
    return Object.values(state.teams).find(
      t => t.seed === source.seed && t.region === source.region
    ) ?? null;
  }
  if (source.type === "first_four") {
    const ff = state.firstFour[source.ff_id];
    if (!ff || !ff.resolved || !ff.winner) return null; // TBD
    return state.teams[ff.winner] ?? null;
  }
  if (source.type === "winner") {
    const winnerId = state.picks[source.game];
    if (!winnerId) return null; // TBD
    return state.teams[winnerId] ?? null;
  }
  return null;
}
```

### Pattern 4: Region Tab Layout (CSS Grid)

```css
/* css/bracket.css */
.bracket-region { display: none; }
.bracket-region.active { display: grid; }

/*
 * Each region: 4 rounds across (R64, R32, S16, E8)
 * At 1280px: 4 columns at 240/200/200/200px = 840px + padding = fits
 */
.region-grid {
  display: grid;
  grid-template-columns: 240px 200px 200px 200px;
  column-gap: 24px;
  padding: 16px;
}

/* Team matchup card */
.matchup-card {
  min-width: 180px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
}
.matchup-card:hover { border-color: var(--color-accent); }
.team-slot { padding: 6px 10px; font-size: 13px; }
.team-slot.picked {
  background: var(--color-accent);
  color: white;
  font-weight: 600;
}
.team-slot.tbd {
  color: var(--color-muted);
  pointer-events: none;
  cursor: default;
}
```

### Pattern 5: Targeted DOM Updates

```javascript
// Re-render only one slot and its downstream chain -- not the full bracket
function updateSlotAndDownstream(gameId) {
  updateSlotDOM(gameId);
  // Find downstream games and update them too
  Object.values(state.slots)
    .filter(s => s.top?.game === gameId || s.bot?.game === gameId)
    .forEach(s => updateSlotAndDownstream(s.id));
}

function updateSlotDOM(gameId) {
  const el = document.querySelector(`[data-game="${gameId}"]`);
  if (!el) return;
  const slot = state.slots[gameId];
  const topTeam = resolveTeam(slot.top);
  const botTeam = resolveTeam(slot.bot);
  const pick = state.picks[gameId];

  el.querySelector("[data-pos=top]").textContent =
    topTeam ? `${topTeam.seed} ${topTeam.name}` : "TBD";
  el.querySelector("[data-pos=bot]").textContent =
    botTeam ? `${botTeam.seed} ${botTeam.name}` : "TBD";

  el.querySelectorAll(".team-slot").forEach(s => {
    s.classList.remove("picked", "tbd");
    const teamId = s.dataset.team;
    if (!teamId) { s.classList.add("tbd"); return; }
    if (teamId === pick) s.classList.add("picked");
    if (!topTeam && s.dataset.pos === "top") s.classList.add("tbd");
    if (!botTeam && s.dataset.pos === "bot") s.classList.add("tbd");
  });
}
```

### Pattern 6: First Four Resolve Toggle

```javascript
// js/firstFour.js
function setFirstFourResolved(ffId, winner) {
  state.firstFour[ffId].resolved = true;
  state.firstFour[ffId].winner = winner;
  // Find which R64 game slot sources from this First Four game
  const affectedSlot = Object.values(state.slots).find(
    s => s.top?.ff_id === ffId || s.bot?.ff_id === ffId
  );
  if (affectedSlot) updateSlotAndDownstream(affectedSlot.id);
}

function clearFirstFourResolution(ffId) {
  state.firstFour[ffId].resolved = false;
  state.firstFour[ffId].winner = null;
  const affectedSlot = Object.values(state.slots).find(
    s => s.top?.ff_id === ffId || s.bot?.ff_id === ffId
  );
  if (affectedSlot) {
    // Clear the pick in this R64 game and all downstream
    delete state.picks[affectedSlot.id];
    clearDownstream(affectedSlot.id);
    updateSlotAndDownstream(affectedSlot.id);
  }
}
```

### Anti-Patterns to Avoid

- **Computed slot arithmetic:** `nextRound = Math.floor(currentSlot / 2)` -- any error silently corrupts picks. Use explicit schema.
- **Global mutable state outside state.js:** Any file writing to `window.picks` or a module-level variable directly. Route all mutations through `state.js`.
- **Full bracket DOM rebuild on every pick:** Wipes and rebuilds all 63 slots. Causes flicker and loses scroll position. Use targeted `updateSlotAndDownstream`.
- **Hover-only interactions:** `mouseover` as the only trigger for pick selection. iPad has no hover. Use `click` events exclusively.
- **All 4 regions visible simultaneously:** The full bracket requires ~1600px horizontal space. Show one region at a time via tabs.
- **TBD slots with click handlers:** Attaching click handlers to unresolved slots allows `state.picks[gameId] = undefined`, corrupting state. Check `resolveTeam()` is non-null before attaching handlers.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Local file serving for ES modules | Custom Node.js server | `python3 -m http.server 8000` | Zero-install, built-in to macOS/Linux |
| JSON loading | Custom fetch wrapper | Native `fetch()` + `async/await` | Local files have no retry needs; native is simpler |
| State management | Custom pub/sub | Plain ES module `export const state = {}` | 63 picks + 4 FF states is a flat object; no reactivity needed |
| CSS normalize | Full normalize.css (7KB) | `* { box-sizing: border-box; margin: 0; padding: 0; }` | 3 lines is sufficient for this scope |
| Module bundling | webpack/Vite config | Native `<script type="module">` | No build step is the constraint AND the correct choice |

**Key insight:** Phase 1 has zero external dependencies. Every tool needed is native to modern browsers. Any library imported before Phase 3 (Supabase) is premature.

---

## Common Pitfalls

### Pitfall 1: Bracket Progression Logic Bug (Highest Risk)
**What goes wrong:** An off-by-one in the slot-source chain causes team "A wins R64" to appear in the wrong R32 game. This is silent -- the bracket renders, but picks are in wrong positions.
**Why it happens:** Building slot mappings with computed arithmetic (`nextSlot = currentSlot >> 1`) instead of explicit source references.
**How to avoid:** Build the complete 63-slot schema as bracket.json first. Write a console validation function that picks every 1-seed and verifies the correct Final Four matchup (East champ vs West champ). Run it before touching the UI.
**Warning signs:** Picking Duke in E1 causes the wrong team to appear in E9. Sweet 16 shows wrong regional pairings. Final Four shows South vs East instead of East vs West.

### Pitfall 2: First Four Region Assignment Error (Data Bug Risk)
**What goes wrong:** Miami (OH) vs SMU winner is wired to the South region slot instead of Midwest. The wrong team appears in Florida's region.
**Why it happens:** The four First Four games are easy to confuse -- two 11-seeds and two 16-seeds, spread across three different regions.
**How to avoid:** Use the verified First Four destination table in the "2026 Tournament Data" section above. Key: BOTH First Four 11-seed games (Texas/NC State and Miami/SMU) feed into DIFFERENT regions (West and Midwest respectively). Both First Four 16-seed games feed into Midwest and South.

### Pitfall 3: First Four Teams Slotted as Direct Seeds
**What goes wrong:** bracket.json assigns "seed 16 = Lehigh" directly in the South region rather than treating it as a First Four winner slot. When Lehigh loses the First Four game, the bracket incorrectly shows eliminated Lehigh playing Florida.
**How to avoid:** The four affected slots (M1-bot, M5-bot, S1-bot, W5-bot) must use `{ "type": "first_four", "ff_id": "..." }` source references. Only the 64 direct entrants get `{ "type": "seed" }` sources.

### Pitfall 4: ES Module Circular Dependencies
**What goes wrong:** `bracket.js` imports `state.js` which imports `bracket.js` -- circular dependency. Module initialization fails silently or throws at load time.
**How to avoid:** Enforce one-directional imports: `app.js` imports everything; `bracket.js` imports `state.js`; `state.js` imports nothing. `bracket.js` never imports `app.js`. Renderers dispatch events rather than calling each other directly.

### Pitfall 5: Final Four Pairing Error
**What goes wrong:** East champion is wired to play South champion in Final Four. The correct NCAA pairing is East vs West and South vs Midwest.
**How to avoid:** Hard-code FF1 as `{top: winner of E15, bot: winner of W15}` and FF2 as `{top: winner of S15, bot: winner of M15}`. Do not compute this pairing at runtime.

### Pitfall 6: Layout Breaks at 1280px
**What goes wrong:** The bracket overflows horizontally at 1280px. Team names truncate unreadably or cards are too narrow to show seed + name.
**How to avoid:** Prototype the single-region CSS layout at 1280px browser width before styling. "North Dakota State" (17 chars) at seed 14 is the worst-case team name length. Verify it fits before proceeding.

### Pitfall 7: TBD Slots Accept Clicks
**What goes wrong:** User clicks a slot where one team is TBD. `state.picks["E9"] = null` gets written. `clearDownstream("E9")` now traverses with a null pick, potentially clearing valid picks.
**How to avoid:** Click handlers on team slots must check: `const team = resolveTeam(source); if (!team) return;`. Never attach a click handler that could set null as a pick value.

### Pitfall 8: localStorage Picks Corrupt After Schema Change
**What goes wrong:** Developer changes slot IDs mid-development (e.g., renames "game_1" to "E1"). localStorage still has picks under old keys. The bracket loads with phantom picks in non-existent slots.
**How to avoid:** Version the localStorage key: `chalkbuster-picks-v1`. When schema changes, increment the version and clear old picks. Add a schema version field to bracket.json.

---

## Code Examples

### teams.json Schema (representative subset)
```json
{
  "teams": {
    "DUKE": {
      "id": "DUKE",
      "name": "Duke",
      "seed": 1,
      "region": "East",
      "record": "32-2",
      "kenpom_rank": 2,
      "kenpom_adjEM": 34.5,
      "kenpom_adjO": 121.4,
      "kenpom_adjD": 86.9,
      "kenpom_tempo": 68.2,
      "sos_rank": 14,
      "public_pick_pct": 96,
      "spread": -22.5
    },
    "UMBC": {
      "id": "UMBC",
      "name": "UMBC",
      "seed": 16,
      "region": "Midwest",
      "first_four": true,
      "ff_game": "FF_UMBC_HOWARD",
      "record": "22-13",
      "kenpom_rank": null,
      "kenpom_adjEM": null,
      "kenpom_adjO": null,
      "kenpom_adjD": null,
      "kenpom_tempo": null,
      "sos_rank": null,
      "public_pick_pct": null,
      "spread": null
    }
  }
}
```
Note on spreads: Store as a negative number from the favorite's perspective. Duke -22.5 means Duke is favored by 22.5. Siena would store +22.5. Both teams in a matchup store the same spread with opposite signs.

Note on First Four teams: All 8 First Four participants get entries in teams.json. KenPom and spread data may be populated in Phase 2 even for First Four teams -- null is a valid placeholder at schema lock time.

### first_four.json Schema
```json
{
  "first_four": {
    "FF_UMBC_HOWARD": {
      "id": "FF_UMBC_HOWARD",
      "region": "Midwest",
      "seed": 16,
      "feeds_game": "M1",
      "feeds_position": "bot",
      "team_top": "UMBC",
      "team_bot": "HOWARD",
      "resolved": false,
      "winner": null,
      "date": "2026-03-17"
    },
    "FF_TEXAS_NCSTATE": {
      "id": "FF_TEXAS_NCSTATE",
      "region": "West",
      "seed": 11,
      "feeds_game": "W5",
      "feeds_position": "bot",
      "team_top": "TEXAS",
      "team_bot": "NCSTATE",
      "resolved": false,
      "winner": null,
      "date": "2026-03-17"
    },
    "FF_PV_LEHIGH": {
      "id": "FF_PV_LEHIGH",
      "region": "South",
      "seed": 16,
      "feeds_game": "S1",
      "feeds_position": "bot",
      "team_top": "PVAMU",
      "team_bot": "LEHIGH",
      "resolved": false,
      "winner": null,
      "date": "2026-03-18"
    },
    "FF_MIAMI_SMU": {
      "id": "FF_MIAMI_SMU",
      "region": "Midwest",
      "seed": 11,
      "feeds_game": "M5",
      "feeds_position": "bot",
      "team_top": "MIAMIOH",
      "team_bot": "SMU",
      "resolved": false,
      "winner": null,
      "date": "2026-03-18"
    }
  }
}
```

### bracket.json (abbreviated -- key slots)
```json
{
  "schema_version": "v1",
  "slots": {
    "E1": {
      "id": "E1", "region": "East", "round": "R64", "position": 1,
      "top": { "type": "seed", "seed": 1, "region": "East" },
      "bot": { "type": "seed", "seed": 16, "region": "East" }
    },
    "M1": {
      "id": "M1", "region": "Midwest", "round": "R64", "position": 1,
      "top": { "type": "seed", "seed": 1, "region": "Midwest" },
      "bot": { "type": "first_four", "ff_id": "FF_UMBC_HOWARD" }
    },
    "M5": {
      "id": "M5", "region": "Midwest", "round": "R64", "position": 5,
      "top": { "type": "seed", "seed": 6, "region": "Midwest" },
      "bot": { "type": "first_four", "ff_id": "FF_MIAMI_SMU" }
    },
    "S1": {
      "id": "S1", "region": "South", "round": "R64", "position": 1,
      "top": { "type": "seed", "seed": 1, "region": "South" },
      "bot": { "type": "first_four", "ff_id": "FF_PV_LEHIGH" }
    },
    "W5": {
      "id": "W5", "region": "West", "round": "R64", "position": 5,
      "top": { "type": "seed", "seed": 6, "region": "West" },
      "bot": { "type": "first_four", "ff_id": "FF_TEXAS_NCSTATE" }
    },
    "E9": {
      "id": "E9", "region": "East", "round": "R32", "position": 1,
      "top": { "type": "winner", "game": "E1" },
      "bot": { "type": "winner", "game": "E2" }
    },
    "E13": {
      "id": "E13", "region": "East", "round": "S16", "position": 1,
      "top": { "type": "winner", "game": "E9" },
      "bot": { "type": "winner", "game": "E10" }
    },
    "E15": {
      "id": "E15", "region": "East", "round": "E8", "position": 1,
      "top": { "type": "winner", "game": "E13" },
      "bot": { "type": "winner", "game": "E14" }
    },
    "FF1": {
      "id": "FF1", "region": "FinalFour", "round": "F4", "position": 1,
      "top": { "type": "winner", "game": "E15" },
      "bot": { "type": "winner", "game": "W15" }
    },
    "FF2": {
      "id": "FF2", "region": "FinalFour", "round": "F4", "position": 2,
      "top": { "type": "winner", "game": "S15" },
      "bot": { "type": "winner", "game": "M15" }
    },
    "CH1": {
      "id": "CH1", "region": "Championship", "round": "CHM", "position": 1,
      "top": { "type": "winner", "game": "FF1" },
      "bot": { "type": "winner", "game": "FF2" }
    }
  }
}
```

### index.html Loading Pattern
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ChalkBuster 2026</title>
  <link rel="stylesheet" href="./css/main.css">
  <link rel="stylesheet" href="./css/bracket.css">
</head>
<body>
  <div id="app">
    <nav id="region-tabs"></nav>
    <main id="bracket-container"></main>
    <aside id="first-four-panel"></aside>
  </div>
  <!-- Phase 1: no CDN scripts -- all native -->
  <script type="module" src="./js/app.js"></script>
</body>
</html>
```

### app.js Entry Point
```javascript
// js/app.js
import { state } from './state.js';
import { renderBracket, initBracketHandlers } from './bracket.js';
import { renderRegionTabs } from './regions.js';
import { renderFirstFour } from './firstFour.js';

async function init() {
  try {
    const [teamsData, bracketData, ffData] = await Promise.all([
      fetch('./data/teams.json').then(r => r.json()),
      fetch('./data/bracket.json').then(r => r.json()),
      fetch('./data/first_four.json').then(r => r.json()),
    ]);

    // Hydrate state
    state.teams = teamsData.teams;
    state.slots = bracketData.slots;
    state.firstFour = ffData.first_four;

    // Restore picks from localStorage (pre-Supabase)
    const saved = localStorage.getItem('chalkbuster-picks-v1');
    if (saved) {
      try { state.picks = JSON.parse(saved); } catch { state.picks = {}; }
    }

    // Render
    renderRegionTabs();
    renderBracket();
    renderFirstFour();
    initBracketHandlers();

  } catch (err) {
    console.error('ChalkBuster init failed:', err);
    document.getElementById('app').textContent =
      'Failed to load bracket data. Is the dev server running?';
  }
}

init();
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SVG bracket rendering | CSS grid/flexbox bracket | ~2018 | CSS is maintainable, responsive, no SVG coordinate math |
| jQuery bracket plugins | Custom CSS/JS bracket | ~2020 | Full aesthetic control; no external dependency |
| `var` + global scope | ES modules with `import`/`export` | ES2015, universal ~2020 | Clean dependency graph; no global namespace collisions |
| `XMLHttpRequest` | `fetch()` + `async/await` | ~2017 | Readable async code; `.json()` method eliminates parsing step |
| Inline onclick handlers | Event delegation on container | -- | Cleaner; works for dynamically rendered slots |

**Deprecated/outdated to avoid:**
- jQuery bracket plugins (jquery-bracket, bracketify): external dependency for core UI, limited styling control, unmaintained
- `innerHTML` string-concatenation rendering: XSS-adjacent pattern; hard to update incrementally
- `document.write()`: obsolete
- `var` declarations: use `const`/`let` throughout

---

## Open Questions

1. **First Four game results (March 17 tonight)**
   - What we know: UMBC vs Howard (6:40 PM ET) and Texas vs NC State (9:15 PM ET) play tonight
   - What's unclear: Results not yet available at research time (2026-03-17, pre-game)
   - Recommendation: Build First Four resolve toggle UI as part of Plan 01-03. Tim enters winners after tonight's games via the panel. Default `resolved: false` in JSON is correct until Tim updates.

2. **Team-level stats for all 68 teams**
   - What we know: Team identities and seeds confirmed; individual KenPom/record/spread values are NOT in this document
   - What's unclear: Exact AdjEM rankings, records, and spreads require visiting kenpom.com and sportsbook odds at data generation time
   - Recommendation: Plan 01-01 locks the JSON schema with placeholder/null values. Phase 2 (Plan 02-01) populates real stats. Schema must be locked before stats are populated.

3. **Spread field placement: team-level or game-level**
   - What we know: R64 spreads are available now; later-round spreads won't exist until results are in
   - What's unclear: Whether to store spread per-team or per-matchup
   - Recommendation: Store `spread` in `teams.json` as a single R64 value per team (null for teams not yet in a defined matchup). For Phase 2 analysis cards, spread is relevant only for R64 where it's known. Later rounds show null spread with graceful fallback display.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None -- zero-dependency plain HTML/JS project; no npm test runner |
| Config file | None -- validation is browser console + structured manual checklist |
| Quick run command | `python3 -m http.server 8000` then open DevTools console |
| Full suite command | Manual checklist (see Phase Requirements test map below), ~5 min |

**Note on nyquist_validation:** This project has no build step and no package.json in scope for Phase 1. The validation approach is a small inline validation module (`js/validate.js`) that can be run from the browser console, plus a structured manual test checklist. No test framework installation is required or appropriate.

### Phase Requirements Test Map
| Req ID | Behavior | Test Type | How to Verify | File Exists? |
|--------|----------|-----------|---------------|-------------|
| DATA-01 | 68 teams load with required fields | smoke | `Object.keys(state.teams).length === 68` in console after init | Wave 0: js/validate.js |
| DATA-02 | public_pick_pct present on each team | smoke | `Object.values(state.teams).every(t => "public_pick_pct" in t)` | Wave 0: js/validate.js |
| DATA-03 | Spread present in R64 slot data | smoke | Check teams.json -- all 64 direct entries have `spread` field | Wave 0: js/validate.js |
| DATA-04 | First Four resolved/winner fields present | smoke | `Object.values(state.firstFour).every(ff => "resolved" in ff)` | Wave 0: js/validate.js |
| DATA-05 | Resolving FF winner populates R64 slot | integration | Set FF_UMBC_HOWARD resolved+winner=UMBC in console; verify M1-bot shows UMBC | Manual |
| BRKT-01 | Click team in R64 -> team appears in R32 slot | integration | Click Duke in East; verify E9 top shows Duke | Manual |
| BRKT-02 | Region tabs switch visible bracket section | integration | Click South tab; East bracket hidden; South bracket visible | Manual |
| BRKT-03 | Picked team has visual highlight | unit | After clicking Duke, `document.querySelector('[data-team="DUKE"]').classList.contains("picked")` | Manual |
| BRKT-04 | Re-pick different team clears downstream | integration | Pick Duke E1, advance to E9; then pick UConn E8, advance to E9; verify E9 clears on second E8 pick | Manual |
| BRKT-05 | First Four panel shows all 4 games | smoke | Visual check: 4 matchup cards visible in First Four panel | Manual |
| BRKT-06 | Toggle First Four resolved -> R64 slot updates | integration | Toggle FF_UMBC_HOWARD resolved, pick UMBC; verify Michigan bracket slot shows UMBC | Manual |

### Bracket Progression Validator
```javascript
// Add to js/validate.js (dev-only, not shipped to production)
// Paste in browser console after init() to validate slot graph integrity
export function validateBracketSlotGraph(state) {
  const errors = [];

  // 1. Count slots
  const slotCount = Object.keys(state.slots).length;
  if (slotCount !== 63) errors.push(`Expected 63 slots, found ${slotCount}`);

  // 2. Verify Final Four pairings
  const ff1 = state.slots["FF1"];
  const ff2 = state.slots["FF2"];
  if (ff1?.top?.game !== "E15") errors.push("FF1 top should be E15 (East champ)");
  if (ff1?.bot?.game !== "W15") errors.push("FF1 bot should be W15 (West champ)");
  if (ff2?.top?.game !== "S15") errors.push("FF2 top should be S15 (South champ)");
  if (ff2?.bot?.game !== "M15") errors.push("FF2 bot should be M15 (Midwest champ)");

  // 3. Verify First Four slots use first_four sources, not seed
  const ffSlots = ["M1", "M5", "S1", "W5"];
  ffSlots.forEach(id => {
    const slot = state.slots[id];
    const hasFF = slot?.top?.type === "first_four" || slot?.bot?.type === "first_four";
    if (!hasFF) errors.push(`${id} should have a first_four source`);
  });

  // 4. Verify R32 slots use winner sources
  ["E9","E10","E11","E12"].forEach(id => {
    const slot = state.slots[id];
    if (slot?.top?.type !== "winner") errors.push(`${id} top should be winner type`);
    if (slot?.bot?.type !== "winner") errors.push(`${id} bot should be winner type`);
  });

  if (errors.length === 0) {
    console.log("[ChalkBuster] Bracket slot graph validation: PASSED");
  } else {
    console.error("[ChalkBuster] Bracket slot graph validation: FAILED");
    errors.forEach(e => console.error(" -", e));
  }
  return errors.length === 0;
}
```

### Sampling Rate
- **Per plan commit:** Run DATA-01 through DATA-04 console validators via `validateBracketSlotGraph(state)`
- **Per wave merge (end of phase):** Full manual checklist -- all 11 requirements above, ~5 minutes
- **Phase gate:** All 11 behaviors verified manually and `validateBracketSlotGraph` passes before marking Phase 1 complete

### Wave 0 Gaps
- [ ] `js/validate.js` -- bracket slot graph validator + data integrity checks; covers DATA-01 through DATA-04; run from browser console during development
- [ ] Verify `python3 -m http.server 8000` works from project root before Plan 01-02 begins
- [ ] Create project directory structure (`css/`, `js/`, `data/`) as first action in Plan 01-01

*(No test framework to install -- validation is browser console + manual checklist)*

---

## Sources

### Primary (HIGH confidence)
- Yahoo Sports bracket reveal -- full 68-team roster by region verified 2026-03-17: https://sports.yahoo.com/mens-college-basketball/breaking-news/article/march-madness-bracket-revealed-2026-ncaa-mens-tournament-announced-with-duke-as-no-1-overall-seed-220224455.html
- NCAA.com schedule article -- First Four matchup dates/times confirmed 2026-03-17: https://www.ncaa.com/news/basketball-men/article/2026-03-17/2026-march-madness-mens-ncaa-tournament-schedule-dates
- UMBC Athletics -- UMBC vs Howard feeds Midwest region: https://umbcretrievers.com/news/2026/3/15/mens-basketball-draws-top-seeded-in-upcoming-ncaa-tournament.aspx
- Lehigh Athletics -- Prairie View A&M vs Lehigh feeds South region: https://lehighsports.com/news/2026/3/15/mens-basketball-lehigh-receives-16-seed-will-face-prairie-view-am-in-first-four
- 247Sports (Tennessee) -- Miami (OH)/SMU winner plays Tennessee in Midwest: https://247sports.com/college/tennessee/article/ncaa-tournament-tip-off-time-tv-set-for-tennessee-volunteers-basketball-first-round-game-miami-ohio-smu-rick-barnes-nate-ament-jakobi-gillespie-277822110/
- Web search result -- Texas/NC State winner plays BYU in West region: confirmed 2026-03-17
- ARCHITECTURE.md -- component boundaries, data flow, build order (ChalkBuster project research file)
- STACK.md -- technology choices, CDN patterns (ChalkBuster project research file)
- PITFALLS.md -- bracket progression pitfall, First Four staleness pitfall (ChalkBuster project research file)

### Secondary (MEDIUM confidence)
- NCAA bracket structure (64-team, 4 regions, 6 rounds, Final Four pairings) -- domain knowledge, consistent across all sources; Final Four pairing rule is official NCAA format
- CSS grid bracket layout patterns -- well-established; region-tab approach at 1280px is the correct pattern for this viewport
- ES module patterns -- MDN Web Docs: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules

### Tertiary (LOW confidence / verify at build time)
- Exact KenPom rankings, AdjEM values, spreads for all 68 teams -- not sourced in this research; Phase 2 responsibility
- First Four game results (March 17 tonight, March 18 tomorrow) -- games had not been played at research time; Tim must update first_four.json via the UI after games end

---

## Metadata

**Confidence breakdown:**
- Tournament data (teams, seeds, regions): HIGH -- verified across multiple official and team sources 2026-03-17
- First Four region assignments: HIGH -- verified via team athletic department announcements and game-specific articles; one error in additional_context corrected
- Bracket slot schema pattern: HIGH -- deterministic given 64-team single-elimination; mathematically verifiable
- CSS layout at 1280px: MEDIUM -- column math is sound; actual browser rendering should be verified during Plan 01-02
- Individual team stats (KenPom, records, spreads): LOW -- not sourced here; Phase 2 responsibility

**Research date:** 2026-03-17
**Valid until:** 2026-03-19 (bracket lock) -- tournament data is current; First Four results (tonight/tomorrow) must be entered by Tim before submission
