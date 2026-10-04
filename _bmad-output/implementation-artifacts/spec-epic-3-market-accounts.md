# Epic 3 — Chợ, giữ lô và sổ thu chi

Implemented 2026-10-03. Stories 3.1–3.3 are **review**; Epic 3 remains in-progress until independent review/acceptance. No Git repository: baseline `NO_VCS`. This record covers the default Cozy RAM flow, not the separate Campaign prototype.

## Behavior and evidence

| Requirement | Implementation | Focused evidence |
| --- | --- | --- |
| 300 initial cash, empty stock, dated prices, valid quantities/funds | Existing CozyStock owner; actual purchase-day unit cost/expiry | CozyStock.test.ts, CozyEconomy.test.ts, initial-market E2E |
| Pre-open purchases/prices; agreed ticket prices immutable | Typed market.buy with command ID; shiftOpen guards; recipe targets retain selection and open price editor | CozyEconomy.test.ts, CozyCustomers.test.ts, epic-3.spec.ts |
| 80–140% pricing, rent/shortage warnings, own pause lease | Existing menuPrice rules, runtime budget/expiry selectors, cream overlay | CustomerProgression.test.ts, epic-3.spec.ts |
| Exact dated FEFO allocation; no overselling | Reserve pins lot IDs after whole-recipe preflight; selectors filter purchase/expiry day; commit consumes only pinned units | CozyLots.test.ts reversed bake order (17 then 15 xu), CozyStock.test.ts, CozyTickets.test.ts |
| Assembly does not consume; bake does; discard has no refund | Runtime passes current day and preserves audited recipe/one-oven rules; remakes reserve fresh stock | CozyShop.test.ts, CozyTickets.test.ts, CozyAccounts.test.ts, CozyDelivery.test.ts |
| Cash flow vs business profit vs retained stock | Pure DayAccounts formulas; zero categories explained; actual historical inventory snapshot | CozyAccounts.test.ts cash/inventory identities across days, spoilage and discard/remake |
| Immutable close, following-day purchase attribution | Close once; runtime captures next opening cash/value from prior snapshot before hub purchases | CozyDay.test.ts, CozyAccounts.test.ts, day-end.spec.ts, epic-3.spec.ts |
| Approved summary layout and readable ledger | Existing three figure targets open scrollable detail; five tabs/three cards/four prep tiles/footer preserved | Screenshot inspection; exact target/footer checks; scroll and visibility-owned lease E2E |
| No fourth-day preparation/replay | Terminal preparationDay remains current day; purchases/prices/open blocked | CozyAccounts.test.ts, CozyDay.test.ts, three-day E2E |

Cash: ending = starting + sales + rewards − purchases − rent − wages − repairs − other.

Profit: sales − consumed historical stock cost − expired stock cost − rent − wages − repairs − other. Rewards remain separate from pizza sales. Purchases are never deducted again from profit; expiry is never another cash debit.

Inventory: opening value + purchases = consumed + expired + closing value. Following-day preparation changes live cash and that day's purchases, never the preceding closed report.

## Verification

- 92 focused Vitest tests passed in 16 relevant domain/runtime/lifecycle/presentation files.
- `npm run build-nolog` passed (existing Phaser chunk-size warning only).
- Six focused Chromium 390×844 E2E cases passed: three Epic 3, two day-end and one initial-market regression. Two legacy shop cases restricted to 360×640 were not selected; no full browser/viewport matrix was run.
- Price editor, next-day market, summary and both ends of the scrollable ledger were inspected. Evidence is in [epic-3-evidence](epic-3-evidence). Approved UI baseline screenshots were not overwritten.
- Dev preview remains available on `http://127.0.0.1:8081/` (HTTP 200 verified).

## Scope remaining

Cozy remains RAM-only. Epic 4 owns persistence/checkpoints/reload, XP/missions, unlocks including sausage, rewards and help/referral visit scheduling. Referral eligibility from Epic 2 remains available; no extra visit source was introduced.

The broader GDD rule for off-recipe toppings from unreserved stock remains a pre-existing deferred gap under audited Story 1.4: current Cozy runtime requires the exact complete recipe. Domain reserved-subset consumption remains supported. Epic 3 does not claim the broader topping rule or resolve Epic 1's separate review status.
