---
title: 'Compact six-position order queue and selected-order detail'
type: feature
created: '2026-10-02'
status: done
baseline_commit: NO_VCS
context: ['_bmad-output/project-context.md', '_bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md']
---

<frozen-after-approval reason="explicit user request authorizes this localized UI change">

## Intent

Replace only the waiting queue and order detail panel according to the supplied reference. Use a cream cloth canopy with terracotta edging and small yellow lamps. Within the existing queue frame, show up to six small round order avatars in one row. Selecting an avatar gives it a gold border and fills the existing detail panel below; without an explicit selection show “Chọn đơn để xem chi tiết”.

## Boundaries & Constraints

**Always:** Preserve the 360×640 canvas, 48/112/251/229px overall regions, HUD, menu, recipe row, board, ovens, y=411 action, sauce shelf, ingredient tray, existing runtime commands, audio, pause/input ownership and reduced motion. Use original code-native artwork matching the reference. Queue selection is a touch operation and does not pause the shift. Live details must match the explicitly selected order; an expired/removed selected order clears the detail. Targets remain at least 48×48 CSS px after scaling, without overlapping adjacent slots at the supported portrait sizes.

Represent counter/customer orders by an avatar and app-source orders by a white phone icon on blue. Source metadata belongs to the presentation input contract; existing CozyRuntime tickets are customer orders. Rendering accepts up to six supplied orders without creating fictitious orders, increasing the existing three-ticket gameplay cap, introducing app arrivals or altering inventory/fulfillment rules. “Tại quán” identifies the ordering source; current takeaway packaging remains required and is shown in details.

**Ask First:** Changing other interface regions, raising gameplay ticket capacity, or implementing delivery-app economics/arrival/persistence.

**Never:** Replace the menu or whole scene, generate a new background, add dependencies, auto-select the first avatar for the detail panel, or display mock app orders in the player game.

## I/O & Edge-Case Matrix

| Scenario | State/input | Expected behavior |
| --- | --- | --- |
| No inspection | Empty queue or fresh live ticket | Prompt only, no gold selection |
| Select customer | Touch a real avatar | Gold border and matching number/name/source/recipe/quantity/takeaway/time in panel; existing runtime selection follows |
| App presentation input | Supplied order with app source | Blue phone icon and app source detail; no new app gameplay |
| Six supplied orders | Mixed valid presentation data | Six equal round icons on one row inside old frame; seventh is not rendered |
| Selection changes | Touch another avatar | Details and gold border move together; oven ownership is unchanged |
| Selected ticket disappears | Expiry/delivery/reset | No stale details or selected ring |
| Blocking overlay | Covered queue/panel tapped | Lower actions stay disabled, time remains frozen |
| Practice | Single training order | Avatar can be selected and order modal remains accessible; guidance keeps its original area |

</frozen-after-approval>

## Code Map

- `src/presentation/CozyArt.ts`: current awning, panels and native Graphics helpers.
- `src/presentation/PizzaIcons.ts`: original SVG avatar/icons and local preload manifest.
- `src/presentation/OrderQueue.ts` (new): small pure presentation input/slot/detail model with optional source metadata.
- `src/scenes/CozyScene.ts`: existing queue, order panel, touch zones and timers. Runtime automatically chooses production targets; detail inspection starts unselected.
- `tests/cozy.spec.ts`, `tests/tutorial.spec.ts`, `tests/story17.spec.ts`: adapt order-reading interactions to explicit avatar selection.
- `tests/order-queue.spec.ts` (new): focused browser selection/geometry/overlay regression.

## Tasks & Acceptance

- [x] `OrderQueue.ts` and its focused unit tests: cap six, retain order identity/source, clear missing selection, format truthful details and geometry.
- [x] `CozyArt.ts`, `PizzaIcons.ts`, `CozyScene.ts`: draw scoped fabric/lights/round queue; explicit selected detail; live timers; keep all other scene coordinates.
- [x] Focused browser tests and affected existing flows: touch selects without pause; modal protections; unchanged lower geometry; inspect empty/selected and six-source fixture screenshots.
- [x] Synchronize the UI baseline, UX and epic/story references to this specific user-authorized queue/panel revision; preserve unrelated visual rules.

Acceptance: Given the normal portrait scene, when it renders, then only the y=44–224 queue/panel artwork changes and its positions below remain unchanged. Given real selectable orders, when an avatar is touched, then the selected ring and panel identify the same order with no unwanted pause. Given no inspected order, when the panel renders, then it says the exact requested prompt. Given a six-order presentation fixture with app sources, when the same scene renders, then six icons fit and phone icons use blue backgrounds without creating production app orders.

