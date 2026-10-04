---
title: 'Story 1.2 — Validated boot and portrait shell'
type: feature
created: '2026-10-01'
status: done
baseline_commit: NO_VCS
context: []
---

## Intent

Finish missing Story 1.2 boot validation, required-asset failure/retry, mobile typography/contrast and load-budget verification. User explicitly authorized implementation after reviewing the gap list. Keep the approved cartoon layout, SVG icons, two ovens and existing gameplay.

## Boundaries

The approved October 1 cartoon direction supersedes the original red-primary/2px-radius requirements. Use the shared immutable cartoon theme: green primary with dark text, cream panels, warm wood, 9/11/20px tile/panel/modal radii, zero letter spacing, 4/8/12/16/24 spacing vocabulary and >=48 CSS px actionable targets. No downloaded art, dependency installation, campaign rule change or data reset. Validate existing demo content compatibility rather than invent new recipes or days.

## Code Map

- `src/config/gameContent.ts`, `public/game-content.json`: immutable validated content and asset manifest.
- `src/scenes/StartupScene.ts`, `src/main.ts`, `src/presentation/PizzaIcons.ts`: startup gate before either playable route, required loads and retry.
- `src/presentation/theme.ts`, `CozyArt.ts`, `src/scenes/CozyScene.ts`, `src/style.css`: shared colors, typography, portrait safe area.
- `src/config/gameContent.test.ts`, `src/presentation/theme.test.ts`, `tests/boot.spec.ts`: validation, contrast, failures/retry, geometry and load evidence.

## Tasks & Acceptance

- [x] Validate config once per boot attempt into deeply immutable `ValidatedGameConfig`. Missing/duplicate/unknown IDs, invalid references and non-finite/out-of-range values prevent gameplay.
- [x] Load mandatory manifest assets before constructing gameplay. On config/network/decode failure show a stable Vietnamese error and >=48px retry; no save mutation or silent fallback. Retry can recover after the resource is repaired.
- [x] Apply approved theme and verify normal text >=4.5:1, essential boundaries/selection >=3:1. Keep Vietnamese glyphs fully visible and all actionable touch regions >=48px after scale.
- [x] Verify 360x640, 390x844, 412x915 on Chromium/WebKit, including nonzero safe-area simulation, no overflow and screenshots. Cold local production boot <=5 seconds and loaded resource bodies <=10 MB; report test environment rather than claiming slow-network certification.
- [x] Run build, focused unit checks and browser regressions; update this story and sprint status with evidence.

Given a valid config/assets, starting either route reaches its existing screen. Given malformed content or a missing mandatory asset, gameplay stays unconstructed until an explicit successful retry. Given repeated failures, retry stays usable and campaign storage remains untouched. Given a phone viewport, typography and controls remain within canvas/safe area.

## Verification

Build and 43 unit tests pass. Boot/smoke matrix: 50 passed, 10 intentionally skipped (two extra timing/short-screen regressions run once, not repeated on the other five profiles). Portrait screenshots visually checked at 360x640, 390x844 and 412x915. Cold production boot: Chromium 1680/813/980 ms; WebKit 1579/1625/1356 ms. Decoded resource bodies: 1,451,590 bytes per run, below 10 MiB. Measurements are local, unthrottled; they do not certify physical-device or slow-network performance. Gameplay regression: 12 passed on Chromium/WebKit 360x640 with one worker. Initial two-worker run had WebKit oven-time timeouts; the serial run confirmed all existing baking, burning, pause, delivery and campaign checkpoint scenarios. Existing unrelated story statuses are not inferred from gameplay code.

Commands: `npm run build-nolog`; `npx vitest run`; `npx playwright test tests/boot.spec.ts tests/smoke.spec.ts --workers=1`; `npx playwright test tests/cozy.spec.ts tests/gameplay.spec.ts --project=chromium-360x640 --project=webkit-360x640 --workers=1 --output=test-results/regression-serial`.

## Review fixes

Three independent scoped reviews completed. Fixed stale loader callbacks after retry (abort/detach + generation guards), touch-padding overlaps on short screens (visible controls win), and heat-marker contrast (dark outline). Added malformed SVG recovery and successful campaign retry coverage. Removed unused legacy campaign PNG downloads; actual campaign rendering is procedural and unchanged.

## Suggested Review Order

- Boot gate and retry: [StartupScene.ts](../../src/scenes/StartupScene.ts).
- Content boundary: [gameContent.ts](../../src/config/gameContent.ts).
- Approved visual contract: [theme.ts](../../src/presentation/theme.ts).
- Mobile and failure evidence: [boot.spec.ts](../../tests/boot.spec.ts).
