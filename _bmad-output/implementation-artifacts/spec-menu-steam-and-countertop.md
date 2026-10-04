---
title: 'Increase pizza steam and align the menu countertop'
type: fix
created: '2026-10-02'
status: done
route: one-shot
baseline_commit: NO_VCS
---

# Increase pizza steam and align the menu countertop

## Intent

**Problem:** The pizza steam was too sparse, and the foreground countertop's left rear edge sat lower than its right edge, making the two sides look disconnected.

**Approach:** Render seven staggered steam trails across the pizza with layered soft strokes, higher opacity and varied rise periods. Preserve the existing reduced-motion, visibility and scene cleanup behavior. Edit the existing illustrated background with imagegen to make the countertop one continuous plane while keeping the pizza and board at their current size and position. Record the exact image edit prompt alongside the asset.

Inspected the full menu and countertop crop on the user's confirmed running server at `http://127.0.0.1:8082/`. The production build passed. One focused Playwright test passed in Chromium 390x844, checking rendered fire, curtain and steam motion, reduced-motion freeze and motion after menu reentry. An independent review of the steam change and its pixel checks found no actionable regressions; no patches or deferrals remained. Full browser/viewport testing stays deferred until Epic 1 completion or release, per the user's instruction. No VCS commit is available.

## Suggested Review Order

- Inspect the repaired countertop and its generation provenance.
  [main-menu-background.png](../../public/assets/main-menu-background.png)
  [main-menu-background.md](../../public/assets/main-menu-background.md)

- Inspect steam placement, density and animation lifecycle.
  [MainMenuScene.ts:11](../../src/scenes/MainMenuScene.ts#L11)

- Check rendered motion, reduced-motion freeze and menu reentry.
  [menu-ambience.spec.ts:17](../../tests/menu-ambience.spec.ts#L17)
