---
title: '4.1 — Deterministic three-day Cozy schedule'
type: feature
created: '2026-10-03'
status: done
baseline_commit: NO_VCS
context: ['_bmad-output/project-context.md', '_bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md', '_bmad-output/implementation-artifacts/epic-4-context.md']
---

<frozen-after-approval reason="User explicitly requested implementation of Stories 4.1 and 4.2; canonical story scope governs">

## Intent

Replace unbounded repeating Cozy arrivals with the configured three-day opportunities from canonical Story 4.1. Scheduling runs on the existing fixed simulation and exposes shift/grace state while retaining the user-approved manual day close. Story 4.2 follows immediately to supply valid menu eligibility and progression.

## Boundaries & Constraints

Always: Day1 duration180 with slots10/35/60/85/110/135, one regular/two picky/three bargain; Day2 duration210 with eight slots10+22i, first eligible regular help otherwise bargain and rest hurry/picky/bargain; Day3 duration240 with ten slots10+20i, conditional regular return and referral210 only when prior final reputation≥55. Each stable day/slot ID is attempted once, including misses/full cap3. Every third commercial opportunity is takeaway; others counter. Recipe cycle cheese/cheese/mushroom/cheese/sausage falls back to the first enabled unlocked menu recipe; regular always cheese, referral first enabled. No clock catch-up across pause.

Always: Stop arrivals at shift duration; up to120 seconds grace closes remaining tickets, releasing unconsumed reservations without stock refund. Never auto-settle: latest explicit user decision keeps manual Kết thúc ngày and confirmation. Closing early remains permitted. Retain snapshots, pause ownership, one oven, exact recipe, menus/assets, five sauce/ten ingredient slots and day-end base geometry. Current recipe selection remains a menu/preparation choice until4.2 supplies enabled menu.

Never: Day4, backlog, fabricating orders when shortage occurs, XP/rewards in4.1, storage, new dependencies, redesigned HUD, help resolution before4.3. Regular-help schedule opportunity is recorded/skipped by an explicit future narrative hook until4.3; it is never substituted with a commercial regular. No help counters, money or pause are invented.

## I/O & Edge-Case Matrix

| Scenario | Input | Expected | Rejection |
| --- | --- | --- | --- |
| First visit | Explicit open, elapsed9.95→10 | First real eligible ticket/decision at10 | Before10 none |
| Full/shortage | Scheduled slot with cap3 or no recipe stock | Mark slot consumed, no partial ticket/hold | Never retry backlog |
| Referral | Day2 final reputation54/55 | Zero/one extra Day3 slot at210 | No duplication/cap bypass |
| Service | Commercial ordinals1/2/3 | Counter/counter/takeaway; detail reflects real need | Special help excluded |
| End shift | elapsedduration→duration+120 | Stop arrivals, expire/close tickets, await manual summary | No auto money/settlement |
| Pause | Visibility/order/other owned lease | Simulation, visits and grace frozen | No wall-clock timer |

</frozen-after-approval>

## Code Map

- src/runtime/CozyRuntime.ts: simulation, arrival command, reviews, delivery and manual close owner.
- src/config/ordinaryCustomers.ts: authoritative patience and price profiles.
- src/presentation/OrderQueue.ts and src/scenes/CozyScene.ts: real packaging/service details, timer presentation on existing surfaces.
- src/domain/CozyStock.ts: dated lot reservation/consume remains unchanged.

## Tasks & Acceptance

- [x] Add pure typed validated three-day schedule with eligibility inputs and recipe resolver, stable slots, grace boundary and no day4.
- [x] Integrate runtime start at10, one-shot attempts, no backlog/cap bypass, regular-help hook, referral, fixed-clock phase selector and grace ticket closing; preserve manual summary.
- [x] Make takeaway per-ticket and delivery scoring/detail reflect counter vs takeaway; retain packaging availability and required correct recipe.
- [x] Show shift phase/remaining through existing text/detail surfaces and read-only diagnostics without moving approved controls.
- [x] Adapt relevant unit fixtures using explicit injected deterministic schedule/recipe data (no production legacy flag); add default schedule/runtime tests for canonical timing/cadence/referral/grace/pause.
- [x] Focused E2E timer/ticket/service and manual summary, typecheck/build; update tracking/evidence.

Given canonical default configuration, explicit opening starts the timer with no instant ticket; each configured slot is considered once. Given shift/grace completion, no customer or simulation continuation can bypass the manual day summary. Given tutorial/freeplay, commercial schedule never changes its economics or practice progression.

## Design Notes

Pure schedule input injection keeps economic/oven regression fixtures deterministic while default production tests explicitly prove the canonical schedule. Existing Epic2 fixtures describe older repeated visits and must not silently define production scheduling. Narrative help is Story4.3; its future hook supplies no placeholder commercial sale.

## Verification

Final combined validation: 103 focused Vitest tests across 14 files passed, production build/typecheck passed, and seven Chromium390×844 browser scenarios passed. The browser run used only tests/epic-4-progress.spec.ts, tests/epic-4-schedule.spec.ts, tests/epic-3.spec.ts and tests/day-end.spec.ts; no full browser/viewport matrix was run.

The default-schedule runtime tests cover all three days and cross-day mission attribution. Browser evidence covers counter/takeaway service, scheduled shift/grace/manual close, real rewards, delayed sausage purchase/assembly, differing preparation/bargain recipes, empty-menu rejection, owned pauses and approved geometry. New screenshots are in [epic-4-evidence](epic-4-evidence/README.md); approved baseline images are unchanged. Three independent reviewers completed the [combined audit](epic-4-1-4-2-review.md), and accepted implementation patches were verified.

RAM snapshots/claim IDs are tested, without claiming checkpoint persistence or completion of the remaining Epic4 stories.

## Spec Change Log

- 2026-10-03: Scope follows canonical Story4.1; manual closure follows later user decision. User already authorized implementation.

## Suggested Review Order

**Schedule integration**

- Open a fixed-clock schedule without an immediate production order.
  [CozyRuntime.ts:229](../../src/runtime/CozyRuntime.ts#L229)

- Define three-day opportunities, service cadence and conditional visits.
  [cozySchedule.ts:35](../../src/config/cozySchedule.ts#L35)

- Stop arrivals, resolve patience/grace and retain explicit manual close.
  [CozyRuntime.ts:414](../../src/runtime/CozyRuntime.ts#L414)

**Presentation**

- Expose real counter/takeaway requirements within the existing order panel.
  [OrderQueue.ts:34](../../src/presentation/OrderQueue.ts#L34)

- Display shift/grace status without moving the approved HUD.
  [CozyScene.ts:258](../../src/scenes/CozyScene.ts#L258)

**Verification**

- Prove default timing, capacity, pauses, referral and the bounded journal.
  [CozySchedule.test.ts:7](../../src/runtime/CozySchedule.test.ts#L7)

- Exercise counter/takeaway service and manual closure after grace.
  [epic-4-schedule.spec.ts:26](../../tests/epic-4-schedule.spec.ts#L26)
