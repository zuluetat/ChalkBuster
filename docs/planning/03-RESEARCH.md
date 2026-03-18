# Phase 3: Persistence and Sharing - Research

**Researched:** 2026-03-18
**Domain:** Supabase REST API (no SDK), localStorage fallback, URL-based share tokens, read-only UI mode, unverified data labeling
**Confidence:** HIGH — Supabase project already live, code already written; research is primarily an integration audit

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PERS-01 | Save bracket picks to Supabase | supabase.js already implements `savePicks()` and `createBracket()`/`updateBracket()`. Table `brackets` is live. Wire to `state.setOnPicksChanged` in app.js. |
| PERS-02 | Load picks on return visit | `loadBracket()` already exists and is called in `app.js init()`. Falls back to localStorage. Bracket ID stored in localStorage key `chalkbuster-bracket-id`. |
| PERS-03 | Reset region and reset all functions | `resetAllPicks()` and `resetRegionPicks(region)` already exist in state.js. `resetBracket()` (Supabase DELETE) exists in supabase.js. UI Reset All button wired in app.js. Region-reset button NOT yet wired in UI — this is the work remaining. |
| SHAR-01 | Shareable public URL for friends to view picks (read-only) | `getShareURL()` and `loadSharedBracket()` already implemented. Share button in toolbar calls `getShareURL()` and copies to clipboard. URL pattern: `?share=<token>`. |
| SHAR-02 | Clear indicator that viewer cannot edit | `state.readOnly = true` is set on share load. Toolbar renders "Viewing shared bracket (read-only)" banner. `setPick()` guards against edits when `readOnly = true`. |
| DINT-03 | Unverified fields labeled "Estimate" or "Unverified" in UI | `kenpom_adjEM`, `kenpom_adjO_rank`, `kenpom_adjD_rank` exist in matchups.json metrics but are NOT rendered in the analysis card (Phase 2 already switched to SRS-based display). `last_10` values are literally "UNVERIFIED" strings, suppressed to "—" by `fmtMetric()`. `win_prob` drives `upset_alert` flag but is not shown as a number. Minimum work: add one data disclaimer note to the analysis card. |
</phase_requirements>

---

## Summary

Phase 3 is unusually far along before work begins. The Supabase project is already created, credentials are in supabase.js, and the `brackets` table is live with real data (8 rows confirmed via live API call). The JavaScript modules for save, load, reset, and share are already written and partially wired into app.js. What remains is closing a small set of integration gaps.

The two plans are correctly scoped: **03-01** handles the Supabase configuration audit (verify CORS for GitHub Pages, confirm share_token auto-generation), and **03-02** handles the remaining implementation gaps — primarily the per-region reset UI button, the share-token UX polish, and DINT-03 unverified field labeling.

**Primary recommendation:** This phase is mostly verification + targeted additions, not greenfield. Both plans should complete quickly. Given the March 19 deadline, prioritize: (1) CORS verification, (2) region reset UI button, (3) DINT-03 disclaimer note. Everything else is already working.

---

## Current State Audit (CRITICAL — Read Before Planning)

This is an existing codebase. The following is already done vs. what remains:

### Already Implemented (DO NOT RE-IMPLEMENT)
| Feature | Where | Status |
|---------|-------|--------|
| Supabase project created | supabase.js lines 5-6 | Live, confirmed reachable via API |
| `brackets` table schema: `id`, `share_token`, `picks`, `created_at`, `updated_at` | Supabase (verified via REST API) | Live with real data |
| `savePicks(picks)` — create or update | supabase.js:117 | Implemented |
| `loadBracket()` — load own bracket by localStorage ID | supabase.js:66 | Implemented |
| `loadSharedBracket(token)` — load by share_token | supabase.js:47 | Implemented |
| `resetBracket()` — DELETE from Supabase + clear localStorage | supabase.js:133 | Implemented |
| `getShareURL()` — returns `?share=<token>` URL | supabase.js:153 | Implemented |
| `getSharedToken()` — reads `?share=` from URL | supabase.js:38 | Implemented |
| App init: checks share token, loads shared or own bracket | app.js:370-396 | Implemented |
| Auto-save wired: `setOnPicksChanged(() => savePicks(picks))` | app.js:395 | Implemented |
| 500ms debounce on picks change triggers Supabase save | state.js:24-30 | Implemented |
| Share button in toolbar (copies URL to clipboard) | app.js:227-241 | Implemented |
| Reset All button in toolbar | app.js:243-251 | Implemented |
| Read-only banner in toolbar | app.js:198-208 | Implemented |
| `state.readOnly` guard in `setPick()` | state.js:36 | Implemented |
| localStorage fallback for picks | state.js:60-81 | Implemented |

