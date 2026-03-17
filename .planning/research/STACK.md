# Technology Stack

**Project:** ChalkBuster — March Madness Bracket Analysis Tool
**Researched:** 2026-03-17
**Constraint:** Plain HTML/CSS/JS (no framework), Supabase, GitHub Pages

---

## Recommended Stack

### Core Frontend

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| HTML5 | — | Markup | Constraint from PROJECT.md; fastest to ship, zero build tooling |
| CSS3 (custom properties) | — | Styling | CSS variables for ESPN-color theming; no preprocessor needed for this scope |
| Vanilla JavaScript (ES2022 modules) | — | Logic and UI | Constraint from PROJECT.md; bracket state, picks, and filtering are simple DOM operations |

**No framework (React/Vue/Svelte) is intentional and correct here.** The app is ~5 HTML views, static JSON data, and bracket click logic. A framework adds a build step, deployment complexity, and saves nothing on a 48-hour deadline.

Use native ES modules (`<script type="module">`) for code organization without a bundler. All modern browsers and GitHub Pages support this natively.

---

### Backend / Persistence

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Supabase JS client | 2.99.2 | Database reads/writes, share-link data | Latest stable as of 2026-03-17; v2 API is stable and well-documented |
| Supabase Postgres (hosted) | managed | Store bracket state (picks, metadata) | Free tier is sufficient; row-level security enables public read for share links |
| Supabase anon key | — | Client authentication | Public anon key scoped to SELECT on bracket table is the correct pattern for shareable read-only links |

**CDN include (no bundler needed):**
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.99.2/dist/umd/supabase.min.js"></script>
```

**Confidence: HIGH** — version 2.99.2 confirmed via CDN content inspection on 2026-03-17. GitHub releases show v2.99.2 released 2026-03-16.

**Supabase schema pattern for this app:**
- One `brackets` table: `id` (uuid), `owner_name` (text), `picks` (jsonb), `created_at`, `updated_at`
- RLS policy: `anon` role can SELECT (public share links work without login); authenticated or service role for INSERT/UPDATE
- No auth for Tim — use a hardcoded UUID as "Tim's bracket ID" stored in localStorage; no login screen needed for MVP

---

### Export (PDF / Image)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| html-to-image | 1.11.13 | Capture bracket DOM as PNG | Actively maintained (last release Feb 2025); replaces abandoned html2canvas |
| jsPDF | 4.2.1 | Wrap PNG into PDF for download | Latest stable as of 2026-03-17; security patches current |

**Do NOT use html2canvas.** It has not had a meaningful release since January 2022, carries 970+ open issues, and is effectively unmaintained. html-to-image is the community-accepted successor, actively maintained with 7.1k stars.

**CDN includes:**
```html
<!-- html-to-image via ESM CDN -->
<script type="module">
  import * as htmlToImage from 'https://esm.sh/html-to-image@1.11.13';
</script>

<!-- jsPDF UMD bundle -->
<script src="https://cdn.jsdelivr.net/npm/jspdf@4.2.1/dist/jspdf.umd.min.js"></script>
```

**Confidence: MEDIUM** — html-to-image version confirmed via GitHub releases (Feb 2025). jsPDF v4.2.1 confirmed via GitHub releases (March 17, 2026). CDN URL patterns are standard jsDelivr/esm.sh conventions; verify at build time.

---

### Data Visualization (Matchup Analysis Cards)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Chart.js | 4.5.1 | Win probability bar charts in matchup cards | Lightweight, no dependencies, renders via Canvas, CDN-friendly |

Use only for matchup analysis cards — one horizontal bar chart per matchup showing win probability. Do not use for the bracket structure itself (pure CSS/HTML is better for bracket lines and pick-click interactions).

**CDN include:**
```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.5.1/dist/chart.umd.min.js"></script>
```

**Confidence: HIGH** — version confirmed via GitHub releases (October 2024). v4 API is stable with no major breaking changes expected.

**Alternative considered:** D3.js — overkill for simple bar charts; adds 500KB and significant API complexity for what amounts to two-bar comparisons. Skip it.

---

### Hosting

| Technology | Purpose | Why |
|------------|---------|-----|
| GitHub Pages | Static frontend hosting | Constraint from PROJECT.md; free, instant deploy on push to main, shareable username.github.io/repo URL |

No Jekyll, no GitHub Actions workflow needed. Push `index.html` to `main` (or `gh-pages` branch) and enable Pages in repo settings.

**Deploy workflow:**
1. Tim creates new repo (e.g., `chalkbuster-2026`)
2. Enable GitHub Pages — source: `main` branch, root `/`
3. `git push` = live update, typically under 60 seconds

---

### Local Development

| Tool | Purpose | Why |
|------|---------|-----|
| `python3 -m http.server` or VS Code Live Server | Local dev server | ES modules require a server context (not `file://`); no install needed |

