---
title: 'Tiệm Pizza Ấm Áp — Day 1 interaction preview'
type: 'feature'
created: '2026-09-30'
status: 'in-review'
baseline_commit: 'NO_VCS'
context: []
---

> Current visual contract (user-confirmed 2026-10-02): [approved UI baseline](ui-baseline-2026-10-02.md). This initial preview spec is historical; use the current menu entry, three customer positions, five-sauce shelf and ten-tile ingredient grid. Do not recreate the earlier one-customer layout. Current story/domain rules govern timing and production behavior.

<frozen-after-approval reason="explicit user request defines the authorized scope">

## Intent

**Problem:** The existing campaign interface does not express the warm shop composition from the supplied references with the 2D cartoon direction requested on 2026-09-30. The user wants a Day 1 interface preview with one customer and one simple pizza, rather than expansion of the campaign.

**Approach:** Present an original portrait 2D cartoon shop with wood, amber lamps, terracotta brick, a customer waiting area, oven, counter and preparation station. Reuse the existing isolated CozyOrder/CozyRuntime fixture for a touchable cheese-pizza sequence. The primary entry displays the preview; the existing campaign remains reachable through an explicit legacy query route for regression verification.

## Boundaries & Constraints

**Always:** Phaser owns all in-game UI, TypeScript domain remains independent of presentation, and main.ts injects the runtime. Use the existing 360x640 logical viewport and approved dependencies. Every actionable region is at least 48x48 at the three approved mobile viewports. Vietnamese labels identify actions and statuses. Keep one customer, one cheese order, day/cash/reputation/energy/pause HUD, order viewing, ingredient selection, baking, boxing and delivery. New art is original 2D cartoon artwork with smooth outlines and soft shading; references guide warmth and composition only. Pause owners are released individually; hidden tabs and landscape suspend cooking, and returning from a hidden tab requires a tap. Simulation uses the existing fixed 50 ms clock. Scene shutdown removes external listeners.

**Ask First:** New dependencies, external services, permanent campaign mutations or additional game systems.

**Never:** Copy reference characters or assets, implement 30 days, introduce DOM gameplay, add accounts/backend, replace or delete existing campaign saves, or imply prototype values are a completed economy.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Initial visit | Fresh preview | Day 1, Linh, one cheese order, empty prep station | No persistence access |
| Order | Tap xem đơn | Readable order overlay and paused simulation | Close releases only order pause |
| Assembly | Select dough, sauce, cheese | Visible ingredients and selected controls | Cannot bake before complete |
| Cooking | Bake complete recipe | Eight simulated seconds with visible progress | No boxing before ready |
| Service | Box then deliver | Box illustration, thank-you and one reward | Repeated delivery cannot reward twice |
| Pause | User pause, tab hidden, orientation | Blocking overlay, retained pizza and timer | Each owner releases only itself |
| Replay | Completed preview | Replay resets only fixture | Campaign checkpoint untouched |

</frozen-after-approval>

## Code Map

- `src/domain/CozyOrder.ts`, `src/runtime/CozyRuntime.ts` — existing isolated flow and fixed-step timing.
- `src/scenes/CozyScene.ts`, `src/presentation/CozyArt.ts` — new scene and original 2D cartoon drawing.
- `src/main.ts`, `src/style.css`, `index.html` — composition, warm host and title.
- `tests/cozy.spec.ts`, `tests/gameplay.spec.ts`, `tests/smoke.spec.ts` — new touch acceptance and preserved campaign tests.

## Tasks & Acceptance

**Execution:**
- [ ] New scene/art — implement coherent shop, clear HUD, order card, ingredient selection and state-driven controls.
- [ ] main/host — inject fixture and select preview by default; preserve existing campaign route.
- [ ] Tests — cover complete flow, disabled actions, pause ownership, viewport sizing and error-free rendering.
- [ ] Build and verify production on Chromium/WebKit at all approved viewports; inspect screenshot.

**Acceptance Criteria:**
- Given a phone in portrait, when the preview opens, then its interior, one customer, single order and all HUD values are legible without scrolling.
- Given an incomplete pizza, when actions are tapped out of order, then no state is advanced and the available next action is clear.
- Given a complete pizza, when the player bakes, boxes and delivers, then feedback confirms delivery once and permits replay of this preview.
- Given overlapping pauses, when only one closes, then the oven remains paused until all are released.
- Given an existing campaign checkpoint, when the preview is used, then that checkpoint remains untouched.

## Design Notes

The user's warm orange/brown direction supersedes the earlier provisional dark-neutral palette. Retain the 360x640 canvas to preserve existing scale behavior. Render cartoon illustrations with rounded shapes, smooth anti-aliased outlines, subtle shading, proportional scaling, and readable Vietnamese system text. Prefer a large shop illustration over dashboard cards. Clearly label the experience as a Day 1 sample.

## Verification

- `npm test -- --run` — domain/runtime tests pass.
- `npm run build-nolog` — strict TypeScript and production build pass.
- `npm run test:e2e` — preview and legacy regression pass on Chromium/WebKit.
- Inspect captured portrait screenshots for clipping, legibility, warm palette and original 2D cartoon illustration.

## Spec Change Log

- Existing fixture classes discovered and reused. User's detailed implementation request authorizes this preview; no campaign expansion.



## Art direction update — 2026-09-30

User-confirmed direction: **2D cartoon**, replacing the previous pixel-art direction. Use soft rounded forms, clear smooth outlines, warm wood/cream/tomato/amber colors, expressive characters, and subtle shading. Keep Vietnamese text readable and retain existing gameplay, portrait layout, and touch-target requirements. This direction supersedes earlier conflicting visual assumptions; existing palette tokens require validation during implementation. This update changes documentation only: cartoon artwork/rendering and visual verification remain pending. Prior completion and test records describe the previous implementation.