### Gaps That MUST Be Addressed
| Gap | File | What to Do |
|-----|------|-----------|
| Region reset button not in UI | app.js `renderToolbar()` | Add per-region reset controls |
| DINT-03: `win_prob` drives `upset_alert` flag without disclosure | analysis.js `buildCardHTML()` | Add brief data disclaimer note to card |
| DINT-03: `last_10` silently shows "—" | analysis.js `fmtMetric()` | Either keep "—" and mention in disclaimer, or show "UNVERIFIED" label |
| CORS origin for GitHub Pages | Supabase dashboard | Add `https://zuluetat.github.io` to allowed origins |

### Supabase Table State (VERIFIED 2026-03-18)
```
Table: brackets
Columns: id (uuid), share_token (text), picks (jsonb), created_at (timestamptz), updated_at (timestamptz)
RLS: NONE — all rows readable by anon key (intentional for single-user app)
Row count: 8 (from prior testing)
Sample row: { id: "78302fb8...", share_token: "1f013760", picks: { "E1": "DUKE" } }
```

The anon key is exposed in source code. This is acceptable — it is a public read/write key for a personal tool with no sensitive data.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase REST API | Direct (no SDK) | Persist picks, share tokens | Already in use; no SDK needed for 2-table CRUD on static site |
| localStorage | Browser built-in | Bracket ID + share token cache | Already in use as backup identity store |
| URLSearchParams | Browser built-in | Read `?share=` param | Already in use |
| navigator.clipboard | Browser built-in | Copy share URL to clipboard | Already in use with prompt() fallback |

### No New Dependencies Required
Phase 3 requires zero new npm packages or CDN imports. All needed browser APIs are already present in the codebase.

---

## Architecture Patterns

### Pattern 1: Device Identity via localStorage
The app uses `chalkbuster-bracket-id` in localStorage as the device's identifier. There is no user account. This means:
- Same device = same bracket (correct behavior)
- New device = new empty bracket (expected)
- Cleared localStorage = bracket orphaned in Supabase (acceptable for MVP)

```javascript
// supabase.js — existing pattern
function getLocalBracketId() {
  return localStorage.getItem("chalkbuster-bracket-id");
}
```

### Pattern 2: Share Token as URL Param
Share tokens are 8-character hex strings (e.g., `1f013760`), server-generated by Supabase's DB default. The URL pattern `?share=<token>` already works end-to-end in app.js and supabase.js. No changes needed to the URL scheme.

### Pattern 3: Read-Only Mode Enforcement
`state.readOnly = true` is set when a share token is detected in the URL. All edit paths (`setPick`) check this flag and return early. The toolbar renders a different view for read-only. The "Make your own" button redirects to `window.location.pathname` (strips query params).

### Pattern 4: Debounced Auto-Save
Picks are saved 500ms after the last change via the `debouncedSave` function in state.js. This prevents hammering the API during rapid picking. The `setOnPicksChanged()` callback hooks into this debounce.

### Pattern 5: Region Reset UI Placement
The cleanest placement for a per-region reset is a small button in the active region's bracket header (rendered in bracket.js or regions.js). It should be clearly labeled (e.g., "Reset East") and only visible in edit mode (not read-only).

```javascript
// New code needed in bracket.js or regions.js
function renderRegionHeader(region) {
  if (state.readOnly) return `<div class="region-header">${region}</div>`;
  return `
    <div class="region-header">
      <span class="region-name">${region}</span>
      <button class="reset-region-btn" data-region="${region}">Reset ${region}</button>
    </div>
  `;
}
```

