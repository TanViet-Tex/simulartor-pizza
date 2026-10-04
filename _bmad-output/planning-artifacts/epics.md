---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
inputDocuments:
  - 'planning-artifacts/pizza-gdd/gdd.md'
  - 'game-architecture.md'
  - 'project-context.md'
  - 'planning-artifacts/ux-designs/ux-pizza-2026-09-29/DESIGN.md'
  - 'planning-artifacts/ux-designs/ux-pizza-2026-09-29/EXPERIENCE.md'
scope: ['E01', 'E02', 'E03', 'E04']
status: 'final'
---

# Game pizza - Epic Breakdown

## Overview

This document provides the implementation epic and story breakdown for the approved three-day pizza demo. It decomposes E01-E04 from the GDD, final UX spines, architecture, and project context into implementable work. E05-E09 and their post-demo systems remain explicitly outside this artifact.

## Requirements Inventory

### Functional Requirements

FR1: Provide the complete loop of reviewing the day, buying ingredients and setting prices, automatically receiving ordinary orders, making/baking/boxing/delivering pizza, and reviewing the day summary.

FR2: Provide a three-day demo in one shop with three recipes, approximately 3-5 minutes per selling shift, ending at a final demo summary with no Day 4 affordance.

FR4: Support regular, demanding, bargaining, and hurried customers with the GDD-defined patience, price thresholds, and behavior.

FR5: Ordinary, hurried and demanding customers arrive on schedule and automatically create one validated ticket, reserve stock and start patience; no Accept/Decline or arrival pause. Only bargaining-price and regular-customer-help choices use their own paused decision overlay before ticket creation.

FR6: Limit active work to three tickets, one oven, and one pizza baking at a time.

FR7: Let the player assemble dough, sauce, cheese, and toppings, bake the result, and deliver it against an explicitly selected ticket.

FR8: Apply oven timing deterministically: ready at 8 seconds, valid removal through 30 seconds, warning at 24 seconds, raw before 8, and burned after 30.

FR9: Allow raw/burned pizza delivery with quality penalties or discard/remake; discarded ingredients are not restored and a remake consumes new ingredients.

FR10: Require takeaway orders to be boxed; wrong recipes and unboxed takeaway delivery are incorrect deliveries.

FR11: Reserve unexpired ingredient lots atomically when a ticket is created, consume the selected lots when production starts, release unused reservations on timeout, and prevent use of stock reserved elsewhere.

FR12: Reject ticket creation when sufficient unexpired stock cannot be reserved, show the exact reason, and never substitute the requested recipe silently; ordinary arrivals do not expose a manual decline choice.

FR13: Allow menu prices to change only before opening, constrain them to 80-140% of reference price, and lock the final price when the ticket is created automatically or after a special price agreement.

FR14: Let bargaining customers open a separate price choice for a 10% reduction; agreeing to the price creates a ticket at that price, rejecting the price creates none and adds no further penalty. This is not generic order Accept/Decline.

FR15: Reject an over-threshold price before ticket creation, exclude it from ratings, and reduce reputation by one up to three times per day.

FR16: Close timed-out tickets for no revenue and one star; customers who leave because all three ticket slots are full cause no penalty.

FR17: Start delivered orders at five stars and apply each relevant penalty once: wrong recipe/packaging -2, raw/burned -2, late-half -1, and an additional -1 for a demanding customer's wrong order, clamped to 1-5.

FR18: Award the agreed price exactly once only for a delivered commercial order; the demo has no tips or refunds.

FR19: Start reputation at 50/100; apply +1 for 4-5 stars, zero for 3, and -2 for 1-2, while daily rating includes completed/time-out orders but excludes pre-ticket rejection.

FR20: Track regular-customer relationship from 0-3, increase it at most once per day for a 4-5-star commercial service, and add at most one referred customer on Day 3 when Day 2 closes at reputation 55 or more.

FR21: Start with 300 coins and zero stock, and use the approved deterministic Day 1-3 market prices and coefficients.

FR22: Track expiry by ingredient lot, consume earliest-expiring stock first, discard lots at the approved end-of-day boundary, and record waste cost.

FR23: Permit purchasing only before opening, with no borrowing, resale, negative cash, or demo supply cap; show forecast rent before opening.

FR24: At day end, separately report cash, sales, bonuses, purchases, cost of goods, waste, rent, zero demo wages/repairs with explanation, other costs, profit, and closing inventory value without double-counting purchases.

FR25: Start with cheese and mushroom recipes; unlock sausage at level 2 and permit it on the menu only from the following day.

FR26: Award 10 XP per delivered commercial order plus 5 XP for 4-5 stars, none for time-out; level 2 starts at 60 XP and level 3 at 150 XP while total XP remains visible.

FR27: Never generate locked/off-menu recipes and never allow opening with an empty menu.

FR28: Track one approved daily goal each day and award 20 coins plus 10 XP exactly once at summary; goal revenue excludes rewards.

FR29: Track the three-day mission to sell eight cheese pizzas and award 30 coins, 20 XP, and two reputation exactly once.

FR30: Track daily goals and the three-day mission independently; opening UI, reload, retry, and save recovery never duplicate rewards.

FR31: Represent mission lifecycle explicitly as locked, active, completed, or failed/expired.

FR32: Introduce the regular customer's cheese preference on Day 1 and allow the Day 2 return only if the first encounter earned at least three stars.

FR33: Model the Day 2 help request as a free cheese pizza with a 120-second limit, one normal ticket slot, normal ingredient consumption, and no commercial revenue or order XP.

FR34: Resolve the help order successfully only for the correct ready pizza on time; apply its relationship result once and exclude it from reputation, daily rating, commercial goals/mission, and rating XP.

FR35: Disable Help with a precise stock reason when necessary; Decline costs no cash/reputation, and gifted-pizza cost is reported separately without double-counting.

FR36: Resolve the regular customer's Day 3 return according to the GDD and grant the 20-coin relationship reward exactly once when relationship reaches two.

FR37: Use the approved deterministic Day 1-3 customer schedules and shift lengths, spawning each slot at most once without accumulating missed arrivals.

FR38: Stop new arrivals when shift time ends, allow up to 120 seconds to resolve active tickets, then close all remaining tickets.

FR39: Start each shift only on explicit player action; the Day 1 tutorial freezes commercial time and produces no money or XP.

FR40: Make every third scheduled commercial order takeaway, keep other commercial orders counter service, keep help counter-service, and preserve a feasible route to eight cheese sales.

FR41: Close a day in this exact order: resolve tickets, calculate rating/goal, grant eligible rewards, expire lots, charge rent/build ledger, evaluate insolvency, then save.

FR42: A missed daily goal does not block progression; after Day 3 show cumulative cash/profit, level/XP, reputation, relationship, and mission results.

FR43: End the campaign with an explanation if the next-day checkpoint cannot cover rent or afford at least one open recipe using cash plus stock; warn before opening when applicable.

FR44: After insolvency, expose only Summary or confirmed New Campaign; provide no loan or rescue mechanic.

FR45: Write a checkpoint when creating a campaign and after a completed day, never after each gameplay tap.

FR46: Reloading mid-day restores the start-of-current-day checkpoint and the same schedule/prices while discarding uncommitted money, XP, rewards, and choices.

FR47: Completed days are immutable and cannot be replayed, reopened, rolled back, selected, or branched.

FR48: Continue only from the latest checkpoint; technical backup may represent only the same latest commit and never a selectable older day.

FR54: Keep ticket deadlines and oven state visible during play, provide pause and mute, label toppings with icon plus text, and never communicate critical state through color or audio alone.

Post-demo GDD requirements FR3 and FR49-FR53 are intentionally excluded because they map to E05-E09, not the requested E01-E04 demo scope.

### NonFunctional Requirements

NFR1: Target portrait mobile web on Chrome Android and Safari iOS; desktop is a secondary verification surface.

NFR2: Support 360x640 CSS px and verify 390x844 and 412x915 without clipped text/buttons or page scrolling during kitchen play.

NFR3: Use single-touch controls without hover, precision drag, right-click, keyboard, or multitouch dependency; interactive targets are at least 48x48 CSS px after scale and respect safe areas.

