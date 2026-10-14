---
title: Mark busy days and simplify VIP avatar timing
type: feature
created: 2026-10-14
status: done
route: oneshot
review_loop_iteration: 0
baseline_commit: 26ec933a62b1c3877f8b9cb26547809282df45c7
---

<frozen-after-approval reason="user explicitly requests these two related HUD indicators">

## Intent

Show a small flame beside the gameplay time on rush and festival days. For VIP customers, show only their avatar and decorative frame without the surrounding countdown/selection circles; keep remaining time in the customer information. Preserve the clock position, avatar frames, other customer timers, input regions and all gameplay deadlines, rewards, saves and event rules. Existing special portraits labelled VIP as well as rewarded VIP tickets should use the simplified treatment.

</frozen-after-approval>

## Implementation Notes

Small reversible presentation change in src/scenes/CozyScene.ts. Use frozen runtime.deliveryApp.event for day status, not preparation forecast; draw a static orange/yellow flame in the existing gap between Pause and HH:mm. Resolve both ticket.vip and specialCustomerForTicket.kind to decide avatar-only VIP treatment. The existing orderCard timer remains authoritative and live. Keep all original geometry and avoid adding assets/dependencies. Add focused Chromium360x640 evidence for rush/festival versus rain/normal, VIP versus ordinary waiting circles and decreasing detail time; build and existing OrderQueue unit tests. Scope has no unresolved intent or irreversible effects. Unrelated existing dirty artifacts remain excluded under prior session authorization. One-shot review uses only its configured blind layer.

Implementation: static two-tone orange/yellow flame at53–62/5–20 beside the unchanged HH:mm position. Scene sets its inspection marker only for actual rush/festival shifts. Rewarded VIP or special-kind VIP omits both green selection circle and patience arc; other customers retain both. Existing artwork/name/hits remain. Information countdown stays live for VIP even if a prep-absence or customer-status notice is shown.

## Review Triage Log

- Medium / patched: notices could replace VIP's only remaining countdown after ring removal. Information row now combines VIP time and notice, with live timer registration. The E2E injects the reachable prep-absence presentation state and checks decrement.
- Low / patched: weak art assertion and ring inspection alone could miss frame/selection changes. Assert exact special portrait sheet and VIP frame, plus manually inspect VIP proof for both circle removals and retained decorative frame.
- Low / patched: flame marker alone does not prove drawing. Inspect captured rush/festival screenshots for rendered flame and normal/rain frames for absence; verify unchanged clock bounds. No screenshot-baseline equality test added for this small drawing.

No review finding remains deferred. Focused OrderQueue tests passed14/14. Initial E2E fixtures used a funded checkpoint already beyond day7 and opened VIP before enabling special presentation; both fixture setup issues were corrected without changing production rules.

Final results: production build passed after the notice fix;14/14 OrderQueue unit tests passed;2/2 Chromium360x640 E2E cases passed in the final run. The day case covers rain/rush/normal/festival; the VIP case proves exact portrait/frame, absence of its arc, ordinary arc presence and decreasing information deadline with/without a prep-absence notice. Manual inspection of rush/festival and VIP/absent-prep screenshots confirms the rendered flame, no green circles around VIP, clean frame and legible information. Fixtures freeze with a presentation lease so screenshots have no unrelated dialog. Full browser matrix and physical device performance were outside scope. No accepted findings deferred; no remote push performed.
