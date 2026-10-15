---
title: Complete technical acceptance of the approved stock, delivery, shop and staff systems
type: chore
created: 2026-10-15
status: done
route: oneshot
review_loop_iteration: 0
baseline_commit: 9f8db3072c5a7be2e2b29d17b3437a4077bcf934
---

<frozen-after-approval reason="user explicitly requests continuing all four epics outside sandbox and recording results">

## Intent

Verify the already implemented, user-approved Epic3/6/7/8 contracts, correct demonstrated stale test fixtures or small proven defects, and record current evidence and honest acceptance decisions. Work in sequence: finish the Stock acceptance gap, then delivery/events/app campaigns, shop development and staff. Given current prices/timing/traffic/contracts, when real runtime commands and browser inputs exercise these systems, then money, stock, ownership, delivery, persistence and expiry must match the current contract without duplicates or deadlocks. Mark stories done only when their criteria have evidence; retain any genuine unverified criteria explicitly.

Existing user decisions are authoritative: cheese60, initial500, oven4/3/2 with3seconds before burning, counter traffic minus20%, drinks from day4, app from day5, app ads100/+50%/one day, staff2000/10days with explicit renewal and no daily charge. Preserve approved UI/artwork and gameplay. No new mechanics, dependencies, backend changes, data deletion, remote push or deployment. Physical-phone certification and human balance studies are outside this technical acceptance.

</frozen-after-approval>

## Implementation Notes

The user has approved keeping all four goals and continuing despite the three unrelated dirty specification files, which remain excluded. This is a bounded verification/test refresh of existing implementations, with no new public API or irreversible operation planned. If investigation reveals a substantial production change or missing user decision, record it and replan that change separately; continue independent acceptance work.

Code/evidence map: Stock renderer/filters in ReferenceStock/CozyScene and reference-shop-screens.spec.ts; Epic6 in CozyRuntime, deliveryEvents, CozyEpic6/CozyAppCampaign and epic6-delivery/app-shop-campaign browser tests; Epic7 in CozyShop, shopCatalog/ShopCheckpoint/Fridge/Advertising and epic7-shop/reference-shop-screens/drinks-service; Epic8 in staffCatalog/StaffCheckpoint/CozyRuntime/CozyCampaignSession and CozyEpic8/StaffContracts/StaffHandoff/FridgeAndAbsence with epic8-staff/staff-handoff browser tests. Read-only investigation agents found stale historical expectations and unsupported mobile-WebKit wheel inputs, but no confirmed new production defect.

Verification runs use one browser worker, no trace, and avoid concurrent CPU-heavy commands. Optional intermediate screenshots may be retained on Chromium only if WebKit GPU readback cannot run under the observed low-memory host; all functional assertions and native inputs remain mandatory, and this must not be described as WebKit pixel certification. Record initial failures and corrected reruns. A context-free blind review will inspect the final scoped diff. Refresh sprint/story acceptance and add one combined evidence report. Commit only this task's files.

## Review Triage Log

- Low / patch: identical fixed-price fixture receipts did not cover the production request resolver. The two-item UI case now uses customerPizzaRequests, an enabled cheese/mushroom menu, configured prices60/78 and actual requested finishing sauces. It asserts both item identities/prices and total138/fee5/net133.
- Low / patch: fixed60 per item could hide unequal-price receipt bugs. The same mixed production-resolver case addresses this root cause; fixed-price legacy controlled fixtures remain only for the other focused paths.
- Low / patch: the browser packing case lacked direct stock assertions. Snapshot usable quantities before cooking, count every recipe ingredient/requested finishing sauce, and assert exact consumption. Packed lots must remain unchanged through waiting, settlement and replay.
- Low / patch: delayed observation alone did not prove duplicate-command handling. Replay against the completed ticket and compare cash, fees, revenue, review total and lots before/after.
- Low / patch: expansion capacity alone did not assert both debits. Assert4000 tables +6000 first expansion and10000 second expansion, total16000 upgrade receipts, and unchanged cash/spent after reload.
- Low / patch: a partly clipped enabled action could bypass helper scrolling and fail minimum-target assertions. The shared revealShopAction validates full transformed viewport containment and minimum CSS dimensions, scrolls using the actual action/viewport metadata, and throws after bounded attempts. Existing native inputs and size assertions remain.
- Low / patch: the rain case's fixed75second jump did not prove its deadline margin. Advance from the actual remaining time to at most5.1positive seconds, then dispatch the real delivery action.

Implementation remains test/documentation only. New failures while adapting receipts/list controls were stale fixture assumptions (legacy no-items app packing, offscreen second expansion, missing readiness) and were retained in initial browser reports. Optional screenshot removal did not fix WebKit page closure and was reverted. No production behavior or approval baseline changed.

Independent follow-up review found no remaining concrete defects after all seven corrections. Actual browser execution remains the acceptance gate; the review does not clear the unresolved WebKit Stock limitation.

Late services harness correction: the first run reached no save-state within its5second startup guard; after adding explicit screen readiness, advertising remained offscreen below the expansion list. Use the same bounded revealShopAction before native tapping, preserve all charge/forecast/reload assertions, and allow120seconds for the complete case. Independent follow-up found no concrete defects in this additional diff. The corrected advertising and lottery cases both passed.

## Completion

Completed this bounded acceptance pass; this does not assert all four epics complete. Epic6/7/8 current approved technical scope is done; Epic3 remains8/9 with3.7review after two outside-sandbox WebKit page closures.281/281focused units pass; full units749/760 with11remaining failures recorded separately. Every targeted Chromium scenario has a passing run after the documented harness corrections. Production build and API TypeScript check pass; existing chunk-size warning remains. Representative images inspected, all review findings triaged, sprint/story/context updated. Final evidence and limits: [epic3678-acceptance-2026-10-15.md](epic3678-acceptance-2026-10-15.md). No runtime/UI behavior, unrelated dirty files or remote state changed.
