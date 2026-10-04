---
baseline_commit: NO_VCS
---
# Story 3.2: Dated lot reservations

Status: review

## Story

As a shop owner, I want orders to reserve usable lots and baking to consume their actual purchase cost, so that concurrent tickets cannot oversell or misstate stock costs.

## Acceptance Criteria

1. Reservation receives the applicable game day and allocates exact usable lots in earliest-expiry order, then stable lot ID. Lots expiring on that day are usable until day settlement; older lots cannot be reserved/consumed. Reservation never allocates future purchases or already-held units. Missing any ingredient rejects the whole reservation without partial holds.
2. Concurrent tickets cannot reserve the same lot units. Owned, reserved and available selectors reflect valid lots for the current/preparation day, with `available = usable owned − reserved`. Duplicate reservation IDs are rejected; detached selectors cannot mutate stock. Normal arrival reservation + ticket creation remains atomic and keeps cap three tickets.
3. Baking preflights the entire consumed list before applying any mutation, then consumes the exact reserved lot quantities and their stored unit cost once. Invalid/duplicate IDs, expired/missing lot allocation, invalid day, absent reservation or repeated commit leave inventory/ledger unchanged. Consuming a reserved subset releases unused reservations as the existing domain API supports; runtime still requires the complete recipe under audited Story 1.4.
4. Before bake, toggling assembly changes no owned inventory/consumption cost. Timeout/cancel/close-day releases unused holds once. Already-baked/discarded/expired pizzas do not refund consumed stock. A remake requires a new valid reservation and consumes fresh stock once; insufficient stock leaves state unchanged and provides a reason.
5. Cross-day carried lots use their historical cost rather than the new market price. Dough/sauce/cheese bought Day 1 remain usable Day 2 and expire at Day 2 close; mushrooms expire at purchase-day close. Reservations do not survive closed-day transition. Day 1 retained dough (cost 5) is used before Day 2 dough (cost 6).
6. Preserve correct-assembly, one oven, tutorial, existing ticket-selection/mismatched-delivery/confirmation, owned pause leases and fixed simulation. Do not expand off-recipe topping or sausage/unlock support in this story; record the broader GDD topping rule as a pre-existing deferred gap.

## Tasks / Subtasks

- [x] Change reservation shape/APIs in `src/domain/CozyStock.ts` to dated FEFO lot allocations; implement quantity preflight and no partial writes (AC 1–3).
- [x] Make owned/reserved/available/missing day-aware; reuse actual `CozyLot.unitCost/day/expiry`, keep selectors detached and settlements idempotent (AC 1–2, 5).
- [x] Pass current day from `CozyRuntime.createTicket`, `remake`, bake commit and inventory selectors; preparation selectors use preparation day while active-ticket operations use current day (AC 2–5).
- [x] Preserve `CozyOrder.bakeReady` correct-recipe predicate/tutorial and runtime oven preflight; do not reintroduce consume at visual ingredient placement or refund on discard (AC 3–4, 6).
- [x] Focused tests in `CozyStock.test.ts`/`CozyRuntime.test.ts`: two/three tickets and mixed-age lots, expiry boundary, atomic rejection, exact per-lot held quantities, subset release, duplicate commit, remake bought upfront, timeout during assembly/baking, retained-cost conservation (AC 1–6).

## Dev Notes

Current `Reservation.amounts` tracks ingredient totals only; current commit selects FEFO globally rather than exact held lots and does not validate expiry. This story strengthens that owner instead of adding an inventory manager. `settle` clears holds; tickets are released on terminal/timeout in runtime. Preserve idempotent `release/expire` and settlement result snapshots. FEFO allocation must account for all existing held allocations before selecting units.

Consumption remains at bake per `game-architecture.md` Day/Order discussion and audited `spec-1-4-day-one-stock.md`. Correct-assembly limitation already exists: runtime rejects off-recipe ingredients and CozyOrder requires the full recipe. GDD paragraph about off-recipe extras using unreserved stock is documented as deferred, not a claim of coverage. Different-recipe pizzas/delivery mismatch remain supported through existing ticket source/target behavior.

### Project Structure Notes

Primary updates: `src/domain/CozyStock.ts`, `src/runtime/CozyRuntime.ts` and their unit tests. Scene uses selectors only; no UI layout or art change is necessary. Pure economic interfaces belong next to their owner; no Phaser imports in domain.

### Project Context Rules

All gameplay mutation uses runtime dispatch, no database write per tap. One command applies entirely or does not change state. No exceptions for expected shortage/expiry. Keep RAM flow, no new dependencies, use focused tests/build-nolog. Do not run a full browser matrix for this domain story.

### References

- `_bmad-output/implementation-artifacts/epic-3-context.md`, economic rules/current gap and scoped deferral.
- `_bmad-output/planning-artifacts/pizza-gdd/gdd.md`, serving/reservation paragraphs and `#Chợ, hạn dùng và kế toán`.
- `_bmad-output/planning-artifacts/pizza-gdd/epics.md#E03 - Chợ và sổ thu chi`.
- `_bmad-output/game-architecture.md`, Day/Order discussion at stock commitment and IP01/X06.
- `_bmad-output/implementation-artifacts/spec-1-4-day-one-stock.md`, atomic reserved subset and runtime complete-recipe constraints.
- `_bmad-output/project-context.md`; `_bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md`.

## Dev Agent Record

### Agent Model Used

GPT-6 (Codex).

### Debug Log References

RED: four dated-lot checks failed before implementation. GREEN: 55 focused domain/runtime tests passed; TypeScript passed. No VCS.

### Completion Notes List

- Reservations now pin exact usable FEFO lot units with the applicable day. Full preflight precedes consumption. Runtime passes game/preparation days; two-ticket reversed bake order preserves each historical cost. Existing remake/timeout/oven/tutorial regressions passed. Off-recipe unreserved extras remain deferred under audited Story 1.4.

### File List

- src/domain/CozyStock.ts
- src/domain/CozyLots.test.ts
- src/runtime/CozyRuntime.ts

## Change Log

- 2026-10-03: Implemented dated lot allocation and atomic consumption; ready for review.