## Design Notes

The queue frame remains x=8/y=48/w=344/h=112. Six 56px touch cells start x=12, centers x=40+56×i; round artwork is smaller than the touch cell. Keep deadline text beneath the order number so urgency also has a textual cue. The detail panel remains x=10/y=161/w=340/h=63 and shows compact three-line text plus the existing pizza illustration.

## Verification

- Focused Vitest queue model plus existing CozyTickets/CozyDelivery/CozyTutorial tests.
- `npm run build-nolog`: TypeScript/Vite pass.
- Focused Playwright Chromium 390×844, one worker, for the new interaction and affected practice/order overlays; no full browser matrix.
- Inspect local live-scene screenshots and an isolated six-order mixed-source fixture using the real CozyScene renderer. Retain durable updated queue screenshots in documentation.

## Spec Change Log

- 2026-10-02: Recorded the user's explicit scoped instruction and attached visual reference; authorized to implement without an additional approval request. No VCS; uv unavailable, empty customization defaults applied manually.
- 2026-10-02: Implemented compact queue and cream detail panel. Focused unit suites: 27 tests across four files passed. TypeScript/Vite build passed. Focused Chromium: ten tests passed initially; pixel comparison test corrected to read composited canvas screenshots rather than the cleared WebGL drawing buffer, then passed on its own. All eleven selected scenarios now pass on unchanged production code. Inspected unselected/selected and six mixed-source screenshots; lower kitchen y=230–640 is pixel-identical to the stored original. Durable screenshots and docs synchronized; independent review pending.
- 2026-10-02: Independent blind, edge-case and acceptance reviews completed using available adversarial/edge-case lenses (legacy named skills absent). No concrete patch or acceptance gap remains. Blind concerns about redraw, seventh entry and ID reuse are handled by existing dirty input, intentional six-entry cap and observed removal/reset flows. Long hypothetical customer-name wrapping is outside the current fixed-name input fixture; existing real names/labels fit. Final TypeScript check passed after correcting the screenshot test. Marked done; full browser matrix remains deferred.

## Changed Files

- Presentation: `src/presentation/OrderQueue.ts`, `OrderQueue.test.ts`, `CozyArt.ts`, `PizzaIcons.ts`, `src/scenes/CozyScene.ts`.
- Focused browser tests: `tests/order-queue.spec.ts`, `tests/cozy.spec.ts`, `tests/shop.spec.ts`, `tests/story17.spec.ts`.
- Documentation: this spec; `ui-baseline-2026-10-02.md`; `epic-1-context.md`; `1-7-mobile-hud-and-lifecycle.md`; `_bmad-output/project-context.md`; planning `epics.md`, UX `DESIGN.md`, `EXPERIENCE.md` and `.decision-log.md`.
- Durable screenshots: `ui-baseline/queue-unselected-360x640.png`, `queue-selected-360x640.png`, `queue-six-mixed-sources.png`.

## Suggested Review Order

- Keep real ticket data separate from explicit detail inspection.
  [CozyScene.ts:224](../../src/scenes/CozyScene.ts#L224)

- Retain six visible identities, source art and matching selected detail.
  [OrderQueue.ts:30](../../src/presentation/OrderQueue.ts#L30)

- Select the runtime target without pausing or changing oven ownership.
  [CozyScene.ts:230](../../src/scenes/CozyScene.ts#L230)

- Show the prompt or truthful three-line detail inside the existing panel.
  [CozyScene.ts:247](../../src/scenes/CozyScene.ts#L247)

- Draw scoped cream fabric, terracotta hem and six small lamps.
  [CozyArt.ts:24](../../src/presentation/CozyArt.ts#L24)

- Keep round avatar artwork and the blue phone source icon.
  [PizzaIcons.ts:18](../../src/presentation/PizzaIcons.ts#L18)

- Verify selection and unchanged lower-kitchen pixels against the stored baseline.
  [order-queue.spec.ts:17](../../tests/order-queue.spec.ts#L17)

- Exercise six mixed-source entries through the same scene renderer.
  [order-queue.spec.ts:69](../../tests/order-queue.spec.ts#L69)

- Cover empty, removed, mismatched, capped and real-deadline input.
  [OrderQueue.test.ts:6](../../src/presentation/OrderQueue.test.ts#L6)
