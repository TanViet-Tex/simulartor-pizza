---
title: 'Shop Screen Visual Redesign from Reference'
type: 'feature'
created: '2026-09-29'
status: 'done'
baseline_commit: 'NO_VCS'
context:
  - '_bmad-output/project-context.md'
  - '_bmad-output/game-architecture.md'
---

> Current visual contract (user-confirmed 2026-10-02): [approved UI baseline](ui-baseline-2026-10-02.md). This completed redesign is historical context. Keep the present illustrated menu and kitchen geometry/theme; do not rerun or expand this redesign during gameplay stories.

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The active shop screen is currently drawn as plain colored rectangles and text, while the supplied reference uses a warm, illustrated, portrait kitchen interface. The visual gap makes the playable demo feel unlike the intended pizza-making game.

**Approach:** Redesign the Phaser start and shop screens at the existing 360x640 logical size to closely follow the supplied references. The start screen uses a warm illustrated pizza-shop interior, title sign, chef/pizza centerpiece, and prominent existing campaign actions. The shop uses a burgundy day/currency bar and striped awning, three customer slots, cream order bubble, recipe tiles, illustrated wooden prep counter with pizza and side tools, green primary action, and a two-row ingredient tray with muted decorative lock tiles. Use Phaser-owned vector/procedural drawing and typography; keep game rules and commands unchanged. Decorative locked tiles must not appear interactive or imply implemented ingredients.

## Boundaries & Constraints

**Always:** Preserve the 360x640 canvas and portrait scaling; retain every current game action, typed command, accessibility label/data attribute, pause behavior, and domain/runtime ownership. Keep touch targets usable after scaling and preserve readable Vietnamese labels. Favor a warm wood, tomato-red, cream, and green palette with clear contrast and stable layout. Keep art self-contained in the existing Phaser presentation layer; do not add packages or unlicensed assets.

**Ask First:** Adding external art/font packages or changing the logical canvas dimensions or gameplay flow.

**Never:** Change economy, order, inventory, persistence, or timing rules; add new gameplay systems; use CSS/DOM to implement the in-game UI; introduce E05-E09 features or remove existing shop functionality.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Active order | Ticket selected, pizza being assembled | Order details and recipe are prominent; ingredient and bake/deliver actions remain discoverable and work | Show existing command rejection in the feedback area without hiding controls |
| No ticket selected | Shop open with no active ticket | Customer/queue area communicates waiting state; unavailable actions remain visibly disabled | No drawing or interaction error |
| Small portrait viewport | 360x640 CSS viewport | Header, ticket area, board, primary action, and ingredient tray fit without page scroll or clipped critical labels | Preserve Phaser FIT behavior; prioritize essential labels over decoration |

</frozen-after-approval>

## Code Map

- `src/scenes/BootScene.ts` -- Phaser canvas rendering, shop layout, hit targets, and current action controls.
- `src/config/viewport.ts` -- fixed 360x640 logical canvas contract.
- `tests/gameplay.spec.ts` -- touch-flow regression coverage; its coordinates may need updating if visual hit regions move.
- `src/style.css` -- host/canvas sizing; expected to remain unchanged unless a host-level issue is found.

## Tasks & Acceptance

**Execution:**
- [x] `src/scenes/BootScene.ts` -- replace the start/shop placeholder visuals with cohesive illustrated compositions inspired by the references, retaining current state-driven content and actions.
- [x] `tests/gameplay.spec.ts` -- adjust only touch coordinates made obsolete by the redesigned shop layout and retain the full market/order/cook/deliver/pause/reload flow.

**Acceptance Criteria:**
- Given the shop screen at 360x640, when a ticket is active, then the order, customer/ticket status, pizza work surface, available ingredients, and next valid action are visually distinct and fit in the viewport.
- Given any current shop state, when the player taps its established controls, then the same domain commands and outcomes occur as before the visual redesign.
- Given an active customer offer, pause, or feedback message, when its overlay is shown, then its current behavior remains intact and readable over the new visual style.
- Given the complete existing Playwright gameplay flow, when tests run against the new layout, then all interactions still succeed without browser errors.

## Spec Change Log

- Human clarified after approval that the supplied gameplay screenshot is the direct visual target, not merely a general style reference; a second reference adds the start screen. Expanded the visual scope to both existing screens; all new locked tiles remain decorative and non-interactive to avoid implying new gameplay.
- Review identified undersized primary touch targets and an oven bar hidden beneath the action control. Increased action targets to at least 48 px and moved the progress indicator beside the pizza; discard now uses a trash icon.

## Verification

**Commands:**
- `npm run typecheck` -- passed.
- `npm test -- --run` -- passed: 6 tests.
- `npm run build-nolog` -- passed; Vite emitted only the existing large Phaser chunk warning.
- `npm run test:e2e` -- passed: 24 tests across Chromium/WebKit at 360x640, 390x844, and 412x915.
- Focused Chromium 360x640 cooking flow after the oven-bar review fix -- passed.

**Manual checks:**
- Inspected start, market, and kitchen screenshots at 360x640; controls and critical Vietnamese text remain within the portrait canvas.

## Suggested Review Order

**Start Screen**

- New title composition and preserved start/continue actions.
  [`BootScene.ts:239`](../../src/scenes/BootScene.ts#L239)

**Shop Presentation**

- Shared wood/awning background and compact day/cash header.
  [`BootScene.ts:161`](../../src/scenes/BootScene.ts#L161)
- Ticket cards, order callout, recipe strip, prep board, ingredients, and action hit targets.
  [`BootScene.ts:333`](../../src/scenes/BootScene.ts#L333)
- Pizza rendering and oven progress feedback.
  [`BootScene.ts:190`](../../src/scenes/BootScene.ts#L190)

**Regression Coverage**

- Market-to-cooking touch flow and pause/reload behavior.
  [`gameplay.spec.ts:3`](../../tests/gameplay.spec.ts#L3)
- Canvas render, nonblank pixels, and mobile viewport fit.
  [`smoke.spec.ts:3`](../../tests/smoke.spec.ts#L3)


## Art direction update — 2026-09-30

User-confirmed direction: **2D cartoon**, replacing the previous pixel-art direction. Use soft rounded forms, clear smooth outlines, warm wood/cream/tomato/amber colors, expressive characters, and subtle shading. Keep Vietnamese text readable and retain existing gameplay, portrait layout, and touch-target requirements. This direction supersedes earlier conflicting visual assumptions; existing palette tokens require validation during implementation. This update changes documentation only: cartoon artwork/rendering and visual verification remain pending. Prior completion and test records describe the previous implementation.
