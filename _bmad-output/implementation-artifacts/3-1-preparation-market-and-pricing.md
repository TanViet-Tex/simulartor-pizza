---
baseline_commit: NO_VCS
---
# Story 3.1: Preparation market and pricing

Status: review

## Story

As a shop owner, I want to buy ingredients and set pizza prices before opening, so that preparation has clear cash and customer consequences.

## Acceptance Criteria

1. A new Cozy commercial session starts with 300 coins and zero stock. Day 1 unit prices dough/sauce/cheese/mushroom are 5/3/7/5; Days 2/3 apply 1.1/0.9 rounded per unit. Purchases create dated lots at their actual unit price. Invalid quantities/ingredients/days and unaffordable purchases leave cash, lots and books unchanged. No future-day price table or playable Day 4 appears.
2. Purchases and price changes are accepted only before the shift opens, including next-day preparation in the summary hub. After opening, `prepareAgain()` may show stock and retain existing recipe-selection behavior, but buying/changing prices is rejected with a clear reason and no economic mutation. Active tickets retain their own recipe and agreed price. Tutorial/freeplay remains isolated.
3. A typed purchase intent includes a unique command ID. Retrying the same intent cannot deduct money/create a second lot; distinct legitimate purchases remain possible. Scene mutation goes through runtime dispatch and domain validation rather than visual/animation callbacks.
4. Existing recipe buttons on initial market and next-day Chợ retain their coordinates, dimensions, count, selection action and style. Before opening, they also open a focused cream price modal; 80–140% of reference is valid, rounded to whole coins. Out-of-range/non-finite values are rejected. Modal closing preserves the underlying tab/layout, uses >=48 CSS px targets, and releases only its owned pause lease. Purchases/prices cannot bypass visibility/orientation pause.
5. Preparation displays current stock quantities, expiry rule/current lots, anticipated rent of 20, remaining cash and a warning when remaining cash is below rent. Opening still requires enough available stock for the selected recipe. No new base-screen controls or reflow are introduced.
6. Ordinary arrivals use the configured menu price; accepted bargain tickets use their final discounted price. Existing customer ceiling/reputation and immutable ticket-price rules from Epic 2 remain unchanged. Sausage/XP/unlocks, rewards and persistence are out of scope.

## Tasks / Subtasks

- [x] Extend `CozyRuntimeIntent`/`dispatch` in `src/runtime/CozyRuntime.ts` with typed purchase intent + command ID, pre-open guards and duplicate protection (AC 1–3).
- [x] Reuse `CozyStock.buy`, `datedIngredientPrice`, `menuPrice`/`setMenuPrice`; avoid another economic owner or duplicated formulas (AC 1, 4, 6).
- [x] Add small preparation budget/expiry/pricing selectors owned by runtime/domain, preserving real quantities and existing phase invariants (AC 2, 5).
- [x] Update only `CozyScene.market`, `dayHub` market branch and existing recipe-button handlers with the approved modal activation; stock view between orders disables purchases and explains why (AC 2, 4–5).
- [x] Focused tests: `CozyStock.test.ts` + `CozyRuntime.test.ts`, existing production/remake tests provision all needed stock before opening; one focused Chromium market/pricing E2E including next-day hub, invalid/duplicate purchase, blocked midshift commands, lease ownership and touch layout (AC 1–6).

## Dev Notes

Current `buy` accepts any preparation phase, including `prepareAgain()` with `shiftOpen=true`; fix this hole at runtime, not only the button. `setMenuPrice` already rejects midshift and uses `menuPrice`. `customerProgress.prices` exposes final menu prices. `processArrival/createTicket` already freeze ticket price and use customer ceiling rules. Day-end hub purchases use `preparationDay=currentDay+1` and must remain booked to the following day. Preserve `selectRecipe` during the existing stock view for Epic 2 different-recipe tests; existing tickets keep immutable recipes.

Recipe selection remains functional on the same buttons. Root chose a price detail overlay from those buttons, not extra +/- controls on the base screen. Do not alter menu artwork, kitchen/HUD, queue, summary geometry, five tabs, three summary cards, four preparation tiles or footer. Do not replace approved screenshots before user approval.

### Project Structure Notes

Extend existing `CozyStock`/`CozyRuntime` owners and `CozyScene`; new pure economic types/config belong in domain/config if needed. `src/domain/demo.ts` provides existing catalog only; do not route Cozy to DemoGame or copy campaign mutation logic.

### Project Context Rules

Domain is pure TypeScript (no Phaser/DOM/IndexedDB); gameplay commands are atomic and owned once. Keep fixed 50ms simulation and owned pause leases. No dependencies/version upgrades. Use `npm run build-nolog` and focused Vitest/E2E; full browser/viewport matrix only per user cadence. RAM Cozy and manual day closure remain; persistence is Epic 4.

### References

- `_bmad-output/implementation-artifacts/epic-3-context.md`, rules/gaps/UI decision.
- `_bmad-output/planning-artifacts/pizza-gdd/epics.md#E03 - Chợ và sổ thu chi`.
- `_bmad-output/planning-artifacts/pizza-gdd/gdd.md#Chợ, hạn dùng và kế toán`; `#Khách, giá, đánh giá và uy tín`.
- `_bmad-output/game-architecture.md#IP01. Command Pipeline`; X03/X04/X06.
- `_bmad-output/implementation-artifacts/spec-1-4-day-one-stock.md`, audited stock commitment/recipe scope.
- `_bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md`, initial market and approved day-end hub; `_bmad-output/project-context.md`.

## Dev Agent Record

### Agent Model Used

GPT-6 (Codex).

### Debug Log References

RED: 4 new runtime checks failed before implementation. GREEN: 51 focused domain/runtime tests passed; 4 Chromium 390×844 market/day-end E2E passed; build-nolog passed. No VCS.

### Completion Notes List

- Added command-ID purchases, pre-open market and pricing guards, budget/expiry selectors and modal on existing recipe targets. Closed report preserved during next-day purchases; owned modal pause preserved across visibility changes. Visual evidence inspected without replacing approved baselines.

### File List

- src/runtime/CozyRuntime.ts
- src/domain/CozyStock.ts
- src/scenes/CozyScene.ts
- src/runtime/CozyEconomy.test.ts
- src/runtime/CozyShop.test.ts
- src/runtime/CozyTickets.test.ts
- src/runtime/CozyDay.test.ts
- src/runtime/CozyCustomers.test.ts
- tests/epic-3.spec.ts
- tests/day-end.spec.ts
- tests/shop.spec.ts

## Change Log

- 2026-10-03: Implemented and verified preparation market and price editor; ready for review.