### Pattern 6: DINT-03 Minimum Viable Labeling
KenPom fields (`kenpom_adjEM`, `kenpom_adjO_rank`, `kenpom_adjD_rank`) are NOT rendered in the analysis card — Phase 2 already switched to SRS-based primary metrics. The remaining unverified surfaces are:

1. `last_10` — rendered but shows "—" when value is "UNVERIFIED" (field is suppressed, not labeled)
2. `win_prob` — used as binary trigger for `upset_alert` flag; the probability number is not shown
3. The `upset_alert` and `contrarian` flags derived from these estimates

Minimum viable approach for DINT-03: add a single disclaimer paragraph at the bottom of the analysis card:

```javascript
// In analysis.js buildCardHTML() — append to card footer
const dataDisclaimer = `
  <p class="data-disclaimer">
    * Win probability and momentum estimates are model-generated,
    not sourced from a sportsbook or official model.
  </p>
`;
```

### Anti-Patterns to Avoid
- **Do not add auth:** No login, no user accounts. The device-ID localStorage pattern is intentional.
- **Do not install Supabase SDK:** The direct REST API calls already work. The SDK adds ~200KB+ bundle size for no benefit on a static site.
- **Do not add `bracket_name` column to Supabase:** The name is stored in localStorage and only relevant to the bracket owner. Shared views don't need it. Adding a DB migration wastes time.
- **Do not use a complex sharing scheme:** 8-char hex tokens and `?share=` URL params are sufficient for "send link to friend" sharing.
- **Do not block the UI on Supabase calls:** All supabase calls are fire-and-forget with `console.warn` on failure. localStorage is the backup. This pattern is correct.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Share token generation | UUID or random string client-side | Supabase DB default (already works, server-generated) | Already in place; client-side generation risks collisions without proper entropy |
| URL state management | History API / SPA routing | Simple `?share=` query param (already works) | GitHub Pages has no server routing; query params are the reliable approach |
| Optimistic UI + sync | Complex local-state reconciliation | Debounced save + localStorage backup (already in state.js) | 500ms debounce is sufficient for single-user bracket picking |
| Copy-to-clipboard UX | Custom clipboard implementation | `navigator.clipboard.writeText()` with `prompt()` fallback (already implemented) | Cross-browser, already handles the non-HTTPS fallback |

---

## Common Pitfalls

### Pitfall 1: CORS Failure on GitHub Pages (HIGH RISK)
**What goes wrong:** All Supabase REST calls silently fail when accessed from `https://zuluetat.github.io`. Picks appear to save (localStorage backup works) but do not persist to Supabase.
**Why it happens:** Supabase projects require authorized origins. The GitHub Pages URL may not be in the allowed list.
**How to avoid:** In Supabase dashboard > Project Settings > API: add `https://zuluetat.github.io` (and optionally `http://localhost:8000` for local dev). This MUST be done in plan 03-01.
**Warning signs:** All `console.warn("[ChalkBuster] Failed...")` messages in production; picks lost when localStorage is cleared.

### Pitfall 2: Share Token Not Available Before First Save
**What goes wrong:** User clicks Share on a fresh empty bracket — `getLocalShareToken()` returns null, the share button's `savePicks({})` creates a row, but if the table requires `picks` to be non-empty, it may error.
**Why it happens:** `share_token` is generated server-side on first POST. No row = no token.
**How to avoid:** The existing handler calls `await savePicks(state.picks)` before checking the token, even if picks is `{}`. Verify the Supabase `brackets` table accepts empty `picks` objects.
**Warning signs:** Share button silently fails or shows null URL on fresh brackets.

### Pitfall 3: Region Reset Over-Clears Final Four Picks
**What goes wrong:** `resetRegionPicks(region)` in state.js (lines 103-110) deletes ALL Final Four and Championship picks blindly, regardless of whether the picked team came from the reset region.
**Why it happens:** The current implementation checks `if (state.picks[s.id])` for every FinalFour/Championship slot, not just ones populated by teams from the target region.
**How to avoid:** This is acceptable for MVP — slightly aggressive is better than stale. Document the behavior so Tim knows resetting East may also clear his Final Four picks if he has any FF/Championship picks entered.
**Warning signs:** User resets one region and loses all Final Four picks, not just the affected ones.

