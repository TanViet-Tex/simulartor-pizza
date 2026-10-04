---
title: 'Raster Cartoon Assets'
type: 'feature'
created: '2026-09-30'
status: 'done'
baseline_commit: 'NO_VCS'
context: []
---

> Current visual contract (user-confirmed 2026-10-02): [approved UI baseline](ui-baseline-2026-10-02.md). This earlier asset migration is historical context, not authority to replace current procedural panels/art or regenerate assets. Retain the current kitchen and illustrated menu; visual changes require an explicit user request.

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The active Day 1 interface still derives its main visual identity from procedural Phaser geometry, so it does not achieve the polished illustrated look of the supplied reference despite the revised layout.

**Approach:** Use the existing project-local PNG cartoon artwork for the kitchen, customer card, pizza states, ingredients, top bar, and action buttons. Register the asset manifest through `BootScene`, render those assets from `CozyArt` and `CozyScene`, and retain the current text, state machine, overlays, action dispatches, and hit regions.

## Boundaries & Constraints

**Always:** Keep the 360×640 logical canvas and current portrait layout. Preserve the existing control IDs, coordinates, dimensions, enabled conditions, runtime dispatches, pause behavior, data attributes, and accessibility label. Keep current functionality for viewing the order, selecting all three ingredients, baking, boxing, delivering, pausing, resuming, completing, and replaying. Use assets from `public/assets` and provide graceful visual fallback if a texture is unavailable.

**Ask First:** Generating a replacement asset set, adding packages/fonts, changing any gameplay command, or moving a hitbox.

**Never:** Change domain/runtime code, timing, rewards, state transitions, persistence, or remove any current function. Do not depend on text baked into an asset for dynamic game state or accessibility.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Asset preload | Day 1 scene starts | All raster textures are registered before the first draw | Missing texture falls back to existing vector panel/color rather than breaking input |
| Ingredient selection | Assembly state | Dough, sauce, and cheese cards use PNG art while retaining the same selection and enabled behavior | Disabled/selected state remains visible through overlays and borders |
| Stage progression | Bake → ready → boxed → delivered | Pizza and primary action imagery changes with state; the same runtime commands fire | Dynamic labels remain live Phaser text |

</frozen-after-approval>

## Code Map

- `public/assets/*.png` -- existing original raster art used by the Day 1 interface.
- `src/scenes/BootScene.ts` -- shared texture-key manifest and Phaser preload registration.
- `src/presentation/CozyArt.ts` -- raster kitchen/pizza composition with vector fallback helpers.
- `src/scenes/CozyScene.ts` -- asset preload call, image placement, dynamic labels, state styling, and unchanged hit zones.
- `src/main.ts` -- smooth texture sampling for high-resolution cartoon raster assets.

## Tasks & Acceptance

**Execution:**
- [x] `src/scenes/BootScene.ts` -- expose and call the shared raster preload manifest without changing campaign behavior.
- [x] `src/presentation/CozyArt.ts` -- replace main procedural scene and pizza drawing with loaded image assets while preserving fallback methods used by UI overlays.
- [x] `src/scenes/CozyScene.ts` -- preload/render raster HUD, customer, ingredients, and stage action images beneath the existing live labels and hit zones.
- [x] `src/main.ts` -- disable pixel-art texture sampling so PNG artwork scales smoothly.

**Acceptance Criteria:**
- Given the default game route, when the Day 1 scene starts, then the warm kitchen background, customer/order art, pizza, ingredients, and action art render from PNG textures.
- Given any gameplay stage, when the player taps a current control, then its control ID, bounds, enabled rule, and dispatched command are unchanged.
- Given a texture load failure, when the scene draws, then the game remains playable with readable controls and no missing-texture crash.
- Given the production build, when TypeScript and Vite run, then they complete successfully without adding dependencies.

## Spec Change Log

## Design Notes

The project already contains a cohesive non-pixel raster set in `public/assets`, including `background-kitchen.png`, `customer-card.png`, pizza/ingredient PNGs, `top-bar.png`, and three action buttons. Reusing these avoids unnecessary asset generation and keeps the visual set internally consistent. Raster art supplies illustration and texture; Phaser still owns dynamic labels, selection outlines, progress, modals, accessibility, and input.

## Verification

**Commands:**
- `npm.cmd run build-nolog` -- expected: typecheck and production bundle succeed.

## Suggested Review Order

**Asset loading and composition**

- Defines one shared manifest used by both game scenes.
  [`BootScene.ts:8`](../../src/scenes/BootScene.ts#L8)

- Replaces the main procedural scene with raster background and stateful pizza art.
  [`CozyArt.ts:58`](../../src/presentation/CozyArt.ts#L58)

**Live UI and unchanged controls**

- Places raster layers while retaining current control metadata and fallbacks.
  [`CozyScene.ts:23`](../../src/scenes/CozyScene.ts#L23)

- Keeps control bounds, enabled rules, labels, and dispatch callbacks together.
  [`CozyScene.ts:27`](../../src/scenes/CozyScene.ts#L27)

- Builds the state-driven screen over the illustrated kitchen.
  [`CozyScene.ts:34`](../../src/scenes/CozyScene.ts#L34)

**Rendering quality**

- Enables smooth sampling for high-resolution cartoon PNG assets.
  [`main.ts:14`](../../src/main.ts#L14)