NFR4: Render Vietnamese diacritics completely, keep 2D cartoon artwork smooth and proportional after scaling, and pair color/audio cues with text, icons, or shape.

NFR5: Target 60 FPS and avoid sustained performance below 30 FPS for more than one second in a full three-ticket shift on baseline mobile hardware.

NFR6: Keep initial assets at or below 10 MB and reach the start screen within five seconds on an empty cache over 20 Mbps.

NFR7: Pausing, hiding/locking, or rotating the device preserves state, stops simulation without catch-up, and requires explicit continuation when returning.

NFR8: Refresh visible oven/patience feedback at least every 0.1 seconds while keeping deterministic simulation rules.

NFR9: Preserve end-day checkpoints without duplicate rewards/currency/XP on load or retry, and never turn backup storage into playable history.

NFR10: Keep demo schedules and prices deterministic and do not advance progress, income, expiry, or timers from real-world elapsed time.

NFR11: Verify the source and license of every asset shipped in the build.

NFR12: Support the approved five-person playtest targets: 4/5 first orders within 60 active seconds, 4/5 complete or understand insolvency, 4/5 explain the ledger, and 3/5 want Day 4.

NFR13: Maintain a relaxed pace: hurried customers are only relatively faster, and consequential choices remain readable while paused.

### Additional Requirements

AR1: The first implementation story must scaffold from official `phaserjs/template-vite-ts` version 1.4.0 through a staging clone, record the source commit SHA, integrate only approved starter files, and never overwrite planning documents.

AR2: Pin exact versions: Node 24.21.0 LTS, npm 11.19.0, Phaser 4.2.1, TypeScript 5.7.2, Vite 6.3.1, Terser 5.39.0, Vitest 4.1.11, and Playwright 1.63.0; produce a lockfile and pass typecheck/build before gameplay work.

AR3: Use Phaser for gameplay presentation and HTML/CSS only for the canvas host, safe area, and orientation shell; add no React, backend, physics, auth, ORM, service worker/PWA, or external gameplay service.

AR4: Keep pure TypeScript domain state and rules independent of Phaser, DOM, IndexedDB, and console logging; compose dependencies in `src/main.ts` without globals or a service locator.

AR5: Route every gameplay mutation through typed `GameRuntime.dispatch`; commands validate current state and apply atomically or make no change, with stable `commandId` protection against double-tap.

AR6: Use explicit discriminated-union state machines for day, order, oven, and mission; animations and audio callbacks never confirm mutations or grant rewards.

AR7: Drive all gameplay timing from one fixed 50 ms simulation clock; rendering remains independent, wall-clock time is never authoritative, and interruption longer than 250 ms safely pauses.

AR8: Track pause through owner-specific leases/tokens; a source releases only its own lease, the clock runs only when the set is empty and the day phase allows it, and no resume-all API exists.

AR9: Separate RAM mutations from persistence. IndexedDB writes only at campaign creation and end-day commit; player settings use separate storage ownership.

AR10: Implement end-day commit as prepare, repository commit, then confirm using the same stable commit ID/payload for retry; do not advance the day until the transaction completes.

AR11: Implement `SaveRepository` as the only IndexedDB boundary; no IDB type escapes infrastructure, and transaction/revision/schema errors return typed results.

AR12: Validate schema, type/range, content IDs, schema version, and content version before loading; preserve invalid data, distinguish corruption from newer-version incompatibility, and never silently reset or repair money/stock.

AR13: Maintain active and backup physical copies only for the same newest commit/revision; offer confirmed recovery only when valid, and reject stale-tab revision conflicts without merging.

AR14: Validate raw content/config exactly once at boot into immutable `ValidatedGameConfig`; reject missing, duplicate, invalid, or broken IDs without fallback.

AR15: UI reads pure selector/view models and emits typed intents. Scene lifecycle registers and removes subscriptions deterministically and releases owned leases on shutdown.

AR16: Use stable content IDs (`namespace.kebab-case`), command IDs (`namespace.verb`), past-tense events, scoped asset keys, and the approved naming/file conventions.

AR17: Use structured, redacted error/log codes. Gameplay rejection is not an exception; recoverable technical errors preserve safe state and expose retry; fatal boot errors stop before gameplay.

AR18: Preload mandatory demo assets through a validated manifest, block shift start when required assets are missing, expose retry, and ship no unlicensed or unreferenced asset.

AR19: Unit-test domain/runtime/config without Phaser/canvas/DOM/IndexedDB; use simulated time and cover valid/rejected transitions, atomic commands, duplicate command IDs, pause nesting, and selectors.

AR20: Browser integration tests must cover IndexedDB commit/retry/corruption/revision and Playwright Chromium/WebKit flows at all three viewports, including visibility, orientation, double-tap, save failure, reload, and overflow without relying on animation timing.

AR21: Build with `npm run build-nolog` into static `dist/`, avoid template telemetry, and verify final behavior over HTTPS, including IndexedDB and audio unlock.

AR22: Do not create placeholder modules or tests for E05-E09 and do not import `_bmad-output/` or `docs/` into runtime code.

### UX Design Requirements

UX-DR1: Implement the twelve canonical component contracts consistently: `action-button`, `order-ticket`, `ingredient-control`, `oven-status`, `primary-status-bar`, `offer-modal`, `feedback-strip`, `ledger-row`, `goal-mission-progress`, `pause-panel`, `error-panel`, and `save-progress`.

UX-DR2: Preserve the user-approved warm cartoon theme and geometry in [UI baseline 2026-10-02](../implementation-artifacts/ui-baseline-2026-10-02.md) and `src/presentation/theme.ts`: wood/cream/terracotta surfaces, green primary action, measured AA contrast, zero letter spacing, current rounded shapes, 4/8/12/16/24 spacing and 48px minimum CSS touch size. Historical dark-neutral/red/2–6px tokens do not authorize restyling.

UX-DR3: At 360x640 preserve the approved 48px status, 112px ticket/awning, 251px work and 229px action/ingredient regions, with safe insets and post-scale targets at least 48x48 CSS px. Keep phase action y=411 beside the ovens, five sauce tiles and the ten-tile ingredient grid. These user-approved dimensions supersede the former 96px rail/176px action budget; new stories must not reflow or redesign without an explicit user request.

UX-DR4: Preserve the user-requested [compact queue/panel revision](../implementation-artifacts/spec-compact-order-queue.md): up to six small circular presentation entries in the existing row, cream canopy/terracotta hem/yellow lamps, shop avatar or blue app-source phone, gold selected border and matching detail in the existing panel. Without explicit inspection show “Chọn đơn để xem chi tiết”. Selection does not pause or reflow the row. This UI capacity does not change the existing three-active-ticket gameplay limit or introduce app arrivals.

UX-DR5: Make the delivery action echo the selected target and recipe. Correct delivery is one tap; wrong recipe or unboxed takeaway requires explicit consequence confirmation; expired/closed target rejects without consuming pizza.

UX-DR6: Use the phase-based action at its approved position beneath the prep board beside the ovens, so Bake, Remove, Box, Deliver, and Discard do not compete simultaneously; destructive discard requires confirmation when consequential. Preserve the sauce shelf and two-row ingredient grid.

UX-DR7: Keep oven state and all deadlines visible while selecting ingredients and beneath blocking overlays, showing whether simulation is frozen or running.

UX-DR8: Use deterministic overlay priority: fatal/save recovery, orientation shell, foreground Continue, user pause, tutorial, special price/help choice, then transient feedback. Lower layers receive no input and retain their pause leases.

UX-DR9: Onboarding uses a controlled noncommercial practice fixture/training clock, exposes one next action without auto-performing commands, and explicitly starts commercial timers only after `Bắt đầu ca`.

UX-DR10: Surface Start/Continue, market/preparation, active shop edge states, end-day/demo-end, offline mandatory-asset failure, and save/recovery states defined by the final UX.

UX-DR11: The end-day summary uses ordered, scrollable sections with a sticky save/advance action; Next Day/Finish Demo remains disabled while saving and there is no replay control.

UX-DR12: Save errors identify the unsaved day and risk, preserve pending results, show retry busy state, and return visual attention to the originating context after recovery.

UX-DR13: Pause UI lists every active reason and exposes Resume/Continue only for a releasable owned lease; clearing one reason never implies all time resumes.

