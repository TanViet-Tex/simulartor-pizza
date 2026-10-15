# Technical acceptance — Epics 3, 6, 7 and 8 — 2026-10-15

> Later same-day follow-up closes the outstanding3.7technical criterion and eleven unit failures: see [Stock WebKit regression report](stock-webkit-regression-2026-10-15.md). The observations and pending decisions below describe this earlier acceptance pass and remain historical evidence.

Baseline: `9f8db3072c5a7be2e2b29d17b3437a4077bcf934`. User explicitly authorized continuing outside sandbox, completing the four epics in sequence and recording results. Existing unrelated dirty specifications are excluded. This record supersedes historical acceptance assumptions only where later user decisions changed the contract; it does not certify physical phones or human balance studies.

## Current contracts

- Stock: actual usable lots/FEFO, explicit low-stock threshold, filters/detail/scroll, no read-only economic mutation, approved management geometry.
- Delivery: app from day5, opt-in preparation transaction, booking before bake,10s/15s rain pickup wait, immediate settlement, fee5,1–3 pizzas, one order outcome and exact per-pizza sales. Staff return20s/30s remains independent. Ads100/day increase only app opportunities50%, no renewal. Forecast and actual schedule share the current minus20% counter pipeline.
- Shop: twelve owned/placed/stored decorations/amenities, effects frozen at opening, no duplicate purchases; oven4/3/2, fridge×4, drinks from day4; expansion6000/10000 for4→5→6 and10%/30% visitors. Paid forecast advertising reveals information without increasing demand. Do not invent a replacement workbench, second oven or repair mechanic.
- Staff: four fixed roles hireable from day1 when affordable;2000 per ten-day inclusive term, no new daily wage, expiry asks the player, explicit renewal only. Preserve old receipts/reports/arrears; prevent repeated charges, stale jobs and boxed handoff deadlocks. Seeded prep absence is implemented; no training or heirloom recipes required.

## Evidence and corrections

Read-only investigations mapped all current Epic6/7/8 stories to implementations and tests; no new production defect was proven by that inspection. Current edits refresh stale fixtures and supported inputs, not game mechanics.

- Focused unit initial:281 total,280 passed,1 failed. The failed special-customer test advanced7000ms plus50ms, burning a pizza after the current7second limit before expecting payment. Refresh to configured perfectStart retained the560xu VIP/payment and duplicate-delivery assertions.
- Focused unit final:281/281 passed across21 files (`epic3678-unit-final-2026-10-15.json`). This includes156 separately reported day/seed/bonus app-campaign combinations, formerly one long test that exceeded its time budget. Every combination retains metadata, timing, ordinals, counter-budget and app-count assertions. Mixed-order expected schedule now includes the approved20% reduction.
- Epic3 WebKit attempts, one worker/no trace: the original full case closed the page while capturing its first screenshot; a functional-only retry also closed the page after navigation. Optional screenshots were restored because removing them did not solve the problem. Reports: `epic3678-stock-webkit-2026-10-15.json`, `epic3678-stock-webkit-functional-2026-10-15.json`. RAM before the attempt:1,670,064KiB free of16,537,592KiB. Cause remains unverified; no weakened graphics or skipped functional assertions used to force acceptance.
- Browser test refresh: current60xu cheese sale, real4second oven timing, automatic per-item packing for production-style item receipts, native scrolling helper instead of unsupported WebKit wheel, deliberately unaffordable800xu painting against fresh500xu, actual list clipping and scrolling. Preserve exact money/save/retry assertions.
- First delivery/shop batch:7/9 passed; failures exposed the legacy custom-schedule no-items packing path and an offscreen second expansion in the test, not the canonical production request path. After the refresh, all four delivery cases and the unaffordable-shop case passed. A later table case initially hit a5second startup readiness limit; the actual readiness guard is now30seconds and the table/expansion flow passed in the staff batch.
- Staff/table batch:8/8 passed (`epic3678-staff-shop-2026-10-15.json`): early failed hiring/retry, all four roles without daily wages, expiry/decline/explicit renewal, failed renewal/retry/reload, eight sequential boxed pizza/drink handoffs and both bargain choices. The table flow preserves six kitchen frames through both expansions and reloads.
- Independent blind review identified seven test-strengthening opportunities, all patched; follow-up found no remaining concrete defects. The final browser batch additionally verifies a production-resolver cheese/mushroom receipt with unequal configured60/78 prices, requested finishing sauce, exact ingredient consumption and lot conservation, duplicate delivery replay, both expansion debits and dynamic pre-deadline rain handoff. See the spec's Review Triage Log for every verdict.

