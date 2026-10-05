---
title: 'Mobile runtime performance and transient cleanup'
type: bugfix
created: '2026-10-05'
status: done
baseline_commit: 75c00b9
context:
  - _bmad-output/project-context.md
  - _bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md
---

<frozen-after-approval reason="user explicitly requested investigation and implementation within this scope">

## Intent

Fix severe mobile production stutter, delayed taps and stale effects. Investigate allocation and lifecycle first, then remove confirmed rendering churn/leaks. Measure object/tween/timer/listener counts and mobile-sized production performance where possible; distinguish desktop emulation from real-phone evidence.

## Boundaries & Constraints

Always preserve deterministic50ms gameplay, rules, money, inventory, save, input targets, UI/art/layout and normal browser-frame rendering. All transient effects must finish/destroy or clean up on transition/shutdown. Rendering may update existing objects separately from simulation. Diagnostics opt-in only, no visible UI additions. Never redesign, install libraries, alter gameplay timing or refactor unrelated systems. Only typecheck, relevant units and focused mobile production tests; no full Playwright.

## I/O & Edge-Case Matrix

| Given | When | Then |
|---|---|---|
| Idle/preparation/paused | Many frames | No repeated UI allocation or redraw |
| Active oven/customer/express clocks | Fixed-step advances | Same simulation values; retained visuals update without rebuilding UI |
| Tap/feedback/modal | Completion or state transition | Effect destroyed; no stale overlays or click-through |
| Menu/play restart | Repeated transitions | Objects/tweens/timers/listeners bounded and subscriptions cleaned |
| Reduced motion or shutdown | Active effects | Timers/tweens removed and transient objects destroyed |
| Diagnostics off | Normal production | No profiling overhead or expensive frame-level debug serialization |

</frozen-after-approval>

## Code Map

- `src/scenes/CozyScene.ts`: signature, full redraw, timers/rings/heat, hit zones, feedback and cleanup.
- `src/presentation/StaticGraphics.ts`: raster cache/readback and bounded ownership.
- `src/scenes/MainMenuScene.ts`, `src/presentation/MenuWind.ts`: animation costs/ownership audit, targeted fix only if confirmed.
- `src/presentation/RuntimeDiagnostics.ts`, `src/main.ts`: opt-in counts/creation/FPS for before/after production checks.
- `tests/mobile-performance.spec.ts`: production360×640 sustained clocks, transient expiry and scene transitions; CPU emulation measurement.
- Existing lifecycle/runtime tests: unchanged deterministic timing and pause ownership.

## Tasks & Acceptance

- [x] Audit repeated allocation/tweens/feedback/listeners/shutdown/hidden updates/textures/DPR and record exact evidence.
- [x] Add opt-in diagnostics, collect baseline without gameplay changes.
- [x] Separate structural UI redraw from clocks; retain clocks/rings/heat, guard unchanged text/graphics/input updates.
- [x] Fix confirmed transient cleanup/state-transition causes with explicit ownership.
- [x] Apply only measured/sourced animation optimizations preserving approved motion.
- [x] Typecheck/build/relevant unit and mobile production checks, before/after report, independent review.

Given equivalent input and elapsed time, when applying optimized renderer, then deterministic runtime/checkpoint remains unchanged. Given repeated pause/settings/menu and popup cycles, when closing/completing/shutting down, then no accumulated effect/timer/listener or live stale object. Given continuous clocks with unchanged structure, when simulating several seconds, then full UI allocations remain zero and browser keeps rendering/input independently of50ms simulation. No claim that emulated desktop FPS certifies physical phones.

## Design Notes

Clock fields currently enter the Cozy signature and trigger `layer.removeAll(true)` plus Text creation and StaticGraphics full pixel scans. Keep structural signature including stage/ingredients/IDs/runtime revision and pause ownership, excluding continuously changing seconds. Retain dynamic rings/clock text and update only changed values; maintain mask/effect cleanup. Avoid speculative pools/refactors until baseline identifies necessary work. MainMenu cleanup and modal ownership currently appear sound; MenuWind has dense zero-weight vertex work and an expensive Canvas fallback. DPR is already logical360×640; do not reduce resolution unnecessarily.

## Verification

Production build + Chromium360×640 only, optional4×CPU slowdown; counters before/after and long-frame distribution. Relevant lifecycle/runtime unit tests and renderer regression only. Audit scene event/timer managers from installed Phaser4.2.1 sources. No fullbrowser matrix, no temporary overlays in normal play.

## Results and review

Build/typecheck and39 current unit tests passed. Three focused production mobile performance regressions passed; six focused pause/settings/background/Menu tests passed earlier. The documented legacy3s extraction assertion still fails unchanged. No full Playwright. See [measured report](mobile-performance-report.md) and raw before/after captures for counts and limits.

Blind/edge/acceptance reviewers found two patch regressions (freeplay readiness and no-inspected-order courier countdown), CDP portability and live-visual/reduced-motion coverage gaps. All addressed; edge and acceptance rechecked with no outstanding findings. No speculative MenuWind/asset optimization was necessary for the confirmed churn fix. Physical-phone FPS is not certified by desktop emulation.

## Suggested Review Order

**Retained rendering and input**

- Structural changes redraw; elapsed clocks update retained visuals independently.
  [CozyScene.ts:177](../../src/scenes/CozyScene.ts#L177)
- Transient effects own completion and state-transition cleanup; hit handlers stay installed.
  [CozyScene.ts:202](../../src/scenes/CozyScene.ts#L202)
  [CozyScene.ts:247](../../src/scenes/CozyScene.ts#L247)
- Static quantity decorations are cached; patience and heat remain dynamic.
  [CozyScene.ts:475](../../src/scenes/CozyScene.ts#L475)
- Both courier label branches retain live countdowns.
  [CozyScene.ts:551](../../src/scenes/CozyScene.ts#L551)

**Measurement and regressions**

- Opt-in probe measures allocations, objects and managers; disabled in ordinary play.
  [RuntimeDiagnostics.ts:4](../../src/presentation/RuntimeDiagnostics.ts#L4)
  [main.ts:90](../../src/main.ts#L90)
- Production checks cover clock changes, cleanup/restarts, readiness and courier countdown.
  [mobile-performance.spec.ts:4](../../tests/mobile-performance.spec.ts#L4)
- Compare raw counts and read device/FPS limitations.
  [mobile-performance-report.md:1](mobile-performance-report.md#L1)



