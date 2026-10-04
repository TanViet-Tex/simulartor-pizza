# Epic 4 Context: Demo ba ngày và quan hệ đầu tiên

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Deliver a deterministic three-day demo with understandable goals, XP and recipe progression, one returning-customer relationship branch, safe latest-checkpoint continuation and an honest final result. Stories4.1/4.2 are implemented; the current request explicitly covers4.3–4.6. The approved implementation breakdown supplies the six stories below. Actual five-person moderated playtesting remains separate human evidence and must never be fabricated from automated tests.

## Stories

- Story 4.1: Play the Deterministic Three-Day Schedule
- Story 4.2: Progress Goals, Mission, XP, Levels, and Recipe Unlocks Once
- Story 4.3: Choose Whether to Help the Returning Regular Customer
- Story 4.4: Load Only a Valid Latest Checkpoint
- Story 4.5: Commit a Day Safely and Resume Without Replay
- Story 4.6: Resolve Insolvency or Finish the Demo After Day 3

## Requirements & Constraints

- Day 1 provides six customer opportunities at simulation seconds 10, 35, 60, 85, 110 and 135 within a 180-second schedule. Its mix is one regular, two demanding and three bargaining customers. Day 2 provides eight opportunities from second 10 every 22 seconds within 210 seconds. Its first slot is the eligible returning regular, otherwise bargaining; remaining slots rotate hurried/demanding/bargaining. Day 3 provides ten opportunities from second 10 every 20 seconds within 240 seconds; first-slot regular eligibility is conditional and remaining slots rotate the other groups. An earned referral is an additional opportunity at second 210, at most once, when Day 2 closing reputation is at least 55.
- Each scheduled opportunity is attempted once. Full capacity, unavailable stock and invalid prices never produce a backlog or silently substitute ingredients. Keep the three-ticket cap. Every third commercial opportunity is takeaway; help remains counter service and does not shift commercial cadence. Commercial arrivals create tickets automatically; only bargaining and narrative help use special decisions and owned pauses.
- The original campaign schedule stops arrivals at shift end, allows up to 120 simulation seconds to resolve remaining tickets, then closes them. The later, explicit Cozy user decision requires manual “Kết thúc ngày” with confirmation instead of automatic summary/day transition. Preserve that decision for the current Cozy integration; timed opportunities and ticket resolution must not silently reinstate automatic day advancement. The separate campaign flow retains its original contract.
- Delivered commercial orders grant 10 XP, with 5 additional XP only for four or five stars. Timeouts grant none. Tutorial and help grant no commercial XP, revenue, rating, commercial goals or mission progress. Levels start at 0/60/150 XP; cap the displayed demo level at 3 while retaining total XP.
- Daily goals: Day 1 delivers three commercial orders; Day 2 reaches 200 commercial sales coins; Day 3 has at least three ended commercial orders and average rating at least four stars. Resolve each goal once at summary: success awards 20 coins and 10 XP; failure expires that goal and never blocks the next day.
- The visible three-day mission sells eight cheese pizzas. It progresses independently of daily goals and awards 30 coins, 20 XP and two reputation automatically once. Keep mission lifecycle, progress, deadline and reward state explicit. No reward is reissued by reopening a tab or submitting the same completion again.
- Cheese and mushroom recipes are initially open. Reaching level 2 makes sausage eligible only from the next day; its reference price is 75 coins, recipe is dough/sauce/cheese/sausage, Day 1 sausage unit cost is 10 coins and its lot expires at the end of its purchase day. Preserve existing economic price multipliers and dated-lot rules.
- Automatic recipe requests follow cheese/cheese/mushroom/cheese/sausage cyclically; a locked or omitted recipe falls back to the first open recipe in recipe-table order. Regular customers request cheese; referral requests use the first open recipe. Require a non-empty valid menu before opening. The published cycle is marked a design proposal in the GDD; implementation must identify that provenance rather than claim a new user-approved menu design.
- Settle commercial outcomes, goals and eligible rewards before expiry/rent/accounting and viability checks. Rewards are a separate cash inflow, never sales or business profit and never revenue-goal progress. A day result remains immutable after settlement. Day 3 cannot expose a playable Day 4 or replay of any closed day.

## Technical Decisions

