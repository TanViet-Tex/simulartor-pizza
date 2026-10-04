---
title: 'Use the reference pizza box after boxing'
type: chore
created: '2026-10-04'
status: done
route: one-shot
baseline_commit: NO_VCS
---

# Use the reference pizza box after boxing

## Intent

**Problem:** The user requested implementing the pizza box in `public/assets/references/hộp pizza.png` when pressing Đóng hộp.

**Approach:** Replace only the boxed-stage board illustration with this transparent PNG, preserving aspect ratio at width130 centered116,340. Startup validates it as a mandatory Cozy asset before gameplay. Other artwork, controls, packaging rules and money/delivery behavior stay unchanged. Freeplay, tutorial and commercial Cozy rendering use the same boxed-stage renderer; optional legacy campaign remains separate.

## Suggested Review Order

- [CozyScene.ts](../../src/scenes/CozyScene.ts): boxed-stage rendering on the existing board.
- [PizzaBoxArt.ts](../../src/presentation/PizzaBoxArt.ts) and [StartupScene.ts](../../src/scenes/StartupScene.ts): required reference asset loading.
- [cozy.spec.ts](../../tests/cozy.spec.ts): screenshot after boxing, unchanged cash until delivery, full touch lifecycle.

Validation: build-nolog passed. Focused Chromium390x844 Day1 assemble/bake/extract/box/deliver test passed; visually inspected cozy-boxed-reference.png and confirmed no overlap with the status/action. No full browser matrix. No VCS available.
Independent adversarial review found no actionable introduced defects; screenshot was manually inspected, not an automated visual assertion.
