---
title: 'Smooth UI Motion'
type: 'feature'
created: '2026-09-30'
status: 'done'
baseline_commit: 'NO_VCS'
context: []
---

> Current visual contract (user-confirmed 2026-10-02): [approved UI baseline](ui-baseline-2026-10-02.md). This motion spec is historical implementation context, not permission to change the current layout/artwork or to restore old raster presentation. Retain current reduced-motion and pause protections; modify animation only within an explicit user request.

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The raster UI is visually richer, but redraws and state changes appear static and abrupt. Buttons do not acknowledge touch beyond the state change, and important transitions have little visual continuity.

**Approach:** Add short, restrained Phaser tweens for initial entrance, button touch feedback, ingredient selection, customer/order presence, oven activity, stage transitions, and modal appearance. Motion must remain decorative and derive only from existing UI state.

## Boundaries & Constraints

**Always:** Keep all current gameplay commands, enabled rules, control IDs, coordinates, dimensions, timers, pause ownership, and state transitions unchanged. Use transforms and opacity only; motion must never move the actual interactive zone. Keep most feedback between 90–240ms, use easing without overshoot for panels, and reserve subtle looping motion for decorative customer/oven elements. Kill obsolete tweens when the scene redraws so destroyed objects are not retained. Respect the browser `prefers-reduced-motion` setting by rendering the final state without animation.

**Ask First:** Adding sound, particles that obscure controls, changing hitboxes, or adding a new gameplay state.

**Never:** Delay command dispatch, alter the oven clock, animate during a blocking pause in a way that implies simulation continues, remove any current function, or add a dependency.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Tap | Enabled control tapped | Brief visual compression/ripple occurs and command dispatch remains immediate | Disabled controls do not animate as accepted input |
| State change | Ingredient/stage/modal changes | New visual state fades/scales into place without moving hit zones | Repeated redraw kills stale tweens first |
| Reduced motion | OS/browser requests reduced motion | UI renders immediately with no loops or entrance tween | Gameplay remains identical |
| Pause | Pause/order/orientation overlay appears | Overlay enters once and ambient loops stop behind it | Resume restores the normal state-driven motion |

</frozen-after-approval>

## Code Map

- `src/scenes/CozyScene.ts` -- all active UI objects, controls, redraw lifecycle, overlays, and state-driven presentation.
- `src/presentation/CozyArt.ts` -- raster image creation used by the scene; no gameplay ownership.

## Tasks & Acceptance

**Execution:**
- [x] `src/scenes/CozyScene.ts` -- add reduced-motion detection, tween cleanup, touch feedback, entrance/state/modal transitions, and restrained ambient motion.
- [x] `src/presentation/CozyArt.ts` -- expose created raster images where needed for safe scene-owned animation without changing rendered state.

**Acceptance Criteria:**
- Given normal motion preferences, when the UI starts or changes state, then visible elements transition smoothly while control metadata remains byte-for-byte equivalent for that state.
- Given an enabled control, when tapped, then feedback begins immediately and its existing command fires in the same pointer event.
- Given reduced-motion preference, when the scene renders, then no decorative tween remains active and all UI is visible at its final coordinates.
- Given repeated baking redraws or overlays, when old objects are removed, then their tweens are also removed and the active control set remains correct.
- Given the production build, when TypeScript and Vite run, then they succeed without new dependencies.

## Spec Change Log

## Design Notes

Motion should clarify cause and effect: selected ingredients pop once, the active pizza/stage gets a small emphasis pulse, and overlays ease into place. Avoid continuous movement across the whole screen; the food and customer may breathe subtly, while text and critical controls remain stable and readable.

## Verification

**Commands:**
- `npm.cmd run build-nolog` -- expected: typecheck and production bundle succeed.
- Headless Chromium at 360×640 -- expected: scene boots, controls remain at existing bounds, and no page errors occur.

## Suggested Review Order

**Motion lifecycle and accessibility**

- Tracks reduced-motion changes and cleans listeners with the scene lifecycle.
  [`CozyScene.ts:13`](../../src/scenes/CozyScene.ts#L13)

- Stops active visual tweens before destroying redraw targets.
  [`CozyScene.ts:46`](../../src/scenes/CozyScene.ts#L46)

**Interaction feedback**

- Adds short ingredient, touch, and stage emphasis without moving hit zones.
  [`CozyScene.ts:29`](../../src/scenes/CozyScene.ts#L29)

- Dispatches existing commands immediately from unchanged control zones.
  [`CozyScene.ts:43`](../../src/scenes/CozyScene.ts#L43)

**Ambient and modal motion**

- Limits customer and oven loops to active, appropriate states.
  [`CozyScene.ts:52`](../../src/scenes/CozyScene.ts#L52)

- Animates each modal reason once with restrained fade and slide.
  [`CozyScene.ts:64`](../../src/scenes/CozyScene.ts#L64)

**Raster ownership**

- Exposes scene-owned raster objects for safe tween targeting.
  [`CozyArt.ts:6`](../../src/presentation/CozyArt.ts#L6)
