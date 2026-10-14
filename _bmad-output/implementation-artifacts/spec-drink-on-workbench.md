---
title: Show attached drink on the cutting board
type: feature
created: 2026-10-14
status: done
baseline_commit: 3bc8e21
context: []
---

<frozen-after-approval reason="User directly authorized implementation">

## Intent

**Problem:** Clicking a requested drink currently consumes a bottle and marks the drink slot, but the cutting board gives no visible indication that the drink is ready to deliver.

**Approach:** Show the attached labeled bottle beside the pizza or pizza box on the existing board. It follows the order owning the board and disappears when that order is delivered or removed.

## Boundaries & Constraints

**Always:** Use existing DrinkArt illustrations and actual ticket attachment state. Keep approved kitchen geometry, stock consumption, pricing, delivery guards, day-four unlock and pause behavior. Bottle is a visual indicator, with no new input target.

**Ask First:** Any change to kitchen layout or delivery rules beyond this display request.

**Never:** Consume stock again when drawing, show unattached drinks, show another customer's bottle beside the current production owner's pizza, or persist transient bottle UI.

## I/O & Edge-Case Matrix

| Scenario | State | Expected behavior |
|---|---|---|
| Attach before dough | Selected ticket has attached drink, no production owner | Show selected ticket's bottle on the board |
| Pizza or box on board | Production owner has attached drink | Show owner's bottle beside pizza or box |
| Inspect another customer | Board has another production owner | Keep owner's bottle; never borrow inspected customer's bottle |
| No attachment | Relevant ticket has no attached drink | No bottle |
| Deliver or expire | Relevant ticket leaves active queue | Remove bottle on redraw |
| Wrong drink/repeated click | Runtime rejects attachment | Keep existing inventory and display state |

</frozen-after-approval>

## Code Map

- `src/scenes/CozyScene.ts` — board rendering and redraw signature.
- `src/presentation/DrinkKitchenCells.ts` — existing attached drink slot feedback.
- `src/presentation/DrinkArt.ts` — shared labeled bottles.
- `src/runtime/CozyRuntime.ts` — active ticket snapshots and production owner.
- `tests/drinks-service.spec.ts` — real canvas fixture and drink settlement checks.

## Tasks & Acceptance

**Execution:**
- [x] Add board bottle presentation using the correct active ticket, existing artwork, and texture cleanup in `src/presentation/WorkbenchDrink.ts`.
- [x] Integrate rendering and attachment redraw invalidation into `src/scenes/CozyScene.ts`.
- [x] Extend focused drink E2E checks in `tests/drinks-service.spec.ts` for all three bottles, pizza/box, delivery removal and different selected customer.
- [x] Record final behavior and verification here and in context/UI baseline.

**Acceptance Criteria:**
- Given a day-four drink order, when the player clicks the correct drink, then its labeled bottle appears on the board immediately and stock decreases only once.
- Given a bottle on the board, when pizza is prepared and boxed, then the same bottle remains visible without changing board bounds or action hitboxes.
- Given a delivered order, when its removal is rendered, then its bottle is absent and pizza/drink payment remains exactly once.
- Given another customer is inspected while a pizza owns the board, then the visible bottle continues to belong to the production owner.

## Design Notes

Resolve the active production owner first, otherwise selected ticket. If the production owner is abandoned, do not fall back to another active customer's bottle. Use available space at the right of the existing board; do not move the centered pizza or box. Canvas diagnostic state should match the actual rendering and be cleared when absent.

## Verification

- `npm run build-nolog` — typecheck and production build pass.
- `npx playwright test tests/drinks-service.spec.ts --project=chromium-360x640 --workers=1` — targeted drink cases pass.
- Inspect a canvas screenshot containing a pizza box and labeled bottle on the board.

## Spec Change Log

## Completion Notes

Completed 2026-10-14. Shared labeled bottles appear at the right of the unchanged board (176/304, 44×72), before dough and beside pizza/box. Active production owner takes priority over inspected customer; no attachment means no bottle. Delivery/queue removal and hub/scene exit clear the indicator. Rendering has no stock/payment side effects. Build/typecheck, 11 focused unit tests and 6 Chromium360×640 E2E cases passed. Box-and-water screenshot was visually inspected. Three independent reviews found no production defect; the acceptance reviewer identified missing scene-level customer-switch coverage, and the added E2E passed.


## Suggested Review Order

- Attachment-aware redraw and bottle placement on the existing board.
  [CozyScene.ts:508](../../src/scenes/CozyScene.ts#L508)
- Resolve the board owner and reuse labeled bottle artwork without gameplay effects.
  [WorkbenchDrink.ts:12](../../src/presentation/WorkbenchDrink.ts#L12)
- Verify all drinks, delivery removal and inspecting another customer.
  [drinks-service.spec.ts:13](../../tests/drinks-service.spec.ts#L13)
- Verify missing/abandoned owners never borrow another customer's bottle.
  [WorkbenchDrink.test.ts:4](../../src/presentation/WorkbenchDrink.test.ts#L4)
