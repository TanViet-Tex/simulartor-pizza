---
title: '4.2 — Goals, mission, XP and next-day recipes'
type: feature
created: '2026-10-03'
status: done
baseline_commit: NO_VCS
context: ['_bmad-output/project-context.md', '_bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md', '_bmad-output/implementation-artifacts/epic-4-context.md']
---

<frozen-after-approval reason="User explicitly requested implementation of canonical Story4.2 after4.1">

## Intent

Make commercial service progress toward daily goals and the eight-cheese mission, grant XP and one-time rewards, and open sausage only on a following day. Use the existing runtime/economic owners and approved UI surfaces. This is RAM progression with detached snapshots and claim IDs, not persistent campaign saving.

## Boundaries & Constraints

Always: Each delivered commercial order grants10XP plus5 for4–5stars. Timeouts, closed tickets, tutorial and futurehelp grant no orderXP or sale-mission progress. Delivered qualifying cheese pizzas advance mission; a wrong-recipe substitution is not a cheese sale. Delivery IDs deduplicate outcomes and reward IDs deduplicate effects.

Always: Day1 goal3delivered; Day2 sales≥200 excluding rewards; Day3 at least3 ended commercial orders with average≥4. Summary success grants20coins/10XP once; failed goal expires without blocking next day. Mission eight cheese sales overdays1–3 grants30coins/20XP/+2bounded reputation automatically once, expires at final day if incomplete. Levels1/2/3 thresholds0/60/150, keep totalXP above150. Crossing60 schedules sausage eligibility for next day only; no playableday4.

Always: Settle ticket outcomes→goals/rewards→expiry/rent/accounts→viability. Rewardcoins are separate cash inflow and never sales/businessprofit. Reports remain detached/immutable after next-day preparation. Menu starts cheese/mushroom, supports enabled flags and must have at leastone unlocked valid recipe. Existing current recipe choice remains preparation choice. Locked/disabled recipes cannot enter scheduled tickets or requests; regular prefers cheese only when enabled. Sausage recipe dough/sauce/cheese/sausage, reference75, baseunit10, same-day expiry and normal FEFO lot rules.

Always: Preserve the four base market ingredient rows, two recipe buttons, five summary tabs, three cards/four prep tiles/footer, existing recipe slots and ten ingredient tiles. Reuse cream price modal for unlocked-recipe choice, enabled menu and sausagepurchase. Use actual level capsule, mission tab and result/detail text without moving controls. Modal input releases/reacquires only its own lease and cannot bypass another pause.

Never: Add storage/checkpoints, Help/Decline branch, new UI rows or dependency/version upgrade; reward in animation; fake missions/stats; reset/replay a settled day. Future persistent restore must preserve claims, outcomes and unlock timing;4.2 verifies pure detached snapshot round-trip only.

## I/O & Edge-Case Matrix

| Scenario | Input | Expected | Rejection |
| --- | --- | --- | --- |
| OrderXP | stars3/4, commercialdelivery | 10/15XP; independentgoal/mission progress | DuplicateID/noXPtimeout |
| Goal | thresholds2/3orders;199/200sales;3endedmean3.99/4 | Fail/succeed; only success20coins10XP | Rewards excluded fromsales |
| Mission | cheese7→8→9 | Once30coins20XP+2reputation, bounded100 | Wrongrecipe/help excluded |
| Unlock | XP59→60 inDay1 | Level2now; sausage usableDay2 | No purchase/ticketDay1 |
| Level | XP149→150→300 | Level2/3/3, XP retained | No negative/nonfiniteXP |
| Menu | Disablelastenabled; requestlocked/disabled | Rejectempty; fallbackfirstenabled/skipregular | No partialconfiguration |
| Summary | Nextdaypurchase/secondclaim/modalreopen | Priorrewardcash/profit/snapshot unchanged | No duplicateeffects |

</frozen-after-approval>

## Code Map

- src/domain/CozyStock.ts, CozyOrder.ts: extend catalog types/expiry and exact recipe forsausage.
- src/domain/DayAccounts.ts: add actual reward cash to cash bridge only.
- src/runtime/CozyRuntime.ts: delivery/close/reward/menu command owners; integrate4.1 recipe resolver.
- src/scenes/CozyScene.ts, src/presentation/OrderQueue.ts: preserve geometry, unlock tile/recipe and actual mission/XP text.

## Tasks & Acceptance

