---
title: Add the seventh shop section for app orders and daily campaigns
type: feature
created: 2026-10-14
status: done
route: dispatch
review_loop_iteration: 0
baseline_commit: 2681a40923807ccceb67a2fa55a34fa7a27df29f
context:
  - '{project-root}/_bmad-output/project-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md'
---

<frozen-after-approval reason="user explicitly approved implementation and selected the price/effect in chat">

## Intent

**Problem:** App orders are buried under Amenities and have no campaign to increase demand. The user requests a seventh small section inside Quán, in the game's established style, containing a real campaign action.

**Approach:** Add Đơn app as the seventh Quán section, with existing app controls and a daily Chạy chiến dịch action. The user selected 100 xu for +50% app orders for one day. The latest instruction is to implement, including fixing missing tooling; these decisions are approved.

## Boundaries & Constraints

**Always:** Keep the five main tabs, management background/header/footer, cream/brown artwork and black/gold action buttons. Preserve the original six cards' size/positions by adding clipped scrolling to their card region when showing a seventh card; keep the home hero fixed. The seventh card may span the last row; it must be reachable and visibly discoverable through a short scroll hint. The new subpage uses existing ShopScreenUI shell, list clipping and return button. App unlock stays day5. Campaigns are purchased only during preparation on days5–30, while app is enabled, once per preparation day, using a unique command ID. Costs persist silently through the existing staged preparation save. Never charge daily recurring fees or automatically renew. Existing commercial shop traffic reduction remains 20% through day30. The new campaign increases app order opportunities only, not shop arrivals, pizza prices or delivery quantities per order. Base two app orders become three; rainy three become five (nearest integer total). Help/referral and original app orders keep metadata and timing. Allow the existing app toggle; turning it off after purchase gives no refund, and enabling it again restores that day's purchased effect.

**Never:** Redesign other game areas, add assets/dependencies unnecessarily, migrate/delete player data, change staff/drinks/unlock policy, or publish remote changes during implementation. Preserve unrelated dirty files. New imports in the API's transitive checkpoint graph must use .js specifiers and pass NodeNext typecheck.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Behavior | Error Handling |
|---|---|---|---|
| Buy campaign | Preparation day5+, enabled app, cash>=100 | Deduct100 once, save receipt, app orders round(base×1.5), counter unchanged | None |
| Guard | Before day5, after day30, disabled app, insufficient cash, active shift, duplicate purchase | No receipt or cash mutation; UI indicates reason | Existing disabled/save feedback |
| Persistence | Successful purchase then reload | Same active campaign, cash and forecast; old saves without campaign field still restore | Invalid receipts rejected |
| Write failure | Staged save fails then retry | Confirmed runtime cash/receipt unchanged until commit; retry same candidate once | Existing visible retry |
| Next day | Close purchased day, open next preparation | Effect expires; optional new purchase costs100; reports retain cost | No auto purchase |

</frozen-after-approval>

## Code Map

- `src/presentation/ReferenceShop.ts`: ShopPage, ShopScreenInput and six-card home. Home grid is x8/184, y292+95×row, 168×89; hero133–284; footer/hint575. Add clipped scrolling only to card region (reuse HubListWindow), seventh app card and page/input types. Keep original cards at offset0.
- `src/presentation/ShopScreens.ts`: shared subpage renderer/actions/scroll; remove old amenities app button, add app subpage with state, toggle, campaign and forecast cards.
- `src/scenes/CozyScene.ts`: shop titles near929, ReferenceShop input near938, dedicatedShop hit whitelist near357, existing app settings modal near1099. Extend titles/action whitelist/input and invoke session campaign mutation; reuse app settings modal.
- `src/runtime/CozyRuntime.ts`: app state/control near103, advertising purchase near216, shared forecast/open buildSchedule near570. Add campaign state/purchase and apply app-only extra schedule before shop bonus/reduction.
- `src/runtime/CozyCampaignSession.ts`: buyAdvertising uses stageShop for candidate/commit/retry and silent savingPreparation. Add equivalent buyAppCampaign method.
- `src/domain/ServiceCheckpoint.ts`: backward-compatible optional campaign day receipts, validation and serviceCostForDay accounting. `src/domain/CozyCheckpoint.ts` validates service spending, reports and cash; keep old-save acceptance.
- `src/config/deliveryEvents.ts`: deliverySchedule allocates original app orders; append uniquely identified extra app slots during purchased days without converting existing shop visits. Keep times on50ms ticks, sorted and before closing. Reuse app metadata templates and valid quantities.
- `src/domain/ShopTraffic.ts`: existing 20% counter reduction must still leave all app orders intact.

