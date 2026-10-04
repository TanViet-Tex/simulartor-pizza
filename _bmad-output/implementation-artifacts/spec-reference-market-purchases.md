---
title: Reference Market with regular preparation purchases
type: feature
created: 2026-10-04
status: done
baseline_commit: NO_VCS
context:
  - _bmad-output/implementation-artifacts/requirement-market-stock-and-express-flow.md
  - _bmad-output/implementation-artifacts/requirement-stock-and-purchase-suggestions.md
  - _bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md
---

<frozen-after-approval reason="User explicitly requested implementing Market from documented notes">

## Intent

**Problem:** Market currently only explains express orders, so players cannot actively buy stock before opening or between days. This contradicts the documented purchase flow.

**Approach:** Restore real regular purchases in the Market tab using `public/assets/references/chợ.png` as the composition reference. Display the existing 19-ingredient catalog, category filters, scrollable rows with quantity, price, usable stock, total and purchase actions. Reuse the runtime purchase intent and actual lot/cash data.

## Boundaries & Constraints

**Always:** Limit new presentation to Market. Keep five tabs, same campaign/day, actual cash and inventory, existing open-day and ending guards, shared confirmation artwork, pause ownership and checkpoint/retry policies. Prices come from current dated config, including provisional extras; report this provisional source clearly. Regular purchases debit once and enter stock immediately without express surcharge/delay. Express remains optional in-shift, price `ceil(day price ×1.6)`, delivery after 5 simulation seconds, suspended by pause. Stock links return to regular Market. Keep tutorial independent from paid inventory.

**Ask First:** A genuinely new economy rule, unavailable ingredient price, or purchase-suggestion recipe assumptions. None are needed for the existing catalog and regular buying. Do not invent low-stock thresholds or recommended portions.

**Never:** Redesign Summary, kitchen, menu, Shop, Missions or the Stock list; only correct Stock's misleading express-only copy/link. No new dependencies, save schema/version, reset, mid-shift save or autosave on purchase. No automatic buying, new recipe unlocks or manufactured stock/expiry figures. Do not use sample art prices or counts as configuration. Do not implement unspecified stock filters/menu purchase forecasts in this Market change.

## I/O & Edge-Case Matrix

| State | Input | Result |
| --- | --- | --- |
| First preparation | Select ingredient and 1–100 portions | Row displays actual dated unit price, total, usable stock and resulting cash |
| Valid purchase | Confirm current selection once | Runtime debits once, creates correct lot, Market and Stock immediately agree |
| Insufficient cash | Attempt purchase | Explain shortage; no partial debit or inventory mutation |
| Cancel/double tap | Cancel or repeat same confirmation | Cancel changes nothing; one command can commit at most once |
| Many rows | Filter/wheel/drag | Only matching ingredients; scroll clipped and controls track displayed rows |
| Before/after sale | Market → Stock → open → consume → close → Market | Same inventory/cash; consumed cost recorded once, next-day dated buying retained |
| Terminal day/save guard | Inspect Market/attempt mutation | Truthful disabled preparation actions, no day 4 or bypass of save guard |
| Old campaign | Load and buy | Existing metadata/stock/report preserved under current checkpoint boundary |

</frozen-after-approval>

## Code Map

- `src/scenes/CozyScene.ts`: Market routing, selected quantities, purchase confirmation and Stock link.
- `src/presentation/ReferenceMarket.ts`: scoped reference frame/header/category/rows, scrolling and dynamic data.
- `src/runtime/CozyRuntime.ts`: existing `market.buy` intent, command deduplication and preparation guards; avoid changes unless tests expose a relevant defect.
- `src/domain/CozyStock.ts`: actual dated price, lots, owned/available quantities and consumed costs.
- `src/presentation/ReferenceKitchenArt.ts`: existing ingredient artwork usable for 19 rows.
- `tests/reference-market.spec.ts`: focused purchase UI and whole preparation/sale/next-day flow.
- `src/runtime/CozyMarketFlow.test.ts`: real purchases, failures, command replay, lot costs, existing checkpoint and express regression.

## Tasks & Acceptance