## Story decisions

| Epic/story | Required evidence | Decision |
|---|---|---|
|3.7|Stock filters/threshold/lot detail/scroll and unchanged shell on WebKit|Review; full browser closes under the observed host conditions. Epic3 remains8/9accepted|
|6.1|Opt-in/restore, multiple pizzas, FEFO and single gross/fee/net outcome|Done, current approved technical scope|
|6.2|Book/wait/pause/background, staff availability/return, no duplicate settlement|Done, current approved technical scope|
|6.3|Seeded weather/peak/festival, unchanged app gate, forecast/schedule agreement|Done, current approved technical scope|
|7.1–7.5|Ownership/place/store, equipment/drinks/fridge, both expansions, effects, atomic saves/migration|Done, current approved technical scope|
|8.1|Early hire, four roles, expiry/decline/renewal/retry/reload and long boxed-handoff sequence|Done, current approved technical scope; absence tested in unit/runtime, not a full browser day off|

## Final browser verification

The final20case Chromium360×640 batch passed19cases. Its remaining advertising case failed before startup finished under an old5second polling guard (`epic3678-final-browser-2026-10-15.json`). The explicit readiness correction exposed an offscreen advertising action (`epic3678-services-confirmed-2026-10-15.json`); the test now scrolls through the existing native list helper before tapping. The advertising and lottery cases then both passed (`epic3678-services-final-2026-10-15.json`). No assertions were removed. Together with the earlier confirmed delivery/shop and staff/handoff batches, every targeted Chromium scenario now has a passing run; these reports overlap and must not be summed as unique coverage.

The mixed two-pizza case uses the production resolver and real native cooking/packing/delivery inputs. It checks cheese60+mushroom78, gross138, fee5, net133, exact ingredient/requested-sauce consumption and unchanged lots/cash/revenue/fees/reviews on completed-ticket replay. Rain delivery occurs with at most5.1positive seconds left. Both expansion prices and16000xu capital receipts survive reload. Staff tests exercise inclusive ten-day expiry, decline/renewal, failed writes/retry and eight sequential pizza/drink orders without manual handoff. Scene presentation checks retain the peak/festival flame and VIP frame/information deadline.

Read-only independent review and both follow-ups found no remaining concrete defects in the scoped changes after the seven recorded corrections and the final services harness correction. This clears the test changes, not the unverified Stock WebKit criterion.

## Evidence images

Representative screenshots were copied to `epic3678-evidence-2026-10-15/`; app settlement, expiry prompt and expansion catalog were visually inspected. The catalog screenshot illustrates the two offers before upgrading; actual two-level debits/capacity/reload are asserted by the browser test. `staff-eight-orders-complete.png` records the earlier eight-order handoff case. These are evidence captures, not a redesigned UI baseline.

## Whole-project regression cross-check

Serial full Vitest:760total,749passed,11failed,0pending (`epic3678-unit-all-2026-10-15.json`). The increase from the historical605total is155additional reported cases from splitting the same156 app-campaign combinations; it is not155new scenarios. The three addressed stale failures were the app-campaign time budget, mixed-order traffic expectation and special-customer burn timing. Remaining failures are six in CozyCustomers.test.ts (relationship/referral/reputation/bargain/day2settlement), one in CozyHelp.test.ts (first commercial visit) and four in CozyProgress.test.ts (goal/reward/mission/bargain). They were not repaired in this bounded acceptance. Full-project units are not green; this report is not a release approval.

## Remaining acceptance limits

Final checks: `npm run build-nolog` passed (frontend TypeScript + Vite production build); `npx tsc -p tsconfig.api.json` passed. Vite retains its existing warning about chunks above500kB (game533.49kB and Phaser1376.36kB before gzip); no bundle/performance improvement is claimed. Scoped `git diff --check` passed. All changes are tests, acceptance documentation and retained evidence; production source is unchanged.

Epic6/7/8 are technically accepted against the current approved mechanics; no new feature was required after investigation. Epic3 remains in progress until3.7passes its full WebKit Stock flow. The two failed outside-sandbox attempts are retained; low available RAM was observed, but the cause of page closure is unproven. No physical-phone, performance/network, human balance or full Chromium/WebKit release-matrix certification was performed. Epic1/4/9 status and the unrelated dirty files remain unchanged. No remote push or deployment is part of this task.
