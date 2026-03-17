# Architecture Patterns

**Project:** ChalkBuster — March Madness Bracket Analysis Tool
**Researched:** 2026-03-17
**Confidence:** HIGH (architecture is nearly deterministic given plain HTML/CSS/JS + static JSON constraints)

---

## Recommended Architecture

ChalkBuster is a **static data-display app** with one persistence concern (Supabase for save/load). The architecture follows a three-layer pattern common to sports analysis tools: static data layer, pure-JS logic layer, DOM rendering layer.

```
[data/]          Static JSON (pre-generated, baked in at build time)
    |
    v
[app.js]         Application state + logic (no framework, module pattern)
    |
    v
[ui/]            DOM renderers — bracket, matchup cards, region tabs
    |
    v
[supabase.js]    Persistence adapter (save/load bracket state)
    |
    v
[Supabase DB]    Remote store for bracket picks (single row per bracket)
```

---

## Component Boundaries

| Component | File(s) | Responsibility | Communicates With |
|-----------|---------|---------------|-------------------|
| **Data Layer** | `data/teams.json`, `data/matchups.json`, `data/bracket.json` | All team stats, matchup analysis, recommendations — pre-generated, read-only | App State (read on init) |
| **App State** | `js/state.js` | In-memory bracket state: which team is picked in each slot, current region view | All UI components (source of truth) |
| **Bracket Renderer** | `js/bracket.js` | Renders full 64-team SVG/HTML bracket, handles click-to-pick, advances winners | App State (reads + writes picks) |
| **Matchup Card** | `js/matchup.js` | Side-by-side analysis panel: metrics, pros/cons, confidence tier, upset/contrarian flags | App State (reads current matchup selection) |
| **Region Tabs** | `js/regions.js` | East/South/Midwest/West tab switching, filters bracket view | Bracket Renderer (triggers re-render) |
| **Persistence Adapter** | `js/supabase.js` | Save bracket picks to Supabase, load on return, generate shareable read-only link | App State (reads full state, writes on load) |
| **Export** | `js/export.js` | PDF/image export via html2canvas + jsPDF | Bracket Renderer (captures DOM node) |
| **Styles** | `css/main.css`, `css/bracket.css` | ESPN-dark sports aesthetic, layout, responsive breakpoints | All components (visual layer) |
| **Entry Point** | `index.html` | Shell HTML, loads CSS, loads JS modules in order, renders skeleton | All |

---

## Data Flow

### Initialization Flow (page load)

```
index.html loads
    -> fetch data/teams.json + data/matchups.json + data/bracket.json (all local, <3s)
    -> state.js hydrates in-memory state with pre-generated data
    -> supabase.js checks for saved bracket (if user ID / URL param present)
        -> if found: merge saved picks into state
        -> if not: state is the clean pre-generated bracket
    -> bracket.js renders full bracket from state
    -> regions.js renders tabs, defaults to East
```

### Pick Selection Flow (user interaction)

```
User clicks team slot in bracket
    -> bracket.js captures click event
    -> state.js updates picks[matchupId] = teamId
    -> bracket.js re-renders affected bracket slots (winner advances)
    -> matchup.js renders analysis card for clicked matchup
    -> (debounced) supabase.js auto-saves state to Supabase
```

### Matchup Analysis Flow

```
User clicks matchup OR bracket.js emits matchup:selected event
    -> matchup.js receives matchupId
    -> reads from state: matchups[matchupId] (pre-generated analysis object)
    -> renders: team A vs team B, metrics, pros/cons, confidence tier, upset flag, contrarian flag
    -> no async calls — all data already in memory
```

### Shareable Link Flow

```
User clicks "Share"
    -> supabase.js saves current state (if not already saved)
    -> generates URL: chalkbuster.github.io?bracket=[uuid]
    -> URL is copied to clipboard
    -> recipient loads URL -> supabase.js fetches bracket by uuid -> renders read-only
```

---

## Data Shape

The JSON data layer is the central design decision. Three files:

### data/teams.json
```json
{
  "teams": {
    "DUKE": {
      "id": "DUKE",
      "name": "Duke",
      "seed": 1,
      "region": "East",
      "record": "30-3",
      "kenpom_rank": 2,
      "sos_rank": 14,
      "adj_offense": 121.4,
      "adj_defense": 88.1,
      "logo_url": "..."
    }
  }
}
```

### data/matchups.json
```json
{
  "matchups": {
    "E1-16": {
      "id": "E1-16",
      "region": "East",
      "round": 1,
      "team_a": "DUKE",
      "team_b": "AMER",
      "recommendation": "DUKE",
      "confidence": "HIGH",
      "reasoning": "Duke's +33 efficiency margin is the largest in the field...",
      "upset_alert": false,
      "contrarian_flag": false,
      "public_pick_pct_a": 97,
      "public_pick_pct_b": 3,
      "win_prob_a": 0.97,
      "win_prob_b": 0.03,
      "pros_a": ["Elite defense ranked #3 KenPom", "Deep tournament experience"],
      "cons_a": ["Slow pace disadvantages in chaos games"],
      "pros_b": ["Upset history at this seed line"],
      "cons_b": ["Schedule strength rank 214"]
    }
  }
}
```