UX-DR14: Feedback shows stars and each cause, while money, XP, reputation, relationship, goal, and mission deltas remain visibly distinct and are never combined into an ambiguous reward burst.

UX-DR15: Always honor `prefers-reduced-motion: reduce` using immediate state/opacity changes with no shake, bounce, flashing, or looping decoration.

UX-DR16: Timers use stable-width `m:ss` plus labels/icons such as `Sắp hết`, `Sẵn sàng`, and `Sắp cháy`, without color-only urgency, flashing, or per-second announcements.

UX-DR17: Render complete Vietnamese labels and longest fixtures without truncating critical content; modal explanations may scroll, but gameplay controls remain reachable.

UX-DR18: Verify actual post-scale 48x48 target geometry, safe-area/browser chrome, 200% browser zoom or equivalent text/canvas scale, and all three portrait viewports.

UX-DR19: Landscape acquires a distinct pause lease and shows a return-to-portrait shell; desktop centers the portrait canvas and adds no hover-only functionality.

UX-DR20: Every audio cue has a visual equivalent, mute never hides state, and mobile audio unlock happens after a player interaction.

UX-DR21: Use immediate pressed/accepted feedback and named busy/disabled/error reasons; visual feedback never substitutes for runtime idempotency or domain confirmation.

UX-DR22: Implement the final UX flows for first pizza, bargain takeaway, end-Day-2 save recovery, phone lock return, regular-customer help/refusal, corrupt/incompatible save recovery, and Day-3 completion including their failure branches.

UX-DR23: Keep screen-reader and keyboard gameplay navigation outside this canvas-only demo; do not claim semantic focus/read order without a future DOM accessibility architecture decision.

UX-DR24: Do not expose delivery app, staff, weather, marketing, hidden mission, celebrity/VIP, Day 4, or other E05-E09 placeholders in demo navigation or screens.

### FR Coverage Map

FR1: Stories 1.4-1.6, 3.1-3.3, 4.1-4.6 - Complete preparation, service, economy, summary, and progression loop.
FR2: Stories 4.1 and 4.6 - Three-day demo and final result.
FR4: Story 2.1 - Four customer archetypes.
FR5: Story 1.5 - Automatic commercial arrivals and atomic ticket creation; special decisions remain in Stories 2.1 and 4.3.
FR6: Story 1.5 - Three-ticket and one-oven capacity.
FR7: Stories 1.5-1.6 - Pizza assembly, baking, and targeted delivery.
FR8: Story 1.5 - Deterministic oven timing and quality.
FR9: Story 1.5 - Raw/burned delivery, discard, and remake.
FR10: Story 1.6 - Takeaway boxing and incorrect delivery.
FR11: Stories 1.4 and 3.2 - Base reservation/consumption/release, extended to FEFO lots and expiry.
FR12: Stories 1.4 and 3.2 - Insufficient-stock rejection from first order through multi-lot play.
FR13: Stories 3.1 and 2.1 - Preparation-only menu pricing, locked order price, and threshold use.
FR14: Story 2.1 - Bargaining offer and decline.
FR15: Story 2.1 - Price-threshold rejection and reputation cap.
FR16: Stories 1.6 and 2.1 - Ticket timeout and full-capacity departure.
FR17: Story 2.2 - Star calculation and demanding-customer penalty.
FR18: Stories 1.6 and 3.3 - Exactly-once commercial revenue and ledger treatment.
FR19: Story 2.2 - Reputation and daily rating.
FR20: Stories 2.3, 4.1, and 4.3 - Relationship, referral, and regular-customer outcomes.
FR21: Stories 1.4 and 3.1 - Day 1 starting economy, then deterministic multi-day market prices.
FR22: Story 3.2 - Ingredient lots, expiry, FEFO, and waste.
FR23: Stories 1.4 and 3.1 - First-shift purchase constraints and later rent forecast.
FR24: Story 3.3 - Complete end-day ledger.
FR25: Story 4.2 - Recipe unlock and following-day availability.
FR26: Story 4.2 - XP and levels.
FR27: Stories 3.1 and 4.2 - Non-empty menu and valid recipe generation.
FR28: Story 4.2 - Daily goals and one-time rewards.
FR29: Story 4.2 - Three-day cheese mission and one-time reward.
FR30: Story 4.2 - Independent/idempotent goal and mission progress.
FR31: Story 4.2 - Mission lifecycle.
FR32: Story 4.3 - Regular customer's Day 1/Day 2 gating.
FR33: Story 4.3 - Free Day 2 help ticket.
FR34: Story 4.3 - Help resolution and commercial exclusions.
FR35: Story 4.3 - Help stock gating, decline, and gift cost.
FR36: Story 4.3 - Day 3 return and relationship reward.
FR37: Story 4.1 - Deterministic three-day customer schedules.
FR38: Story 4.1 - Shift end and grace period.
FR39: Story 1.3 - Explicit shift start and controlled tutorial.
FR40: Story 4.1 - Takeaway cadence and feasible mission schedule.
FR41: Stories 3.3 and 4.5 - Ordered day close and save boundary.
FR42: Stories 4.2 and 4.6 - Nonblocking failed goals and final demo summary.
FR43: Stories 3.1 and 4.6 - Insolvency warning and final detection.
FR44: Story 4.6 - Insolvency end-state actions.
FR45: Stories 4.4-4.5 - Campaign creation and end-day checkpoints only.
FR46: Stories 4.4-4.5 - Mid-day reload to current-day start.
FR47: Stories 4.5-4.6 - Immutable completed days and no replay.
FR48: Stories 4.4-4.5 - Latest-checkpoint-only continuation and same-commit backup.
FR54: Story 1.7 - Persistent HUD, pause/mute, and redundant feedback.

### Cross-Cutting Coverage Map

| Requirement set | Story owners |
| --- | --- |
| NFR1-NFR4 | 1.2, 1.7 |
| NFR5 | 1.5, 1.7 |
| NFR6 | 1.2 |
| NFR7 | 1.3, 1.7, 4.5 |
| NFR8 | 1.5, 1.7 |
| NFR9 | 4.4, 4.5 |
| NFR10 | 1.4, 2.1, 3.1, 4.1, 4.5 |
| NFR11 | 1.2 |
| NFR12 | 4.6 |
| NFR13 | 1.3, 2.1, 4.1 |
| AR1-AR3 | 1.1 |
| AR4 | 1.2 |
| AR5-AR8 | 1.3-1.6, then reused by later domain stories |
| AR9-AR13 | 4.4-4.5 |
| AR14 | 1.2, 2.1, 3.1-3.2, 4.2-4.3 |
| AR15-AR16 | 1.2-1.7 and every presentation/content story |
| AR17-AR18 | 1.2, 4.4-4.6 |
| AR19 | 1.3-1.6, 2.1-2.3, 3.1-3.3, 4.1-4.5 |
| AR20 | 1.7, 4.4-4.6 |
| AR21-AR22 | 1.1, 1.7, 4.6 |
| UX-DR1 | 1.4-1.7, 2.1-2.3, 3.1-3.3, 4.3-4.5 |
| UX-DR2 | 1.2 |
| UX-DR3-UX-DR8 | 1.4-1.7, 3.1-3.2, 4.3-4.5 |
| UX-DR9 | 1.3 |
| UX-DR10 | 1.2-1.3, 3.1-3.3, 4.1-4.6 |
| UX-DR11-UX-DR12 | 3.3, 4.4-4.6 |
| UX-DR13 | 1.3, 1.7, 4.4-4.5 |
| UX-DR14 | 1.5-1.6, 2.1-2.3, 3.3, 4.2-4.3, 4.6 |
| UX-DR15-UX-DR21 | 1.2-1.7, with summary/recovery checks in 3.3 and 4.4-4.6 |
| UX-DR22 | 1.6, 2.1-2.3, 3.2-3.3, 4.1-4.6 |
| UX-DR23 | 1.7 |
| UX-DR24 | 1.2, 4.1, 4.6 |

## Epic List

### E01: Vòng lặp làm và giao pizza

Players can start the mobile game, buy the first ingredients from zero stock, learn the controls, receive an automatically created inventory-backed order, assemble and bake one pizza, box takeaway, deliver to the intended ticket, and understand the result while pause/mute and browser lifecycle protect the relaxed pace.