- [x] Add pure CozyProgression with explicit goal/mission states, detached snapshots/restore validation, dedup outcomes/claims, threshold/delayedunlock rules and actual reward effects.
- [x] Extend stock/order/queue types forsausage and preserve historical cost/expiry/recipe validation.
- [x] Integrate runtimeprogression on real commercial results; one-timecash/reputation effects; closegoals before settlement; reward bookkeeping separated fromrevenue/profit; reset and nextday attribution correct.
- [x] Add typed atomic menuconfiguration and unlocked/nonnullenabledmenu selectors; preserve current recipechoice and canonical scheduled generation.
- [x] Populate actual summarylevel/mission/resulttext and existing recipe/ingredient slots; unlockedrecipe cycle, menuenable and sausagebuy inexisting cream modal only.
- [x] Focused unit tests for thresholds/rewardIDs/snapshotrestore/missions/goal failure/unlockdates/menu validity/cashconservation; focused browser goal/reward/nextdayunlock/pause/geometry evidence; build and audit.

Given a successful delivery, monetarysale and progression both resolve once from its actual outcome. Given a faileddailygoal, preparation proceeds if economic viability permits. Given sausage unlock, preparation for thenextday exposes real dated purchase and recipe assembly without newbasecontrols. Given visibilitypause, modal cannot grant rewards/change menu/buy stock.

## Design Notes

Commercial revenue and stockcash keep their current owners; progression returns reward effects to runtime rather than touching the ledger. Capture priorclosedcash before next-daypurchases as Epic3 already does. Use snapshot round-trip tests to preserve reward IDs without claiming IndexedDB support. Menu selection and inclusion are separate; scheduled shortages consume their slot, never fall back to a stocked recipe.

## Verification

Final combined validation: 103 focused Vitest tests across 14 files passed, production build/typecheck passed, and seven Chromium390×844 browser scenarios passed. The browser run used only tests/epic-4-progress.spec.ts, tests/epic-4-schedule.spec.ts, tests/epic-3.spec.ts and tests/day-end.spec.ts; no full browser/viewport matrix was run.

The default-schedule runtime tests cover all three days and cross-day mission attribution. Browser evidence covers counter/takeaway service, scheduled shift/grace/manual close, real rewards, delayed sausage purchase/assembly, differing preparation/bargain recipes, empty-menu rejection, owned pauses and approved geometry. New screenshots are in [epic-4-evidence](epic-4-evidence/README.md); approved baseline images are unchanged. Three independent reviewers completed the [combined audit](epic-4-1-4-2-review.md), and accepted implementation patches were verified.

RAM snapshots/claim IDs are tested, without claiming checkpoint persistence or completion of the remaining Epic4 stories.

## Spec Change Log

- 2026-10-03: Scope follows canonical Story4.2; user already authorized implementation after4.1.

## Suggested Review Order

**Progression ownership**

- Apply returned rewards once through the existing economic owner.
  [CozyRuntime.ts:77](../../src/runtime/CozyRuntime.ts#L77)

- Track goals, XP, mission claims and delayed recipe availability.
  [CozyProgression.ts:17](../../src/domain/CozyProgression.ts#L17)

- Settle goals before expiry/rent and preserve detached day reports.
  [CozyRuntime.ts:165](../../src/runtime/CozyRuntime.ts#L165)

**Menu and bookkeeping**

- Validate atomic menu inclusion and preparation choices before opening.
  [CozyRuntime.ts:68](../../src/runtime/CozyRuntime.ts#L68)

- Separate reward cash from pizza revenue and business profit.
  [DayAccounts.ts:10](../../src/domain/DayAccounts.ts#L10)

- Use sausage with existing dated-lot reservation and exact recipe rules.
  [CozyStock.ts:2](../../src/domain/CozyStock.ts#L2)

**Approved UI surfaces**

- Reuse the cream modal for unlocked recipes, menu inclusion and sausage purchases.
  [CozyScene.ts:364](../../src/scenes/CozyScene.ts#L364)

- Populate level, goals and mission while preserving approved summary geometry.
  [CozyScene.ts:461](../../src/scenes/CozyScene.ts#L461)

**Verification**

- Complete the mission across canonical days without repeated reward effects.
  [CozyProgress.test.ts:44](../../src/runtime/CozyProgress.test.ts#L44)

- Verify actual bargains, rewards, next-day sausage and unchanged touch geometry.
  [epic-4-progress.spec.ts:24](../../tests/epic-4-progress.spec.ts#L24)