### data/bracket.json
```json
{
  "rounds": ["R64", "R32", "S16", "E8", "F4", "Championship"],
  "slots": {
    "E1-16": { "region": "East", "round": "R64", "position": 1, "team_a_slot": null, "team_b_slot": null }
  }
}
```

---

## Patterns to Follow

### Pattern 1: Module Pattern (no bundler)
**What:** Each JS file is a self-contained ES module, loaded via `<script type="module">` in index.html.
**When:** Plain HTML/JS with no build step. Avoids global namespace collisions.
```html
<script type="module" src="js/state.js"></script>
<script type="module" src="js/bracket.js"></script>
```

### Pattern 2: State as Single Source of Truth
**What:** One `state` object in `state.js` holds all picks. All renderers read from it; none maintain their own state.
**When:** Multiple UI components need to stay in sync (bracket view + matchup card + tab counts).
```javascript
// state.js
export const state = {
  picks: {},          // { [matchupId]: teamId }
  currentRegion: 'East',
  bracketId: null,    // Supabase row ID
};
```

### Pattern 3: Event-Driven UI Updates
**What:** User actions dispatch custom events (matchup:selected, pick:made). Renderers subscribe. No direct cross-component calls.
**When:** Decouples bracket renderer from matchup card — avoids spaghetti.
```javascript
// bracket.js dispatches
document.dispatchEvent(new CustomEvent('matchup:selected', { detail: { matchupId } }));

// matchup.js subscribes
document.addEventListener('matchup:selected', (e) => renderMatchupCard(e.detail.matchupId));
```

### Pattern 4: Pre-generated Data, Never Fetch at Runtime
**What:** All JSON files ship with the repo. data/ is static. No API calls to external services during use.
**When:** This entire app. Removes runtime failure modes, eliminates API key exposure, speeds up interactions.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Shared Mutable State via Global Variables
**What:** Multiple files directly mutating window.picks or similar globals.
**Why bad:** Causes hard-to-track state corruption when bracket picks advance through rounds.
**Instead:** All state mutations go through state.js exported functions. Renderers are pure — they receive data and return DOM.

### Anti-Pattern 2: Re-rendering the Entire Bracket on Every Pick
**What:** Wiping and rebuilding the full 63-slot bracket DOM every time a user picks.
**Why bad:** Causes flicker, loses scroll position, >100ms on slow devices. Especially painful in bracket view.
**Instead:** Targeted DOM updates. Only re-render the specific matchup slot and its downstream winners.

### Anti-Pattern 3: Inline Analysis Data in JS
**What:** Hardcoding team stats and matchup reasoning directly in JavaScript files.
**Why bad:** Makes Tim's "simple edit" use case impossible without editing code. Can't separate data refresh from code.
**Instead:** All data lives in data/*.json. JS only reads it.

### Anti-Pattern 4: Supabase Calls on Every Click
**What:** Saving to Supabase synchronously on every pick selection.
**Why bad:** Creates latency on every pick, burns Supabase free tier quota fast (63 picks = 63 writes).
**Instead:** Debounce saves (500ms after last pick). One upsert call, not 63.

---

## Suggested Build Order (Dependencies)

This order minimizes rework — each layer depends only on things built before it.

```
1. data/           JSON files (teams, matchups, bracket structure)
                   -> Everything depends on this shape being stable

2. js/state.js     In-memory state, no DOM dependencies
                   -> Required by all renderers

3. index.html      Shell, layout skeleton, CSS
   css/main.css    -> Required before any visual component

4. js/bracket.js   Core bracket render + click-to-pick
                   -> Primary UI, most complex component

5. js/regions.js   Tab switching (depends on bracket renderer)

6. js/matchup.js   Analysis card (depends on state + data shape)

7. js/supabase.js  Persistence (depends on state being stable)

8. js/export.js    Export (depends on bracket DOM being stable)
```

**Critical path:** data/ shape -> state.js -> bracket.js. If the JSON schema changes after bracket.js is built, expect rework. Stabilize JSON before writing renderers.

---

## Scalability Considerations

This is a one-time, single-user tool. Scalability is not a concern for MVP. However, if the shareable link feature becomes popular:

| Concern | At 1 user (Tim) | At 15 users (pool) | At 1000 users |
|---------|-----------------|---------------------|---------------|
| GitHub Pages | Free, fine | Free, fine | Free, fine |
| Supabase reads | Negligible | Negligible | Under free tier (50k rows/month) |
| Supabase writes | 63 picks max | 945 picks max | Well under limits |
| Bundle size | <500KB (no framework) | Same | Same |

---

## Sources

- Architecture derived from project constraints in PROJECT.md (plain HTML/CSS/JS, no framework, pre-generated JSON, Supabase, GitHub Pages)
- Module pattern: MDN Web Docs — ES Modules (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- Event-driven pattern: well-established JavaScript DOM pattern
- Supabase static site integration: https://supabase.com/docs/guides/getting-started/quickstarts/vanilla-js
- Confidence: HIGH — constraints eliminate framework/bundler decisions; architecture follows directly from requirements
- WebSearch unavailable at research time; findings based on domain knowledge + project spec analysis