**FRs covered:** FR1, FR5-FR12, FR16, FR18, FR21, FR23, FR39, FR54  
**Natural dependency:** None. Its first story establishes the approved Phaser starter and verification baseline; later E01 stories build a complete playable service slice.

### E02: Khách và uy tín

Players can recognize and serve four customer personalities, respond to bargaining and price sensitivity, and understand stars, daily ratings, reputation, and limited referral consequences.

**FRs covered:** FR4, FR14-FR17, FR19, FR20  
**Natural dependency:** E01's complete order/service result pipeline.

### E03: Chợ và sổ thu chi

Players can buy expiring ingredient lots at deterministic daily prices, set valid menu prices, understand stock reservations and shortages during service, and reconcile cash, costs, waste, rent, inventory, and profit at day end.

**FRs covered:** FR1, FR11-FR13, FR18, FR21-FR24, FR41  
**Natural dependency:** E01 order lifecycle and E02 final-price/customer outcomes. E03 remains complete without any E04 feature.

### E04: Demo ba ngày và quan hệ đầu tiên

Players can progress through the complete deterministic three-day demo, earn XP and mission/goal rewards, unlock a recipe for a later day, make a regular-customer help choice, safely continue from end-day checkpoints, and finish or become insolvent without replaying completed days.

**FRs covered:** FR1, FR2, FR20, FR25-FR38, FR40-FR48  
**Natural dependency:** Complete E01-E03 service, customer, and economy outcomes. No E05-E09 dependency is permitted.

## Epic 1: Vòng lặp làm và giao pizza

Players can launch the portrait-mobile game, buy the first ingredients from zero stock, learn its touch controls, receive an automatically created order backed by reserved inventory, make and bake pizza, box takeaway, deliver to the intended ticket, and understand the result while pause and browser lifecycle preserve a relaxed pace.

### Story 1.1: Set Up the Initial Project from the Official Phaser Starter

As a development team,
I want the approved Phaser TypeScript + Vite starter integrated reproducibly,
So that every player-facing story begins from a verified mobile-web build rather than an ad hoc setup.

**Goal:** Create the smallest bootable project and test baseline without adding pizza gameplay.

**Dependencies:** None.

**Covered requirements:** AR1-AR3, AR21-AR22; enables all FRs and UX-DRs.

**Acceptance Criteria:**

**Given** the documentation repository and explicit permission to implement  
**When** the official `phaserjs/template-vite-ts` version 1.4.0 is cloned into staging  
**Then** its source commit SHA is recorded and only approved starter files are integrated  
**And** no planning document, template `.git`, sample README, screenshot, or sample gameplay overwrites project content.

**Given** the starter is integrated  
**When** dependencies are installed  
**Then** every version equals AR2, a lockfile is created, and no React, physics, backend, ORM, PWA, or unapproved package is present.

**Given** a clean checkout with the approved Node/npm versions  
**When** typecheck, unit-test baseline, and `npm run build-nolog` run  
**Then** all pass, static `dist/` is produced without template telemetry, and a minimal Phaser canvas boots without console errors.

**Testing:** Verify clean install and exact dependency versions; run typecheck, Vitest baseline, production build, and Playwright smoke boot in Chromium and WebKit. Inspect imports and generated files to confirm planning artifacts are untouched.

### Story 1.2: Boot Validated Demo Content and the Portrait Shell

**Implementation update (2026-10-01):** The user-approved cartoon theme supersedes this story's original exact red primary color and 2/6px radii. The current acceptance contract and verification are in [Story 1.2](../implementation-artifacts/spec-1-2-validated-portrait-boot.md); boot validation, retry, contrast, touch minimums and mobile checks remain required.

As a mobile player,
I want the game to start only with valid content and required assets,
So that I never enter a broken kitchen session.

**Goal:** Establish the composition root, validated configuration, boot/preload flow, asset manifest, and portrait host needed by later gameplay.

**Dependencies:** Story 1.1.

**Covered requirements:** NFR1-NFR4, NFR6, NFR11; AR4, AR14, AR16-AR18; UX-DR2, UX-DR10, UX-DR17, UX-DR19, UX-DR24.

**Acceptance Criteria:**

**Given** valid demo config and licensed mandatory assets  
**When** the game boots  
**Then** config is validated once into immutable `ValidatedGameConfig`, assets load through the manifest, and the portrait start surface appears within the approved load budget.

**Given** a missing, duplicate, broken, or out-of-range content ID  
**When** boot validation runs  
**Then** gameplay does not start, a stable player-safe error and retry action appear, and no silent fallback content is chosen.

**Given** a mandatory asset cannot load  
**When** preload exhausts its allowed attempt  
**Then** the player remains before gameplay with named retry/reload behavior and no campaign mutation.

**Given** the canvas is viewed at each target portrait viewport  
**When** the shell applies browser chrome and safe-area insets  
**Then** Vietnamese text renders fully, 2D cartoon artwork remains smooth and clear, and no E05-E09 or Day 4 affordance appears.

**Given** the final visual theme is loaded  
**When** the token registry is inspected  
**Then** primary action color is exactly `#B9362B`, letter spacing is `0`, corner radii are 2 px and 6 px for their documented roles, and the spacing scale is exactly 4/8/12/16/24 px with a 48 px touch minimum.

**Given** normal text, essential boundaries, focus indicators, and primary actions render from the final tokens  
**When** contrast is measured  
**Then** normal text is at least 4.5:1, essential boundaries/focus are at least 3:1, and primary text on `#B9362B` is at least the committed 5.48:1.

**Given** HUD, body, label, and numeric content at 360x640, 390x844, and 412x915  
**When** typography and spacing are rendered  
**Then** the documented font families, sizes, weights, line heights, zero letter spacing, radii, and spacing tokens are applied without clipped Vietnamese text or touch targets below 48x48 CSS px.

**Testing:** Vitest validates the immutable token object and exact values; automated contrast tests calculate every committed foreground/background pair; Playwright Chromium/WebKit captures all three mobile viewports and verifies canvas/shell pixel samples, typography fixtures, post-scale target geometry, radii, spacing, safe areas, overflow, asset-failure/retry, and five-second/10 MB boot budgets.

### Story 1.3: Run a Controlled Tutorial with Owned Pause Leases

**User requirement update2026-10-03 — documentation only, implementation pending:** Starting a new campaign must enter the pizza tutorial directly, without a market/purchase prerequisite. Use isolated practice ingredients, keeping real cash/stock/rewards frozen. This changes onboarding order, not commercial purchasing rules or approved UI. Previous completed-story/test records remain historical until the new entry behavior is implemented and verified.

As a first-time player,
I want to learn one touch action at a time without commercial time pressure,
So that I understand the kitchen before the real shift begins.

**Goal:** Implement runtime dispatch, fixed simulation time, owned pause leases, and the noncommercial Day 1 tutorial transition.

**Pending entry acceptance (2026-10-03):** Given the player selects Start/New Campaign, when initial entry completes, then the tutorial opens directly without requiring a purchase or market visit; practice ingredients cannot debit campaign cash/stock or grant commercial rewards. Do not mark this new acceptance passed from earlier implementation evidence.

**Dependencies:** Stories 1.1-1.2.

**Covered requirements:** FR39; NFR7-NFR10, NFR13; AR5-AR8, AR15, AR19; UX-DR8-UX-DR10, UX-DR13, UX-DR15.

**Acceptance Criteria:**

**Given** the Day 1 tutorial is active  
**When** the player reads or performs a guided step  
**Then** customer patience, commercial schedule, money, inventory accounting, and XP remain frozen  
**And** the tutorial never performs a domain command on the player's behalf.

**Given** the practice bake step starts  
**When** controlled training time advances  
**Then** only the practice fixture advances and the tutorial reacquires its lease at the next milestone.

**Given** multiple pause reasons are active  
**When** one owner releases its lease  
**Then** all other reasons remain listed and simulation stays frozen until the lease set is empty.

**Given** tutorial milestones are complete  
**When** the player taps `Bắt đầu ca`  
**Then** the tutorial lease clears and commercial simulation begins explicitly from the correct state.

