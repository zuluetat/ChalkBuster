---
status: complete
phase: 03-persistence-and-sharing
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md]
started: 2026-03-18T15:10:00Z
updated: 2026-03-18T15:35:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Save Picks to Supabase
expected: Make a pick in any R64 matchup. Network tab shows a Supabase request with picks data. No console errors.
result: pass

### 2. Load Picks on Return
expected: After making picks, close the browser tab completely. Reopen the app. Your previous picks should appear exactly as you left them.
result: pass

### 3. Share Link (Copy + Open)
expected: Click Share button. Toast says "Share link copied!". Open URL in incognito. Picks appear in read-only mode.
result: pass

### 4. Read-Only Indicator
expected: Shared view shows "Viewing shared bracket (read-only)" and "Make your own" button. No edit controls.
result: pass

### 5. Reset All Picks
expected: Click Reset All, confirm dialog, all picks cleared.
result: pass

### 6. Per-Region Reset Button
expected: Select region tab, amber reset button appears with region name. Only that region's picks cleared.
result: pass

### 7. Region Reset Hidden on Final Four
expected: Final Four tab does not show per-region reset button.
result: pass

### 8. Data Disclaimer on Analysis Card
expected: Analysis card shows italic disclaimer about model-estimated win probabilities and unverified last-10 records.
result: pass

## Summary

total: 8
passed: 8
issues: 0
pending: 0
skipped: 0

## Gaps

[none]
