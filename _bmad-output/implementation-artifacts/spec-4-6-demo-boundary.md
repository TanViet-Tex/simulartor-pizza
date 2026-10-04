---
title: '4.6 — Honest insolvency and final demo result'
type: feature
created: '2026-10-03'
status: done
baseline_commit: NO_VCS
human_playtest_status: pending
context: ['_bmad-output/project-context.md', '_bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md', '_bmad-output/implementation-artifacts/epic-4-context.md']
---

<frozen-after-approval reason="User explicitly authorized canonical Stories 4.3–4.6">

## Intent

Finish the demo honestly at insolvency or after Day3, preserving final results only after safe commit and offering confirmed New Campaign. Record external five-person moderated playtesting honestly, separately from automated implementation acceptance.

## Boundaries & Constraints

Always: After settlement, next-day cash must cover rent20 and independently fund missing valid units for at least one unlocked open recipe using retained stock/next-day prices. Preserve existing ability to enable an unlocked cheaper recipe before opening. Explain exact rent or ingredient shortfall; no loan/rescue/advance from terminal state. Preparation warns consistently without changing final viability rule.

Always: Final result includes cumulative cash/profit, actual level/XP, reputation/relationship and mission. Day3 terminal save records summary without Day4; failed save disables Finish/new campaign until retry/reload resolves the pending write. Existing approved five tabs/cards/prep tiles/footer remain; terminal actions/details reuse modal surfaces and existing footer controls, no layout rewrite.

Always: New Campaign requires explicit consequence confirmation, creates a fresh Day1 checkpoint, does not reopen past committed days. Safe Summary viewing remains possible. New Campaign after corrupted data is explicit replacement. Keep storage failures/revision conflicts understandable and preserve original data until successful replacement.

Always: Provide approved five-person playtest script and result sheet for participants unfamiliar with GDD; targets4/5 first orders≤60active seconds,4/5 finish or explain insolvency,4/5 explain ledger,3/5 wantDay4. Actual participants/results must come from human playtesting; never simulate or fabricate them. Track this external criterion as pending if results are unavailable, while completing code and automated verification.

Never: Playable Day4, family recipe/equipment placeholders after demo, replay/rollback, automatic new campaign or invented playtest pass.

## I/O & Edge-Case Matrix

| Boundary | Expected |
| --- | --- |
| Cash19/20 with recipe possible | Insolvent/viable rent threshold |
| Missing recipe units affordable/not | Continue/ingredient-specific insolvency |
| Final save fails | Same RAM result, retry, no Finish/advance |
| Day3 committed + reload | Final summary only, no Day4 |
| New Campaign cancel/confirm | Original unchanged/fresh atomic Day1 |
| Playtest unavailable | Prepared script/sheet; external acceptance pending |

</frozen-after-approval>

## Code Map

- src/domain/CozyViability.ts: pure next-day threshold/cause selector.
- src/runtime/CozyRuntime.ts and CozyCampaignSession.ts: terminal snapshots, final selectors and confirmed replacement.
- src/scenes/CozyScene.ts, MainMenuScene.ts: existing final/result/modal surfaces.
- _bmad-output/implementation-artifacts/epic-4-playtest.md: approved script and unfilled human evidence sheet.

## Tasks & Acceptance

- [x] Add consistent viability/cause and preopen warning with actual dated stock and menu availability.
- [x] Present real cumulative final values, safely committed terminal state and no Day4 action.
- [x] Implement explicit New Campaign consequence confirmation and creation failures without losing existing save.
- [x] Verify thresholds, terminal retry/reload/new campaign and approved geometry with focused unit/E2E/build.
- [x] Prepare five-person playtest script/results sheet and clearly report whether actual human evidence exists.

## Verification

Focused Vitest and Chromium390×844 final/insolvency/save-failure/replacement cases; separate human playtest evidence. Do not mark human playtesting passed from browser automation.

## Spec Change Log

- 2026-10-03: Implementation authorized; actual five-person playtest evidence not yet supplied, user asked what it means and received explanation.

## Verified implementation — 2026-10-03

152 focused Vitest tests across 22 files passed; 16 unique Chromium390×844 scenarios passed across help/save/schedule/progress/market/day-end flows. Typecheck and production build passed. Combined blind/edge/acceptance review fixes are recorded in [review report](epic-4-final-review.md). UI evidence is separate from approved baseline screenshots.

Implementation and automated checks complete. Five-person human playtest remains pending; no participant results exist. This spec status records code completion, not full Epic4 acceptance.

## Suggested Review Order

- Tách ngưỡng thuê và chi phí nguyên liệu còn thiếu.
  [CozyViability.ts:4](../../src/domain/CozyViability.ts#L4)

- Kết quả thật và xác nhận thay chiến dịch trong modal hiện có.
  [CozyScene.ts:586](../../src/scenes/CozyScene.ts#L586)

- Day3 terminal không sinh Day4 hoặc replay.
  [CozyCheckpoint.test.ts:31](../../src/domain/CozyCheckpoint.test.ts#L31)

- Reload terminal và thay chiến dịch nguyên tử.
  [epic-4-save.spec.ts:79](../../tests/epic-4-save.spec.ts#L79)

- Kịch bản năm người; kết quả thật còn chờ.
  [epic-4-playtest.md:1](epic-4-playtest.md#L1)

