---
title: 'Post-tutorial preparation in the existing day hub'
type: feature
created: '2026-10-03'
status: done
baseline_commit: NO_VCS
---

# Post-tutorial preparation in the existing day hub

## Intent

**Problem:** The user wants to remove the separate market after tutorial and open Chợ in the approved summary interface.

**Approach:** Reuse its layout for initial preparation with truthful copy, real money/stock and the existing openShop command. No dummy report, closed day, rent settlement or day increment. Preserve direct-shop, checkpoint cadence, actual end-day hub and pause/save guards. Keep a session-only tutorial-completed selector in runtime so menu return retains the surface.

## Tasks & Acceptance

- [x] `src/runtime/CozyRuntime.ts`: expose post-tutorial preparation without changing economic state.
- [x] `src/scenes/CozyScene.ts`: hub defaults to Chợ, supports null report, opens Day 1 through openShop.
- [x] `src/runtime/CozyTutorial.test.ts`, `tests/tutorial.spec.ts`: isolation, buy and open once, focused end-day regression.
- [x] Synchronize UI baseline and project context.

Given completed tutorial, when confirmed, then hub opens Chợ at day 1, phase preparation, cash 300 and no report. Given empty stock, opening is disabled. Given purchased ingredients, opening starts Day 1 without increasing day or granting practice rewards. Normal closed-day reports/next-day preparation remain unchanged. Other UI geometry/artwork and gameplay are unchanged.

## Verification

Build, focused tutorial/day unit tests, Chromium 390×844 tutorial/day-end checks and visual inspection of initial hub.


Validation: build-nolog and 14 focused runtime unit tests passed. Focused Chromium390x844 checks passed for tutorial buying/opening, campaign pause/menu-return/new-campaign cancellation, nested tutorial pause ownership, and two real end-day flows. Visually inspected post-tutorial-market.png. Independent reviews prompted restoring pause/menu/reset access and preserving reset confirmation. Menu-return E2E exposed purchase ID collisions; scene-scoped UUID command IDs fix this while preserving double-tap deduplication. No full browser matrix run.

## Suggested Review Order

- [CozyScene.ts:184](../../src/scenes/CozyScene.ts#L184): route tutorial-completed preparation into the approved hub.
- [CozyRuntime.ts:211](../../src/runtime/CozyRuntime.ts#L211): session-only selector leaves economics and checkpoints intact.
- [tutorial.spec.ts](../../tests/tutorial.spec.ts): buying, pause/menu return and opening Day1.
