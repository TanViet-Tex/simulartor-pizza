# Three-day playable demo

## Default Cozy Epic 3 implementation — 2026-10-03

Stories 3.1–3.3 are implemented and ready for review. The preparation market now exposes 80–140% menu pricing on existing recipe targets, command-ID purchases, rent/stock warnings and a read-only stock view after opening. Tickets reserve exact usable dated FEFO lot units and baking consumes their historical cost without stealing another ticket's held lot.

The immutable day statement separates starting/ending cash, sales, zero rewards, purchases, consumed/spoiled stock, rent and explained zero wages/repairs/other costs. Inventory retains historical value; following-day purchases change live cash and next-day books without altering the closed report. Existing figure cards open scrollable statement detail. Approved base UI geometry and menu assets remain intact.

Evidence: 92 focused Vitest checks, six scoped Chromium 390×844 E2E cases and build-nolog passed; [implementation matrix](spec-epic-3-market-accounts.md) records scope and [cash detail](epic-3-evidence/statement-cash.png) shows the new overlay. Stories stay review pending independent acceptance; Epic 1 status remains unchanged. RAM persistence, XP/missions/unlocks/help scheduling and the pre-existing off-recipe topping gap remain outside this work.

## Default Cozy Epic 2 implementation — 2026-10-02

Stories 2.1–2.3 are complete and independently reviewed. All 11 review findings were resolved and verified. The default Cozy shop now repeats regular/hurried/picky/bargaining visits, with separate patience and reference-price limits. The fourth visit opens an owned bargaining pause; acceptance reserves stock and starts patience at the agreed rounded price, while rejection adds no commercial result. Typed preparation-only pricing is available to runtime consumers; player-facing price controls remain Epic 3.

Commercial deliveries, expiries and closing-day departures supply actual stars, explicit scoring reasons and bounded reputation deltas. Familiar commercial service grows a separate 0–3 relationship at most once per day. Day 2 closure records stable Day 3 referral eligibility at final reputation 55; no referral/help scheduling is implemented here. Approved kitchen/menu/hub geometry, colors, assets, five sauce and ten ingredient slots remain intact; additional details use existing order/result/review surfaces and the cream modal pattern.

Final evidence: 76 focused Vitest tests passed in 12 domain/runtime/presentation files, including `CustomerProgression.test.ts`, `DeliveryResult.test.ts`, `CozyCustomers.test.ts`, `CozyTickets.test.ts`, `CozyDelivery.test.ts` and `CozyDay.test.ts`, plus affected shop, stock, tutorial, pause and queue regressions. `npm run build-nolog` passed. Two existing day-end tests and two focused Epic 2 touch/visibility/200%-text tests passed on Chromium 390×844. The four-personality case passed independently after raising its test-only wall-clock timeout. [Final spec and matrix audit](spec-epic-2-customers-reputation.md) and [summary screenshot](epic-2-evidence/epic2-summary.png) record the result.

Cozy remains RAM-only. Campaign/checkpoints, Epic 1's separate audit, Epic 3 pricing UI, XP/missions and Epic 4 help/referral consumption are not certified by this work. The earlier prototype description below refers to the separate campaign prototype, not Cozy completion.

Playable implementation: market, three-day order schedules, cooking, takeaway boxing, four customer types, returning-customer help request, daily goals, XP/unlocks, reputation, stock expiry, daily ledger and forward-only checkpoints.

Source ownership: `src/domain/demo.ts` contains deterministic game rules; `src/infrastructure/checkpoints.ts` owns IndexedDB transactions; `src/scenes/BootScene.ts` presents the touch prototype. Button actions update in-memory domain state only. Database writes occur on campaign start and daily transitions, not per action.

Pause reasons are tracked independently (user, visibility, orientation, frame gap, confirmation and tutorial); pending customer offers also freeze domain time. The loop uses 50ms steps and discards long frame gaps.

Prototype limitations: onboarding is a guide rather than an interactive practice fixture; artwork is procedural; final accessibility/UX acceptance and story-by-story signoff remain open. Do not mark all E01-E04 stories accepted from this prototype alone.
