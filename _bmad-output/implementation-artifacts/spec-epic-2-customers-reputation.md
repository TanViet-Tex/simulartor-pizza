---
title: 'Epic 2: Customer personalities, understandable reputation and relationship'
type: feature
created: '2026-10-02'
status: done
route: dispatch
review_loop_iteration: 0
baseline_commit: NO_VCS
context:
  - '{project-root}/_bmad-output/project-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
---

<frozen-after-approval reason="user-owned Epic 2 scope and approved UI">

## Intent

Complete Stories 2.1–2.3 in the default Cozy shop: four customer personalities, separate bargaining, truthful stars/reputation feedback, commercial regular-customer relationship and capped referral eligibility. Existing commercial deliveries work, but Cozy lacks bargaining/price limits, relationship and referral state, and feedback explaining reputation.

## Boundaries & Constraints

**Always:** Preserve the approved menu, queue, kitchen, ingredient slots and end-of-day hub geometry/theme/assets. Add information within existing order, result and review content areas; bargaining uses the existing cream modal pattern and accessible touch targets. Keep three active tickets, owned pause leases, fixed 20 Hz clock, atomic stock reservation, immutable closed summaries and once-only commercial results. Domain owns scoring/progression; runtime owns intents/state; scene only presents. Continue the existing RAM-only Cozy flow.

Customer profiles: regular 120s/120% reference price, picky 100s/110%, bargain 110s/105% with 10% discount, hurry 75s/125%. Regular is the tracked familiar customer; request cheese when enabled in the menu, without silently changing unavailable orders. Preserve the existing three initial arrival slots; add bargain as the fourth slot in the repeating deterministic demo pattern. Ordinary arrivals never pause or show Accept/Decline. No ticket/reservation/deadline before bargaining acceptance. Final agreed price is immutable on each ticket. Provide a validated preparation-only runtime pricing intent (80–140%, nearest xu) for price evaluation; player-facing pricing controls belong to Epic 3, so defaults remain reference prices here.

Stars start at five: wrong recipe or packaging −2 once; raw/burnt −2 once; delivery strictly after half patience −1; picky wrong recipe adds −1, with its own reason. Packaging alone must not trigger picky wrong-recipe penalty. Clamp 1–5; timeout is one star and no cash. Reputation starts 50, stays 0–100: 4–5 stars +1, three zero, 1–2 −2. Display actual delta at clamp boundaries, separately from money. Aggregate terminal commercial results including timeout/close, excluding pre-ticket rejection; empty rating is null. Regular 4–5 stars increases relationship once/day, bounded 0–3. Closing Day 2 at final reputation ≥55 publishes one Day 3 referral flag, otherwise none. Eligibility/reason is visible; actual referral scheduling and help story remain Epic 4.

**Never:** Redesign approved UI, replace baseline screenshots, increase ticket cap, synthesize reviews, award XP/missions/help rewards, introduce durable saving or modify the separate campaign mode. Do not mark Epic 1 done: its sprint audit remains independent.

## I/O & Edge-Case Matrix

| Scenario | Input/state | Expected behavior |
| --- | --- | --- |
| Ordinary | Valid arrival, price/stock/capacity valid | Atomic reservation/ticket/price/deadline, distinct profile text |
| Bargain | Fourth slot, free capacity | Owned decision pause; no ticket, stock hold or elapsed patience yet |
| Choice | Accept/reject, duplicate taps | Acceptance reserves once at rounded 90% final price; reject no penalty; only own lease released |
| Blocked | Visibility/orientation/user pause over bargain | Decision cannot mutate; other leases survive; no time catch-up |
| Price | Above profile threshold, including final bargain price | No ticket/rating; reputation −1 at most three/day |
| Capacity/stock | Full three slots or missing ingredients | No backlog, forced substitution or star/reputation penalty |
| Scoring | All eligible penalty combinations/half-time boundary | Each cause once, explicit picky reason, bounded stars and once-only payment |
| Terminal | Delivered/expired/closed, duplicate command | Actual bounded reputation delta and truthful commercial daily average |
| Relationship | Qualifying regular result again/day or across days | At most +1/day, bounds 0–3, no duplicate event |
| Referral | Close Day 2 at 54/55, duplicate close | Zero/one stable eligibility flag; no early actual referral arrival |

