---
title: Polish the management leaderboard
type: feature
created: 2026-10-14
status: done
route: one-shot
baseline_commit: db688ee
---

# Polish the management leaderboard

## Intent

**Problem:** User finds the management leaderboard awkward: repeated headings, separate sparse frames and a large blank unavailable panel.

**Approach:** Redesign only the ranking body into one cream/brown card. Use a trophy, compact heading, top-three medals, evenly spaced row cards, green personal highlight, a distinct personal-rank strip and illustrated loading/empty/unavailable states. Keep five rows per page, real cash/day/rank, existing header/navigation, action IDs/hit bounds and day-opening footer. No animation or fake players added; backend setup remains pending.

## Verification / Completion Notes

Completed 2026-10-14. Production build/typecheck and four focused Chromium360×640 cases passed across runs: populated preparation/end-day with pagination/refresh, unavailable/no-port with day opening, and saved tutorial advancement. Populated and unavailable screenshots visually checked. One independent UI review identified misleading unranked text while loading; neutral/loading personal-rank copy now distinguishes an unavailable rank from a confirmed absent rank. Rendering/data/action/lifecycle boundaries remain unchanged.

## Suggested Review Order

- One body card, trophy, medal rows and truthful state presentation.
  [ReferenceLeaderboard.ts:11](../../src/presentation/ReferenceLeaderboard.ts#L11)
- Preserve ranking interactions and capture both populated and unavailable states.
  [leaderboard-tab.spec.ts:32](../../tests/leaderboard-tab.spec.ts#L32)
