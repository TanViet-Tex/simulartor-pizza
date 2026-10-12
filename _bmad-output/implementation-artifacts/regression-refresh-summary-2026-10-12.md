# Regression refresh — 2026-10-12

Baseline: 75 files, 518 tests; 401 passed, 117 failed, 0 skipped.
Final: 75 files, 518 tests; 518 passed, 0 failed, 0 skipped.

No production runtime, domain, scene, asset or UI files changed. Every file retains its original test case count. Fixtures and expectations follow approved current rules; no failures hidden by skips.

Build/typecheck passed. Two focused Chromium360x640 E2E flows passed: investment/placement/upgrades/hiring/reload, and failed-save/retry.

## Rules behind the repairs

- New runtime/stock/order capital500; genuine legacy snapshots without initialCash retain300. Legacy DemoGame remains its isolated three-day prototype and300 capital.
- Presale is5 seconds for the production schedule; explicit test schedules without preparation intentionally start at0.
- Oven ready6-8/4-6/2-4 seconds; a single workbench retains its owner until the pizza is delivered or discarded.
- Stock is consumed at bake, not reserved by arrival; queuecapacity4, first expansion5 plus10% visitors.
- Unrelated lottery/thanks events receive explicit public responses in multi-day fixtures. Current campaign/history boundaries remain30 real days.
- Staged investments keep confirmed RAM/save on failure. Existing recipe-save path retains a blocked RAM candidate, with durable save unchanged until identical retry.

## Previously failing files

| Test file | Baseline failures | Final passed / total |
| --- | ---: | ---: |
| AutomaticOrders.test.ts | 1 | 5 / 5 |
| CampaignDelivery.test.ts | 1 | 2 / 2 |
| demo.test.ts | 2 | 5 / 5 |
| DrinkStock.test.ts | 1 | 3 / 3 |
| FreePizza.test.ts | 2 | 6 / 6 |
| BrowserPlayLifecycle.test.ts | 3 | 3 / 3 |
| CozyAccounts.test.ts | 3 | 3 / 3 |
| CozyBoldMenu.test.ts | 1 | 3 / 3 |
| CozyCampaignEvents.test.ts | 3 | 9 / 9 |
| CozyCampaignSession.test.ts | 7 | 16 / 16 |
| CozyCashTransactions.test.ts | 3 | 5 / 5 |
| CozyCustomers.test.ts | 13 | 13 / 13 |
| CozyDay.test.ts | 6 | 9 / 9 |
| CozyDelivery.test.ts | 6 | 6 / 6 |
| CozyEconomy.test.ts | 2 | 4 / 4 |
| CozyEpic5.test.ts | 6 | 10 / 10 |
| CozyEpic6.test.ts | 11 | 12 / 12 |
| CozyEpic7.test.ts | 2 | 9 / 9 |
| CozyEpic8.test.ts | 1 | 8 / 8 |
| CozyEpic9.test.ts | 4 | 7 / 7 |
| CozyFinishingSauces.test.ts | 1 | 9 / 9 |
| CozyHelp.test.ts | 2 | 15 / 15 |
| CozyHistory.test.ts | 1 | 2 / 2 |
| CozyKitchenV2.test.ts | 1 | 13 / 13 |
| CozyMarketFlow.test.ts | 3 | 4 / 4 |
| CozyMarketForecast.test.ts | 2 | 12 / 12 |
| CozyMixedOrders.test.ts | 2 | 12 / 12 |
| CozyProgress.test.ts | 7 | 9 / 9 |
| CozyRuntime.test.ts | 1 | 3 / 3 |
| CozyShop.test.ts | 6 | 6 / 6 |
| CozyTickets.test.ts | 9 | 10 / 10 |
| CozyTutorial.test.ts | 3 | 5 / 5 |
| CozyVipCustomers.test.ts | 1 | 12 / 12 |

## Still pending

Five-person human playtest (0 sessions), physical-phone FPS/input latency, slow-network certification and the release Chromium/WebKit viewport matrix remain unverified. No automation is recorded as human/device evidence.

## Independent review

Three reviewers found one deduplicated boundary-fixture gap. Restored closecash20 with mushroom89 purchase; cheese17 remains viable while enabledmushroom23 is unaffordable. Focused9tests and the final full518tests passed after correction. No remaining findings.
