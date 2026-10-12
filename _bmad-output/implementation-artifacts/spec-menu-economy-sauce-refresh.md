---
title: Silent menu saving, 20 percent economy and shared labeled sauces
type: feature
created: 2026-10-12
status: done
baseline_commit: af0236d
---

<frozen-after-approval>

## Intent

User requests that changing pizza prices no longer opens a saving-day dialog. User confirmed both pizza sale prices and ingredient prices increase20%, rather than30%. Sauce bottles need labels in market and must be synchronized with the kitchen.

## Boundaries & Constraints

Always retain actual menu persistence, selling toggle, save concurrency guard, error/retry/recovery, custom pricing percentages, owned items, historic cash/lots/report values and approved UI geometry. Increase all8pizza reference sale prices and all19ingredient base prices by1.2, round xu to nearest integer. Do not increase recipe-unlock prices, furniture, equipment or wages. Existing relative menu percentages keep their meaning against the new reference prices. Preserve historical lot purchase costs and exact saved viability calculations under either original or new economy.

Keep kitchen background and other ingredients unchanged. Use the generated labeled sauce atlas for market/stock illustrations, and the same labels on the five existing kitchen bottles. No emoji, sample prices baked into artwork, duplicated label assets or altered shelf hit boxes.

Never hide save errors, accept a random lot cost, remove accounting checks or alter baked/pending pizza sale receipts.

</frozen-after-approval>

## Code Map

- `CozyCampaignSession.ts` — pending.menu classification keeps existing upgrade save contract; savingMenu only true during an in-flight menu write.
- `CozyScene.ts` — suppress pending menu save dialog/overlay, retain failures and other overlays; five sauce labels share loaded atlas frames.
- `recipeCatalog.ts`, `ingredientCatalog.ts`, `gameContent.ts`, `public/game-content.json` — current selling/ingredient prices and boot compatibility; historical price table for stored stock.
- `CozyStock.ts`, `CozyCheckpoint.ts` — validate actual historical purchase costs and old/new recorded day boundary viability.
- `MarketIngredientArt.ts`, `ReferenceMarket.ts` — load labeled atlas, use only its top five sprites and register shared label frames; old14ingredient illustrations retained.

## Tasks & Acceptance

- [x] Menu save classification and scene suppression with delayed-save unit/browser tests.
- [x] All8pizza/all19ingredient price updates, matching production boot catalog and preserved percentage-based pricing.
- [x] Historical lot and completed-report compatibility without changing old fixtures or accounting.
- [x] Labeled sauce image saved in project, existing loader integration and shared kitchen labels.
- [x] Update affected unit assertions/budget fixtures while preserving test cases and meaningful boundary conditions.
- [x] Focused360×640 browser checks, build and screenshot inspection.
- [x] Review triage, fixes and final documentation (review coverage limitation below).

Given a pending menu price save, when a player taps+/−, then prices update without saving-day/pause modal, while concurrent writes stay guarded. Given a failed write, when retry is chosen, then the exact payload is retried and persisted. Given an existing save, when loaded, then money/old lot costs/reports survive while future purchases and reference sale prices use new values. Given sauces in market and kitchen, when inspected, then all five labels are distinct and match.

## Verification

Full unit after economy changes:521/521 passed,0fail/skip (original518 plus1delayed menu test and2balance/legacy-cost cases). Historical fixtures unchanged. Focused legacy/current boot validation26/26passed. Browser/build evidence to be appended after completion.

## Art provenance

Built-in imagegen edited the existing atlas, adding only cream cartoon labels (tomato/cream/flame/basil/chili). Output saved at `public/assets/market-sauces-labeled.png`. Runtime samples only its five top-row bottle sprites and label crops; other food sprites use the original atlas. Exact prompt stored alongside verification notes.

## Final verification and review

Build/typecheck passed. Full521/521unit tests passed with0skip; after final menu error-copy refinement, focused25/25unit passed. Four focused browser scenarios passed at360×640: three-tab purchase/filter/detail/scroll; sauce labels/newprices/kitchen matching; menu price/selling/production reload; delayed menu save/no overlay/error/retry/session reload. The delayed reload fixture now waits for scene boot and restores through a fresh actual repository-backed session; production reload is independently covered by the existing menu test. Screenshots inspected and copied to ui-baseline/menu-economy-sauces-2026-10-12.

Blind reviewer found no confirmed introduced bug. Edge reviewer checked lot-cost/viability/menu-save behavior but stopped before final report; acceptance reviewer failed before completing due tool usage limit. Primary agent completed source and screenshot acceptance checks; do not present this as three completed independent reviews. A reachable legacy DemoGame still keeps its original3pizza sale-price model; current CozyRuntime campaign is the scoped8pizza economy. Historical fixtures remained byte-unchanged.

The existing current-report supplier calculation consults whole stock history, predating this change; broader report-scoping cleanup is outside this request. Historical candidate added here scopes purchases through the recorded day and matches its full viability object exactly.

## Suggested Review Order

- Save classification keeps persistence guards while hiding successful menu saving UI.
  [CozyCampaignSession.ts:34](../../src/runtime/CozyCampaignSession.ts#L34)
- Current economy and historical lots retain distinct actual costs.
  [ingredientCatalog.ts:1](../../src/config/ingredientCatalog.ts#L1)
  [CozyStock.ts:24](../../src/domain/CozyStock.ts#L24)
  [CozyCheckpoint.ts:203](../../src/domain/CozyCheckpoint.ts#L203)
- Shared atlas frames match kitchen labels to the market bottles.
  [MarketIngredientArt.ts:4](../../src/presentation/MarketIngredientArt.ts#L4)
  [CozyScene.ts:613](../../src/scenes/CozyScene.ts#L613)
- Delayed persistence and exact balance cases verify real outcomes.
  [silent-menu-save.spec.ts:12](../../tests/silent-menu-save.spec.ts#L12)
  [EconomyBalance.test.ts:7](../../src/domain/EconomyBalance.test.ts#L7)

## Image generation prompt

Built-in image_gen, precise-object-edit: Edit the transparent pizza ingredient atlas. Change only the five top-row bottles by adding cream paper labels with dark brown outlines: tomato, cream swirl, BBQ flame, basil leaves, red chili pepper, left to right. Preserve bottle colours, silhouettes, shading, positions, scale, five-column layout and transparent background. Keep all14other ingredients unchanged. No words, extra items, watermark or background. Labels should read at mobile icon scale. The generated image is saved in public/assets/market-sauces-labeled.png; runtime intentionally samples only its five sauces and label crops, preserving original other ingredients regardless of generated variation.