- Keep domain rules and progression in pure TypeScript, with one owner for each mutation. Presentation reads selectors and sends typed runtime commands; animation callbacks do not award XP, money or reputation. Configuration has stable IDs and validates once before gameplay.
- Customer schedules, patience, ovens and progression deadlines share the fixed 50 ms simulation clock. Freeze all relevant time under any active pause lease; release only the owner's lease and do not catch up missed background time.
- Reward claims have stable IDs and explicit claimed state. Reject repeated/invalid commands before mutation; order outcome and progression resolve once. Represent goal/mission transitions explicitly and expose detached views.
- Purchases and gameplay update RAM. Persistent campaign checkpoints are introduced by Stories 4.4–4.5, not by 4.1–4.2. Their eventual snapshots must include XP, progression, claim IDs, menu/unlock eligibility and deterministic schedule state. Save retry reuses a prepared commit payload and must never recompute rewards.
- Focus tests on schedule boundaries, one-shot opportunities, pauses, capacity misses, takeaway/referral rules, XP threshold edges, independent progress, reward duplication, delayed unlocks and recipe validity. Do not run the full viewport/browser matrix for these individual stories unless separately authorized.

## UX & Interaction Patterns

- Keep the approved menu, kitchen, six-avatar presentation, theme, assets and touch geometry. The six-avatar display does not change the three-ticket gameplay cap.
- Keep the approved end-day hanging board, money/level/rating capsules, five tabs, three content cards, four preparation tiles and green footer. Populate real level/XP, goals and mission within existing surfaces; no new layout or restyling is authorized. Keep at least 48 CSS px touch targets and the existing accessibility/modal pause rules.
- Explain sales, reward coins, XP, reputation and relationship separately. Show locked recipes with their next-day condition; never generate a locked recipe request. Failed goals should remain understandable without implying campaign failure.

## Cross-Story Dependencies

- Story 4.1 consumes the established order lifecycle, dated-stock/economy rules and Day 2 referral flag from Epics 1–3. Story 4.2 consumes its schedule plus the immutable economic day result.
- Conditional regular return/help needs Story 4.3; keep that boundary visible rather than implementing a normal Day 2 commercial regular in place of the future help request. Story 4.3 must reuse the schedule slot, not add another visit.
- Stories 4.4–4.5 supply corruption-safe persistence, same-commit backups, atomic saving and reload semantics. Story 4.6 supplies full final-result/save-failure/new-campaign acceptance. Current RAM behavior does not certify these stories or completion of Epic 4.

## Remaining Story Contract — 2026-10-03

- Day2 eligible help offers free cheese120seconds in the existing slot. Exact ready/on-time success +1 relationship; wrong/raw/burnt/late/closed −1, clamp0–3 once. Decline neutral. Exclude help from commercial XP/revenue/reputation/reviews/goals/mission; gift cost is a consumed-cost subset. Day3 return on help success or latest regular commercial stars≥4; relation≥2 grants once20coins and thanks, no family recipe.
- Create a native IndexedDB checkpoint before Day1 purchases. Version/content/ranges/linked IDs validate before construction. Save only latest current-day start or terminal result; active/backup share commit/revision, transaction completion confirms. Recovery needs a valid same-latest backup and explicit confirmation. Unsupported/newer/corrupt/migration failure remain distinct, originals untouched.
- Day commit prepares stable ID/revision/payload once, then commits and confirms. Failure retains old checkpoint and pending RAM result; retry reuses payload, advance disabled. Stale writer reloads, never merges. Midday reload discards later RAM changes, never reopens closed days. No-save play requires explicit choice.
- Next-day viability independently requires rent20 and missing units for any valid unlocked recipe using retained stock and next-day prices. Final reports retain cumulative actual values; terminal/new campaign uses existing modal/footer surfaces and explicit replacement confirmation. No Day4, rescue or replay.
- Human playtest requires5participants unfamiliar withGDD:4/5 first order≤60active seconds,4/5 finish or explain insolvency,4/5 explain ledger,3/5 wantDay4. Prepare script/sheet; mark missing human results honestly.

## Implementation evidence — 2026-10-03

Stories4.3–4.6 implemented and automated checks complete: 152 focused units, 16 unique Chromium390×844 cases, typecheck/build and three independent review lenses. Actual default menu and direct shop now use CozyCampaignSession/native IndexedDB. Creation precedes purchases; end-day commit retains stable retry payload and only confirms at transaction completion. Reload starts the current unclosed day; in-app menu return preserves RAM. Day3 remains terminal. Approved UI geometry/assets retained; separate evidence captures are in epic-4-evidence. Five-person human playtest has no results; epic remains in-progress pending external acceptance. See epic-4-final-review.md and epic-4-playtest.md.
