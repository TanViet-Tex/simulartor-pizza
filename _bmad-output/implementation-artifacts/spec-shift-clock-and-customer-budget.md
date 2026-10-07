---
title: 'Shared opening clock and seeded order budget'
type: feature
created: '2026-10-07'
status: done
baseline_commit: '1f6b375fe28784a838702f028f512177431a7c5e'
context: []
---

<frozen-after-approval reason="User directly authorized implementation in the task request">

## Intent

Replace the current customer density and shift clock with the user's opening hours and seeded total order budget. Forecast, runtime and HUD must use the same schedule. The user requested implementation and focused verification without a separate planning approval.

## Boundaries & Constraints

Always preserve money, inventory, pizza counts per order, checkpoint compatibility, and approved art/layout except the requested clock immediately to the right of Pause. Preparation takes five simulation seconds, 08:50–09:00, followed by opening 09:00–21:00 and the existing 120-second grace. Pause freezes both timers. No arrivals or app orders during preparation or after closing. No progress deletion or save schema changes.

Days 1 / 2–5 / 6–10 / 11–20 / 21+ use 180 / 210 / 240 / 270 / 300 selling seconds and 15–20 / 22–28 / 28–36 / 36–46 / 46–60 base order opportunities. Count includes counter and app, before decoration/referral bonuses. The new explicit bands supersede old event density deltas; weather/delivery event identities, timing, fees and pizza request rules remain. App replaces eligible commercial opportunities rather than adding to the base budget. A help opportunity retains its existing semantics in the schedule. Counts remain seeded by campaign and day. First customer arrives exactly at opening; early shift is sparse, middle busiest, late declining. Bursts cap at two through day five, three thereafter, independent of queue capacity. Referral and decoration use positions within the selling interval.

## I/O & Edge-Case Matrix

| Scenario | Input | Expected |
| --- | --- | --- |
| Opening | Start day | 08:50, no orders, five-second preparation |
| Boundary | 4.95 then 0.05 seconds | 08:59 then 09:00, first opportunity processed at elapsed selling time zero |
| Closing | Preparation plus selling duration | 21:00, stop arrivals, display closed status and separate grace countdown |
| Pause | Any owned pause lease | Preparation, display time, selling elapsed and grace remain unchanged |
| Expanded queue | Same seed/day, capacity four versus six | Identical arrival times, counts and burst sizes |
| Old checkpoint | Restore at day boundary | Money, stock, progression, settings and campaign identity retained |

</frozen-after-approval>

## Code Map

- `src/config/cozySchedule.ts`: canonical timing, density bands, arrival curve and referral.
- `src/config/deliveryEvents.ts`: app allocation and event integration.
- `src/domain/ShopSchedule.ts`: decoration opportunities inside opening hours.
- `src/runtime/CozyRuntime.ts`: shared schedule construction, preparation gate, display clock, forecast and actual arrivals.
- `src/scenes/CozyScene.ts`: HH:mm beside Pause and status/countdown in the existing timer area.
- Schedule, runtime and forecast unit suites: focused regression coverage.

## Tasks & Acceptance

- [x] Update shared timing/budget and seeded sparse–busy–declining arrivals.
- [x] Integrate app within budget, preserve bonus and delivery rules, remove hard-coded arrival times.
- [x] Add preparation timer independent of selling/patience and shared runtime/forecast schedule construction.
- [x] Add requested HUD clock and closed status, preserve remaining geometry.
- [x] Update relevant focused tests and documentation; run typecheck/build and focused suites.

Acceptance: Given each day band, when forecasting and starting with identical settings, then schedule and per-pizza ingredient totals agree. Given capacity upgrade, when producing the schedule, then only queue capacity changes. Given preparation or grace, when paused, then no time advances. Given closing, when advancing, then no new order opportunities are accepted.

## Verification

`npm run typecheck`, `npm run build-nolog`, and targeted Vitest schedule/runtime/forecast/delivery tests. No full E2E run.

Results: typecheck/build passed. Ten focused Vitest suites: 103 tests passed (the initial floating-point assertion was corrected, then the affected 17-test suite passed). One Chromium 360×640 E2E passed; covers preparation, owned Pause, closing admission, separate grace countdown, readable HUD bounds and an occupied oven at closing. Final screenshots inspected. Three independent review lenses completed; one oven-readout finding was fixed and covered by E2E. No changes to money, inventory or checkpoint schema.

## Suggested Review Order

- Shared hours, duration bands, seeded budget and bounded bursts.
  [cozySchedule.ts:11](../../src/config/cozySchedule.ts#L11)
- App consumes an existing commercial opportunity within the same budget.
  [deliveryEvents.ts:14](../../src/config/deliveryEvents.ts#L14)
- Forecast and runtime share the schedule construction pipeline.
  [CozyRuntime.ts:480](../../src/runtime/CozyRuntime.ts#L480)
- Preparation gates arrivals without advancing selling time or patience.
  [CozyRuntime.ts:983](../../src/runtime/CozyRuntime.ts#L983)
- Clock, closed status, grace countdown and retained oven readout.
  [CozyScene.ts:398](../../src/scenes/CozyScene.ts#L398)
- Focused preparation, pause, closing, forecast and save regressions.
  [CozySchedule.test.ts:12](../../src/runtime/CozySchedule.test.ts#L12)
- Browser geometry and an oven still baking at closing.
  [shift-clock.spec.ts:12](../../tests/shift-clock.spec.ts#L12)