### Pitfall 4: Clipboard API Unavailable in HTTP/Localhost
**What goes wrong:** `navigator.clipboard.writeText()` throws in non-HTTPS contexts.
**Why it happens:** Clipboard API requires secure context.
**How to avoid:** The existing code has a `prompt()` fallback. Already handled.

### Pitfall 5: DINT-03 Scope Creep
**What goes wrong:** Trying to comprehensively label every unverified field individually adds visual noise and takes too long.
**Why it happens:** DINT-03 says "clearly labeled" but does not specify granularity.
**How to avoid:** One paragraph disclaimer at the bottom of the analysis card satisfies the requirement. Do not add per-metric "Unverified" badges to individual rows — the card already uses SR-verified data as primary metrics.

---

## Code Examples

### Existing: Auto-Save Wire-Up (already in app.js:395)
```javascript
// Already implemented — do not change
setOnPicksChanged((picks) => savePicks(picks));
```

### Existing: Share Button Handler (app.js:227-241)
```javascript
// Already implemented — verify this works with empty picks
document.getElementById("btn-share").addEventListener("click", async () => {
  if (!getLocalShareToken()) {
    await savePicks(state.picks); // creates row, generates share_token
  }
  const url = getShareURL();
  if (!url) return;
  try {
    await navigator.clipboard.writeText(url);
    showToast("Share link copied!");
  } catch {
    prompt("Copy this link to share your bracket:", url);
  }
});
```

### New: Region Reset Button in Toolbar (03-02 work)
```javascript
// In app.js renderToolbar() — add to non-readOnly toolbar HTML
// Option A: Per-region reset button appears contextually per active region
toolbar.innerHTML = `
  <button id="btn-export" class="toolbar-btn">Export</button>
  <button id="btn-reset-region" class="toolbar-btn toolbar-btn--secondary">
    Reset ${state.activeRegion}
  </button>
  <button id="btn-share" class="toolbar-btn toolbar-btn--primary">Share</button>
  <button id="btn-reset" class="toolbar-btn toolbar-btn--danger">Reset All</button>
`;

document.getElementById("btn-reset-region").addEventListener("click", () => {
  if (!confirm(`Reset all ${state.activeRegion} picks?`)) return;
  resetRegionPicks(state.activeRegion);
  renderBracket();
  showToast(`${state.activeRegion} picks reset`);
});
```

### New: DINT-03 Disclaimer in Analysis Card (03-02 work)
```javascript
// In analysis.js buildCardHTML() — append to return template
// Add just before the closing of the card:
`<p class="data-disclaimer">
  * Upset alerts and contrarian flags are based on model-estimated win probabilities,
  not official sportsbook lines. Last-10 records are unverified.
</p>`
```

### Existing: Read-Only Mode (app.js:198-208)
```javascript
// Already implemented — no changes needed
if (state.readOnly) {
  toolbar.innerHTML = `
    <span class="toolbar-label">Viewing shared bracket (read-only)</span>
    <button id="btn-own" class="toolbar-btn">Make your own</button>
  `;
  document.getElementById("btn-own").addEventListener("click", () => {
    window.location.href = window.location.pathname;
  });
  return;
}
```

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|------------------|-------|
| Supabase SDK (`@supabase/supabase-js`) | Direct REST API fetch calls | SDK unnecessary for simple CRUD on static site — already done correctly |
| Auth-based persistence (JWT/OAuth) | localStorage device ID | No auth needed for single-user tool |
| Complex sharing (expiring tokens, auth guards) | 8-char hex token + `?share=` URL param | Sufficient for "send link to friend" use case |
| Server-rendered read-only view | Client-side `state.readOnly = true` | Correct for GitHub Pages SPA |

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None — browser console only |
| Config file | None |
| Quick run command | Browser DevTools: `import('./js/validate.js').then(m => m.validateBracketSlotGraph(state))` |
| Full suite command | Same — no automated test runner exists |

