---
phase: 02
slug: analysis-layer
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Browser console (js/validate.js) + manual visual |
| **Config file** | none — plain HTML/JS project |
| **Quick run command** | `open http://localhost:8000 && echo "check console"` |
| **Full suite command** | `node -e "import('./js/validate.js')"` (ESM — run in browser console) |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Open browser, check console for errors
- **After every plan wave:** Run full validate.js suite in browser console
- **Before `/gsd:verify-work`:** Full suite must be green + visual checks
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | ANAL-01 | data integrity | jq check teams.json | yes | pending |
| 02-01-02 | 01 | 1 | ANAL-02,03,04,05,06 | data integrity | jq check matchups.json | no W0 | pending |
| 02-02-01 | 02 | 2 | ANAL-01 | visual | Open matchup card | no W0 | pending |
| 02-02-02 | 02 | 2 | ANAL-02,03 | visual | Check tiers and pros/cons | no W0 | pending |
| 02-02-03 | 02 | 2 | ANAL-04,05 | visual | Check flags | no W0 | pending |

---

## Wave 0 Requirements

- data/matchups.json — 63 matchup analysis records
- Team stats populated in data/teams.json

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Matchup card stats | ANAL-01 | Visual layout | Click matchup, verify stats |
| Confidence tier | ANAL-02 | Visual + content | Verify tier badge + reasoning |
| Pros/cons | ANAL-03 | Content count | Count bullets |
| Upset alert | ANAL-04 | Visual styling | Find upset, verify badge |
| Contrarian flag | ANAL-05 | Visual styling | Find contrarian, verify flag |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity maintained
- [ ] Wave 0 covers all MISSING references
- [ ] Feedback latency < 10s
- [ ] nyquist_compliant: true set in frontmatter

Approval: pending
