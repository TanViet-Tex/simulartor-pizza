---
title: 'Replace the two Cozy oven illustrations'
type: 'chore'
created: '2026-10-03'
status: 'done'
route: 'one-shot'
---

# Replace the two Cozy oven illustrations

## Intent

**Problem:** The user supplied two PNG oven illustrations and requested replacing the two existing ovens.

**Approach:** Use the empty illustration for idle/locked ovens and the pizza illustration for an occupied first oven. Preserve both existing 116×77 rectangles at x=236, y=296/379, labels, locked second oven, temperature gauge and input. Use the subsequently user-supplied `Lò nướng mini với pizza cháy khét.png` for the burnt state. Load both textures through the existing startup error/retry gate. Other UI and gameplay remain unchanged.

## Suggested Review Order

1. [Oven renderer](../../src/scenes/CozyScene.ts) — `ovens()` selects empty/occupied art without moving controls.
2. [Asset manifest](../../src/presentation/OvenArt.ts) and [startup gate](../../src/scenes/StartupScene.ts) — both supplied PNGs are mandatory Cozy assets.
3. [Approved UI scope](ui-baseline-2026-10-02.md) — scoped oven artwork update.

Validation: `npm run build-nolog` passed. Two focused tests in `tests/cozy.spec.ts` passed on Chromium 390×844 (assemble/bake/extract/deliver and burn/discard). Visually inspected `test-results/cozy-leaving-pizza-past-th-dd5ac--and-allows-a-fresh-attempt-chromium-390x844/two-ovens-baking.png`. Independent adversarial review found no actionable introduced bugs. No full browser matrix run.