**Testing:** Vitest fixed-clock tests without real waits; nested/repeated lease acquisition and idempotent release; tutorial reward/time isolation; exhaustive runtime transition tests; Playwright verifies visible pause reasons and reduced-motion behavior.

### Story 1.4: Buy and Reserve Ingredients Before the First Commercial Order

As a new shop owner,
I want to buy the first ingredients so automatic ticket creation can reserve them,
So that the first commercial pizza uses real player-owned stock rather than an unexplained fixture.

**Goal:** Provide the minimum production inventory slice required for E01: Day 1 starting cash/zero stock, pre-opening purchases, one-day lots, automatic-order feasibility, reservation, production consumption, and unused release. E03 extends this same model with all daily prices, FEFO, expiry, forecasting, and accounting; it does not replace it.

**Dependencies:** Stories 1.1-1.3.

**Covered requirements:** FR1, FR11-FR12, FR21, FR23; AR5-AR6, AR14-AR16, AR19; UX-DR1, UX-DR3, UX-DR10, UX-DR17, UX-DR21.

**Acceptance Criteria:**

**Given** a new Day 1 campaign before opening  
**When** preparation begins  
**Then** cash is 300 coins, player-owned stock is zero, and the approved Day 1 ingredient prices are visible.

**Given** the player selects an affordable ingredient quantity  
**When** Purchase succeeds  
**Then** cash decreases exactly once and a Day 1 lot with quantity and unit cost becomes player-owned stock; overspending rejects atomically and creates no lot.

**Given** the player has not bought enough unreserved ingredients for at least one selected open recipe  
**When** Open Shop is requested  
**Then** opening is blocked with exact missing quantities, so no commercial ticket can be created against unexplained inventory.

**Given** enough stock exists for the initial cheese or mushroom menu  
**When** the player opens the first shift  
**Then** both initially unlocked recipes use their approved reference prices and the first configured commercial arrival can automatically create a ticket; player price editing remains the explicit E03 extension.

**Given** sufficient player-owned stock and a valid ordinary commercial arrival  
**When** its ticket is created automatically  
**Then** recipe quantities are reserved for that ticket and become unavailable to others; insufficient stock rejects creation with an exact reason and no ticket, without a manual Accept/Decline choice.

**Given** a reserved ticket begins production  
**When** its selected ingredients are committed  
**Then** used quantities are consumed atomically and unused reserved quantities return to availability; timeout before use releases its reservation exactly once.

**Testing:** Vitest covers 300-coin/zero-stock initialization, Day 1 purchase atomicity, overspend rejection, open-shop feasibility, concurrent reservation exclusion, production consumption, timeout release, and conservation of owned quantities. Playwright covers preparation purchase, disabled Open and automatic-creation shortage reasons, and the uninterrupted path from purchased stock to the first automatically created ticket on each mobile viewport.

### Story 1.5: Automatically Create Customer Orders and Make a Pizza in One Oven

As a shop owner,
I want ordinary customers to arrive and create readable orders automatically, then assemble their pizza and control the oven,
So that I can complete the central cooking challenge.

**Goal:** Deliver automatic commercial arrival/ticket creation, assembly, oven-quality, discard, and remake for one to three tickets. Ordinary, hurried and demanding customers have no Accept/Decline; bargaining-price and story-help decisions belong to their specific stories.

**Dependencies:** Stories 1.1-1.4.

**Covered requirements:** FR1, FR5-FR9, FR16; NFR5, NFR8, NFR10; AR5-AR7, AR15, AR19; UX-DR1, UX-DR4, UX-DR6-UX-DR8, UX-DR14, UX-DR16, UX-DR21.

**Acceptance Criteria:**

**Given** an ordinary, hurried or demanding scheduled customer arrives with capacity, valid price and reservable stock  
**When** the arrival is processed  
**Then** exactly one ticket is created automatically, stock is reserved and patience starts once; the shift continues without Accept/Decline or an arrival pause. Repeated processing of the same arrival creates no duplicate ticket.

**Given** a hurried or demanding customer creates an order  
**When** the ticket is displayed and resolved  
**Then** its configured patience/penalty differs by customer type; the arrival and automatic ticket flow remains identical to ordinary customers.

**Given** three tickets are active or the oven contains a pizza  
**When** another ticket/bake is requested  
**Then** the command rejects atomically with a local reason and no state mutation.

**Given** an automatically created ticket whose player-owned ingredients were reserved by Story 1.4  
**When** the player taps ingredients and Bake  
**Then** the assembled recipe is preserved, reserved quantities are consumed through the inventory command, one pizza enters the oven, and duplicate rapid taps resolve once.

**Given** a pizza is baking  
**When** simulation reaches 3 or 4 seconds, or passes 5 seconds (user timing update: 2026-10-01)  
**Then** selectors report ready, warning, and burned states respectively; removal before 3 is raw, from 3 through 5 is ready, warning begins at 4, and after 5 is burned; the gauge ends at 7 seconds.

**Given** a raw, ready, or burned pizza  
**When** the player discards it after required confirmation or chooses to continue  
**Then** discard restores no consumed ingredients and frees the oven; remake requires new ingredients.

**Testing:** Vitest command/state-machine boundary tests at timing edges, full-capacity and double-tap rejection, discard/remake invariants, and deterministic event output; Playwright touch flow keeps tickets and oven visible at all target viewports.

### Story 1.6: Box and Deliver to the Intended Ticket Exactly Once

As a player with a finished pizza,
I want to box it when required and deliver it to an explicit ticket,
So that I understand whether the order succeeded and receive revenue only once.

**Goal:** Complete packaging, target selection, delivery validation, ticket timeout, base result feedback, and exactly-once payment.

**Dependencies:** Stories 1.1-1.5.

**Covered requirements:** FR10, FR16, FR18; AR5-AR6, AR15, AR19; UX-DR4-UX-DR7, UX-DR14, UX-DR21.

**Acceptance Criteria:**

**Given** a takeaway ticket and finished pizza  
**When** the player boxes it then taps an action labeled with the selected ticket and recipe  
**Then** delivery resolves against that target and the agreed revenue is granted exactly once.

**Given** a wrong recipe or unboxed takeaway  
**When** Deliver is tapped  
**Then** a consequence confirmation identifies the mismatch; cancel preserves state and confirm resolves one incorrect delivery.

**Given** an expired or already closed ticket  
**When** delivery is attempted  
**Then** the command rejects without consuming the pizza or granting money.

**Given** patience reaches zero  
**When** the timeout command resolves  
**Then** the ticket closes at one star, grants no revenue, and cannot resolve again.

**Given** two rapid delivery inputs share the same logical action  
**When** runtime dispatch handles them  
**Then** only one terminal result, payment, and feedback event exists.

**Testing:** Vitest delivery/packaging/timeout matrix and command-id idempotency; selector tests for selected target and feedback; Playwright exact-match, confirmation cancel/confirm, closed-ticket, selection-change, and double-tap flows.

### Story 1.7: Protect Active Play with Mobile HUD, Pause, Mute, and Lifecycle

As a mobile player,
I want stable controls and safe interruption handling,
So that locking, rotating, muting, or pausing never causes hidden time loss or accidental input.

**Goal:** Complete visibility/orientation continuation, audio unlock/mute, and input ownership while preserving the approved E01 HUD and kitchen composition. Story 1.7 does not authorize redesign.

**Dependencies:** Stories 1.1-1.6.

**Covered requirements:** FR54; NFR1-NFR8, NFR13; AR3, AR7-AR8, AR15, AR20-AR21; UX-DR1-UX-DR8, UX-DR13-UX-DR21, UX-DR23.

**Acceptance Criteria:**

**Given** active play at 360x640  
**When** up to three tickets and the bottom action phase are visible  
**Then** the approved 48/112/251/229px regions fit with safe insets and every actionable target measures at least 48x48 CSS px after scale; preserve the queue/panel as amended by the explicit compact-queue request, phase action beside the ovens, five sauce tiles and ten-tile ingredient grid, per [UI baseline 2026-10-02](../implementation-artifacts/ui-baseline-2026-10-02.md). The visual row supports up to six supplied entries while existing gameplay remains capped at three tickets.

**Given** the tab hides, phone locks, or orientation becomes landscape  
**When** the browser lifecycle adapter reacts  
**Then** its own pause lease freezes simulation without catch-up; foreground and portrait return clear only their leases and require explicit Continue where specified.