</frozen-after-approval>

## Code Map

- `src/config/ordinaryCustomers.ts`: three existing frozen profiles; extend validated price/personality data while preserving ordinary consumers.
- `src/domain/DeliveryResult.ts`: shared scoring; fix picky recipe-only modifier and explicit reasons. Add a small pure customer/progression rules module if needed, avoiding formulas in scene.
- `src/runtime/CozyRuntime.ts`: live shop owner; reuse reservation, serial/arrival idempotency, deliveredCommands, leases, closeDay and next-day transitions. Extend tickets/results/reviews with agreed price and progression data. Avoid copying campaign state into Cozy.
- `src/scenes/CozyScene.ts`, `src/presentation/OrderQueue.ts`: approved renderer and order view model; preserve geometry, add profile/final-price/threshold info and readable feedback in existing content. Expose real state datasets for E2E.
- `src/runtime/CozyTickets.test.ts`, `CozyDelivery.test.ts`, `CozyDay.test.ts`, `src/domain/DeliveryResult.test.ts`: focused regression owners. `tests/day-end.spec.ts` verifies retained stock/summary; `tests/shop.spec.ts` verifies touch shop.

## Tasks & Acceptance

**Execution:**
- [x] Customer config/domain rules: validate profiles, pricing and deterministic bounded progression; add focused boundary tests.
- [x] `CozyRuntime.ts`: integrate four profiles, bargain intent/lease, final prices, capped price rejection, terminal result deltas, relation/day guard and Day 2 referral flag; test every matrix row through public APIs.
- [x] `CozyScene.ts`/order presentation: show distinct profile, final price, all reasons and progression within existing surfaces; bargain modal supports both choices and overlay ownership.
- [x] `tests/epic-2.spec.ts`: real touch ordinary/bargain/result/summary behavior plus approved geometry checks at Chromium 390×844. Cover interrupted bargaining.
- [x] Spec, `sprint-status.yaml`, `demo-progress.md`: record all three stories with evidence, keep Epic 1 review status and Epic 4 boundaries accurate.

**Acceptance Criteria:**
- Given the default/menu Cozy entry, when the player serves four customer types, then the complete Epic 2 behavior is reachable with truthful price, patience and feedback.
- Given new customer/progression content, when comparing the renderer, then approved component positions, counts, themes, assets and next-day footer remain intact.
- Given completed tests, when reporting status, then Stories 2.1–2.3 have specific evidence and deferred Epic 3/4 work is not claimed complete.

## Implementation Notes

User approved the spec and implementation on 2026-10-02. Source/test snapshots are preserved in `.tools/epic-2-baseline` for review because this workspace has no VCS repository. Frozen scope is unchanged.

## Spec Change Log

## Review Triage Log

Three context-free review layers completed. Edge-case hunter reported no additional findings. Findings below are individually triaged; corrections retain the approved layout and frozen scope.

