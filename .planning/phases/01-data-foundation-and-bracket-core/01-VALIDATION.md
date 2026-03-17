---
phase: 1
slug: data-foundation-and-bracket-core
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual browser testing (no test framework — plain HTML/CSS/JS MVP) |
| **Config file** | none |
| **Quick run command** | `open index.html` (browser check) |
| **Full suite command** | `node -e "const d=require('./data/teams.json'); console.log(d.length + ' teams loaded')"` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Open index.html in browser, verify no console errors
- **After every plan wave:** Verify all success criteria manually
- **Before `/gsd:verify-work`:** Full manual walkthrough of all 5 success criteria
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | DATA-01 | data | `node -e "const d=require('./data/teams.json');console.log(d.length)"` outputs 68 | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | DATA-02,03 | data | `node -e "const d=require('./data/teams.json');console.log(d.every(t=>t.public_pick_pct!==undefined))"` outputs true | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | DATA-04,05 | data | `node -e "const d=require('./data/first_four.json');console.log(d.length)"` outputs 4 | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 2 | BRKT-01 | manual | Click team in R64 → advances to R32 | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 2 | BRKT-02 | manual | Region tabs switch visible section | ❌ W0 | ⬜ pending |
| 01-02-03 | 02 | 2 | BRKT-03,04 | manual | Selected team highlights, re-click clears downstream | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 2 | BRKT-05,06 | manual | First Four view shows matchups, toggle resolves winners | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `data/teams.json` — all 68 teams with required fields
- [ ] `data/matchups.json` — 63-game slot structure
- [ ] `data/first_four.json` — 4 First Four games with resolution status

*Existing infrastructure: none — greenfield project*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Click-to-pick bracket advancement | BRKT-01 | Visual UI interaction | Click any team → verify it appears in next round slot |
| Downstream pick clearing | BRKT-04 | Stateful UI interaction | Pick Team A in R64, then pick through to S16. Re-pick Team B in R64 → all downstream clears |
| Region tab switching | BRKT-02 | Visual layout check | Click each tab → correct region bracket appears |
| First Four resolve toggle | BRKT-06 | Manual toggle UI | Toggle First Four game as resolved → winner slots into main bracket |
| ESPN aesthetic | N/A (Phase 4) | Visual design | Not validated in Phase 1 |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
