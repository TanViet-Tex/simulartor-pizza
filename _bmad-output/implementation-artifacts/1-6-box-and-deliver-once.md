---
title: 'Story 1.6 — Box and Deliver to the Intended Ticket Exactly Once'
created: '2026-10-01'
status: review
baseline_commit: NO_VCS
---

## Story
As a player with a finished pizza, I want to box it when required and deliver it to an explicit ticket, so that I understand the result and receive revenue only once.

## Acceptance Criteria
1. Box a finished takeaway pizza and deliver against an action identifying the target customer and recipe. Grant the agreed revenue exactly once.
2. Wrong recipe or unboxed takeaway opens a consequence confirmation identifying the mismatch. Cancel preserves pizza, tickets and money; confirm resolves one incorrect delivery.
3. Expired/closed targets reject without consuming pizza or granting revenue.
4. At zero patience, close the ticket once at one star without revenue. Release unused reservations; retain consumed pizza for discard, without refund or delivery to an expired owner.
5. Duplicate logical commands produce only one terminal result, payment and feedback event, even if selection changes.

## Tasks / Subtasks
- [x] Add a pure delivery-result rule and packaging/result matrix tests; preserve inclusive 3–5 second baking and production-only behavior.
- [x] Implement explicit pizza/target identities, consequence confirmation, command idempotency and timeout closure in CozyRuntime. Preserve reservations, shared-oven ownership, tutorial and freeplay; expired produced pizzas remain discardable.
- [x] Apply explicit targets, consequence consent, idempotency and non-consuming closed-target rejection to the campaign DemoGame/BootScene path.
- [x] Present target-and-recipe delivery actions, mismatch cancel/confirm, result reasons and expired-pizza discard in CozyScene. Retain 48px touch controls and owned pause reasons.
- [x] Run focused domain/runtime regression tests, TypeScript/build and Story 1.6 mobile E2E on a single Chromium portrait configuration. Full Playwright browser/viewport matrix is deferred until Epic 1 completion or release.

## Dev Notes
- Sources: `_bmad-output/planning-artifacts/epics.md`, Story 1.6; `pizza-gdd/gdd.md`, pizza/stock and rating rules; `_bmad-output/game-architecture.md`, command IDs and RAM mutations; `_bmad-output/project-context.md`, testing cadence.
- Existing `CozyOrder` strictly gates recipe/boxing and pays its isolated fixture; keep tutorial/freeplay unchanged. Production needs an explicit delivery rule and aggregate result ownership in runtime.
- `CozyRuntime` already keeps assembly per ticket and one shared oven. Its stock expiry only closes unused reservations, leaving committed tickets alive at zero; fix that without refunding consumed ingredients. Never retarget a repeated delivery to a different ticket.
- Campaign already permits wrong ingredients and uses agreed ticket prices, but scene-owned confirmation and implicit selection do not protect stale targets. Capture pizza and ticket identities before confirmation.
- Score: start at 5, mismatch/packaging -2 once, quality -2 once, late -1, picky mismatch adds configured penalty; clamp 1–5. Timeout is one star. Help remains excluded from commercial rewards.
- TypeScript domain/runtime owns mutations; scenes read selectors and send intents. No new dependencies, persistence writes, unrelated epic behavior or project-wide exploration.
- Prior story lessons: Vitest uses simulated time; Playwright parallel load caused delayed taps/startup timeouts. Use direct CLI, focused tests and one worker.

## Dev Agent Record
### Debug Log
- Story context created from the approved Story 1.6 section because no implementation file existed. Workflow customization defaults are empty; uv is unavailable and defaults were resolved manually.
### Completion Notes
- Implemented explicit source/target delivery, mismatch confirmation and cancellation, one-time payment/result events, and one-star timeout closure.
- Added a pure delivery scoring rule shared by the shop runtime and campaign. Distinct penalties apply once; source and target identities are captured before confirmation, and completed command IDs cannot settle another valid pizza/ticket.
- Preserved expired or otherwise closed-owner consumed pizzas for confirmed discard without refund. Such pizzas keep the oven occupied until discarded and cannot be boxed or delivered.
- Added target/customer/recipe labels, consequence dialogs, result reasons, expired-pizza discard controls and production accessibility feedback. Tutorial/freeplay behavior remains covered by regression tests.
- Validation: 43 focused tests across 9 domain/runtime files passed. Later campaign and command-ID refinements passed their focused reruns (12 and 8 tests respectively). Final TypeScript/production build passed.
- Three Story 1.6 E2E cases passed on Chromium 390x844: unboxed cancellation/confirmation, selected-target/double-tap payment, and campaign wrong-recipe cancellation/confirmation. Inspected confirmation and result screenshots; touch controls are checked at 48px minimum.
- Full multi-browser/multi-viewport Playwright was intentionally deferred until Epic 1 completion or release, following the user-confirmed cadence. No new dependencies or persistence changes.

## File List
- `src/domain/DeliveryResult.ts`
- `src/domain/DeliveryResult.test.ts`
- `src/domain/CozyOrder.ts`
- `src/domain/demo.ts`
- `src/domain/AutomaticOrders.test.ts`
- `src/domain/CampaignDelivery.test.ts`
- `src/runtime/CozyRuntime.ts`
- `src/runtime/CozyDelivery.test.ts`
- `src/scenes/CozyScene.ts`
- `src/scenes/BootScene.ts`
- `tests/story16.spec.ts`
- `_bmad-output/implementation-artifacts/1-6-box-and-deliver-once.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log
- 2026-10-01: Created implementation context and started Story 1.6.

- 2026-10-01: Completed delivery/packaging/timeout implementation and focused validation; status changed to review.
