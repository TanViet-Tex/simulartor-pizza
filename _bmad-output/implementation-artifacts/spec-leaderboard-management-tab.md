---
title: Replace management Missions tab with Leaderboard
type: feature
created: 2026-10-14
status: done
baseline_commit: d2bbec3
context: []
---

## Intent

User requests the fifth management tab become Bảng xếp hạng. Replace its name/title/content with the existing shared online ranking data (name, cash, day, personal rank). Keep all other tabs, existing button bounds/art, selection/press motion, body transform and existing day-opening footer. Keep the menu leaderboard entry as another access point. Supabase remains pending setup; show a clear unavailable message, never fake competitor rows.

## Boundaries

Keep internal `missions` tab and tutorial IDs for compatibility with saved tutorial indices and existing navigation motion; the visible tab is now Xếp hạng (full body title Bảng xếp hạng). Update tutorial wording for this tab, preserve indices and auto-awarded mission/reward gameplay. Do not delete mission rules or modify save schema. Do not display the old mission cards. Network remains outside gameplay/save pause ownership.

## Code Map / Tasks

- [x] `src/presentation/HubHeader.ts` — fifth tab label fits existing 63px tile, same icon/colors/motion.
- [x] `src/presentation/ReferenceLeaderboard.ts` — ranking body in existing management content area, shared port, pagination/personal row/refresh, states and unchanged footer.
- [x] `src/scenes/CozyScene.ts` — optional final constructor leaderboard port, subscribe/cleanup, refresh only on selecting fifth tab, render ranking instead of missions.
- [x] `src/main.ts` — pass the existing menu leaderboard port to the normal campaign scene.
- [x] `src/config/interactiveTutorial.ts` — truthful ranking introduction, stable old indices/IDs.
- [x] Focused E2E for preparation and end-day tab, async data/unconfigured/refresh, other tab motion and tutorial step.
- [x] Record outcome/context/UI baseline and local commit.

## Acceptance

- Given preparation or end-day management, selecting fifth tab displays Bảng xếp hạng and name/cash/day ranking data, with personal row and refresh.
- Given missing backend, selecting it displays unavailable state with no fake data and still allows using other tabs and opening the day.
- Given the tutorial reaches the fifth tab, the introduction describes rankings, Next advances without breaking saved tutorial indices.
- Selection keeps the whole tile pale yellow, unchanged icon brightness, 150ms selection and120ms press, with reduced motion respected.

## Verification

Build/typecheck, focused ranking hub E2E and existing navigation motion unit tests. Inspect rank/preparation screenshots. Live database still needs existing deployment setup; no backend changes here.

## Completion Notes

Implementation complete. Build/typecheck and 31 focused unit tests passed. Fifth-tab preparation/end-day data, refresh, pagination, no-port/unconfigured and restored tutorial checks passed; navigation animation/icon/hit-bounds check passed. Full tutorial and final reload/Continue check passed. Total six focused Chromium360×640 E2E cases passed across focused runs. Three independent reviews found the new leaderboard controls missing from hub hit allowlists; patched both production and save guards. Async score publication now preserves a loaded ranking and clears obsolete pending warning, covered by unit tests. E2E fixture teardown uses the actual Phaser scene manager. Screenshots visually checked at ui-baseline/leaderboard-management-tab-2026-10-14. Internal missions keys/indices remain compatibility identifiers; the visible tab and body are rankings. Supabase activation remains pending existing setup instructions.

## Suggested Review Order

- Replace fifth-tab content and keep its read-only controls enabled in the hub.
  [CozyScene.ts:941](../../src/scenes/CozyScene.ts#L941)
- Render shared rank/cash/day rows and personal position inside the existing body.
  [ReferenceLeaderboard.ts:11](../../src/presentation/ReferenceLeaderboard.ts#L11)
- Reuse the same menu/campaign leaderboard actions.
  [main.ts:65](../../src/main.ts#L65)
- Introduce rankings without changing saved tutorial IDs or indices.
  [interactiveTutorial.ts:29](../../src/config/interactiveTutorial.ts#L29)
- Verify preparation, end-day, missing configuration and restored tutorial.
  [leaderboard-tab.spec.ts:32](../../tests/leaderboard-tab.spec.ts#L32)
