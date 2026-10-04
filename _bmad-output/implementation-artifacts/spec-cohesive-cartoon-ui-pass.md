---
title: 'Cohesive Cartoon UI Pass'
type: 'feature'
created: '2026-10-01'
status: 'superseded'
context: []
---

> Superseded by the user's 2026-10-02 instruction to retain the current [approved UI baseline](ui-baseline-2026-10-02.md). This earlier draft is not an authorized task to generate a replacement kitchen or UI sheet. Preserve it as proposal history; a future redesign needs a new explicit user request.

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The current screen mixes several independently generated raster assets with live panels, creating duplicated text, inconsistent borders, and a composition that still feels assembled rather than designed as one game screen.

**Approach:** Generate a new text-free portrait kitchen base and a matching transparent UI asset sheet in one coherent 2D cartoon style. Recompose the Day 1 screen around the supplied reference hierarchy while keeping all live labels, gameplay controls, motion, and runtime behavior in Phaser.

## Boundaries & Constraints

**Always:** Use the earlier user-supplied UI image as the visual direction: warm wood, cream cards, tomato red accents, green primary action, rounded illustrated food and expressive customer art. Keep 360×640, every current control ID/bound/condition/dispatch, all pause/success/replay behavior, Vietnamese live text, and reduced-motion support. Generated art must contain no required text so dynamic values remain authoritative.

**Ask First:** Changing gameplay flow, adding/removing controls, changing hitboxes, or introducing licensed/external third-party art.

**Never:** Modify domain/runtime logic, bake dynamic money/time/status text into required artwork, copy a branded character, or remove existing fallback rendering.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Scene start | Assets load | One visually coherent shop scene appears with clean space for live HUD/order/actions | Existing vector/raster fallback remains playable if an asset fails |
| State change | Ingredient or stage changes | Matching sprites and live text update without duplicated baked-in labels | Same command and control metadata remain active |
| Pause/success | Blocking overlay appears | Overlay remains legible over the new scene and preserves motion rules | Gameplay stays paused exactly as before |

</frozen-after-approval>

## Code Map

- `public/assets/` -- generated project-local text-free background and transparent cartoon sprites.
- `src/scenes/BootScene.ts` -- preload manifest for new asset keys.
- `src/presentation/CozyArt.ts` -- scene composition and resilient fallbacks.
- `src/scenes/CozyScene.ts` -- live HUD, labels, controls, animation, and unchanged hit zones.

## Tasks & Acceptance

**Execution:**
- [ ] `public/assets/` -- add a cohesive new background plus matching transparent customer/food/control artwork generated with the built-in image tool.
- [ ] `src/scenes/BootScene.ts` -- register the new assets without altering campaign behavior.
- [ ] `src/presentation/CozyArt.ts` -- compose new art by state while retaining fallbacks.
- [ ] `src/scenes/CozyScene.ts` -- simplify visual layering, eliminate duplicated asset text, and preserve controls/motion.

**Acceptance Criteria:**
- Given the default route at 360×640, when loaded, then the screen reads as one cohesive 2D cartoon UI with no duplicated or conflicting text.
- Given each current stage, when the player acts, then control IDs, bounds, enabled rules, and runtime commands remain unchanged.
- Given missing art or reduced motion, when rendered, then the UI remains functional, legible, and accessible.
- Given production build and headless Chromium, when verified, then both complete without page errors or new dependencies.

## Spec Change Log

## Design Notes

The background should reserve calm areas for the HUD, order card, ingredient row, and primary action. Character and food sprites should share outline weight, lighting, and color treatment. Phaser remains responsible for all text and interactive state so artwork can be reused without stale values.

## Verification

**Commands:**
- `npm.cmd run build-nolog` -- expected: production build succeeds.
- Headless Chromium at 360×640 -- expected: scene boots, controls match the current metadata, and no page errors occur.

