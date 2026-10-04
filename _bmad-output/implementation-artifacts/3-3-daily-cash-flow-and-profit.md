---
baseline_commit: NO_VCS
---
# Story 3.3: Daily cash flow and profit

Status: review

## Story

As a shop owner, I want a truthful immutable daily statement with cash flow, consumed costs and retained stock, so that I can understand profit and prepare the following day.

## Acceptance Criteria

1. The closed-day statement records starting cash, sales revenue, rewards separately, purchases, consumed historical lot cost, expired-lot cost, rent, wages, repairs, other costs, ending cash and retained inventory quantity/value. Day 1 starting cash is 300 before preparation purchases; Day N starting cash is the previous closed-day ending cash before any Day N preparation purchases. Following-day purchases made while the preceding hub is visible belong solely to the following day.
2. For each closed day, ending cash = starting cash + sales + rewards − purchases − rent − wages − repairs − other. Business profit = sales − consumed cost − expired cost − rent − wages − repairs − other. Buying inventory is not subtracted again from profit; expiration is not deducted again from cash. Retained stock is valued at actual purchase cost, never today's replacement price. Across days, opening inventory value + purchases = consumed cost + expired cost + retained inventory value.
3. Rent is 20 once per day. Wages/repairs are 0 with readable reasons “no employees in demo” / “no equipment damage in demo”; rewards and other costs stay 0 until implemented sources exist and are never fabricated or merged into pizza revenue. If help-order cost is represented, it is a separate subset of consumed cost, not an extra subtraction.
4. Closing manually ends/releases active tickets first, finalizes existing reviews/results, expires lots with expiry <= closing day, charges rent, creates an immutable economic statement and checks terminal state. Repeated close/settle, opening/closing detail UI or returning between tabs cannot repeat money/stock mutations. No restore/replay of a closed day.
5. Buying stock/preparing prices for Day N+1 changes live cash and Day N+1 books but cannot change Day N report starting/ending cash, purchases, consumed/expiry totals, stock snapshot or profit. Existing cash capsule remains live and is distinguished from closed-day ending cash in statement detail. Cumulative business profit, if presented, is the sum of closed-day profits, not cash or placeholders.
6. Approved summary geometry remains unchanged: hanging board, cash/level/rating capsules, five tabs, three cards, four preparation tiles and green next-day footer retain style/positions. Existing figure-card taps may open a focused cream statement detail modal with readable/scrollable cash bridge and inventory breakdown; no new base controls or relocated sections. Price/stock data and comments remain real; unimplemented level/mission/decor state stays “Chưa mở”.
7. Day 3 closes to demo completion; insolvency remains explained and prevents purchases/next-day opening. No Day 4 price computation or opening. Preparation warns about rent/stock shortage using Story 3.1; no rewards/mission/XP/checkpoint/reload work from Epic 4 is claimed.

## Tasks / Subtasks

- [x] Extend `CozyStock` books/settlements and pure snapshot methods for cash starts, dated purchases, consumed/expired cost, stock quantities/value and detached immutable outputs; avoid double-booking revenue/cash already owned by runtime (AC 1–5).
- [x] Extend `CozyDaySummary` and `CozyRuntime.closeDay` to build the truthful closed statement once and preserve it through subsequent preparation; capture starting cash before next-day hub purchases and ending cash before those purchases (AC 1–5, 7).
- [x] Reuse existing sales owner in delivery and settlement FEFO costs from Story 3.2; expose rewards/wages/repairs/other zero categories with reasons without inventing reward systems (AC 2–4).
- [x] Add runtime selectors for statement/cumulative profit as needed; guard terminal pricing/market selectors against invalid fourth day (AC 5, 7).
- [x] Update only `CozyScene.dayHub` real text and existing figure-card taps for statement detail; preserve approved base UI and release only modal-owned pause lease (AC 3, 5–7).
- [x] Focused unit tests: close with untouched stock, one delivered pizza, discarded/remade pizza, Day 1 mushrooms expiry, retained lot costs, repeated close/settle and invariant statement after Day 2 hub purchase. Check exact cash bridge and inventory conservation across days (AC 1–5).
- [x] Focused `tests/day-end.spec.ts`/economic E2E: manual close, readable statement detail/zero reasons, live-cash vs statement cash distinction, next-day purchase attribution, terminal guards. Build with `npm run build-nolog`; do not run full multi-browser matrix (AC 1–7).