**Given** a higher-priority overlay is open  
**When** the player taps a covered lower layer  
**Then** lower input is ignored, overlay priority is deterministic, and oven/ticket state remains readable as frozen.

**Given** audio is locked or muted  
**When** the player interacts or toggles mute  
**Then** audio follows mobile policy while every critical cue remains available as icon plus label/text.

**Given** reduced motion or 200% zoom/equivalent scale  
**When** active play and modals render  
**Then** no prohibited motion occurs, modal content can scroll, and all timers/recovery/primary actions remain reachable without gameplay page scrolling.

**Testing:** Focused Vitest lifecycle/lease/selector tests and focused Chromium checks for the changed behavior, including geometry, lifecycle, overlays, mute, reduced motion and text-scale as applicable. Compare presentation to the approved baseline. Full Playwright Chromium/WebKit across all viewports is reserved for Epic 1 completion or release, per user instruction.

## Epic 2: Khách và uy tín

Players can distinguish four customer personalities, make informed price/bargain decisions, and understand how order quality changes stars, daily rating, reputation, relationship, and limited referrals.

### Story 2.1: Make Customer Patience and Price Behavior Distinct

As a shop owner,
I want each customer type to communicate different patience and price behavior,
So that automatic orders communicate their patience and penalties, while bargaining presents a clear price decision.

**Goal:** Implement the four archetype configurations, final-price evaluation, bargaining interaction, over-price rejection, and capacity behavior.

**Dependencies:** Epic 1 complete.

**Covered requirements:** FR4, FR14-FR16; NFR10, NFR13; AR5-AR6, AR14-AR17, AR19; UX-DR1, UX-DR8, UX-DR14, UX-DR21-UX-DR22.

**Acceptance Criteria:**

**Given** regular, demanding, bargaining, and hurried customer config  
**When** each scheduled customer arrives  
**Then** ordinary commercial visits, including regular customers buying normally, hurried and demanding customers create validated tickets automatically; approved patience, penalties, maximum price, order and distinguishing icon/text cue are visible without relying on color alone. No generic Accept/Decline appears.

**Given** a bargaining offer  
**When** the player chooses “Đồng ý giá giảm” for the 10% reduction  
**Then** the ticket stores that final price and starts patience once; “Từ chối giá” creates no ticket and applies no penalty. Only this price decision pauses the commercial arrival flow.

**Given** a menu price exceeds the customer's threshold  
**When** the customer evaluates it  
**Then** automatic ticket creation or the agreed-price ticket is rejected before creation, excluded from ratings, and reputation decreases by one no more than three times that day.

**Given** all three ticket slots are occupied  
**When** a scheduled customer arrives  
**Then** the customer leaves without a ticket or special choice, star/reputation penalty, or queued backlog.

**Testing:** Vitest covers automatic ticket creation, arrival idempotency, archetype patience/penalty, threshold/bargain/daily-cap rules and invalid config; Playwright verifies no Accept/Decline for ordinary/hurried/demanding visits, separate price choices for bargaining and no hidden ticket timer before a special choice resolves.

### Story 2.2: Explain Stars, Daily Rating, and Reputation

As a player,
I want every order result to explain its star and reputation changes,
So that I can improve service rather than guessing why my shop changed.

**Goal:** Implement deterministic order scoring, demanding-customer modifier, daily aggregation, reputation bounds, and separated result feedback.

**Dependencies:** Story 2.1 and Epic 1 delivery results.

**Covered requirements:** FR17, FR19; AR5-AR6, AR15, AR19; UX-DR1, UX-DR14, UX-DR16, UX-DR21-UX-DR22.

**Acceptance Criteria:**

**Given** a delivered commercial order  
**When** its result resolves  
**Then** scoring starts at five and applies each eligible wrong recipe/packaging, raw/burned, late-half, and demanding-wrong penalty once before clamping to 1-5.

**Given** a terminal commercial result of 4-5, 3, or 1-2 stars  
**When** reputation updates  
**Then** it changes by +1, zero, or -2 respectively and remains within 0-100.

**Given** delivered and timed-out tickets plus pre-ticket rejections  
**When** daily rating is selected  
**Then** completed/time-out results are included and pre-ticket rejections are excluded; no completed orders displays `chưa có đánh giá` rather than five stars.

**Given** result feedback appears  
**When** the player reads it  
**Then** stars, every cause, and reputation delta are distinct from money and XP and remain readable with mute/reduced motion.

**Testing:** Vitest exhaustive penalty combinations, once-per-cause behavior, clamps, daily aggregation, and selector text; Playwright validates reason presentation, icon/text redundancy, and no ambiguous combined reward animation.

### Story 2.3: Build the Regular-Customer Relationship and Capped Referral

As a player,
I want good service to build a visible regular-customer relationship,
So that repeated customers and referrals feel earned and predictable.

**Goal:** Establish commercial relationship progression and the one-customer Day 3 referral input consumed later by E04 schedules.

**Dependencies:** Stories 2.1-2.2.

**Covered requirements:** FR20; AR5-AR6, AR14-AR16, AR19; UX-DR1, UX-DR14, UX-DR21-UX-DR22.

**Acceptance Criteria:**

**Given** the regular customer receives a 4-5-star commercial order  
**When** relationship progression resolves  
**Then** relationship increases by one within 0-3 and no more than once that day.

**Given** another qualifying order or duplicate command occurs on the same day  
**When** progression is evaluated again  
**Then** no second relationship increase or duplicate event occurs.

**Given** Day 2 closes at reputation 55 or more  
**When** referral eligibility is calculated  
**Then** exactly one referral flag becomes available to the Day 3 scheduler; lower reputation produces none.

**Given** relationship or referral feedback appears  
**When** the player reads it  
**Then** the reason and delta are explicit and remain separate from commercial stars, money, and XP.

**Testing:** Vitest relationship bounds, once-per-day/command idempotency, threshold edges at 54/55, and selector feedback; later E04 schedule integration consumes the stable referral flag without altering these rules.

## Epic 3: Chợ và sổ thu chi

Players can prepare the shop using deterministic daily prices, manage expiring stock without hidden double spending, and understand exactly how sales, costs, waste, rent, cash, inventory, and profit produce the day's outcome.

### Story 3.1: Extend Preparation Across Daily Markets and Menu Pricing

As a shop owner,
I want to buy ingredients and set valid menu prices before opening,
So that I can plan the day's service within my available cash.

**Goal:** Extend E01's real Day 1 purchase/lot model across all three deterministic markets with carried stock, rent/risk forecast, menu pricing, and complete open-shop validation. This story reuses the E01 inventory commands and lot entities rather than introducing a replacement implementation.

**Dependencies:** Epics 1-2 complete.

**Covered requirements:** FR13, FR21, FR23, FR27; NFR10; AR5-AR6, AR14-AR16, AR19; UX-DR1-UX-DR3, UX-DR10, UX-DR17, UX-DR21.

**Acceptance Criteria:**

**Given** E01's Day 1 inventory model and a current campaign checkpoint  
**When** preparation loads for Day 1, 2, or 3  
**Then** carried cash/lots remain intact and market prices/coefficients match the deterministic configuration for that day; only new-campaign initialization from Story 1.4 starts at 300 coins and zero stock.

**Given** an ingredient purchase would exceed cash  
**When** the player submits it  
**Then** the command rejects atomically with a precise reason and neither cash nor lots change.

**Given** an affordable purchase  
**When** it succeeds  
**Then** cash decreases once and a lot with ingredient, quantity, unit cost, purchase day, and expiry day is added; no loan, resale, or supply cap appears.

**Given** preparation is active  
**When** the player sets a recipe price  
**Then** it must be 80-140% of reference price rounded to whole coins; after opening, price commands reject and accepted tickets retain their locked price.

**Given** the player attempts to open  
**When** the menu is empty or available cash plus stock cannot support rent/one open recipe  
**Then** opening is blocked or warned exactly as the GDD requires, with forecast rent and specific recovery information.

**Testing:** Vitest deterministic market tables, purchase atomicity, lot creation, integer-price bounds, phase rejection, locked-price invariants, empty-menu and risk forecast cases; Playwright preparation layout, disabled reasons, longest Vietnamese labels, and target geometry.