No Node.js, no npm, no build step. This is intentional. Zero tooling overhead is the right tradeoff for the 48-hour deadline.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Frontend framework | Vanilla JS | React/Vue/Svelte | Build tooling adds complexity; 48h deadline; app is simple enough without it |
| Bracket rendering | Custom CSS/HTML | jquery-bracket, bracketify | External dependencies for core UI; custom CSS gives full ESPN aesthetic control |
| Charts | Chart.js 4.5.1 | D3.js | D3 is 500KB and requires significant API knowledge for basic two-value bar charts |
| Screenshot/export | html-to-image 1.11.13 | html2canvas | html2canvas abandoned (last meaningful release Jan 2022, 970+ open issues) |
| PDF | jsPDF 4.2.1 | Browser print dialog | Print dialog cannot control output format; jsPDF gives predictable bracket layout |
| Auth | None (localStorage UUID) | Supabase Auth | Tim is the only writer; full auth login flow is over-engineering for MVP deadline |
| Hosting | GitHub Pages | Netlify, Vercel | Explicit constraint; also simpler for a single static repo with no build step |

---

## CDN Load Order

Place before `</body>` in this order to avoid dependency conflicts:

```html
<!-- 1. Supabase (UMD global: window.supabase) -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.99.2/dist/umd/supabase.min.js"></script>

<!-- 2. Chart.js (UMD global: window.Chart) -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.5.1/dist/chart.umd.min.js"></script>

<!-- 3. jsPDF (UMD global: window.jspdf) -->
<script src="https://cdn.jsdelivr.net/npm/jspdf@4.2.1/dist/jspdf.umd.min.js"></script>

<!-- 4. App entry point (imports html-to-image via ESM internally) -->
<script type="module" src="./js/app.js"></script>
```

Inside `app.js` (or a dedicated `export.js` module):
```javascript
import { toPng } from 'https://esm.sh/html-to-image@1.11.13';
```

---

## Data Layer Architecture (No Runtime AI)

All team data and matchup analysis is baked into the app as static JSON files:

```
/data/
  teams.json           — 68 teams with stats (KenPom, record, SOS, seed, public pick %)
  matchups.json        — All R1 matchups with pre-generated analysis
  recommendations.json — Confidence tiers, pros/cons, reasoning per matchup
```

These files are generated by Claude once, committed to the repo, and read at runtime via `fetch('./data/teams.json')`. No API calls at runtime. No secrets in frontend code (Supabase anon key is intentionally public-facing by design).

**This is the correct pattern for the deadline.** Pre-generation means zero latency on matchup cards, zero API costs, and zero risk of rate limits during bracket deadline crunch.

---

## Sources

- Supabase JS v2.99.2 confirmed: https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js (inspected 2026-03-17)
- Supabase release history: https://github.com/supabase/supabase-js/releases (v2.99.2 released 2026-03-16)
- Supabase RLS anon pattern: https://supabase.com/docs/guides/auth/row-level-security (anon SELECT policy confirmed)
- jsPDF v4.2.1: https://github.com/parallax/jsPDF/releases (released 2026-03-17)
- html-to-image v1.11.13: https://github.com/bubkoo/html-to-image/releases (released Feb 2025)
- html2canvas abandonment assessment: https://github.com/niklasvh/html2canvas (970+ open issues, last release Jan 2022 per GitHub releases page)
- Chart.js v4.5.1: https://github.com/chartjs/Chart.js/releases (released Oct 2024)
- GitHub Pages capabilities: https://pages.github.com (static hosting confirmed, no recent constraint changes)
