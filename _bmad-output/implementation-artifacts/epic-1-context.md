# Epic 1 Context: Vòng lặp làm và giao pizza

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Deliver the first complete portrait-mobile service slice: the player launches a validated Phaser game, learns touch controls without commercial time pressure, buys real Day 1 ingredients from zero stock, receives an automatically created inventory-backed order, assembles and bakes a pizza, boxes takeaway when required, and delivers to an explicit ticket exactly once. The slice must remain understandable and safe through pause, mute, rotation, visibility changes, rapid taps, and constrained mobile layouts while establishing the technical foundation reused by later demo epics.

## Stories

User update2026-10-03 (documentation only; not implemented): Start/New Campaign must enter the isolated pizza tutorial directly, without a market or ingredient-purchase prerequisite. This overrides older statements about purchasing before learning. Practice ingredients do not affect cash/stock/rewards; commercial purchases still follow the GDD. Preserve approved UI and existing historical test evidence. See planning-artifacts/pizza-gdd/decision-log.md.

- Story 1.1: Set Up the Initial Project from the Official Phaser Starter
- Story 1.2: Boot Validated Demo Content and the Portrait Shell
- Story 1.3: Run a Controlled Tutorial with Owned Pause Leases
- Story 1.4: Buy and Reserve Ingredients Before the First Commercial Order
- Story 1.5: Automatically Create Customer Orders and Make a Pizza in One Oven
- Story 1.6: Box and Deliver to the Intended Ticket Exactly Once
- Story 1.7: Protect Active Play with Mobile HUD, Pause, Mute, and Lifecycle

## Requirements & Constraints

- Start from the official `phaserjs/template-vite-ts` 1.4.0 in staging, record its commit SHA, and integrate only approved starter files. Pin Node 24.21.0, npm 11.19.0, Phaser 4.2.1, TypeScript 5.7.2, Vite 6.3.1, Terser 5.39.0, Vitest 4.1.11, and Playwright 1.63.0. Produce a lockfile and pass typecheck, baseline tests, smoke boot, and `npm run build-nolog` without telemetry.
- Validate configuration and the mandatory licensed-asset manifest before gameplay. Missing, duplicate, invalid, or broken IDs and failed required assets must stop before campaign mutation and expose a stable retry path; never choose fallback content silently.
- Day 1 begins with 300 coins and zero stock. The player must purchase affordable ingredient lots and have enough unreserved stock for at least one open recipe before opening. Cheese and mushroom use their approved reference prices in this epic; editable pricing is deferred.
- Ordinary, hurried and demanding customers arrive automatically and atomically create a validated ticket, reserve recipe quantities and start patience, without Accept/Decline or an arrival pause. Production consumes committed quantities, timeout-before-use releases them once, and discard/remake never restores consumed ingredients. Insufficient stock rejects ticket creation with exact missing quantities. Hurried/demanding types differ by configured patience and penalties.
- Bargaining customers use a separate price choice; regular customers asking for story help retain Help / Decline. Only these special decisions pause and delay ticket/patience/reservation until agreement. Regular customers buying normally follow automatic commercial ordering.
- Support at most three active tickets, one oven, and one baking pizza. Oven outcomes are deterministic: raw before 3 seconds, ready from 3 through 5, warning from 4 through 5, and burned after 5 (user timing update 2026-10-01; gauge ends at 7 seconds). Time feedback refreshes at least every 0.1 seconds.
- Takeaway requires boxing. Delivery always targets an explicitly selected ticket; wrong recipe or missing packaging requires consequence confirmation. Closed targets reject without consuming pizza. A commercial order pays its agreed price once; timeout pays nothing, and duplicate taps cannot create duplicate state, payment, or feedback.
- The tutorial uses an isolated practice fixture and controlled training time. It grants no money or XP and advances no commercial schedule, patience, or inventory accounting. Commercial time begins only after explicit `Bắt đầu ca` action.
- Target Chrome Android and Safari iOS in portrait at 360x640, 390x844, and 412x915 CSS px. Use single-touch controls of at least 48x48 CSS px, complete Vietnamese text, safe-area handling, smooth proportional cartoon scaling, no kitchen page scrolling, and no hover, keyboard, precision-drag, or multitouch dependency.
- Preserve a relaxed pace: lifecycle gaps over 250 ms pause rather than catch up. Critical state must never rely on color or audio alone. Honor reduced motion, support mute and mobile audio unlock, and keep initial assets within 10 MB with a five-second empty-cache start target.
- Do not expose or create placeholders for E05-E09, Day 4, delivery app, staff, weather, marketing, hidden missions, or VIP systems.

## Technical Decisions

