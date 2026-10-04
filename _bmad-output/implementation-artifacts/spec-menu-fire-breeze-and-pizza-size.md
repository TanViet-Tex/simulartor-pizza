---
title: 'Visible menu fire, window breeze and a smaller pizza'
type: fix
created: '2026-10-01'
status: done
route: one-shot
baseline_commit: NO_VCS
---

# Visible menu fire, window breeze and a smaller pizza

## Intent

**Problem:** The menu's oven only had a subtle glow, the window had no breeze or fluttering curtain, and the foreground pizza looked too large for its counter.

**Approach:** Add independently moving flame tongues and embers, subtle incoming breeze streaks, and a generated transparent curtain anchored at its top. Use a deformed Phaser Rope in WebGL and an animated image fallback in Canvas. Reduce the pizza and its board through a targeted background edit while preserving the scene composition. Keep all decorative motion owned by the menu lifecycle and its shared reduced-motion setting; do not change gameplay or session continuation.

The built-in imagegen tool produced the refined backdrop and curtain; prompts/provenance are recorded beside the assets. Required curtain loading uses the existing boot retry gate. Production build and TypeScript passed. Four focused Chromium 390x844 E2E tests passed, including rendered-pixel evidence of flame/curtain motion, static reduced-motion rendering, reentry and required-asset retry. Menu screenshot inspected: pizza sits within the counter, curtain hangs at the left window and title/buttons remain readable. Full browser matrix was not run. Independent adversarial review found no actionable regressions; no patches or deferrals remained. No VCS commit available.

## Suggested Review Order

- Own flame shapes, breeze and cloth movement as presentation-only objects.
  [MenuAmbience.ts:7](../../src/presentation/MenuAmbience.ts#L7)

- Bind ambience to menu creation, motion preferences and lifecycle cleanup.
  [MainMenuScene.ts:36](../../src/scenes/MainMenuScene.ts#L36)

- Require the curtain before menu entry and preserve the retry gate.
  [StartupScene.ts:55](../../src/scenes/StartupScene.ts#L55)

- Record the image edits and transparent curtain generation prompts.
  [main-menu-background.md:15](../../public/assets/main-menu-background.md#L15)

- Check actual rendered motion, reduced-motion freeze, reentry and asset retry.
  [menu-ambience.spec.ts:17](../../tests/menu-ambience.spec.ts#L17)
