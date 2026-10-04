---
title: 'Story 1.4 — Buy and reserve Day 1 ingredients'
type: feature
created: '2026-10-01'
status: done
baseline_commit: NO_VCS
context: []
---

## Intent

After guided practice, prepare the first commercial order with 300 coins and zero owned stock. Buy ingredients at approved Day 1 prices, open only a feasible selected recipe, reserve on acceptance, consume at production commitment and release unused reservations. Preserve the approved cartoon kitchen and existing freeplay/campaign routes.

## Code Map

- `src/domain/CozyStock.ts`: lot ledger, atomic purchase/reserve/consume/release, exact shortage reports.
- `src/domain/CozyOrder.ts`, `src/runtime/CozyRuntime.ts`: production lifecycle, cheese/mushroom recipes, isolated tutorial.
- `src/scenes/CozyScene.ts`, `src/main.ts`: preparation, purchase quantities, open/accept reasons and live counters.
- Domain/runtime tests and `tests/shop.spec.ts`: conservation, timeout, overspend, mobile purchase-to-ticket path.

## Tasks & Acceptance

- [x] Start preparation at cash300 and zero stock; expose Day 1 dough5/sauce3/cheese7/mushroom5 and recipe cheese50/mushroom65.
- [x] Integer affordable purchases create Day 1 lots with unit costs exactly once; invalid/overspending requests leave cash/lots unchanged.
- [x] Opening checks selected unlocked recipe and reports exact missing quantities; no production before accepted reservation.
- [x] Reserve recipe quantities per ticket; unreserved stock cannot be allocated twice. Invalid consumption lists cannot change stock. Explicit consumption of a reserved subset releases unused quantities; the runtime requires the entire selected recipe before baking. Used quantities are consumed once; unused ones and timeout reservations are released once.
- [x] Connect existing bake/box/deliver lifecycle to real stock. Clearing assembly does not spend ingredients; burnt committed pizza has no refund. Tutorial retains independent economics and enters preparation explicitly.
- [x] Display real owned/available/reserved quantities, buy quantity controls, disabled reasons and initial recipe prices on portrait screens with >=48px targets.
- [x] Build and verify unit invariants and Chromium/WebKit purchase-to-accept flow on each approved mobile viewport; update sprint status.

Given insufficient stock, opening/acceptance reject with a reason and no ticket. Given two tickets, reserved quantities are excluded from the next acceptance. Given consumed production or an expired reservation, repeated commands cannot duplicate consumption/refunds. Later E03 extends this same lot ledger with pricing/expiry/accounting; no persistence expansion here.

## Verification

Build and 56 unit tests pass. Final shop matrix: 10 passed and 8 intentionally skipped (full mushroom cooking/restart regressions run only on each browser's 360x640 profile; purchase-to-accepted-ticket runs on all six browser/viewport profiles). Tutorial/freeplay regression: 6 passed. Portrait screenshots checked at360x640 and412x915. Three scoped reviews completed; fixed wrong mushroom order label, visible available counters, insufficient-funds button reason and recovery after unusable purchases. Recovery resets the session only after explicit confirmation. Clarified subset consumption as the required unused-reservation release operation; runtime rejects incomplete recipes before commit.

Current UI supports one active order/oven; the underlying reservation ledger supports multiple tickets for conservation tests and later stories. New production inventory is session state; campaign checkpoint implementation remains separate. `?mode=shop` opens preparation directly; default first completes tutorial, and `?mode=freeplay` preserves the former unlimited-stock preview.

Commands: `npm run build-nolog`; `npx vitest run`; `npx playwright test tests/shop.spec.ts --workers=1`; `npx playwright test tests/tutorial.spec.ts tests/cozy.spec.ts --grep 'guided practice|reading order|Day 1 touch' --project=chromium-360x640 --project=webkit-360x640 --workers=1`.

## Suggested Review Order

Timing update (2026-10-01): user changed the shared baking window to3–5seconds; after5seconds pizza burns, gauge ends at7seconds. Guided practice now stops at3seconds. This supersedes all earlier8–11second references. Configuration is centralized in `src/config/bakeTiming.ts`.

- Lots, cash and reservations: [CozyStock.ts](../../src/domain/CozyStock.ts).
- Preparation-to-production lifecycle: [CozyRuntime.ts](../../src/runtime/CozyRuntime.ts).
- Purchases and visible counters: [CozyScene.ts](../../src/scenes/CozyScene.ts).
- Mobile purchase and delivery evidence: [shop.spec.ts](../../tests/shop.spec.ts).
