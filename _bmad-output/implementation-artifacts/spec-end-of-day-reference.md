---
title: 'Manual day close and warm end-of-day hub'
type: feature
created: '2026-10-02'
status: done
baseline_commit: NO_VCS
context:
  - '{project-root}/_bmad-output/project-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md'
---

<frozen-after-approval reason="user-owned request and explicit manual-close decision">

## Intent

The user supplied a warm illustrated end-of-day reference and wants the shop to reach this preparation flow after a day. The user explicitly chose pressing “Kết thúc ngày”, rather than an automatic three-minute deadline. Add a manual close, truthful summary and next-day preparation to the existing Cozy shop session.

## Boundaries & Constraints

**Always:** Preserve the kitchen, compact queue and main menu. Place the entry in the owned user-pause panel; confirm pending orders before closing. Use cream rounded cards, warm wood, terracotta active tab, gold indicators and green next-day action from the supplied reference. Show actual balances, revenue, consumed-ingredient costs, expiry, rent, profit, completed orders, abandoned orders and actual customer reviews; empty reviews say “Chưa có đánh giá”. Source numbers in the picture are examples, never defaults. Domain owns inventory accounting, runtime owns phase transitions, scene only renders/selects/intents. Pause owners remain independent. Tabs are Tổng kết / Chợ / Kho / Quán / Nhiệm vụ. Chợ and Kho operate on the real retained stock; unavailable decoration/mission/level systems are clearly “Chưa mở”. No invented rewards, upgrades or unlocks. Finish the three-day demo at day 3 or explain insolvency; committed days cannot be replayed in the session.

**Ask First:** Further kitchen/menu redesign or implementing the independent decoration/mission systems requires a new user request.

**Never:** Automatically finish a running shift, fabricate the 1,250 cash/18 orders/4.6 rating shown in the reference, reset money to 300 on next day, deduct purchases twice as profit costs, tick ovens/arrivals on the summary, release another owner's pause, or claim durable campaign saving. This change concerns the existing RAM-only Cozy shop session; the separate campaign/checkpoint flow is unchanged. Reload persistence and campaign integration remain E04 work.

## I/O & Edge-Case Matrix

| Scenario | Input | Expected behavior |
| --- | --- | --- |
| Manual close | Open shop, user pause only | Explicit confirmation; accepted close settles remaining tickets once and stops simulation |
| Other pause | Visibility/orientation/gap/order/delivery owner | No close mutation until the owned blocking state is resolved |
| Cancel | Close confirmation | Return to paused kitchen with unchanged money, tickets and oven |
| Duplicate | Repeated close/next-day taps | One settlement and one forward day transition |
| Partial day | Delivered, expired and unfinished orders | True counts/reviews; pending tickets counted abandoned; unused reservations released, consumed stock never returned |
| Books | Purchased stock partly consumed | Cash flow shows purchases separately; profit deducts consumed actual lot cost, expired cost and rent only |
| Next day | Summary with sufficient funds | Retain cash/valid lots; dated purchases/expiry and price use current day; restart arrivals/ovens with unique IDs |
| Empty/end | No completed reviews, day 3 or insolvency | Empty copy, accurate ending, no playable day 4 or previous-day reset |

</frozen-after-approval>

## Code Map

- `src/domain/CozyStock.ts`: lot ownership/reservations/cash; add dated stock accounting.
- `src/runtime/CozyRuntime.ts`: current production shop, deliveries, expiry and owned pause; add manual summary/next-day selectors and intents.
- `src/scenes/CozyScene.ts`: approved kitchen renderer, pause, market; add dedicated reference-inspired summary hub.
- `src/presentation/PizzaIcons.ts`: original code-native icons; reuse/add only hub icons if necessary.
- `tests/shop.spec.ts`: real touch stock/order flow and control geometry.

## Tasks & Acceptance

**Execution:**
- [x] `src/domain/CozyStock.ts` and focused tests: dated buying, consumed unit cost, cash debit/rent, expiry and stock carry-over with pure accounting.
- [x] `src/runtime/CozyRuntime.ts` and `CozyDay.test.ts`: manual settlement/immutable summary, actual review records, next day and demo ending, no replay after a completed day.
- [x] `src/scenes/CozyScene.ts` and optional dedicated presentation helper/icons: pause entry/confirmation and warm hub with real tab navigation, inventory/buying, fixed next-day action and safe input/lifecycle.
- [x] `tests/day-end.spec.ts`: touch close/cancel, summary values, tabs, purchases, next-day carry-over, blocked background taps and screenshot at one Chromium viewport.
- [x] Reference spec, UI baseline and UX documents: record new outside-shift surface and manual closing decision without changing kitchen geometry or sprint status.

