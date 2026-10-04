---
title: '4.3 — Returning regular help and thanks'
type: feature
created: '2026-10-03'
status: done
baseline_commit: NO_VCS
context: ['_bmad-output/project-context.md', '_bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md', '_bmad-output/implementation-artifacts/epic-4-context.md']
---

<frozen-after-approval reason="User explicitly authorized canonical Stories 4.3–4.6">

## Intent

Replace the deferred Day2 regular-help slot with the actual narrative Help/Decline choice and free cheese ticket, and resolve its distinct relationship outcome. An earned Day3 return grants thanks and twenty coins once when relationship reaches two.

## Boundaries & Constraints

Always: Day1 regular result ≥3 gates Day2 help, below3 misses it. Help occupies the existing first Day2 slot and at most one of three tickets, 120 simulation seconds, counter service, normal exact cheese recipe and stock reservation/consumption. Offer freezes simulation through its own help lease. Help is disabled with exact stock/cap/menu reason; decline changes no cash/reputation/relationship. Missing regular preference is explained.

Always: Correct ready on-time help +1 relationship; wrong/raw/burnt/expired/closed help −1, clamp0–3, resolve once. Help never changes commercial revenue, reputation, daily commercial reviews/rating, goals, mission, orderXP or good-ratingXP. Record gift consumption as a subset of consumed cost once, not an extra expense. Result/detail mark free help clearly. Day3 regular returns when help succeeded OR latest commercial regular stars≥4; on that encounter relationship≥2 grants one20-coin reward, separately from revenue/profit, stable claim ID, no XP or family recipe placeholder.

Always: Preserve approved menu/kitchen/summary geometry, assets and touch targets. Reuse existing cream decision/detail/result modals for consequences and thanks. Snapshot-friendly help state and claim IDs must be detached and validated; root subsequently integrates checkpoint persistence.

Never: Add Day2 commercial regular, schedule slot, automatic summary, storage implementation in this story, dependency, gameplay rewards in presentation callbacks, or redesign.

## I/O & Edge-Case Matrix

| Scenario | Input | Behavior |
| --- | --- | --- |
| Gate | Day1 stars2/3 | Nohelp/help once at10 |
| Choice | No cheese/cap3/omitted menu | Explain reason; Helpdisabled, Declineavailable |
| Help | Exact good before120 / incorrect orlate | +1/−1relation once; commercial counters unchanged |
| Cost | Help commits ingredients | Giftcost subset of consumed, not doubled |
| Thanks | Day3 return relation1/2 | No reward / once20coins separated fromsales |
| Pause | Visibility plus help lease | Releasing one cannot resume the other |

</frozen-after-approval>

## Code Map

- src/runtime/CozyRuntime.ts: schedule/help choice, ticket/result owners, commercial exclusion and snapshot-ready state.
- src/scenes/CozyScene.ts and src/presentation/OrderQueue.ts: existing modal/detail surfaces, free-help marking and consequence text.
- src/domain/DayAccounts.ts: gift cost breakdown remains a consumed-cost subset.

## Tasks & Acceptance

- [x] Add explicit help offer/outcome/thanks state, validated detached views and typed choice intent with owned lease.
- [x] Create/reject help atomically; resolve success/failure once with commercial exclusions and actual gift cost.
- [x] Connect Day3 help-success return and once-only20coins reward; keep revenue/profit separate.
- [x] Present consequence choice/free ticket/result/thanks on existing UI surfaces without moving base controls.
- [x] Focused runtime/queue tests for gates, stock/decline, exclusions, cost, bad/late/closed outcomes, clamps, dedup and pauses; focused browser evidence and build.

## Design Notes

Keep help outcomes separate from commercial terminal reviews. A free ticket must not pass through the commercial reputation/XP handler. Persistent runtime export/restore will capture help success, decisions and thanks claim state in the following stories.

## Verification

Focused Vitest and Chromium390×844 help/decline scenarios, production build, and independent combined review with 4.4–4.6.

Implemented verification: 43 focused Vitest tests passed across CozyHelp, CozyProgress, CozySchedule and OrderQueue (13 help runtime cases; 13 queue cases including explicit free-help detail). Typecheck and production build passed. Browser scenarios `tests/epic-4-help.spec.ts` are authored; root coordinates the single preview server, screenshots and independent combined review after 4.4–4.6 integration.

Checkpoint contract: pure `src/domain/CozyHelp.ts` exposes `CozyHelpCheckpoint` and `validateHelpCheckpoint`. Only settled decision/outcome/unique thanks claim survives checkpoints; no offer, active ticket, pending thanks modal or per-day gift cost is persisted.

## Spec Change Log

- 2026-10-03: Canonical scope already authorized; manual end-day and approved UI remain binding.

## Verified implementation — 2026-10-03

152 focused Vitest tests across 22 files passed; 16 unique Chromium390×844 scenarios passed across help/save/schedule/progress/market/day-end flows. Typecheck and production build passed. Combined blind/edge/acceptance review fixes are recorded in [review report](epic-4-final-review.md). UI evidence is separate from approved baseline screenshots.

## Suggested Review Order

- Lựa chọn giúp, kết quả và thưởng có owner rõ ràng.
  [CozyRuntime.ts:94](../../src/runtime/CozyRuntime.ts#L94)

- Chỉ quyết định đã chốt đi vào bản lưu.
  [CozyHelp.ts:3](../../src/domain/CozyHelp.ts#L3)

- Kiểm tra miễn phí, quan hệ và chi phí quà.
  [CozyHelp.test.ts:16](../../src/runtime/CozyHelp.test.ts#L16)

- Kiểm tra luồng chọn và lời cảm ơn trên trình duyệt.
  [epic-4-help.spec.ts:19](../../tests/epic-4-help.spec.ts#L19)

