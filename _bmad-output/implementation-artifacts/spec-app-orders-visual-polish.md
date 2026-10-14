---
title: Polish the app orders shop page
type: feature
created: 2026-10-14
status: done
route: oneshot
review_loop_iteration: 0
baseline_commit: 7ceb5665518b1dd90454fd2f6ed757cfd64c9531
---

<frozen-after-approval reason="user requests improving the delivered app page appearance">

## Intent

Improve the visual quality of the new Đơn app page using the existing warm cream/brown game style. Make the phone illustration, app status,100xu campaign and50% benefit visually distinct, with balanced alignment, spacing and forecast metrics. Keep changes within this page; retain the shared management shell, footer, controls and gameplay/save semantics.

</frozen-after-approval>

## Implementation Notes

Scope investigation: src/presentation/ShopScreens.ts owns only the app branch to change. ShopScreenUI supplies artwork, panels, money and buttons; reuse the existing pizza artwork rather than adding assets. Keep all three card bounds, action IDs and existing hit regions. Existing tests/app-shop-campaign.spec.ts covers locked, enabled, purchased, pending save and failed-save retry states; rerun its three Chromium360x640 cases plus production build. No new public API, dependency, irreversible action or unresolved intent gap. Existing unrelated dirty notes/artifacts remain outside this work, as already authorized in the session.

Visual implementation: refined phone/pizza illustration, compact status pill, prominent gold50% benefit, clear budget typography, and two tinted forecast metrics. All three card bounds and both action bounds/IDs are retained. No new assets or gameplay/save changes. Screenshot outputs now go to a separate visual-polish evidence directory, preserving previous feature evidence.

## Review Triage Log

- Low / patched: paid campaign caption appeared active when app was off. It now distinguishes purchased receipt from currently applied effect.
- Low / patched: forecast caveat omitted queue capacity. Restored both ingredient and waiting-slot requirements.
- Low / patched: consequential no-refund caption became smaller/lighter. Restored10px and previous brown contrast with adequate bottom padding.

All review observations are resolved; nothing deferred. The oneshot route uses one blind review layer; no separate edge/verification reviewers were configured.

Verification note: the initial browser run hit the fixture's5-second load poll on actual reload; the UI/save state was still loading. The readiness check now permits30seconds, matching scene startup readiness elsewhere, without changing game loading behavior. Final verification is rerun after the review patches against a completed production build.


Final verification: production build passed after all visual corrections;3/3 focused Chromium360x640 cases passed in one final run, including actual reload, silent pending save and failure/retry. Locked and purchased screenshots were inspected; no overlap or clipped consequential captions. Existing chunk-size warning remains. No full viewport/WebKit matrix or remote publication was performed.
