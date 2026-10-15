---
title: Keep fully visible list actions at the minimum touch size
type: bugfix
created: 2026-10-15
status: done
route: oneshot
review_loop_iteration: 0
baseline_commit: 2dc7ee4be8a89bc24d81e7d07153d9b8196df8f6
---

<frozen-after-approval reason="requested Epic1/Epic3 self-acceptance includes existing minimum-touch criterion">

## Intent

During Epic1/Epic3 acceptance, the first Market buy control was46px tall because list clipping cut its48px expansion. Preserve the approved UI and visible-button bounds; shift the expanded hit rectangle inside the list viewport when the entire original button is visible, retaining minimum48CSSpx. Partially clipped controls keep existing clipping/drag protections and covered-input ownership. Do not change gameplay, prices, saves, or other screen layouts.

</frozen-after-approval>

## Implementation Notes

Scope: CozyScene.hit list expansion branch, with existing ReferenceSummary full flow checking the first Market purchase now used by next-day reminder. Current unrelated dirty files remain excluded. Raw button bounds are stored before expansion; fully visible controls may shift only their expanded zone, whereas partial rows must not gain an oversized target. Maintain tapRects priority and listHubTap routing.

Acceptance refresh fixes in separate tests preserve existing behavioral assertions: oven timing uses current config; arrival fixture explicitly reaches20seconds; market forecast includes approved20% thinning; expense labels follow current contract; ReferenceSummary uses current60xu sale/18xu cost, cumulative reviews and next-day market purchase. Guard optional PWA manifest CDP data for TypeScript compilation. No new public API/dependency or irreversible action.

## Review Triage Log

- false (no defect): raw tapRects/visibleActions are registered before expansion and keep approved geometry; no gameplay change. Review observation confirmed; no correction required.
- Low / patched: common list fix needed Stock/Shop coverage. Added actual Market edge target, Stock detail and Shop menu target bounds checks; existing cross-list scroll/drag retention case remains active.
- Low / patched: nominal bounds alone did not prove padding/partial behavior. Added touch on newly included top padding (purchase reaches dough once), exact original button dimensions, partial-row clipping and above-viewport no-purchase checks. Bottom padding can overlap a neighbouring enlarged target under the existing visible-button-priority policy, so the regression targets the newly fixed unobstructed top edge.
- Low / patched: day-one fixture cannot establish cumulative reviews. Retain its modal/scroll checks and run the separate two-day review-history reload scenario, updated only for auto-continue and existing player-name entry.
- false (no defect): numeric/timing refreshes retain real conservation/idempotency assertions. Added explicit day1 assertion while the next-day Market reminder is visible as evidence enrichment.

Focused units:160/160 in20files pass after refresh. ReferenceSummary modal/purchase flow and actual Market purchase→cook→close→next-day flow passed in the boundary run. Further scroll fixture updates use the current0.88 management transform and expect Quán's one legitimate seventh-card scroll listener instead of falsely treating it as a leak. No runtime lifecycle/resource handling changed.

Independent blind-review follow-up: clean after the added edge/partial/Stock/Shop and saved-history checks. The portable WebKit helper dispatches native drag input through the same Phaser list and observes actual offsets; it does not mutate game state. No unresolved fix-review finding remains. Browser runs additionally needed polling after review-filter taps and stock-threshold Enter; these wait for the existing render result while retaining the original exact assertions. Boot-budget attachment now precedes assertions so failures retain measurement evidence; limits are unchanged.

## Final verification

Production build and API typecheck pass. The list-edge regression passed Chromium/WebKit360; single-workbench/tutorial/shop navigation passed all six browser/viewport profiles. Focused units160/160 pass. This small fix is complete; the broader self-acceptance remains conditional: Epic1 fails the current10MiB startup budget and lacks physical-device evidence, Epic3 story3.7 awaits a complete WebKit Stock run after page closures under low RAM. Full-suite591/605 and all failed/interrupted attempts remain documented in [the acceptance record](epic1-3-acceptance-2026-10-15.md). No claim of full release readiness or complete Epic1/3 acceptance.
