---
title: 'Refresh regression tests and progress against current game rules'
type: chore
created: '2026-10-12'
status: done
baseline_commit: f00f84e
---

## Intent

The user asks to handle unfinished verification and progress tracking. Make the existing regression suite trustworthy for the game already implemented, then align sprint/deferred/playtest documents with evidence. A full unit baseline found518 tests,401 passed,117 failed; the earlier17 failures were a small subset. Resolve every unit failure by checking its contract, not by copying observed results blindly.

## Boundaries & Constraints

Always: follow current project-context/config and prior approved requirements: new cash500, legacy cash300 retained; preparation5seconds before selling, oven6–8/4–6/2–4 seconds, campaign30days, real accounting, one workbench/oven owner, current seeded arrival budgets, separate rewards and capital costs, owned pause leases and atomic save/retry. Fixtures may use explicit schedule/resolveRecipe/event seeds to isolate the behavior under test. Keep meaningful invariant assertions, including rejected actions, exact state transitions and once-only receipts. No skipped/todo tests or removal of failed coverage to hide failures.

Never: redesign UI, change prices/rules to satisfy obsolete assertions, fake human/device results, mark unaudited stories done, install new dependencies or remote push. If a failure reveals a real bug, establish expected behavior from the approved contract and fix narrowly with a targeted regression. Escalate ambiguous gameplay decisions rather than inventing them.

## I/O & Edge-Case Matrix

| Scenario | Expected |
| --- | --- |
| New vs legacy checkpoint cash | New500; legacy300 remains exact through restore and purchases |
| Opening/preparation vs selling | No orders/elapsed selling during preparation; explicit transition after configured preparation; pause excludes elapsed time |
| Cooking/selection/remake | Use actual ready/burn timing; single owner retained; no stock refund or duplicate payment |
| Campaign/report history | Days1–30 progress and terminal boundary tested; snapshot reports remain immutable, current catalog accounting exact |
| Persistence retry | Staged shop/menu/staff commits retain confirmed cash/ownership on failure; legacy recipe purchase keeps a blocked RAM candidate while durable save stays unchanged, and retry commits the identical payload once |
| Documentation | Implemented items become review with source evidence; human5person playtest and physical-device certification remain pending |

## Code Map

- src/config/cozySchedule.ts, bakeTiming.ts, kitchenEconomy.ts, campaignRules.ts — current clocks, opening cash and campaign constants.
- src/runtime/CozyRuntime.ts, CozyCampaignSession.ts, PlayLifecycle.ts — actual selectors, guarded actions, simulation/save boundaries.
- src/runtime/*.test.ts, src/domain/*.test.ts, src/infrastructure/BrowserPlayLifecycle.test.ts — historical regression assertions/fixtures; baseline JSON identifies failed cases.
- _bmad-output/implementation-artifacts/sprint-status.yaml — stale implementation tracking.
- _bmad-output/implementation-artifacts/deferred-work.md, epic-4-playtest.md — historical failures and external acceptance criteria.

## Tasks & Acceptance

- [x] Service/order tests: update CozyCustomers/Delivery/Help/Progress/Shop/Tickets plus related cooking assertions with deterministic supported public-flow fixtures; retain each covered intent.
- [x] Campaign/day tests: update Accounts/Day/Epic5/Epic6/Epic9/History/FinishingSauces/MixedOrders/VipCustomers with current clocks and30day terminal state, not shorter demo behavior.
- [x] Cash/legacy/clock tests: update CampaignSession/CashTransactions/CampaignEvents/Economy/Epic7/Epic8/MarketFlow/MarketForecast/BoldMenu/Tutorial/Runtime, domain AutomaticOrders/CampaignDelivery/demo/DrinkStock/FreePizza and browser lifecycle. Preserve legacy300 fixtures when deliberately testing old saves.
- [x] Investigate any non-stale failures before changing production; targeted regression for any actual defect. Owner reports rationale for each changed test group.
- [x] Full Vitest rerun, build/typecheck and focused Chromium360×640 existing UI/session/campaign flows relevant to changed contracts. Broad browser matrix only at release; physical phones and real participants remain external.
- [x] Sprint/deferred/playtest docs: cite done implementation specs, move stale backlog/in-progress items to review, clarify human/device work; update playtest instructions to first3days of30day campaign and current background-play timing without entering fabricated outcomes.
- [x] Verification report: baseline/final totals, mapping old assumptions to current approved rules, remaining limits and review findings.

Acceptance:
- Given current source, when all unit/integration tests run, then every test passes with no newly skipped/removed checks and genuine invariants retained.
- Given any changed expectation, when reviewed, then its rationale traces to an approved rule or explicit deterministic fixture, never only observed runtime output.
- Given current implementation evidence, when reading sprint status, then implemented UI/catalog/staff/campaign parts are distinguishable from pending human/device/release criteria.
- Given player/device checks absent, when reporting completion, then results remain unknown/pending and no automated run is represented as a human playtest.

## Verification

npx vitest run (JSON baseline/final reports); npm run build-nolog; focused Playwright Chromium360×640. Independent adversarial/edge/acceptance review before local commit. Existing untracked art/diff files are unrelated and must remain untouched.

## Authorization

User's 'làm đi' authorizes the recommended test repair and tracking update. Continue without intermediate spec approval. Scope excludes adding missing reference-only gameplay items or inventing player/device results.


## Results

Baseline75files/518tests:401passed,117failed,0skipped. Final full rerun after review:518passed,0failed,0skipped. Everyfile keeps its original casecount; no productionruntime/domain/scene/UI/art changes. Build/typecheck passed and2focusedChromium360×640 actualinvestment/reload/failedsave-retry flows passed. Sprint3.4–3.9/7.2–7.3 nowreview with completed-spec evidence; human5personplaytest stays0sessions, phone/slow-network/release-matrix checks staypending.

Three independent review lenses reported one deduplicated coverage issue: cheaper-menu fallback had amplecash220. Fixed by buying89mushrooms so closecash20 sits between cheese17 and mushroom23; explicit viability/assertedcost/enablingcheese/reopen coverage retained. Focused9tests and final518test rerun passed. No unresolved review findings.

## Suggested Review Order

- Verification totals and current-rule rationale.
  [regression-refresh-summary-2026-10-12.md](regression-refresh-summary-2026-10-12.md)
- Preserve the near-insolvency cheaper-menu boundary.
  [CozyProgress.test.ts:57](../../src/runtime/CozyProgress.test.ts#L57)
- Keep arrivals, workbench ownership and duplicate payments distinct.
  [CozyTickets.test.ts:9](../../src/runtime/CozyTickets.test.ts#L9)
- Genuine legacy300 and current500 accounting fixtures.
  [CozyEpic7.test.ts:70](../../src/runtime/CozyEpic7.test.ts#L70)
- Progress follows implementation evidence; human acceptance remains separate.
  [sprint-status.yaml:1](sprint-status.yaml#L1)
- Real-player criteria are still waiting for actual sessions.
  [epic-4-playtest.md:1](epic-4-playtest.md#L1)