**Acceptance Criteria:**
- Given the shop is open, when the player confirms manual close, then the dedicated hub shows actual day results and the oven/arrival clocks stop.
- Given the hub, when the player uses preparation tabs then the same retained stock and funds are displayed and only supported actions are active.
- Given a successful preparation, when the player opens the next day then day increments once, inventory/balance survive, selection/oven clear and kitchen geometry stays identical.
- Given a completed day, when old replay controls or duplicate actions are attempted then that day cannot be reopened; day 3 and insufficient funds show an explained end.

## Design Notes

Approval clarification (user, 2026-10-02): the implemented end-of-day screen is now an approved visual baseline, including its five tabs and preparation surfaces. Preserve the geometry, artwork, theme and footer documented in [UI baseline](ui-baseline-2026-10-02.md), using its durable screenshots. “Reference” in this spec's name describes the original input, not permission to redesign. Gameplay, persistence, accessibility or new stories must fit the approved composition; a visual change requires an explicit user request scoped to that change. Figures and reviews remain live data, not frozen screenshot values.

Fit the portrait 360×640 canvas using a hanging title, top balance/status capsules, five compact tabs, financial cream card, actual review card, four preparation tiles and persistent green footer. Content inside a tab can use bounded scrolling where necessary, respecting existing ModalText and 48 CSS px targets. Do not stretch the supplied tall picture into the kitchen or paint fixed text/numbers into an image. The requested manual close supersedes the previous proposed automatic shift deadline only for this Cozy session.

## Verification

Focused stock/runtime unit tests, `npm run build-nolog`, one Chromium day-end touch flow and relevant existing shop/pause regressions. Full Chromium/WebKit multi-viewport matrix remains reserved for Epic 1 completion or release.

## Review findings and patches

- Three independent reviewers found Day 1 replay retaining new accounting counters/reviews. Reset now clears them; replay-then-close regression passes.
- Edge review found an affordable alternative recipe inaccessible in summary. Next-day market now exposes existing cheese/mushroom selection, guarded by the same runtime preparation state; immutable prior statement remains unchanged. A low-funds recipe-switch regression passes.
- Unsupported Array.at in the new stock test was replaced with indexed access to respect the project compilation target.
- Focused units: 31 passed across CozyDay, CozyStock, CozyDelivery and CozyTickets. Final browser evidence is recorded below.

## Verification evidence

- Final focused unit run: 31 passed across four affected files.
- Final production build passed TypeScript and Vite. Existing Phaser chunk-size warning remains.
- Chromium 390x844: manual close/cancel/carry-over, delivered-pizza accounting/review and existing stock regression passed (3 tests); foreground pause ownership regression passed separately. No full browser matrix.
- Initial real-time browser cooking attempts encountered the existing interruption guard and timing window. The new cooking test now pauses and advances Playwright browser time through the actual scene/runtime; production timers are unchanged. Existing stock helper recovers from gap using the visible Continue gesture.
- Three independent review lenses completed; both actionable findings were patched and regression-tested, with edge reviewer confirming resolution.
- RAM-only Cozy session, unsupported progression/decor/mission labels and independent legacy campaign remain explicit in README and UX/GDD amendments.

## Suggested Review Order

- Manual settlement freezes the statement and prevents duplicate day closure.
  [CozyRuntime.ts:70](../../src/runtime/CozyRuntime.ts#L70)

- Expire dated lots and charge rent once using actual costs.
  [CozyStock.ts:61](../../src/domain/CozyStock.ts#L61)

- Carry valid stock and next-day purchases into one forward transition.
  [CozyRuntime.ts:79](../../src/runtime/CozyRuntime.ts#L79)

- Render the reference-inspired hub and block underlying kitchen input.
  [CozyScene.ts:343](../../src/scenes/CozyScene.ts#L343)

- Confirm manual closing while preserving other pause owners.
  [CozyScene.ts:459](../../src/scenes/CozyScene.ts#L459)

- Regression coverage for replay bookkeeping and affordable recipe selection.
  [CozyDay.test.ts:45](../../src/runtime/CozyDay.test.ts#L45)

- Touch flow, genuine numbers, stopped timers and stock carry-over.
  [day-end.spec.ts:21](../../tests/day-end.spec.ts#L21)


Final Vietnamese recipe-label check and manual-flow rerun passed; durable screenshots are linked from the UI baseline.
