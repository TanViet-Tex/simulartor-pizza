---
title: Kho, Quán và Nhiệm vụ theo references
type: feature
created: 2026-10-04
status: done
baseline_commit: NO_VCS
---

## Intent and scope

User explicitly requests continuing Stock, Shop and Missions according to notes and references. Preserve the new shared header/wood, Summary/Market/kitchen/menu and money/stock/save rules. These tabs adopt shared HubTheme/HubCanvasUI, dynamic data, interactive list/cards and consistent footer. Stock uses kho.png and shop uses Quán.png plus category images. No dedicated mission reference exists in references; mission cards use shared theme and implemented CozyProgression rules, no new goals/reward claims.

## Tasks

- [x] ReferenceStock: 19 items including empty, transparent icons, usable stock/reserved count, real multiple-lot expiry, all/low/expiry filters, bounded scrolling, lot detail, purchase suggestions information, go Market.
- [x] ReferenceShop: reference preview explicitly illustrative (no fictitious ownership), six category cards; menu connects existing editor, equipment/expansion existing oven/queue upgrades with confirmation, unavailable new items clear/not purchased. No image-derived price/bonus. Category navigation/back remains usable.
- [x] ReferenceMissions: active preparation-day goal, most recent closed goal, cheese8 mission, XP/unlock and automatic real reward status. Terminal no fake next-day goal; before Day1 shows actual zero progress instead of locked blank page.
- [x] CozyScene integration/modals and focused browser/domain checks, final screenshots and review.

## Constraints

Stock filter thresholds are not preapproved: ask user or require explicit in-game threshold selection, do not silently set a global gameplay rule. Separate valid lotted expiry; expired/future lots excluded from usable. Existing stock FEFO remains unchanged. Menu purchase forecasts for unsupported8recipes/custom sauces cannot fabricate quantities. Any forecast must use only current supported recipes and explicitly entered preparation portions with recipeIngredients; information only. Decoration/amenity/employee purchase persistence/prices/scheduler/bounds incomplete per notes, so display specific unavailable status and never fake money/ownership changes. Existing oven/queue upgrades retain command ID and campaign atomic save behavior.

## Acceptance

- Given any stock state, when Stock/filter/detail opens, then all19 items remain accessible and quantities/expiry reflect actual preparation day, with no mutation.
- Given supported recipe/portion targets, when planner updates, then ingredient needs sum first and subtract available once, with no automatic purchase.
- Given Shop, when each of6cards opens/back, then the matching category appears with actual supported actions or precise unavailable state.
- Given upgrade cancel/confirm, when clicked repeatedly, then cancel preserves state and confirmed existing command spends only once; save guard/terminal pauses prevent mutation.
- Given Day1/next-day/terminal, when Missions opens, then actual goal/mission/XP/status/reward text renders without adding claims or replay.
- Given360×640, when scrolling/modals/navigation occurs, then bounded content remains readable and interactive with existing48CSS target rules and correct pause lease cleanup.

## Verification

Production build; focused Chromium360×640 stock/category/mission/pause/purchase flow; meaningful stock projection/forecast tests, existing economy/stock/progression regression as needed. Keep reference image numbers illustrative. Record screenshots and unresolved configuration clearly; no full browser matrix or dependencies.

## Implementation and verification record

Shared renderers: ReferenceStock.ts, ReferenceShop.ts and ReferenceMissions.ts. StockPlanning.ts provides pure valid-lot projection and recipe needs summed before available subtraction; StockPlannerPanel.ts presents read-only forecasts. CozyScene wires reference assets, navigation, owned pause leases, lot details, explicit filter criteria and existing atomic upgrade commands. MarketQuantityInput accepts optional limits/label for filter criteria while retaining the Market1–100 default. No runtime/save schema changes or dependencies.

Review fixes: preparation controls must allow stock-/shop- IDs; stock row activation waits for pointerup and ignores drag so stale pointerdown state cannot prevent first tap; Missions retains the most recent closed result alongside the next goal. Updated the existing next-day stock assertion to open the actual lot-detail UI rather than searching retired Phaser text labels.

Final production build passed. StockPlanning/CozyStock/CozyProgression:15 unit tests passed. reference-market plus preparation-summary:13 focused Chromium360×640 E2E passed, including full purchase/use/end-day/next-day flow, stock filters/drag/detail/planner, all6shop categories, price editing, upgrade cancel/confirm/insufficient cash, terminal mission read-only behavior, shared header and existing pause/quantity/express guards. Eight screenshots retained in ui-baseline with 2026-10-04 suffix. No full browser matrix claim.

Remaining configuration outside this implementation: full8recipe/custom-sauce quantities, global stock warning thresholds and new decoration/amenity/staff/device purchase prices, ownership persistence and scheduling. Explicit in-game filter selection and unavailable category states avoid fabricated rules/transactions. No sprint/epic completion claims for these future systems.