## Tasks & Acceptance

**Execution:**
- [x] Extend service receipts/config/domain schedule and runtime/session purchase/accounting.
- [x] Add seventh reachable home card and new app subpage; relocate app settings from Amenities.
- [x] Add focused domain/runtime/session tests for every matrix row, plus forecast/count/accounting/legacy save.
- [x] Add focused Chromium360×640 E2E for reaching seventh card, locked day, toggle/campaign purchase, silent save/reload and screenshot.
- [x] Run build, API NodeNext typecheck and focused checks; inspect screenshot and report exact results in Implementation Notes.

**Acceptance Criteria:**
- Given Quán home, when scrolling to its last card and opening Đơn app, then the styled subpage is usable without altering header/navigation/footer or original six card geometry.
- Given a purchased campaign, when forecasting and opening its shift, then the same increased app budget is used while shop visits match the unpromoted day.
- Given a completed day, when inspecting accounts and restoring the checkpoint, then the100xu campaign is included exactly once and passes validation.

## Implementation Notes

Tooling repaired: uv installed from PyPI in a temporary directory; existing bundled Python used to render this workflow. No runtime game dependency added. Existing dirty artifacts are unrelated and must not be committed.

Implementation completed locally on 2026-10-14. `APP_CAMPAIGN` defines100xu,1.5× and days5–30. Optional `services.appCampaignDays` records each purchased day; validation rejects null/nonarrays, duplicate, fractional, future and out-of-bounds days while preserving missing fields in old service receipts. `serviceCostForDay` includes the campaign once in both current preparation cash and closed-day reports/checkpoint reconciliation. Runtime/session purchases use the existing staged `stageShop` transaction and silent preparation save; failed writes leave live cash/receipts unchanged and retry the exact candidate/commit.

`deliverySchedule` appends uniquely identified opportunities on50ms ticks:2→3 or rain3→5. Existing slots remain unchanged; the added app marker lets shop bonuses use only the original timeline and ordinals. This keeps counter slots identical, including their20% reduction, help/referral and metadata. Forecast and shift opening both use the same runtime schedule pipeline. A receipt expires by preparation day, remains in report accounting and survives toggling app off/on without refund.

Quán home retains the original six168×89 cards at x8/184,y292+95×row when offset0, with its hero fixed. Only card region8/292/344×279 scrolls95px to reach the seventh full-width Đơn app card. The existing hint strip now describes the short scroll. The new subpage uses ShopScreenUI shell/list/footer and live app status, existing settings modal, campaign purchase and demand forecast. The former Amenities app button moved to this subpage. Five tabs, other screens, header/footer/background and gameplay prices/quantities remain intact.

Verification:25/25 focused Vitest tests passed across `CozyAppCampaign.test.ts`, `CozyServices.test.ts`, `ShopTraffic.test.ts`, `ServiceCheckpoint.test.ts` and `CampaignDelivery.test.ts`. The new schedule test checks156 day/seed/bonus combinations, and new runtime/session tests cover every matrix row, accounting, exact retry and legacy receipts. Six unique Chromium360×640 cases passed:3new campaign flows, existing six-page shell/navigation/resources regression, existing app opt-in/cancel/reload and rainy forecast. The old delivery fixtures needed a public `resolveLottery(0)` during their preparation loop and a reload selector poll after scene readiness; production lottery/loading rules were unchanged. No full browser/viewport matrix was run.

Visual QA inspected all six stable screenshots at `ui-baseline/app-orders-shop-campaign-2026-10-14/`: [home](ui-baseline/app-orders-shop-campaign-2026-10-14/home.png), [scrolled seventh card](ui-baseline/app-orders-shop-campaign-2026-10-14/home-scrolled.png), [locked day1](ui-baseline/app-orders-shop-campaign-2026-10-14/app-locked.png), [silent pending save](ui-baseline/app-orders-shop-campaign-2026-10-14/silent-saving.png), [purchased day5](ui-baseline/app-orders-shop-campaign-2026-10-14/purchased.png), [restored purchase](ui-baseline/app-orders-shop-campaign-2026-10-14/restored.png). Text, controls and clipping fit without overlap; saving has no overlay and retains the confirmed cash/count until commit. These are implementation evidence, not a new automatic UI approval.

