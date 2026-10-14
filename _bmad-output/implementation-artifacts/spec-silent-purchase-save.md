---
title: Save purchase transactions in the background
type: bugfix
created: 2026-10-14
status: done
route: one-shot
baseline_commit: 2ffe2ff
---

## Intent

**Problem:** Buying upgrades, decoration, recipes, drinks or hiring staff shows the generic “Đang lưu ngày” dialog and a pause veil although the player is only shopping.

**Approach:** Extend existing silent menu-save presentation to all preparation `upgrade` transactions. Session savingPreparation is true only during their pending write; hide the generic save dialog and save-only pause overlay then. Keep save guard/lease, exact retry, candidate confirmation, duplicate-click rejection, unrelated pause owners and day-boundary saves unchanged. Errors and recovery remain visible; messages describe unsaved changes rather than an unsaved day. No save schema, economics or layout change.

## Verification / Completion Notes

Completed 2026-10-14. Production build/typecheck passed; 19 focused session unit tests and three Chromium360×640 E2E cases passed. The delayed purchase screenshot confirms the shop stays visible with no save dialog/backdrop. Independent review found no concrete regression. Focused session test covers delayed purchase/failure/retry/other pause owner. Canvas tests cover delayed real purchase, background tab navigation, exact payment/ownership/reload, failure UI and existing silent price edits.

## Suggested Review Order

- Classify the current pending write without changing persistence ownership.
  [CozyCampaignSession.ts:37](../../src/runtime/CozyCampaignSession.ts#L37)
- Suppress only preparation-saving modal and save-only veil.
  [CozyScene.ts:571](../../src/scenes/CozyScene.ts#L571)
- Verify real purchase with delayed IndexedDB write and reload.
  [reference-shop-screens.spec.ts:204](../../tests/reference-shop-screens.spec.ts#L204)
