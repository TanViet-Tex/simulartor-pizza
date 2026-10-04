---
title: '4.5 — Atomic day commit and latest-only resume'
type: feature
created: '2026-10-03'
status: done
baseline_commit: NO_VCS
context: ['_bmad-output/project-context.md', '_bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md', '_bmad-output/implementation-artifacts/epic-4-context.md']
---

<frozen-after-approval reason="User explicitly authorized canonical Stories 4.3–4.6">

## Intent

Connect the existing once-only manual day result to prepare/commit/confirm. Preserve RAM results on failure, safely retry the same immutable payload, and reload only the beginning of the current uncommitted day.

## Boundaries & Constraints

Always: Explicit Kết thúc ngày and confirmation remain. Calculate outcomes/goals/rewards/expiry/rent/viability once, then prepare stable commitId/sourceRevision/completedDay and next-day start or terminal snapshot. Snapshot includes settled result and every awarded claim/help state. Keep pending data in RAM; save owns its own pause. Disable purchases/menu/Next Day/Finish while saving or error. Only tx.oncomplete confirms a day; no next-day activation first.

Always: Retry and duplicate submit reuse the same ID/payload and are idempotent. Old checkpoint and pending result survive failures; explain unsaved day and closing-page loss risk. Revision conflict requires reload. Reload mid-day discards later RAM choices/money/XP/stock and returns to that same day start with deterministic schedule/prices. Closed days remain immutable with no replay/rollback/historical selection API.

Always: Successful nonterminal commit enables the existing summary preparation hub/footer; its later preparation purchases remain RAM for the next uncommitted day. Terminal commit preserves final summary and creates no Day4. Exiting to menu preserves RAM pause ownership; reload follows checkpoint semantics. Temporary no-save mode is explicit and remains visibly described.

Never: Recalculate rewards on retry, write during topping/buy/delivery, enable advance on request.onsuccess alone, bypass another pause, roll back closed days, redesign summary.

## I/O & Edge-Case Matrix

| Trigger | Expected |
| --- | --- |
| Day close double tap | One calculated result and stable pending payload |
| Abort/quota/timeout | Old checkpoint unchanged, RAM pending kept, advance disabled |
| Retry/duplicate | Same ID/data; one latest revision/claim set |
| Another tab commits | Conflict; reload latest, no merge |
| Reload while serving | Start current unclosed day; discard RAM changes |
| Commit then reload | Next day start or terminal; closed day unavailable |

</frozen-after-approval>

## Code Map

- src/runtime/CozyRuntime.ts: pure boundary export/restore and persistence guards.
- src/runtime/CozyCampaignSession.ts: stable pending commit, save lease and typed retry state.
- src/infrastructure/CozySaveRepository.ts: idempotent transaction/revision enforcement.
- src/scenes/CozyScene.ts and src/main.ts: manual close entry and existing save/error modal surfaces.

## Tasks & Acceptance

- [x] Export/restore only validated day-boundary state and preserve prior results/claims without active tickets.
- [x] Add prepare/commit/confirm with stable detached pending state and exact save-pause ownership.
- [x] Gate summary preparation/advance/finish on successful confirmation and offer readable retry/reload feedback.
- [x] Verify failure/duplicate/conflict/reload/no-replay in focused session/unit and real IndexedDB browser tests.

## Design Notes

Keep existing synchronous standalone runtime tests possible through explicit no-save runtime construction. Production default menu and direct shop use the persistent session coordinator. Persistent mode guards cannot be bypassed by runtime methods even if the modal is closed.

## Verification

Focused Vitest and Chromium390×844 failure/retry/reload flows, build/typecheck and combined review. No full browser matrix.

## Spec Change Log

- 2026-10-03: Canonical scope authorized; manual close stays explicit and approved hub geometry stays fixed.

## Verified implementation — 2026-10-03

152 focused Vitest tests across 22 files passed; 16 unique Chromium390×844 scenarios passed across help/save/schedule/progress/market/day-end flows. Typecheck and production build passed. Combined blind/edge/acceptance review fixes are recorded in [review report](epic-4-final-review.md). UI evidence is separate from approved baseline screenshots.

## Suggested Review Order

- Giữ một payload/commitId đến khi transaction xác nhận.
  [CozyCampaignSession.ts:58](../../src/runtime/CozyCampaignSession.ts#L58)

- Ghi ba bản ghi trong cùng transaction và kiểm tra revision.
  [CozySaveRepository.ts:70](../../src/infrastructure/CozySaveRepository.ts#L70)

- Retry/reload/recovery luôn có đường quay lại.
  [CozyScene.ts:570](../../src/scenes/CozyScene.ts#L570)

- Chặn mutation trước confirm và không tính lại thưởng.
  [CozyCampaignSession.test.ts:24](../../src/runtime/CozyCampaignSession.test.ts#L24)

- Abort thật giữ nguyên checkpoint và kết quả RAM.
  [epic-4-save.spec.ts:46](../../tests/epic-4-save.spec.ts#L46)

