---
title: Align leaderboard and player name popup headings
type: bugfix
created: 2026-10-14
status: done
route: one-shot
---

# Align leaderboard and player name popup headings

## Intent

**Problem:** Both popup headings used a top text anchor at the banner's center, placing the words too low and across the lower border.

**Approach:** Center the two heading labels vertically at the existing title banner center. Keep frame, body, controls, native name editor, keyboard offset and online score behavior unchanged.

## Suggested Review Order

- Center the leaderboard title within its art banner.
  [LeaderboardPanel.ts](../../src/presentation/LeaderboardPanel.ts#L14)
- Center the name title while preserving the shared keyboard translation.
  [PlayerNamePanel.ts](../../src/presentation/PlayerNamePanel.ts#L49)

## Verification

Build/typecheck and two focused Chromium360×640 tests passed (leaderboard pagination/refresh, name popup keyboard/resize). Inspected both screenshots: headings now center inside the decorative title banner. Independent focused review found no actionable issues. Proof: ui-baseline/ranking-popup-heading-alignment-2026-10-14. Fixture leaderboard rows are test data only.