**Execution:**
- [x] `src/presentation/ReferenceMarket.ts` — build reference Market with live fields, four category filters and clipped list of 19 ingredients.
- [x] `src/scenes/CozyScene.ts` — route Market to new renderer; keep quantities and scroll across redraw; use own confirmation lease and one command per acceptance; fix Stock copy/link only.
- [x] `src/runtime/CozyMarketFlow.test.ts` — verify buy/fail/replay, preserved cash/lots, consumed costs and next-day price/expiry; exercise old checkpoint and express invariants.
- [x] `tests/reference-market.spec.ts` — verify quantities/filter/scroll/cancel/confirm/insufficient money/save guard and complete purchase-to-next-day flow at one viewport.
- [x] Applicable requirements/context/baseline — record status and inspected screenshots, run build and three review lenses without claiming all Stock/E05 work complete.

**Acceptance Criteria:**
- Given the reference image, when opening Market, then its warm wood/cream style, five tabs, category bar, ingredient rows and black/gold footer match the requested surface with live labels.
- Given a selected quantity, when accepted, then actual cash decreases by dated unit price times quantity and the same stock increases immediately, without express pricing or delivery delay.
- Given preparation inventory, when opening and baking, then that inventory is used exactly once and the closed report is not changed by next-day purchases.
- Given an independent visibility pause, when cancelling/closing purchase confirmation, then only its own pause lease is released.

## Design Notes

The image shows six sample rows but catalog size is nineteen: use scrolling rather than changing the ingredient set. Category membership follows ingredient IDs (five sauces; dough/cheese; remaining toppings). All values remain from runtime. Purchase suggestions in the active note require unconfirmed thresholds/portions/recipe quantities; use a truthful preparation tip instead of the image's fixed low-mushroom warning. Existing one-unit consumption rules and provisional prices are not rebalanced here. Footer continues the existing first/next-day opening behavior; viewing other tabs preserves their approved renderers.

## Verification

Run focused Market/Stock/Accounts/Checkpoint/express data tests, `npm run build-nolog`, and Chromium 390×844 Market plus existing Summary preparation regression. Inspect and retain actual renderer screenshots. No full browser matrix. No VCS baseline available; preserve original touched files for review diff.

### Results — 2026-10-04

- `npm run build-nolog` passed, with the existing large-bundle warning only.
- 43 focused unit tests passed across CozyMarketFlow, CozyEconomy, CozyCampaignSession, CozyKitchenV2, CozyStock and CozyCheckpoint. Tests cover normal dated purchases, failure/replay, real lot cost once, retained lots, legacy report metadata, guards and existing no-autosave boundary, premium delivery and pause.
- 6 Chromium 390×844 tests passed across `tests/reference-market.spec.ts` and `tests/preparation-summary.spec.ts` (55.4s). Verified complete buy→Stock→open→bake/consume→deliver→close→buy next day→Stock→open Day2, all filters/19 items, continuous drag/wheel, purchase at list end, cancel/double-tap, insufficient cash, save guard, terminal read-only state, independent visibility pause and optional express delivery.
- Inspected renderer evidence retained: [Market](ui-baseline/reference-market-2026-10-04.png), [last rows](ui-baseline/reference-market-scrolled-2026-10-04.png), [confirmation](ui-baseline/reference-market-confirmation-2026-10-04.png).
- Runtime/domain/config/save implementation remained unchanged; no dependencies installed. Inventory filters, lot detail and menu purchase forecasts remain pending under their separate requirement.

### Review and fixes

Blind, edge-case and acceptance reviews completed. Patched dirty paper sampling, missing row cash preview and misleading save-blocked wording. Global scrolling now checks live pause state for Pause/price/purchase overlays; drag survives redraw and resets on pointerupoutside. Review rechecks confirmed modal input isolation and the presentation fixes. The blind input-depth lead was already handled by existing depth10 row controls above the depth0 scroll surface and verified by browser purchases. No unresolved intent gaps.

## Suggested Review Order

**Presentation and actions**

- Scoped Market route retains existing day-opening and price-editor behavior.
  [CozyScene.ts:587](../../src/scenes/CozyScene.ts#L587)
- Native frame/icon composition with live row values and bounded scrolling.
  [ReferenceMarket.ts:15](../../src/presentation/ReferenceMarket.ts#L15)
- Confirmation owns one pause lease and dispatches one existing purchase command.
  [CozyScene.ts:681](../../src/scenes/CozyScene.ts#L681)

**Verification**

- Atomic transactions, historical report stability and retained lot costs.
  [CozyMarketFlow.test.ts:9](../../src/runtime/CozyMarketFlow.test.ts#L9)
- Real UI purchase flow, filters, modal input and express regression.
  [reference-market.spec.ts:50](../../tests/reference-market.spec.ts#L50)
