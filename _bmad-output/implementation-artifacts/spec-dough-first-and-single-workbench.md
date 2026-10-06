---
title: Dough first and finish the active order before starting another
type: bugfix
created: 2026-10-07
status: done
baseline_commit: 5ddbecf
context:
  - _bmad-output/project-context.md
  - _bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md
---

<frozen-after-approval reason="User explicitly requested this correction and confirmed delivery before the next order">

## Intent

**Problem:** Ingredients can currently be added before dough. Staff prepares other tickets while the selected boxed pizza still occupies the displayed workbench, so the player sees a box on the board and another order baking. This violates the requested preparation sequence.

**Approach:** Require dough before other ingredients and keep one production order active from its first dough until actual handoff. Inspection may change customers, but cannot start another order. The user confirmed: “Phải giao bánh xong mới làm tiếp”. Preserve their existing requirement to box each of 2–3 pizzas and deliver the whole order together: further pizzas of the same order are allowed after packing the previous one.

## Boundaries & Constraints

**Always:** Manual and staff operations share workflow guards. First accepted dough starts ownership; selection, redraw, boxing, pause and waiting for a rider do not release the active order. A successful whole-order handoff releases it; waiting for staff return does not lock the next order. Discard/remake of a live order stays within that order. An expired unbaked order releases ownership; a consumed abandoned pizza requires existing discard cleanup. Removing dough clears its unconsumed toppings, without cash/stock effects. Order inspection remains available. Render the actual workbench owner, including when staff acts while another ticket is selected. Packed intermediate pizzas remain stored off the board, with existing packed progress intact.

**Ask First:** A change to whole-order delivery, queue capacity, recipe scoring, fees or approved geometry requires user direction.

**Never:** Redesign the UI; hide a concurrency bug without guarding runtime; consume stock for rejected inputs; remove mixed orders; alter one-second staff pacing, baking durations, requested sauces, saves, money or customer schedule.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected behavior | Rejection |
|---|---|---|---|
| Empty board | Tap sauce/topping before dough | No ingredient, cost or audio change | UI disabled and domain/runtime reject |
| Dough present | Add/toggle toppings, then remove dough | Normal editing; removing dough clears loose toppings | No consumed inventory refund |
| Another selected order | A assembling/baking/extracted/boxed; inspect B | Inspection works; B cannot start dough or toppings | Staff cannot bypass |
| Mixed order | Pack A item 1 of 2/3 | Continue next item of A, packed box stored | B remains blocked |
| Waiting delivery | A packed, rider not arrived | No next-order production | Inspection/booking still work |
| Handoff | A delivered once | Allow another order; no stale board box | Duplicate handoff does not change ownership |
| Cancel/discard | Cancel wrong pack or discard active pizza | Preserve ownership and existing correction/remake rules | No repeated stock consumption |
| Expiry | Current ticket disappears or consumed pizza remains abandoned | Release empty order; keep abandoned physical pizza until cleanup | No permanent orphaned owner |

</frozen-after-approval>

## Code Map

- `src/domain/CozyOrder.ts` — isolated pizza ingredient/stage rules used by practice and production.
- `src/runtime/CozyRuntime.ts` — selected ticket, shared manual/staff path, packing, delivery, expiry and discard.
- `src/scenes/CozyScene.ts` — draws selected pizza on board while oven/staff may belong to another ticket; ingredient hit predicates currently depend only on stage.
- `src/runtime/CozyEpic8.test.ts` — one-second manual/staff races; adjust intentional cheese-before-dough fixture.
- `src/runtime/CozyMixedOrders.test.ts` — keep same-order packing, costs, shipping and cancellation coverage.

## Tasks & Acceptance

**Execution:**
- [x] `src/domain/CozyOrder.ts`, `CozyOrder.test.ts` — enforce dough prerequisite and removal cleanup; verify no invalid toggles.
- [x] `src/runtime/CozyRuntime.ts`, focused runtime test — bind production ownership, guard staff/manual, release through delivery/expiry/cleanup; expose owner and ingredient eligibility to UI.
- [x] `src/scenes/CozyScene.ts` — use shared eligibility for dough/sauce/toppings/express and actual owner for workbench art; keep all geometry.
- [x] Relevant staff tests and focused browser fixture — verify same-order continuation, delivery gate, cross-ticket inspection/staff rendering and no cost/audio on rejection.
- [x] This spec, project context and UI baseline — record the confirmed rule, checks and targeted captures; run build and independent reviews.

**Acceptance Criteria:**
- Given no dough, when a player or staff adds another ingredient, then it is rejected before stock/audio side effects.
- Given active order A, when B is inspected or staff selects work, then only A's pizzas can be prepared until handoff.
- Given a multi-pizza order, when a pizza is boxed, then its next pizza remains possible without admitting another customer's order.
- Given an accepted handoff or abandoned-pizza cleanup, when another order starts, then the workbench shows that new pizza, never a stale box from A.
- Given pause, double-tap or an expiry, when processing resumes, then ownership and existing conservation rules remain coherent.

## Spec Change Log

2026-10-07: User explicitly chose delivery, not boxing, as the boundary for starting the next order. Keep mixed-order packing and whole-order payment previously confirmed; this correction serializes different orders.

## Design Notes

Production ownership is transient; no mid-shift save or schema field. Selecting a customer is inspection, not permission to claim a second workbench. Staff must re-evaluate a pending preparation job when manual dough claims another ticket. Shared input eligibility should express structural workflow only; the existing express purchase path remains available for an eligible ingredient that has zero stock.

## Verification

Focused domain/runtime/staff/mixed-order units; Chromium 360×640 scene test for no-dough controls and cross-ticket workbench/boxed handoff; `npm.cmd run build-nolog`; blind, edge-case and acceptance review. No full viewport/browser matrix.

Results: 43 focused unit tests passed, plus four distinct Chromium 360×640 cases (manual workbench, staff workbench, counter mixed order, app mixed order). Production build passed. Three independent reviews found no concrete defects. Captures are in `ui-baseline/dough-workbench-2026-10-07/`. An unchanged legacy `CozyRuntime.test.ts` expects extraction at 3 seconds despite the current 6-second bake threshold; that pre-existing fixture was not altered.

## Suggested Review Order

- Follow the active order through shared manual and staff guards.
  [CozyRuntime.ts:432](../../src/runtime/CozyRuntime.ts#L432)
- Require dough before ingredients and clear toppings when dough is removed.
  [CozyOrder.ts:29](../../src/domain/CozyOrder.ts#L29)
- Draw the physical owner's pizza independently of the inspected customer.
  [CozyScene.ts:399](../../src/scenes/CozyScene.ts#L399)
- Verify packing, handoff, expiry, remake, rider waiting and staff races.
  [CozyWorkbench.test.ts:12](../../src/runtime/CozyWorkbench.test.ts#L12)
- Exercise the existing controls and workbench in the real scene.
  [dough-workbench.spec.ts:32](../../tests/dough-workbench.spec.ts#L32)
