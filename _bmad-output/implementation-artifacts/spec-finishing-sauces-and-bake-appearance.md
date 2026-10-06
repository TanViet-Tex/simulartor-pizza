---
title: Finishing sauces and actual pizza bake appearance
type: feature
created: 2026-10-06
status: done
baseline_commit: 6c1c916
context:
  - _bmad-output/project-context.md
  - _bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md
---

<frozen-after-approval reason="explicit user implementation request">

## Intent

White cream, pesto and hot sauce become optional finishing sauces. After extraction and before boxing, tapping their existing bottles adds a white/green/red-orange zigzag within the pizza surface. The pizza must visibly follow real bake state/time, preserving the appearance after extraction and rendering finishing sauces above all ingredients.

## Boundaries & Constraints

**Always:** Preserve layout, positions, hitboxes, other controls and existing recipe scoring. Each finishing sauce is optional, once per pizza, consuming exactly one available portion with its real cost. All five sauces remain usable across days and show “Không hết hạn” in Market/Stock. Existing saves retain all stored sauce quantities, cash and accounts.

**Ask First:** Any required change outside the requested pizza artwork, sauce semantics and shelf-life labels.

**Never:** Replace base sauce with finishing sauce, highlight finishing sauces as required recipe ingredients, alter recipes, cover the whole pizza with a single tint, revive quantities already absent from old saves, change prices or other ingredients' shelf life, add mid-shift persistence, automatically push or deploy.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected behavior | Failure behavior |
| --- | --- | --- | --- |
| Finishing | Extracted ready/raw/burnt pizza, stock available | Append one topping drizzle, consume one portion; preserve base layers and quality | No partial stock/state change |
| Repeated tap | Same sauce already used | Reject/no-op; no second consumption/audio | Preserve pizza |
| Wrong stage | Assembly, inside oven, boxed or delivered | Reject finishing sauce | No stock change |
| Optional scoring | Correct recipe plus finishing sauces | Same recipe correctness and rewards as without sauces | Underlying raw/burnt quality still applies |
| Stock | Buy ordinary/bulk/express, no recipes owned for finishing sauces | Three sauces immediately unlocked | Other ingredient locks preserved |
| Day boundary | Any of five sauces in inventory | No expiry disposal; other ingredient expiry unchanged | Preserve financial conservation |
| Old save | Finite sauce expiry, valid original checksum | Validate original save and normalize retained sauce lots to non-expiring | Corrupt save still rejected |

</frozen-after-approval>

## Code Map

- `src/config/ingredientCatalog.ts`, `src/domain/CozyStock.ts`: catalog, expiry policy, FEFO consumption and validation.
- `src/domain/CozyOrder.ts`, `src/runtime/CozyRuntime.ts`: per-pizza topping state, dispatch, cost and scoring.
- `src/domain/CozyCheckpoint.ts`, `src/infrastructure/`: detached validation and checksum before migration.
- `src/presentation/CozyArt.ts`, `src/scenes/CozyScene.ts`: layered pizza drawing, dynamic oven appearance, ingredient hints and tap guards.
- `src/presentation/ReferenceMarket.ts`, `src/presentation/ReferenceStock.ts`: shelf-life labels and stock detail.

## Tasks & Acceptance

**Execution:**
- [x] Catalog/stock/checkpoint: shared finishing-sauce classification and non-expiring policy, compatible save normalization without input mutation.
- [x] Order/runtime: separate finishing sauce list, extracted ownership/quality, atomic once-only stock consumption and cost accounting, access guards and unchanged scoring.
- [x] Art/scene: actual raw→golden→ready→burnt colors per base/cheese/topping layer, retained extracted quality, topmost bounded zigzags, time-dependent oven repaint without rebuilding UI every tick.
- [x] Market/Stock: “Không hết hạn” for five sauces including detail/filter behavior; existing layout unchanged.
- [x] Focused unit and Chromium E2E: stages, repeat taps, cost, resets/order switches/app pizzas, migration and day settlement, actual renderer captures and existing affected regressions.

**Acceptance Criteria:**
- Given baking time at each oven level, when time advances, then layers gradually become cooked and burnt according to that order's timing; extraction freezes the resulting appearance.
- Given a finishing sauce, when bought or used, then runtime guards and inventory match UI; redraw, double-tap, pause and changing selection cannot duplicate consumption.
- Given optional sauces on a correct cooked pizza, when delivered, then recipe correctness and qualifying cheese behavior remain unchanged.
- Given sauce inventory in an old valid save, when restored and settled, then stored quantities/value are retained; other inventory retains current expiry rules.

## Spec Change Log

- Review patched deliverySource to require extraction, keeping Giao bánh disabled for burnt-in-oven.
- Review retained sauce-row total and remaining/shortage text alongside shelf-life label inside existing bounds.

## Design Notes

Non-expiring lots need a finite serializable sentinel or explicit policy, not Infinity (JSON/checksum). Validate legacy finite expiry narrowly against the original sauce policy before normalizing. Finishing state is per pizza and transient, like current assembly state; checkpoints remain day-boundary only. Burnt-in-oven and extracted-burnt must be distinguishable without clearing quality.

## Verification

- `npm.cmd run typecheck` and `npm.cmd run build-nolog`.
- Focused Vitest for order, stock, checkpoint, runtime sauce/cost and scoring.
- Focused Playwright Chromium at 360×640 for interactive use, freeze after extraction, stock labels and visual inspection; no full browser matrix.

**Results:** Build/TypeScript passed. 89 focused unit tests across 11 files plus the changed Accounts conservation test passed (90 total). Five Chromium360×640 finishing-sauce scenarios passed. Rendered raw/cooked/burnt and Market/Stock captures inspected and stored in `ui-baseline/finishing-sauces-2026-10-06/`. Three review lenses completed; two concrete edge findings patched and rechecked. Blind review's hypothetical finishing ingredients in recipes was refuted by the current eight-recipe catalog.

Expanded legacy Delivery/Accounts tests were also attempted: Delivery helper still extracts after3s and Accounts still expects a terminal three-day demo. Those broader failures remain outside this focused feature verification; baseline execution was not performed, and no full-suite success is claimed.

## Suggested Review Order

**Per-pizza use and inventory**

- Guard extracted state, consume one portion and book its actual cost.
  [CozyRuntime.ts:830](../../src/runtime/CozyRuntime.ts#L830)
- Keep optional finishing sauces separate from recipe ingredients.
  [CozyOrder.ts:31](../../src/domain/CozyOrder.ts#L31)
- Validate historical expiry before normalizing retained sauce lots.
  [CozyStock.ts:28](../../src/domain/CozyStock.ts#L28)
- Normalize validated checkpoint and historical report inventory consistently.
  [CozyCheckpoint.ts:184](../../src/domain/CozyCheckpoint.ts#L184)

**Rendering and checks**

- Draw actual bake colors per layer, then bounded finishing drizzles.
  [CozyArt.ts:53](../../src/presentation/CozyArt.ts#L53)
- Update oven Graphics dynamically without rebuilding unrelated UI.
  [CozyScene.ts:556](../../src/scenes/CozyScene.ts#L556)
- Keep price, shelf-life and remaining cash in existing Market row.
  [ReferenceMarket.ts:56](../../src/presentation/ReferenceMarket.ts#L56)
- Verify per-pizza app reset, pause, scoring, stock and save migration.
  [CozyFinishingSauces.test.ts:12](../../src/runtime/CozyFinishingSauces.test.ts#L12)
- Exercise taps and actual renderer at all three oven levels.
  [finishing-sauces.spec.ts:30](../../tests/finishing-sauces.spec.ts#L30)
