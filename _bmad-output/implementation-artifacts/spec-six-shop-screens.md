---
title: 'Six reference-driven shop management screens'
type: feature
created: '2026-10-08'
status: done
baseline_commit: 85c16a0
---

## Intent

The user explicitly authorizes redesigning all six Quản lý quán subpages using the six images already in public/assets/references. Replace compressed generic cards with complete portrait game screens: illustrated hanging cream header, back button and live cash; cream cards, dark outlined action buttons and consistent reference artwork. Keep all actual game rules and data. This is one cohesive redesign of the management section.

## Boundaries & Constraints

Always: Phaser presentation, 360×640 logical coordinates with existing responsive scale, shared management background, actual catalog/runtime values and existing session commands. Reuse reference illustrations without sample text/prices; each distinct product has its own illustration. Header and back navigation remain fixed while content scrolls; controls remain clipped and touchable. Use shared components for header, cards, buttons, coin display and art. Retain existing home/hub/kitchen layout.

Never: new browser tabs, fake purchases, placeholder emoji portraits, duplicate art for different products, new upgrades or altered unlocks/effects/wages/prices, schema changes, remote push. Reference shows sample second oven/workbench and three expansion types, whereas game has oven levels, drinks, fridge and two queue upgrades; show actual supported products/upgrades with reference-quality matching art. Staff names may use reference names Linh/Nam/Mai/Minh as presentation only; role remains catalog key.

## I/O & Edge-Case Matrix

| State | Behavior |
| --- | --- |
| Owned/unowned, affordable/poor, locked day | True status, active/disabled action and missing coins from runtime |
| Purchased decoration, placed/stored | Owned tab filters actual acquisitions; detail allows existing place/store actions |
| Hired/absent staff, wage arrears | Working tab uses real roster; status and wages remain runtime-derived |
| Save failure or campaign ended | Existing guard/retry retains control, never mutate through disabled UI |
| Long list, drag, return, resize | Content clips; hit positions update; drag never clicks product; cleanup handlers/textures |

## Code Map

- src/presentation/ReferenceShop.ts — current seven-page canvas renderer and reference manifest.
- src/scenes/CozyScene.ts — shop page state, hub transform, input guards, menu/app/item/employee/upgrade dialogs and campaign commands.
- src/presentation/HubListWindow.ts, HubListScroll.ts — reusable scroll and drag ownership.
- src/config/shopCatalog.ts, staffCatalog.ts, recipeCatalog.ts — true products and costs; no gameplay redesign.
- src/runtime/CozyRuntime.ts, CozyCampaignSession.ts — selectors, transactional mutations/save boundary.
- src/scenes/StartupScene.ts — loads SHOP_ART via current manifest.

## Tasks & Acceptance

- [x] src/presentation/ShopScreenUI.ts / ShopScreenArt.ts — shared reference header, leafy decoration, cash, cards, rounded illustrated crops, dark buttons; separate mapped crop per pizza/item/employee/upgrade preview. Reuse existing textures, cache source frames or raster, do not load asset repeatedly.
- [x] src/presentation/ReferenceShop.ts / ShopScreens.ts — retain home page; six full subpages with scrolling. Menu: pizza/name/cost/price −/+ and selling toggle, select row for profit, keep recipe unlock purchase. Expansion: large room, two actual level upgrade choices before/after/status, existing advertising. Equipment: two columns oven/fridge/drinks with unique illustrations, true levels/use/action. Amenities: room plus two columns of actual six items, app still available. Decoration: store/owned tabs, room and two columns. Staff: recruit/working tabs, four distinct cartoon portraits, reference names plus role/wage/profile, honest empty roster.
- [x] src/scenes/CozyScene.ts — render subpages in full-size dedicated game layer instead of small popup/compressed hub under navigation; fixed back and cash header, scroll/filter/selection state, clipped hit registration and reset on page switch. Preserve confirmation/detail dialogs and existing save/pause ownership. Adapt tutorial focus to new geometry, retain all six introductions.
- [x] tests/reference-shop-screens.spec.ts — screenshots six pages, navigate/back, tabs/filter, clipping/drag, menu price/toggle/profit, real item buy/place/store, oven/fridge/queue upgrades, staff unlock/hire/roster, save reload persistence and guard failure. Focused tests; reuse existing fixtures.
- [x] UI baseline/context — record requested new subpages and evidence, keep historical hub shell instructions scoped to home.