## Dev Notes

Current stock book has purchases/consumed only; settlement has expired/rent; runtime computes sales and profit and creates a detached daySummary. Preserve that single ownership. `buy(preparationDay)` already attributes hub purchases to the next day, but starting-cash capture must occur before those purchases, not only in `openNextDay`. Closing snapshots must not share mutable arrays/maps with stock, or later preparation will corrupt historical stock values.

Current `summary.cash` is closed cash while the capsule reads live `runtime.state.cash`. Keep that meaningful distinction and explain it in detail, without moving capsules. Existing summary cards are y183/y342/y453, four preparation tiles y481/y529, market panel ends y568 and footer begins y580; use overlay/detail scrolling rather than adding new report rows to force a reflow.

Close-order flow remains manual and Cozy RAM-owned. Persistence `prepare → commit → confirm` belongs to Epic 4; do not add database writes or claim reload protection here. No Git repository is available for prior commit intelligence; use audited story/test evidence instead.

### Project Structure Notes

Update existing `CozyStock.ts`, `CozyRuntime.ts`, `CozyScene.ts`, focused unit tests and `tests/day-end.spec.ts`; add a pure economy type module only if this makes the single owner clearer. Keep market/summary renderer boundaries intact.

### Project Context Rules

Pure domain/runtime economic decisions; typed runtime intents; atomic/idempotent commands; no animation/callback money updates. Fixed simulation/owned pause leases remain. Read approved UI before any renderer edits. No dependency upgrades, placeholders, full browser matrix or Epic 4 save/mission expansion.

### References

- `_bmad-output/implementation-artifacts/epic-3-context.md`, economics and UI decision.
- `_bmad-output/planning-artifacts/pizza-gdd/epics.md#E03 - Chợ và sổ thu chi`.
- `_bmad-output/planning-artifacts/pizza-gdd/gdd.md#Chợ, hạn dùng và kế toán`; `#Ba ngày, kết thúc và lưu tiến độ`.
- `_bmad-output/game-architecture.md`, IP01/IP02 and X04/X06 ownership boundaries.
- `_bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md`, approved day-end table/screenshots; `_bmad-output/implementation-artifacts/spec-end-of-day-reference.md`, Cozy RAM/manual close scope.
- `_bmad-output/project-context.md`; Stories 3.1/3.2.

## Dev Agent Record

### Agent Model Used

GPT-6 (Codex).

### Debug Log References

RED: cash/inventory identities failed before statement implementation. GREEN: 92 focused tests across 16 domain/runtime/lifecycle/presentation files; build-nolog; six focused Chromium 390×844 E2E cases (three Epic 3, two day-end, one initial market) passed. The old market fixture was corrected to close the newly requested price dialog. No VCS.

### Completion Notes List

- Added pure DayAccounts formulas and detached historical inventory snapshots. Runtime owns starting cash/value and cumulative closed profit; next-day starts use prior closed values before hub purchases. Sales remain owned by delivery and cash by CozyStock, with no extra debit for spoilage or cost.
- Existing figure cards open a scrollable cream statement with cash bridge, actual lot value and explanations for zero wages/repairs/rewards/other. Modal releases only its own pause; visibility resume preserves it. Day 3 blocks any fourth-day preparation. Approved base UI and screenshots remain unchanged.
- Visual evidence inspected in epic-3-evidence. Cozy remains RAM-only; no persistence, XP/missions/unlocks/help/referral scheduling was added.

### File List

- src/domain/CozyStock.ts
- src/domain/DayAccounts.ts
- src/runtime/CozyRuntime.ts
- src/runtime/CozyAccounts.test.ts
- src/scenes/CozyScene.ts
- tests/epic-3.spec.ts
- _bmad-output/implementation-artifacts/epic-3-evidence/statement-cash.png
- _bmad-output/implementation-artifacts/epic-3-evidence/statement-detail.png

## Change Log

- 2026-10-03: Implemented and verified cash/stock/profit statement and terminal guards; ready for review.