### Story 3.2: Reserve, Consume, Release, and Expire Ingredient Lots

As a player serving several tickets,
I want stock availability to account for reservations and expiry,
So that every accepted pizza is feasible and inventory changes are trustworthy.

**Goal:** Extend E01's base reservation/consumption commands to multiple lots using FEFO, custom topping allocation, concurrent tickets, expiry, and end-day waste input without changing the first-order contract.

**Dependencies:** Story 3.1 and Epic 1 Stories 1.4-1.6.

**Covered requirements:** FR11-FR12, FR22; AR5-AR6, AR14-AR16, AR19; UX-DR1, UX-DR7, UX-DR10, UX-DR21-UX-DR22.

**Acceptance Criteria:**

**Given** sufficient unexpired available lots  
**When** an automatic commercial ticket is created, a bargaining price is agreed, or Help succeeds  
**Then** the required recipe quantities are reserved FEFO for that ticket and unavailable to other tickets.

**Given** insufficient unexpired stock  
**When** automatic ticket creation, a bargaining price agreement or Help is evaluated  
**Then** the action is disabled/rejected with exact missing quantities and no ticket, reservation, or substitute recipe is created.

**Given** a ticket starts production with selected ingredients  
**When** the command succeeds  
**Then** selected quantities consume their reserved/available lots atomically, unused recipe reservations return to availability, and extra toppings never steal another ticket's reservation.

**Given** an accepted ticket times out before use  
**When** it closes  
**Then** all unused reservations release exactly once; consumed/discarded/remake ingredients are never restored.

**Given** the day reaches its expiry boundary  
**When** eligible lots are processed  
**Then** all expiring quantities, including previously released stock, are removed FEFO and their historical cost is recorded once as waste.

**Testing:** Vitest multi-lot FEFO tables, concurrent reservations, atomic rejection, custom-topping consumption, timeout/release idempotency, discard/remake, and expiry cost; property/invariant tests ensure available + reserved + consumed/discarded balances quantities.

### Story 3.3: Close the Day with an Explainable Financial Ledger

As a shop owner,
I want the end-of-day ledger to reconcile cash and profit separately,
So that I understand whether the shop actually made money and why.

**Goal:** Compute one immutable pending day result in the approved order and present an ordered, scrollable summary; persistence/advance is added in E04.

**Dependencies:** Stories 3.1-3.2 and Epic 2 terminal customer results.

**Covered requirements:** FR18, FR24, FR41; AR5-AR6, AR15, AR19; UX-DR1, UX-DR10-UX-DR12, UX-DR14, UX-DR17-UX-DR18, UX-DR21-UX-DR22.

**Acceptance Criteria:**

**Given** the shift and grace period are ready to close  
**When** the day-close calculation runs  
**Then** it resolves remaining tickets, calculates rating/goal inputs, prepares eligible rewards, expires lots, charges rent, computes ledger/insolvency inputs, and produces one pending result in that order.

**Given** commercial orders, a gift pizza, purchases, expiry, rent, and rewards exist  
**When** the ledger is selected  
**Then** it separately displays cash, sales, bonuses, purchases, COGS, gift cost, waste, rent, wages zero with reason, repairs zero with reason, other costs, profit, and closing inventory value.

**Given** purchases reduced cash when they occurred  
**When** profit is calculated  
**Then** purchase cash outflow is not also treated as COGS; only consumed/gift/waste rules affect the approved profit formula.

**Given** the summary is viewed at a target mobile viewport or 200% scale  
**When** content exceeds available height  
**Then** ordered sections scroll, arithmetic rows remain grouped, and the sticky save/advance region remains visible but unavailable until E04 persistence confirms the commit.

**Testing:** Vitest golden accounting scenarios and conservation checks for revenue/cash/COGS/waste/gift/rent/profit, close-order idempotency, and selector grouping; Playwright summary scrolling, sticky disabled action, numeric alignment, zoom, and Vietnamese overflow.

## Epic 4: Demo ba ngày và quan hệ đầu tiên

Players can complete the deterministic three-day campaign, pursue goals and a mission, unlock a later-day recipe, choose whether to help a regular customer, recover safely from local-save problems, and finish or become insolvent without reopening completed days.

### Story 4.1: Play the Deterministic Three-Day Schedule

As a demo player,
I want three clearly bounded shifts with predictable customer opportunities,
So that I can learn, compare decisions, and reach a meaningful campaign ending.

**Goal:** Implement approved Day 1-3 schedules, shift start/end, takeaway cadence, referral insertion, grace period, and final-day boundary.

**Dependencies:** Epics 1-3 complete.

**Covered requirements:** FR2, FR20, FR37-FR40; NFR10, NFR13; AR5-AR8, AR14-AR16, AR19; UX-DR7-UX-DR10, UX-DR13, UX-DR16, UX-DR22, UX-DR24.

**Acceptance Criteria:**

**Given** a configured demo day  
**When** the player explicitly starts the shift  
**Then** its approved duration and customer slots begin on simulation time, each slot can spawn at most once, and missed/full-capacity slots never backlog.

**Given** a commercial customer slot number  
**When** its automatic ticket or special price decision is created  
**Then** every third commercial order is takeaway, other commercial orders are counter service, and help orders do not alter this cadence.

**Given** Day 2 ended at reputation 55 or more  
**When** Day 3 schedule is built  
**Then** at most one configured referral is inserted without violating ticket capacity or mission feasibility.

**Given** shift time ends  
**When** tickets remain  
**Then** no new customers spawn, up to 120 simulation seconds of grace resolve active tickets, and remaining tickets close when grace ends.

**Given** Day 3 closes  
**When** scheduling is queried  
**Then** no Day 4 playable state, customer slot, or navigation action exists.

**Testing:** Vitest deterministic schedule snapshots, one-shot slots, full-capacity miss, takeaway cadence, referral/no-referral, mission feasibility, shift/grace boundary, and no-Day-4 transition; Playwright verifies visible phase/timer transitions without frantic input.

### Story 4.2: Progress Goals, Mission, XP, Levels, and Recipe Unlocks Once

As a progressing shop owner,
I want daily goals, a three-day mission, XP, and recipe unlocks to resolve transparently,
So that each day gives me a reason to improve without duplicate rewards.

**Goal:** Implement goal/mission state machines, XP/levels, reward IDs, sausage unlock, next-day menu eligibility, and valid order generation.

**Dependencies:** Story 4.1 and Epic 3 pending day result.

**Covered requirements:** FR25-FR31, FR42; AR5-AR6, AR14-AR16, AR19; UX-DR1, UX-DR10-UX-DR11, UX-DR14, UX-DR21-UX-DR22.

**Acceptance Criteria:**

**Given** a delivered commercial order  
**When** progression resolves  
**Then** it grants 10 XP, adds 5 XP only for 4-5 stars, grants none for timeout, and updates applicable goal/mission progress independently.

**Given** a daily goal succeeds at summary  
**When** its stable reward ID is claimed  
**Then** 20 coins and 10 XP apply exactly once; failure does not block the following day and reward money never counts toward revenue.

**Given** eight qualifying cheese pizzas are sold across the demo  
**When** the mission completes  
**Then** 30 coins, 20 XP, and two reputation apply exactly once and mission lifecycle remains explicit.

**Given** XP crosses 60 or 150  
**When** level is selected  
**Then** level becomes 2 or 3, total XP is retained, and level 2 unlocks sausage only for the next day's menu.

**Given** a recipe is locked or omitted from today's menu  
**When** the scheduler generates an automatic order or special price/help request  
**Then** that recipe is never requested; a non-empty valid menu is required before opening.

**Testing:** Vitest threshold edges, reward-id/double-submit/load idempotency, independent goal/mission progress, failed-goal continuation, unlock timing, and recipe-generation constraints; Playwright summary progress/reward separation and next-day menu availability.

### Story 4.3: Choose Whether to Help the Returning Regular Customer

**Customer-flow update (2026-10-01):** Keep Help / Decline for this story request because it is a narrative choice. The regular customer still arrives automatically; a normal purchase uses automatic ticket creation without Accept/Decline. Only asking for help opens this decision and its pause lease.