Acceptance:
- Given management home, when selecting any of six categories, then a dedicated illustrated screen fills the game with its own fixed header/back button; no browser popup or new tab.
- Given true state, when adjusting/purchasing/upgrading/hiring, then existing command and checkpoint logic updates money/status exactly once and redraw shows actual result.
- Given each reference, when viewing corresponding page, then layout follows its visual hierarchy, appropriate unique artwork, cream cards, wood/earth/green accents and dark buttons, without source sample text.
- Given long list, when scrolling or returning repeatedly, then fixed shell stays still, offscreen controls cannot fire, cleanup prevents accumulating handlers/textures.
- Given phone resize, when game scales, then content remains within portrait canvas and back/navigation stays usable.

## Verification

npm run build-nolog; focused Vitest runtime/shop/session regression; Playwright Chromium360×640 reference-shop-screens plus affected existing management/tutorial tests. User specifically requests responsive support, so targeted check390×844 for new screens only is permitted. Inspect all six screenshots and scrolled/owned/staff states. Three independent reviews before local commit.

## Design Notes

User's explicit instruction to implement all six is authorization to proceed without an intermediate spec approval. Prior untracked reference/evidence artifacts belong to earlier work; leave them untouched. Reference assets are already loaded by StartupScene, so crops should retain resolution and display ratios. No new dependency is needed.

## Baseline verification

Before presentation integration, focused Vitest ran42 tests across CozyShop, CozyBoldMenu, CozyEpic7, CozyEpic8 and CozyCampaignSession:25 passed,17 failed. Existing failures include legacy300xu initial-cash assertions and stale shift/tutorial assumptions. Runtime/domain files are unchanged by this redesign; retain economic assertions in new UI tests and report these baseline failures honestly. Do not rewrite gameplay to satisfy obsolete tests.


## Results and review

Build/typecheck passed. Seven focused Chromium360×640 tests passed for sixpage screenshots/navigation/scroll/uniqueart/resourcecleanup, price/toggle and persistence, item buy/place/store, oven/fridge/twoqueue upgrades, staff hire/workingtab/reload, locked/poor/drag, failedsave/retry, sharedbackground and fulltutorial. Two newpage checks repeated at390×844 passed. Final360screenshots refreshed after polish. Three independent review lenses found and resolved wage Unicode corruption and missingdeficit labels; no remaining functional finding. Drinks category intentionally pictures genuineCola/water from existingtray, excludes bubbletea. No runtime/domain/save changes. Baseline17unit failures remain as described above.

## Suggested Review Order

- Dedicated screen routing and input ownership.
  [CozyScene.ts:894](../../src/scenes/CozyScene.ts#L894)
- Six layouts bind existing runtime selectors and callbacks.
  [ShopScreens.ts:12](../../src/presentation/ShopScreens.ts#L12)
- Shared header, buttons and cash display.
  [ShopScreenUI.ts:8](../../src/presentation/ShopScreenUI.ts#L8)
- Unique reference artwork, retaining original proportions.
  [ShopScreenArt.ts:3](../../src/presentation/ShopScreenArt.ts#L3)
- Real transactions, save retry and responsive screenshots.
  [reference-shop-screens.spec.ts:43](../../tests/reference-shop-screens.spec.ts#L43)


## User correction: compact like management tab

2026-10-08: user explicitly requests all six pages compact to the management tab size. Supersedes dedicatedfullsize shell geometry. Reuse common hub shell with5tabs, body .88/21.6; backtoolbar133, viewport180–580 or222–580 with fixedtabs178. Hit clipping and tutorial focus use the common transform. Artwork/accounting/session unchanged. Focused regression and screenshots updated below.

Compact correction verified: build/typecheck and6focusedChromium360×640 regressions passed (allpages, menu, purchases/upgrades/staff/reload, locked/drag, failedsave/retry, fulltutorial). Tab Quán now returns to management home from a subpage; final navigation test below. Evidence: ui-baseline/compact-shop-screens-2026-10-08.

Final sixpage navigation/scroll/resourcecleanup check also passed after adding tabQuán→home behavior. All6pages use the same compact transform as managementhome.