No remote changes published, dependencies installed, schema version changed or unrelated dirty artifacts modified. Remaining verification limits:physical-device touch/performance, WebKit/full viewport matrix and remote deployment are outside this scoped implementation. Demand counts are opportunities; actual orders still depend on menu, inventory and queue capacity.

## Spec Change Log

## Review Triage Log

| Finding | Verdict / route | Evidence |
|---|---|---|
| Blind: campaign and bonus ticks may coincide | false / reject | The canonical schedule deliberately permits simultaneous arrivals/bursts; validateCozySchedule and processDueArrivals support them. No unique-timestamp invariant or demonstrated incorrect counter mutation. Preserving existing counter timings is required. |
| Blind: added app and shop bonus ordinals collide | low / patch | Both allocate from the original maximum, so resolveScheduleRecipe can reuse sequence positions. Move only campaign-added ordinals beyond the bonus range; original counter metadata must remain unchanged. |
| Blind: dense/short schedule clamp collides | false / reject | Production deliverySchedule receives only the canonical schedule (minimum180s with sparse slots). Custom injected schedules bypass it. The exhausted-tick branch cannot occur in this feature's real callers; shared ticks are valid anyway. |
| Blind: home touch swipe not exercised | medium / patch | New home drag/tap routing is exercised only by wheel scrolling. Add touch swipe then independent tap coverage. |
| Blind: full lifecycle of new app slot lacks a new dedicated test | low / reject | The added slot uses unchanged source=app/quantity/takeaway metadata and generic app delivery consumers never branch on appCampaign. Existing CampaignDelivery checks the delivery behavior; a new full clock/queue serving harness adds complexity without evidence of a changed consumer. |
| Blind: restore after expiry not checked | low / patch | Live expiry is covered, but restoring that boundary is a direct additional assertion on the existing checkpoint test. |
| Blind: terminal day30 receipt restore not checked | low / patch | Day30 purchase is covered but terminal reconciliation is a commonly reachable boundary; extend the existing terminal test. |
| Blind: confirmed reload after failed candidate not checked | low / patch | Exact retry/live preservation is covered; loading a new session before retry directly checks the authoritative committed state. |
| Blind: repeated forecast generation on Quán subpages | low / reject | Getter runs on dirty hub redraw, not an animation-frame polling loop. Canonical budgets are bounded and existing forecast paths already use the same builder. No observed delay; splitting public forecast/eligibility surfaces is more than a direct correction. |
| Verification gap: home card swipe then tap | medium / patch | Independent reviewer confirmed no Phaser home-card swipe test exists. Same root cause as the blind swipe finding; one focused touch regression settles both. |

Edge-case review reported no findings. Patch batch sent to the original implementation agent; no intent/spec loopback or unrelated deferred work required.

## Verification

- `npm run build-nolog` and `npx tsc -p tsconfig.api.json`.
- Focused Vitest files for campaign receipts, app schedule, runtime/session/save and20% traffic.
- Focused Playwright Chromium360×640 on the new section; preserve tests for six existing sections where relevant. No full viewport/browser matrix.
- Results: `npm run build-nolog` and `npx tsc -p tsconfig.api.json` passed; focused Vitest25/25; six unique focused Chromium cases passed across selective runs. Vite retains its existing chunk-size warning.


### Final repair and verification — 2026-10-14

All five patch requests are resolved: unique campaign-only ordinals after shop bonuses, native touchscreen home-card swipe plus separate tap, expired receipt restore, terminal day30 restore, and confirmed-state reload before failed-write retry. The remaining review observations were rejected with evidence in the triage table; no accepted issue remains deferred.

Parent verification after repairs passed: production build, API TypeScript compilation,26/26 focused unit tests and6/6 focused Chromium360×640 E2E tests in one run. Visual inspection confirms the purchased-day page fits the established shell. Existing Vite chunk-size warning remains. No full viewport/WebKit or physical-device performance run was required. This feature is completed locally; no new remote deployment is claimed.