As a player who met a regular customer,
I want to help or decline with understandable consequences,
So that the first relationship story reflects my service and choice rather than hidden commercial scoring.

**Goal:** Implement the three encounter gates, Day 2 free help ticket, relationship outcomes/exclusions, Day 3 thanks, and one-time reward.

**Dependencies:** Stories 4.1-4.2 and Epic 2 relationship state.

**Covered requirements:** FR20, FR32-FR36; AR5-AR6, AR14-AR16, AR19; UX-DR1, UX-DR8, UX-DR14, UX-DR21-UX-DR22.

**Acceptance Criteria:**

**Given** the regular customer's Day 1 commercial service ended below three stars  
**When** Day 2 schedule is built  
**Then** the return/help encounter does not appear; at three stars or more it appears once and explains the cheese preference.

**Given** the Day 2 help offer and insufficient stock  
**When** the choice is shown  
**Then** Help is disabled with an exact reason while Decline remains available and changes no cash, reputation, or relationship.

**Given** Help is accepted  
**When** its ticket is created  
**Then** it occupies one slot, has a 120-second limit, consumes normal ingredients, and is visibly marked noncommercial with zero revenue/order XP.

**Given** the help pizza is correct, ready, and on time, or instead wrong/raw/burned/late  
**When** it resolves  
**Then** relationship changes according to the approved branch exactly once while reputation, daily rating, commercial goal/mission, and rating XP remain unchanged; gift cost is reported once.

**Given** the Day 3 relationship condition is met  
**When** the regular returns  
**Then** thanks and the 20-coin relationship reward occur exactly once at relationship two, with no family-recipe placeholder.

**Testing:** Vitest encounter gating, Help stock/decline, success/failure matrix, commercial-exclusion assertions, gift-cost accounting, relationship clamp/idempotency, and one-time Day 3 reward; Playwright complete help and refuse branches with consequence preview and noncommercial feedback.

### Story 4.4: Create, Validate, and Load the Latest Campaign Checkpoint

As a returning player,
I want the game to load only a valid latest checkpoint,
So that local corruption or incompatible data never silently changes my campaign.

**Goal:** Implement the versioned save envelope, `SaveRepository` IndexedDB adapter, campaign-creation checkpoint, validation/migration boundary, active/same-commit backup, revision checks, and boot recovery UI.

**Dependencies:** Stories 4.1-4.3; AR9 becomes active only in this story.

**Covered requirements:** FR45-FR46, FR48; NFR9; AR9, AR11-AR13, AR17, AR20; UX-DR1, UX-DR10, UX-DR12-UX-DR13, UX-DR21-UX-DR22.

**Acceptance Criteria:**

**Given** a new campaign is confirmed  
**When** repository creation succeeds  
**Then** a versioned checkpoint before Day 1 purchases becomes the latest revision and no gameplay-tap persistence is registered.

**Given** a structurally valid latest checkpoint  
**When** boot loads it  
**Then** schema/content versions, ranges, and linked IDs validate before domain state is constructed, and Continue names the current day.

**Given** active data is corrupt or references invalid content  
**When** a valid backup with the same commit ID/revision exists  
**Then** recovery is explained and requires confirmation; a different/older commit is never offered as playable rollback.

**Given** save schema is newer than the game or migration fails on a validated copy  
**When** load is attempted  
**Then** incompatibility is distinguished from corruption, original data remains untouched, and safe Retry Read or confirmed New Campaign choices appear without raw save/exception content.

**Given** two tabs hold different revisions  
**When** the stale tab attempts a write  
**Then** the repository returns a revision conflict requiring reload and never merges state.

**Testing:** Browser integration tests against IndexedDB for create/load, envelope validation, corrupt active, same/different-commit backup, newer schema, failed migration, revision conflict, unavailable storage, and confirmed recovery; Playwright boot/recovery attention and safe action flows.

### Story 4.5: Commit a Day Safely and Resume Without Replay

As a player finishing a day,
I want saving and continuation to be atomic and recoverable,
So that retries cannot duplicate rewards or reopen a completed day.

**Goal:** Connect pending day results to prepare/commit/confirm, retry the same payload, enforce immutable completed days, and implement mid-day reload semantics.

**Dependencies:** Story 4.4 and Epic 3 pending result.

**Covered requirements:** FR41, FR45-FR48; NFR7, NFR9-NFR10; AR9-AR13, AR17, AR19-AR20; UX-DR1, UX-DR8, UX-DR10-UX-DR13, UX-DR21-UX-DR22.

**Acceptance Criteria:**

**Given** a pending day result  
**When** Save starts  
**Then** one stable commit ID/payload is prepared, Next Day/Finish Demo is disabled, and no next-day state becomes active before the IndexedDB transaction completes.

**Given** the transaction fails  
**When** the error panel appears  
**Then** the old checkpoint and pending RAM result remain intact, the unsaved day/risk is named, and retry reuses the same commit ID/payload without recalculating rewards.

**Given** retry or duplicate submit succeeds  
**When** confirmation runs  
**Then** exactly one checkpoint/reward set exists, the completed day becomes immutable, and only the legitimate next action is enabled.

**Given** the page reloads during an uncommitted shift  
**When** latest checkpoint loads  
**Then** the player returns to the start of that same current day with its deterministic prices/schedule and all later RAM mutations discarded.

**Given** a day is committed  
**When** any runtime/UI/repository action is queried  
**Then** no replay, rollback, historical checkpoint selection, or branch command exists.

**Testing:** Vitest prepare/confirm/reward idempotency and absence of replay commands; IndexedDB integration for partial failure, retry, duplicate submit, old revision, and latest-only load; Playwright Day 2 fail/retry/advance, mid-shift reload, and no replay UI.

### Story 4.6: Resolve Insolvency or Finish the Demo After Day 3

As a player reaching a campaign boundary,
I want a clear insolvency or final-demo result,
So that the run ends honestly without a false next day or lost summary.

**Goal:** Implement next-day viability checks, insolvency warning/end state, Day 3 final commit/results, and confirmed new campaign.

**Dependencies:** Stories 4.1-4.5.

**Covered requirements:** FR2, FR42-FR44, FR47; NFR12; AR10, AR15, AR17, AR20-AR22; UX-DR10-UX-DR12, UX-DR14, UX-DR17-UX-DR18, UX-DR21-UX-DR24.

**Acceptance Criteria:**

**Given** the next-day checkpoint cannot cover rent or make at least one open recipe using cash plus stock  
**When** viability is evaluated  
**Then** the campaign ends with the exact cause and only Summary or confirmed New Campaign; no loan, rescue, or advance action appears.

**Given** the same risk is detectable before opening  
**When** preparation is shown  
**Then** the player receives the approved warning without changing the final viability rule.

**Given** Day 3 pending results are ready  
**When** the final save transaction succeeds  
**Then** final results show cumulative cash/profit, level/XP, reputation, relationship, and mission; no playable Day 4 checkpoint or control is created.

**Given** final Day 3 save fails  
**When** the player retries  
**Then** Finish Demo remains disabled until the same commit succeeds and no cumulative value/reward duplicates.

**Given** New Campaign is selected from insolvency or final results  
**When** confirmation is accepted  
**Then** a fresh campaign checkpoint is created and the player is told committed days cannot be revisited.

**Given** a five-person moderated playtest  
**When** the approved script is completed  
**Then** results record first-order time, completion/insolvency comprehension, ledger explanation, and Day 4 interest against NFR12 without changing requirements to manufacture a pass.

**Testing:** Vitest viability boundary scenarios and final-result selectors; IndexedDB final-commit/no-Day-4/retry tests; Playwright insolvency, final Day 3, failed final save, New Campaign confirmation, and absence of post-demo placeholders; execute and record the approved five-player playtest separately.


## Art direction update — 2026-09-30

User-confirmed direction: **2D cartoon**, replacing the previous pixel-art direction. Use soft rounded forms, clear smooth outlines, warm wood/cream/tomato/amber colors, expressive characters, and subtle shading. Keep Vietnamese text readable and retain existing gameplay, portrait layout, and touch-target requirements. This direction supersedes earlier conflicting visual assumptions; existing palette tokens require validation during implementation. This update changes documentation only: cartoon artwork/rendering and visual verification remain pending. Prior completion and test records describe the previous implementation.



