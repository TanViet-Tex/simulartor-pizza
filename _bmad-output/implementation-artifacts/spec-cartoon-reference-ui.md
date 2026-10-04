---
title: 'Cartoon Reference UI'
type: 'feature'
created: '2026-09-30'
status: 'done'
baseline_commit: 'NO_VCS'
context: []
---

> Current visual contract (user-confirmed 2026-10-02): [approved UI baseline](ui-baseline-2026-10-02.md). Earlier one-customer/three-ingredient sketches and the suggestion to omit locked slots below are historical, superseded by the current three-customer, five-sauce and ten-ingredient composition. Preserve current artwork and geometry unless the user explicitly requests a change.

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The current Day 1 screen uses blocky procedural pixel-style artwork and does not match the supplied warm 2D cartoon pizza-shop reference.

**Approach:** Redraw the existing portrait interface as an original 2D cartoon composition inspired by the reference: warm shop background, compact HUD, customer/order/oven stage, preparation area, ingredients, and a prominent delivery action. Preserve the current state machine and commands.

## Boundaries & Constraints

**Always:** Keep the 360×640 logical canvas, portrait layout, Vietnamese labels, and touch targets at least 48×48. Keep every existing command and stage available: view order, choose dough/sauce/cheese, bake, box, deliver, pause/resume, success, and replay. Use smooth rounded shapes, clear outlines, warm red/cream/wood colors, soft highlights, and readable contrast. Show day, money, reputation, and time/oven status in the HUD; place the waiting customer on the left, the order on the right, the oven centrally, and ingredients plus the main action near the bottom.

**Ask First:** Adding external assets or fonts, changing canvas dimensions, or changing the input flow.

**Never:** Change domain/runtime files, gameplay rules, rewards, timings, persistence, pause ownership, or command semantics. Do not copy characters or branded assets from the reference image.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Assemble | Zero to three chosen ingredients | Ingredient cards clearly show availability and selection; bake enables only when all three are chosen | Disabled controls remain readable and non-interactive |
| Bake and finish | Baking, ready, or boxed stage | Oven timer/progress is visible; primary action changes to bake, box, then “Giao pizza” without changing commands | Pause overlays cover controls and preserve state |
| Small viewport | 360×640 portrait | All required regions fit without page scrolling; every actionable target is at least 48px | Landscape keeps the existing pause prompt |

</frozen-after-approval>

## Code Map

- `src/presentation/CozyArt.ts` -- procedural shop, customer, oven, pizza, counter, and ingredient illustrations.
- `src/scenes/CozyScene.ts` -- HUD, panels, labels, state-driven actions, overlays, and hit targets.

## Tasks & Acceptance

**Execution:**
- [x] `src/presentation/CozyArt.ts` -- replace stepped pixel geometry with rounded cartoon drawing helpers and redraw the warm shop composition.
- [x] `src/scenes/CozyScene.ts` -- reorganize the HUD and controls to match the reference hierarchy while retaining the same runtime dispatches.

**Acceptance Criteria:**
- Given any existing Day 1 stage, when the screen redraws, then it uses the warm 2D cartoon layout and exposes the same valid action as before.
- Given the 360×640 viewport, when the player interacts with the screen, then no critical label is clipped and every control recorded in `data-controls` is at least 48px high and wide.
- Given all three ingredients are selected and the pizza progresses through baking and boxing, when the final action becomes valid, then it is prominently labeled “Giao pizza” and dispatches the existing deliver command.
- Given pause, order, orientation, success, or replay UI is displayed, when it is used, then its existing behavior remains unchanged.

## Spec Change Log

## Design Notes

The visual reference supplies hierarchy and mood, not reusable artwork. The implementation should approximate its rounded panels, scalloped awning, cream order card, green primary action, and food-focused illustration using original Phaser vector shapes. The smaller game scope has one customer and three ingredients, so empty/locked reference slots are omitted rather than implying unavailable gameplay.

## Verification

**Commands:**
- `npm.cmd run build-nolog` -- expected: TypeScript and Vite production build complete successfully.

## Suggested Review Order

**Screen hierarchy and actions**

- Starts from the state-driven 360×640 composition and HUD.
  [`CozyScene.ts:27`](../../src/scenes/CozyScene.ts#L27)

- Keeps every interactive target at least 48px and preserves dispatch behavior.
  [`CozyScene.ts:21`](../../src/scenes/CozyScene.ts#L21)

- Makes the final delivery state a prominent green “Giao pizza” action.
  [`CozyScene.ts:41`](../../src/scenes/CozyScene.ts#L41)

**Cartoon presentation**

- Builds the warm shop, central oven, worktop, and pizza with smooth vector shapes.
  [`CozyArt.ts:48`](../../src/presentation/CozyArt.ts#L48)

- Uses an original expressive customer illustration on the left.
  [`CozyArt.ts:26`](../../src/presentation/CozyArt.ts#L26)

**Modal continuity**

- Retains pause, order, orientation, success, and replay behavior.
  [`CozyScene.ts:46`](../../src/scenes/CozyScene.ts#L46)