- Phaser owns presentation and scene lifecycle; HTML/CSS is limited to canvas hosting, safe areas, and the orientation shell. Pure TypeScript domain code must not import Phaser, DOM, IndexedDB, or console logging.
- Compose dependencies in `src/main.ts`. Keep domain models/rules/state machines separate from `runtime`, `presentation`, `features`, `infrastructure`, and validated `config`; avoid globals, service locators, broad barrel files, and generic manager/helper modules.
- Every gameplay mutation goes through typed `GameRuntime.dispatch`. Commands validate and apply atomically or leave state unchanged, use stable `commandId` idempotency, and return typed results/events. UI reads pure selector view models and never infers success from animation or audio callbacks.
- Model day, order, oven, and mission states as discriminated unions with pure transition functions. Use stable namespaced content and command IDs, past-tense events, scoped asset keys, and exhaustive invalid-transition tests.
- Drive gameplay from one fixed 50 ms simulation clock independent of rendering and wall time. Pause sources acquire owner-specific, idempotently released leases; the clock runs only in an allowed phase with no active lease. No `resumeAll` or `clearAll` API is allowed.
- Domain entities remain plain data. Phaser objects are created and updated through presentation factories/presenters. Scene subscriptions must be registered and removed deterministically, and scene shutdown releases only scene-owned leases.
- Keep gameplay RAM mutations distinct from persistence. Epic 1 does not write IndexedDB per tap; persistence remains behind the repository boundary introduced by the later checkpoint stories.
- Unit-test domain, runtime, selectors, clock, config, inventory conservation, timing boundaries, invalid transitions, and duplicate commands without Phaser, canvas, DOM, IndexedDB, or real waits. Browser tests cover Chromium/WebKit mobile layout, lifecycle, orientation, overlay input ownership, audio, reduced motion, zoom, and touch geometry.

## UX & Interaction Patterns

- Preserve the user-approved [UI baseline of 2026-10-02](ui-baseline-2026-10-02.md): status 48px, queue/canopy region 112px, work region 251px and action/ingredient region 229px in a 360x640 canvas. The user subsequently authorized only the [compact queue/panel revision](spec-compact-order-queue.md): cream fabric/terracotta hem/yellow lamps, up to six round presentation slots, gold explicit selection, app-source phone icon, and the unselected detail prompt. Gameplay remains at three active tickets without app arrivals. Keep left prep board/right ovens, phase action y=411, five sauce tiles y=464 and the ten-tile ingredient grid. Selection never reflows the rail; former 96/176px budgets are superseded.
- Keep the canonical behavior of `action-button`, `order-ticket`, `ingredient-control`, `oven-status`, `primary-status-bar`, `offer-modal`, `feedback-strip`, and `pause-panel` within this approved composition. Phase actions beside the ovens change label by state; this does not authorize moving them.
- Keep the warm cartoon theme from `src/presentation/theme.ts`, including green primary actions, wood/cream/terracotta surfaces, zero letter spacing and current rounded geometry. Contrast targets remain 4.5:1 for normal text and 3:1 for essential boundaries. Do not restore historical red-button/2–6px tokens.
- New gameplay, lifecycle, audio, performance or accessibility stories must preserve this layout and the illustrated animated main menu. A redesign needs an explicit user request; limit any requested UI change to its stated scope.
- Special price/help decisions and tutorial overlays pause their own sources; ordinary arrivals never pause. Overlay priority is fatal/recovery, orientation, foreground Continue, user pause, tutorial, special customer choice, then transient feedback. Covered layers receive no input; oven and deadline state remains visible and labeled as frozen or running.
- Delivery labels echo both target and recipe. Exact matches resolve in one tap; consequential mismatches confirm. Timers use stable-width `m:ss` plus icon/text labels, and every disabled or failed action names its reason.

## Cross-Story Dependencies

Story 1.1 establishes the verified toolchain and build baseline. Story 1.2 adds boot validation and the portrait shell. Story 1.3 introduces the command runtime, fixed clock, and pause leases used by all gameplay stories. Story 1.4 must provide real purchased and reserved inventory before Story 1.5 can automatically create and cook a commercial order. Story 1.6 consumes Story 1.5 production results and closes tickets/payment. Story 1.7 completes the shared HUD and lifecycle protections around the entire playable slice. Later E03 stories extend the same inventory model with multi-day prices, FEFO, expiry, and accounting rather than replacing it.


## Art direction update — 2026-09-30

Historical direction decision; the pending implementation statement below describes 2026-09-30. The current interface is implemented and governed by the approved 2026-10-02 UI baseline linked above.

User-confirmed direction: **2D cartoon**, replacing the previous pixel-art direction. Use soft rounded forms, clear smooth outlines, warm wood/cream/tomato/amber colors, expressive characters, and subtle shading. Keep Vietnamese text readable and retain existing gameplay, portrait layout, and touch-target requirements. This direction supersedes earlier conflicting visual assumptions; existing palette tokens require validation during implementation. This update changes documentation only: cartoon artwork/rendering and visual verification remain pending. Prior completion and test records describe the previous implementation.

