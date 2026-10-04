---
title: Shared hub theme — Market preview first
type: feature
created: 2026-10-04
status: done
baseline_commit: NO_VCS
---

## Intent

The user requests a consistent cartoon pizza interface across Summary, Market, Stock and Shop management, delivered Market first for visual review before applying to the remaining screens. This iteration creates reusable theme and canvas components and adopts them in Market. No attachment arrived with the request; use the existing `references/chợ.png` unless the user supplies another selection.

## Boundaries & Constraints

Keep money, ingredient prices, nineteen ingredients, stock lots, existing purchase confirmation, quantity entry 1–100, filters, scrolling, opening the next day, pause ownership and persistence unchanged. Only change Market presentation and add reusable presentation primitives. Do not modify kitchen, menu, Summary, Stock or Shop renderers yet. Do not add dependencies or render the screen as a static screenshot. Retain six visible ingredient rows and five navigation tabs. The preview must work at 360×640 with readable Vietnamese, live cash and quantity and usable controls. Adoption in remaining screens is pending the user's review of Market, as explicitly requested.

## Code Map

- `src/presentation/theme.ts`: game-wide theme, keep kitchen tokens intact.
- `src/presentation/HubTheme.ts`: new scoped shared hub palette, spacing, typography and geometry.
- `src/presentation/HubCanvasUI.ts`: reusable background, scalable panel, header, navigation, button, text and footer components; dynamic content on canvas.
- `src/presentation/ReferenceMarket.ts`: Market canvas and existing interactive callback routing.
- `tests/reference-market.spec.ts`: actual Phaser/runtime browser fixtures and transaction checks.

## Tasks & Acceptance

- [x] Create scoped hub theme and reusable canvas components using existing reference artwork for the decorative shop sign, vector borders that avoid baked-in amounts or row text.
- [x] Replace local Market drawing primitives and shell duplication with shared components. Use consistent warm paper, wooden background, copper borders, rounded buttons, active navigation, title/subtitle and typography. Keep existing control IDs/callbacks and list clipping/cleanup.
- [x] Validate production build and focused Market/browser tests on Chromium 360×640. Capture the Market preview and quantity/confirmation states; inspect clipping and text sizes.
- [x] Complete independent review, fix confirmed issues and document preview scope. Record other screens as pending review.

Acceptance:
- Given Market is open, when cash or quantity changes, then text and total update through the existing runtime.
- Given nineteen ingredients, when filters or wheel/drag are used, then all items remain accessible within the panel and do not paint over navigation/footer.
- Given 360×640, when Market and purchase/quantity panels open, then controls remain in canvas, text is legible and existing touch-region checks pass.
- Given insufficient money, a save guard or another pause, when purchase/scroll is attempted, then existing restrictions remain effective.
- Given completed Market preview, when implementation ends, then the shared design components are ready for later adoption while other screens remain unchanged.

## Design Notes

Use a single scoped hub palette and roles for title/section/body/meta/action rather than new per-screen colors. Shared header/nav/footer geometries follow the existing Market shell; content remains screen-specific. Keep the native decorative shop sign, combine scalable vector paper/copper frames with dynamic canvas text and icons. Avoid global UI_THEME changes that would redesign the kitchen. Improve the existing flat controls with shaded cartoon surfaces, copper contours and consistent active/disabled states; preserve row number and interaction layout.

## Spec Change Log

- Visual inspection found source-image corner slices leaking miniature baked labels/decorations into live headings. Use vector rounded frames in the shared painter; KEEP existing geometry, sign, icons, callbacks and six-row layout. This prevents static source labels inside dynamic content.
- Edge review confirmed 11px metadata could truncate the final shortfall digit at quantity100. Keep compact amount wording and actual canvas paint regression test; KEEP readable11px metadata.

## Verification

`npm run build-nolog`; `node node_modules/@playwright/test/cli.js test tests/reference-market.spec.ts tests/preparation-summary.spec.ts --project=chromium-360x640 --workers=1`. These include buy→Stock→open→consume→close→next-day purchase, invalid quantities, cancellation, pause isolation and express regression. Add visual geometry checks if needed. Retain inspected screenshots under `ui-baseline/`.

Result: final build passed (existing Phaser bundle-size warning); all9 focused E2E passed on Chromium360×640 in1.5m. Added a real canvas paint check verifying every digit of `1000 xu · Thiếu 700` remains inside the120px row column at quantity100. No runtime/domain/persistence changes or dependencies. Blind, edge and acceptance reviews completed; edge amount truncation fixed and final vector-frame patch rechecked. Full browser matrix intentionally not run.

Inspected renderer captures: [Chợ360×640](ui-baseline/market-shared-theme-360x640-2026-10-04.png), [cuộn](ui-baseline/market-shared-theme-scrolled-2026-10-04.png), [xác nhận mua](ui-baseline/market-shared-theme-confirmation-2026-10-04.png), [nhập số](ui-baseline/market-shared-theme-quantity-2026-10-04.png), [100phần](ui-baseline/market-shared-theme-large-quantity-2026-10-04.png). These are preview evidence awaiting visual feedback, not blanket approval of all hub screens.

## Suggested Review Order

- Shared palette and typography remain scoped to management screens.
  [HubTheme.ts:4](../../src/presentation/HubTheme.ts#L4)
- Reusable header/navigation/paper frames and buttons keep text dynamic.
  [HubCanvasUI.ts:10](../../src/presentation/HubCanvasUI.ts#L10)
- Market uses shared drawing while retaining transactions and input callbacks.
  [ReferenceMarket.ts:18](../../src/presentation/ReferenceMarket.ts#L18)
- Native quantity field adopts the same colors and font.
  [MarketQuantityInput.ts:1](../../src/presentation/MarketQuantityInput.ts#L1)
- Regression verifies large-quantity money digits in actual canvas output.
  [reference-market.spec.ts:156](../../tests/reference-market.spec.ts#L156)
