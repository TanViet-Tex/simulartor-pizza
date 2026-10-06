---
title: Staff ingredient pacing and expanded customer orders
type: feature
created: 2026-10-06
status: done
baseline_commit: 2312630
context:
  - _bmad-output/project-context.md
  - _bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md
---

## Intent

User requests one second per ingredient added by prep staff, retaining manual ingredient input; customers may order the three finishing sauces, increased daily customer counts, simultaneous arrivals up to existing capacity, and orders containing two or three different pizzas. Keep layout and other functions.

## Confirmed independent work

- Staff prep uses one simulation second per ingredient. Manual additions remain accepted.
- Adding a different correct ingredient preserves the current staff timer; adding its pending ingredient cancels that stale action without toggling it off.
- Pause, stage/order identity changes and wrong ingredients keep existing guards.

## Confirmed scope and acceptance

1. Requested finishing sauces are mandatory for correctness when specified. Extras remain optional and base recipes unchanged. Display sauce requests per pizza; prep staff must add requested sauces after extraction before boxing, one second each, with existing once-only consumption.
2. Base daily arrivals: day1=20, days2–5 deterministically sampled40–50, day6=50, day7 onward=50+2×(day−6), up to98 atday30. Preserve weather/shop/app modifiers. Most arrivals are single; after seven single arrival groups, every eighth group is an occasional same-time batch up to owned4/6capacity. The final batch may be smaller. Full queue still rejects excess, no invisible unlimited queue. Forecast and real schedule use identical stable samples and grouping. Keep existing day duration.
3. Both counter and app customers can request2–3different pizzas from owned currently-selling menu; if menu only offers1–2 recipes, never invent an unavailable recipe. Individual item recipe/price/sauce requirements retained; box each pizza, track progress, finish entire order only once all items done. Single counter order keeps its existing unboxed/takeaway rules. Multi counter orders need boxes per user's explicit answer.
4. Per-pizza recipe scoring plus requested finishing sauces; wrong/missing requested sauce triggers existing wrong-order confirmation/score penalty. No recipe ingredient list mutation; extra finishing sauces remain allowed. Mandatory finishing sauces are not ingredient highlights (retain user's previous nohighlight instruction). Staff uses same guards and timings; player can still operate. Fee5 once per app order, none for counter; cash/XP/goal/VIP/regular-help/bargain semantics remain once per customer and quantity/sales breakdown per pizza. Multi orders accumulate correct per-item revenues/quality, aggregate worst stars; no partial payment.
5. Save old reports unchanged through optional per-item sold metadata, validate new mixed receipts/totals and increased counts coherently. Day-boundary only persistence. Forecast includes deterministic recipe/sauce demand, subtracts stock once; all sauces still noexpiry.
6. Preserve existing UI geometry/art/buttons: current order panel shows the current pizza, requested sauces, total price and boxed progress within its current bounds; modal details list full requests. No new layout or carousel. Existing controls for boxing/delivery reused (box packs ready item of multi order and prepares next pizza; Giao finishes whole order when ready). Order selection/ovenowner remains safe.

Given concurrent arrivals when empty, then up to ownedcapacity appear the same simulation tick. Given two/threeitemorder, then itemrecipe changes only after box+pack, finishing flags reset per item, and no payment before final delivery. Given requested sauce missing, then wrong-order confirmation remains; expected sauce used twice rejects/never subtracts twice. Given manual staff overlap, then1sactual work and no toggle of alreadyadded ingredient. Given newday with50+customers, then report/checkpoint restore and autosave remain valid. Given save oldsingle/same-recipe appreport, then restores unchanged finances and scoring metadata.

## Tasks / ownership

- [x] Schedule config/domain and focused tests: counts/bursts/stable random/modifiers, no30cap.
- [x] Runtime/order/checkpoint/forecast: typed mixed item requests, requested finishing scoring, packing and atomic final settlement, staff/fee/cost/progression/save guards; tests.
- [x] Staff prep1s, manual overlap and existing staff regressions.
- [x] Scene/OrderQueue: display per-item requests/progress within existing geometry, next pizza and final deliver controls.
- [x] Focused unit/E2E/build, adversarial/edge/acceptance reviews, docs/captures.

## Investigation

`cozySchedule` currently enforces strictly different arrival ticks; `deliverySchedule` truncates to30 and `ShopSchedule` limits30. Report/checkpoint validation caps30reviews/90pizzas. These boundaries must be updated coherently when counts are confirmed. Current app supports2–3same-recipe pizzas, counter one; mixed orders require per-item recipe/sauce and packed outcome metadata, forecasts/prices/cost/quality/scoring/save validation, and clear progress within the current order panel. Existing ingredient hints use selected recipe and must exclude optional sauces unless the user explicitly changes scoring.

## Verification

Latest steering implemented: day six remains 50, then two additional customers per day; mostly individual arrivals with every eighth group arriving together. The focused suite was rerun after this amendment; all staff/mixed-order/sauce/settlement/save behavior stays intact. The two E2E fixtures use explicit schedules, so their passed scene scenarios are unaffected by this density-only amendment.

`npm.cmd run build-nolog` passed on final amended source. Focused Vitest run passed 89 tests across 11 files after the amendment (schedule/density, shop modifiers, runtime schedule, mixed orders, finishing sauces, checkpoint, forecast, staff, audio notifications and compact order panel). Both Chromium 360×640 E2E tests passed: counter two distinct pizzas, app three distinct pizzas, requested sauces, next item after boxing, no partial cash, duplicate delivery and one shipper fee. No full viewport/browser matrix run.

Regression coverage includes one-second staff/manual overlap and pause, six simultaneous arrivals with seeded forecast parity, cancellation then sauce correction/rebox without repeated stock consumption, full packed counter discard/rebake guards, partially packed expired/closed saves, altered item receipts, and an actual day-seven campaign with more than 50 completed customers restored with matching cash/inventory. Historical single/same-recipe app fixtures remain valid.

Blind, edge-case and acceptance reviews completed. All actionable findings were patched and verified: abandoned mixed counter receipt validation, actual schedule seed/capacity, incomplete box cancellation, full packed counter discard/rebake and late-delivery Vietnamese text. Updated edge/acceptance audits found no remaining concrete gaps. No intent ambiguity or deferred finding remains for this feature.

Captured UI: [counter details](ui-baseline/expanded-orders-2026-10-06/counter-order-detail.png), [second pizza](ui-baseline/expanded-orders-2026-10-06/second-pizza.png), [three-pizza app details](ui-baseline/expanded-orders-2026-10-06/app-three-pizzas.png). Geometry/art unchanged. Sprint sync skipped because this standalone change has no story key.

## Suggested Review Order


**Requests and settlement**

- Expose current item and whole-order progress through existing ticket views.
  [CozyRuntime.ts:428](../../src/runtime/CozyRuntime.ts#L428)
- Generate stable distinct menu items and requested finishing sauces.
  [customerPizzaRequests.ts:6](../../src/config/customerPizzaRequests.ts#L6)
- Pack each pizza, then settle the complete order once.
  [CozyRuntime.ts:633](../../src/runtime/CozyRuntime.ts#L633)

**Guards and persistence**

- Reopen only the unaccepted box without consuming ingredients again.
  [CozyOrder.ts:30](../../src/domain/CozyOrder.ts#L30)
- Validate mixed receipts while preserving abandoned orders and historical saves.
  [CozyCheckpoint.ts:62](../../src/domain/CozyCheckpoint.ts#L62)
- Share seed and owned capacity between forecast and actual schedule.
  [CozyRuntime.ts:513](../../src/runtime/CozyRuntime.ts#L513)

**Presentation and verification**

- Preserve panel bounds while showing current pizza, sauce and packing progress.
  [OrderQueue.ts:45](../../src/presentation/OrderQueue.ts#L45)
- Enable final delivery only after every requested pizza is boxed.
  [CozyScene.ts:415](../../src/scenes/CozyScene.ts#L415)
- Cover transaction, cancellation, staff, forecast and larger-save invariants.
  [CozyMixedOrders.test.ts:15](../../src/runtime/CozyMixedOrders.test.ts#L15)
- Exercise counter and app orders through the real scene controls.
  [mixed-customer-orders.spec.ts:41](../../tests/mixed-customer-orders.spec.ts#L41)