No Jest, Vitest, or Mocha setup. The existing `validate.js` is a browser-console bracket-graph integrity checker. Phase 3 verification is manual browser testing.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Method |
|--------|----------|-----------|--------|
| PERS-01 | Picks save to Supabase on pick change | Manual | Make a pick, wait 1s, check Network tab — expect PATCH to Supabase API |
| PERS-02 | Picks reload on return visit | Manual | Make picks, close tab, reopen — picks must be present without re-picking |
| PERS-03 | Reset region clears only that region | Manual | Fill bracket, click Reset East, verify East clear, other regions intact |
| PERS-03 | Reset all clears everything | Manual | Fill bracket, click Reset All, confirm dialog, verify all picks gone |
| SHAR-01 | Share URL copies to clipboard | Manual | Click Share, paste URL into incognito window — verify picks appear |
| SHAR-02 | Read-only banner visible in shared view | Manual | Open share URL — verify "read-only" banner visible, clicks do not change picks |
| DINT-03 | Unverified estimate disclaimer visible | Manual visual | Open any analysis card — verify disclaimer text present |

### Wave 0 Gaps
None — no test framework installation needed. All verification is manual browser testing as above.

---

## Open Questions

1. **CORS configuration status for GitHub Pages**
   - What we know: Supabase project is live at `osayanpbjyndsnyxdwzh.supabase.co`. Local dev works.
   - What's unclear: Whether `https://zuluetat.github.io` has been added to Supabase's allowed origins.
   - Recommendation: Plan 03-01 must include explicit step: open Supabase dashboard > Settings > API > add GitHub Pages URL. This is the #1 blocker for production.

2. **share_token auto-generation mechanism**
   - What we know: The existing row shows `share_token: "1f013760"`. The `createBracket()` function expects it returned in the POST response.
   - What's unclear: Whether the column has a DB-level default that generates the token, or if it requires a trigger.
   - Recommendation: Plan 03-01 must verify the column default via Supabase dashboard > Table Editor > `brackets` > column definition. The fact that existing rows have values is a good sign but not a guarantee the default is still active.

3. **Region reset label when on Final Four tab**
   - What we know: The toolbar renders a "Reset [activeRegion]" button. When `state.activeRegion` is "FinalFour", the button would say "Reset FinalFour".
   - What's unclear: Whether region reset should be disabled on the Final Four tab (no region-specific slots there).
   - Recommendation: Disable the region reset button or hide it when `state.activeRegion === "FinalFour"` — or show "Reset Final Four" and call `resetRegionPicks("FinalFour")` which will clear those slots.

---

## Sources

### Primary (HIGH confidence)
- Live Supabase API — `GET /rest/v1/brackets` returned HTTP 200, confirmed schema columns, confirmed existing row data
- Direct code reading: `/Users/tzulueta/ChalkBuster/js/supabase.js`, `state.js`, `app.js`, `analysis.js`
- `/Users/tzulueta/ChalkBuster/data/matchups.json` — confirmed unverified field presence and values via `node -e` inspection
- `/Users/tzulueta/ChalkBuster/data/teams.json` — confirmed `kenpom_adjEM_status: "UNVERIFIED — use srs_proxy_adjEM..."` field

### Secondary (MEDIUM confidence)
- Supabase CORS configuration behavior — standard documented behavior, not tested against GitHub Pages origin yet

---

## Metadata

**Confidence breakdown:**
- Supabase integration status: HIGH — live API confirmed, existing code verified by inspection
- Architecture patterns: HIGH — code already written, patterns directly observed
- DINT-03 scope: HIGH — matchups.json inspected, which fields are rendered confirmed via code reading (KenPom fields are NOT in the card render path)
- Region reset gap: HIGH — toolbar code inspected, no region reset button found
- CORS pitfall: MEDIUM — standard Supabase behavior, GitHub Pages origin not verified yet

**Research date:** 2026-03-18
**Valid until:** 2026-03-19 (project deadline tomorrow morning)
