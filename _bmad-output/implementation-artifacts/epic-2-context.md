# Epic 2 Context: Khách và uy tín

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Players distinguish four customer personalities, understand price/bargain decisions, and see separate order-star, daily-rating, reputation and relationship consequences. Complete the demo customer rules while preserving the approved interface, and supply bounded referral eligibility for later Epic 4 integration.

## Stories

- Story 2.1: Make Customer Patience and Price Behavior Distinct
- Story 2.2: Explain Stars, Daily Rating, and Reputation
- Story 2.3: Build the Regular-Customer Relationship and Capped Referral

## Requirements & Constraints

- Customer patience/maximum reference-price ratio: regular 120 seconds/120%; demanding 100/110%; bargaining 110/105%; hurried 75/125%. Bargaining requests 10% off. Regular customers request cheese and track a separate relationship.
- Menu prices range from 80–140% of reference, rounded to whole coins. Evaluate final agreed price. Excessive price rejects before ticket creation, contributes no stars/failed order, and costs one reputation at most three times/day. Declining a bargain adds no penalty.
- Ordinary commercial visits, including regular/hurried/demanding, create tickets automatically. Ticket creation, stock reservation, final price and patience start are atomic. Missing stock reports its reason without substituting the requested recipe. Three occupied slots cause departure with no special choice, penalty or backlog.
- Bargaining decisions precede ticket/reservation/patience. Agreement stores final price and starts patience once. No arrival accumulation during the special choice.
- Delivered commercial scoring starts at five: wrong recipe/packaging −2 once; raw/burned −2 once; later than half patience −1; demanding wrong recipe adds −1. Distinct causes combine, each once; clamp 1–5. Expiry scores one and earns nothing. Delivered orders collect agreed price once, without tips/refunds.
- Reputation starts at 50, clamped 0–100: 4–5 stars +1; three unchanged; 1–2 −2. Daily rating averages terminal commercial results, including expiry, excluding pre-ticket rejection. Empty days show “Chưa có đánh giá”. Story-help orders do not contribute commercial revenue, XP, ratings or reputation penalties.
- Regular commercial service at 4–5 stars increases relationship once/day, clamped 0–3. Duplicate commands produce no duplicate increase/event. Closing Day 2 with reputation ≥55 provides exactly one Day 3 referral flag; 54 or below provides none. Epic 2 supplies eligibility; Epic 4 owns its scheduled consumption and help storyline.
- Focused tests cover invalid config, arrival/command idempotency, price/bargain thresholds and daily cap, capacity/stock failure, penalty combinations, bounds, rating aggregation, relationship daily cap and 54/55 edges. Browser tests cover automatic arrivals, no hidden bargain timer, readable reasons and affected geometry. No full browser/viewport matrix per story.

## Technical Decisions

- Pure TypeScript domain owns mutations/rules. Presentation sends typed intents through GameRuntime.dispatch and reads selectors/view models. Phaser/animation callbacks never award money/reputation/relationship.
- Validate immutable config once; use stable IDs and typed gameplay results, without silent integrity fallback. Use discriminated state machines and deterministic scoring reasons.
- Simulation runs at 20 Hz and owns patience/arrivals/oven time. Special decisions acquire their own pause lease; resolution releases only that lease. No background catch-up or backlog.
- Order stars, shop reputation and individual relationship are distinct models. Domain owns formulas; selectors/presenters expose reasons/deltas without duplicating scoring. Referral eligibility is a stable scheduler input.
- This epic does not complete IndexedDB/checkpoints, missions or Epic 4 story help. Current Cozy day hub retains RAM; additional feedback is not durable-save certification.

## UX & Interaction Patterns

- Preserve the approved 2026-10-02 UI, including six presentation avatar positions with the unchanged three-ticket gameplay cap, selection panel, HUD/kitchen/menu, five sauce cells and ten ingredient cells. Do not revive obsolete layout budgets or redesign assets/theme.
- Preserve day-end hanging board, money/level/rating cluster, five tabs, three cards, four preparation cells and green footer button. Values/comments must reflect actual results; never overwrite baseline images to legitimize redesign.
- Customer differences need text/icon cues as well as color. Existing bargain modal shows original price, 10% reduction, final price and “Đồng ý giá giảm” / “Từ chối giá”. Ordinary arrivals have no generic Accept/Decline.
- Stars, each cause, reputation, relationship and referral feedback remain explicit and separate from money/XP, readable with mute/reduced motion. Use existing surfaces. If a requirement genuinely needs approved geometry changes, present the conflict and concrete option for user decision while continuing independent work.

## Cross-Story Dependencies

- Epic 1 service capabilities underpin ticket delivery/expiry, reservation, command idempotency and pause ownership. Its tracked completion status must not be inferred or changed by compiling this context.
- Story 2.1 supplies customer/price behavior to 2.2; 2.2 supplies commercial results to 2.3.
- Epic 3 consumes final pricing. Epic 4 consumes relationship/referral eligibility and owns Day 3 scheduling/help branches; those integrations do not expand this epic's scope.
