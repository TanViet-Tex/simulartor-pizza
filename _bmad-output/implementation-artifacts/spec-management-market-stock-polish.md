---
title: Reference polish for management, market and stock tabs
type: feature
created: 2026-10-12
status: done
baseline_commit: 128084a
context: []
---

<frozen-after-approval>

## Intent

**Problem:** The management home, market and stock tab bodies lack the illustrated details and visual hierarchy in the supplied references. The user requests a more attractive rendition closer to those images.

**Approach:** Refine these three bodies with coherent cream cards, warm brown borders, larger distinct illustrations, illustrated filter/status icons and stronger action hierarchy. Use the existing reference artwork and actual game values.

## Boundaries & Constraints

**Always:** Retain the approved compact wooden wall shell, header, cash, pause, five tabs, shared fixed background and mobile 360×640 scale. Retain existing action IDs, live stock quantities, prices, recipe locks, purchase gating, expiry calculation, thresholds, transactions, save behavior and placed-item preview. All six home sections remain visible and lead to their existing compact subpages. Market and stock scrolling remains clipped and background fixed. Every icon must use a coherent existing illustration or the established icon system.

**Ask First:** Any change to gameplay rules or to other approved screens.

**Never:** Sample amounts or labels baked into reference images; emoji artwork; browser tabs; redesign of the six shop subpages, summary or kitchen; unrelated production changes.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Stock warning | Zero usable stock or approaching expiry | Distinct readable status with actual quantities/days | No invented expiry for permanent ingredients or missing valid lots |
| Threshold unset | Low/expiry criteria not configured | Existing choose-threshold flow and filter semantics | No sample warning counts |
| Market lock | Recipe locked or purchases unavailable | Existing locked/read-only row and disabled actions | No bypass of affordability/save guards |
| Scroll | Long ingredient list | Art, labels and hits move together within existing viewport | Fixed shell and footer remain usable |

</frozen-after-approval>

## Code Map

- `src/presentation/ReferenceShop.ts` — room preview and six home cards; existing source crops.
- `src/presentation/ReferenceMarket.ts` — nineteen real ingredients, filters, stepper and buy controls.
- `src/presentation/ReferenceStock.ts` — stock statistics, filters and lot/status rows.
- `src/presentation/HubCanvasUI.ts`, `MarketIngredientArt.ts` — shared cream frames, existing coherent icons and ingredient illustrations.
- `src/presentation/HubWallLayout.ts` — approved shell transform and hit coordinates.
- `src/scenes/StartupScene.ts`, `CozyScene.ts` — boot/fallback asset loading and clipped input.
- `tests/reference-market.spec.ts`, `reference-shop-screens.spec.ts` — existing focused browser fixtures and controls.

## Tasks & Acceptance

**Execution:**
- [x] `ReferenceShop.ts` — refine room chip and six illustrated cards with reference-like borders and chevrons, live state and truthful subtitles.
- [x] `ReferenceMarket.ts` — refine filters, price/stock icons, ingredient cards and action presentation without changing calculations or hit geometry.
- [x] `ReferenceStock.ts` — show illustrated stats/filter icons and distinct real-state expiry/stock badges; improve suggestion/banner details.
- [x] Relevant shared art/loader files — only if required, register real reference art through existing boot and reuse painter helpers without creating image objects per row.
- [x] Focused Playwright tests — cover all three tabs, all six home destinations, market filtering/purchase, stock detail/filter and scrolling; capture 360×640 screenshots.
- [x] UI baseline and project context — document the requested three-body refinement and verification.

**Acceptance Criteria:**
- Given 360×640, when opening the three tabs, then all body art and controls fit inside the existing wall shell and no text overlaps.
- Given real game state, when buying/filtering/viewing stock or opening any management section, then the existing action updates state and navigation correctly.
- Given a long list, when scrolling, then clipped row input aligns with visible artwork and the fixed shell remains unchanged.
- Given the supplied references, when inspecting screenshots, then cards, filters, illustration scale and status colors visually follow the respective reference without embedding its example values.

## Spec Change Log

## Verification

- `npm.cmd run build-nolog` — TypeScript and production build pass.
- Focused Chromium 360×640 Playwright — purchase/navigation/detail/filter/scroll checks pass; inspect saved screenshots.
- Independent review of the resulting diff — resolve actionable introduced problems.

## Review and verification results

Build/typecheck passed. Three focused Chromium 360×640 tests passed: the new three-tab purchase/filter/detail/scroll check, all six subpage navigation/resource checks, and actual purchase/place/store/upgrades/staff plus persistence reload. Independent blind, edge-case and acceptance reviews completed. Two P2 presentation regressions were patched: preserve delivery-app status on the amenities card, and retain the illustrative-room qualifier alongside live state. Both reviewers confirmed their findings resolved. No gameplay/transaction/scroll geometry changes.

## Suggested Review Order

- Scoped reference crops and card painter isolate the requested visual changes.
  [ManagementTabArt.ts:1](../../src/presentation/ManagementTabArt.ts#L1)
- Six illustrated home cards retain destinations and live shop information.
  [ReferenceShop.ts:55](../../src/presentation/ReferenceShop.ts#L55)
- Illustrated filters and ingredient rows keep existing purchase calculations.
  [ReferenceMarket.ts:29](../../src/presentation/ReferenceMarket.ts#L29)
- Pastel badges distinguish actual stock and valid-lot expiry dates.
  [ReferenceStock.ts:31](../../src/presentation/ReferenceStock.ts#L31)
- Focused interactions verify buying, filtering, detail, scroll and fixed navigation.
  [reference-shop-screens.spec.ts:43](../../tests/reference-shop-screens.spec.ts#L43)

Final three-tab E2E rerun after both review patches passed (1/1); final gallery inspected at 360×640.