| Finding | Verdict / route | Evidence and correction |
| --- | --- | --- |
| Blind: pre-ticket rejection explanation invisible | medium / patch | Kitchen does not render shopMessage; failed stock/price arrivals need readable feedback in existing order content without pausing ordinary arrivals. |
| Blind: acceptance enabled without stock | medium / patch | Public missing-stock flow dismisses bargain without a ticket; disable its acceptance using the existing missingReason and display that reason. |
| Blind: fixed recipe price labels | medium / patch | Runtime pricing intent changes final prices but existing recipe labels remain 50/65; read current values through the existing progress view. No pricing controls are added. |
| Blind: stale lastResult after close | low / patch | Closed summary is correct, but the public lastResult retains an earlier event; clear it at close, retaining all terminal summary reviews. |
| Blind: duplicated bargain constants | low / patch | Copy hardcodes profile values; direct reads of pending/config data avoid future renderer divergence with a trivial correction. |
| Blind: mushroom pricing verification missing | medium / patch | Runtime integration tests use 50-xu cheese; 65-xu mushroom needs rounded threshold and actual payment assertions. |
| Blind: scroll existence without touch movement | medium / patch | Browser asserts overflow only; perform a touch swipe and assert scroll offset plus reachable choices. |
| Blind: referral before pending-close penalty untested | medium / patch | Current closure code settles first correctly; add a regression that would reject moving eligibility before terminal departures. |
| Blind: oven during bargain untested | medium / patch | Ticket/stock freeze has evidence, oven state does not; test an active bake across the owned bargain lease. |
| Verification: Day 2 closure eligibility gap | medium / patch | Confirmed test gap: 54/55 tests close without pending tickets; add 55-to-53 public closure case. Shared root with the blind finding, retained as a separate review row. |
| Verification: selected price/limit output gap | medium / patch | Existing queue fixtures omit price/limit and browser only checks profile; add priced selector and visible-panel assertions. |

## Verification

- 2026-10-02: All 11 review findings were patched and verified. The final notice modal also displays actual shop state without inventing a selected order. Frozen scope and approved geometry remain unchanged.
- Final focused Vitest run: 76 tests passed across 12 domain/runtime/presentation files, covering customer progression, scoring, customer/ticket/delivery/day/shop/runtime, stock, pause, tutorial and order queue behavior.
- `npm run build-nolog` passed (existing Phaser chunk-size warning).
- All four focused Chromium 390×844 cases passed: two day-end regressions and two Epic 2 touch/visibility/200%-text cases. The four-personality case exceeded the initial 240-second wall-clock allowance in the combined run; it passed independently in 3.2 minutes with a 480-second allowance. Only the test timeout changed.
- Visual inspection confirmed retained layout and readable content: [summary](epic-2-evidence/epic2-summary.png), [selected order](epic-2-evidence/epic2-selected-order.png), [stock notice](epic-2-evidence/active-stock-rejection.png), [bargaining](epic-2-evidence/bargain.png), and [native touch swipe at 200% text](epic-2-evidence/bargain-200-percent-swiped.png). Approved reference images were not overwritten.

| Frozen matrix row | Passing evidence |
| --- | --- |
| Ordinary | CozyTickets, CozyCustomers and four-personality browser case: profile, stock, deadline and visible agreed price |
| Bargain / Choice | CozyCustomers: no pre-agreement ticket/hold/timer, duplicate choice, correct rounded final payment, heating oven freeze |
| Blocked | CozyCustomers/CozyRuntime pause ownership; interrupted-bargain browser visibility and native touch swipe case |
| Price | CustomerProgression/CozyCustomers: bounds, daily cap/reset, immutable price, 65-xu mushroom rounded 116%/118% threshold |
| Capacity/stock | CozyTickets/CozyCustomers/CozyStock; browser missing-stock notice and disabled bargain acceptance |
| Scoring | DeliveryResult combinatorial penalties and half-patience boundary; CozyDelivery once-only payment |
| Terminal | CozyCustomers clamp deltas; CozyDay and two day-end browser cases: actual accounting/reviews, pending closure, duplicate commands |
| Relationship | CustomerProgression/CozyCustomers: daily guard, bounds and duplicate delivery |
| Referral | CozyCustomers: Day 2 54/55, pending closure 55→53, duplicate close and next-day stable eligibility |

Stories 2.1–2.3 are complete and reviewed. Epic 3 pricing UI and Epic 4 referral scheduling/help remain explicitly outside this completion. No full browser/viewport matrix was run.
