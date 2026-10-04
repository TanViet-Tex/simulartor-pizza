---
title: '4.4 — Validated latest Cozy checkpoint'
type: feature
created: '2026-10-03'
status: done
baseline_commit: NO_VCS
context: ['_bmad-output/project-context.md', '_bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md', '_bmad-output/implementation-artifacts/epic-4-context.md']
---

<frozen-after-approval reason="User explicitly authorized canonical Stories 4.3–4.6">

## Intent

Persist the actual Cozy campaign through a native IndexedDB SaveRepository and load only its validated latest checkpoint. Existing legacy DemoGame persistence is a different schema and must not silently become a Cozy save. Keep the main menu and kitchen geometry while explaining load/recovery status through existing cream modal surfaces.

## Boundaries & Constraints

Always: Versioned envelope includes schema/content versions, campaign/commit identity and revision; payload contains current day start or terminal result, dated stock, progression/claims, relationships/help, enabled menu/prices, completed-day records and deterministic schedule identity. Validate types/ranges/IDs and consistency before constructing domain state. Fresh campaign creation records Day1 before purchases; gameplay taps update RAM only.

Always: Active/backup and authoritative latest identity are written in one IndexedDB transaction. Valid active must match latest identity. Corrupt active can offer only a validated backup of the same commit/revision, requiring confirmation. Older/mismatched backup never offers rollback. Distinguish corrupt, newer/incompatible version, migration failure and storage unavailability. Retry Read and confirmed New Campaign preserve originals until an explicit successful replacement. Migration works on a validated detached copy, never overwrites on failed migration.

Always: Repository returns typed failures and waits for transaction completion. Stale revision requires reload, never merge. Continue names current day. Initial storage failure permits explicitly chosen temporary no-save play; failed writes never silently enter it. Every session/scene releases only its own pause/subscriptions.

Never: Save after each tap, add cloud/backend/dependency, load partial/unvalidated data, repair money/stock, fabricate a saved session, history picker, redesign or expose raw exceptions/save data.

## I/O & Edge-Case Matrix

| State | Expected |
| --- | --- |
| Empty DB | Start creates versioned Day1 checkpoint before gameplay |
| Valid latest | Continue names day and constructs validated state |
| Corrupt active + same backup | Confirmation then restore same latest commit |
| Old backup/newer schema/migration failure | Safe explicit error; no mutation/rollback |
| Unavailable DB | Retry Read or explicit temporary/new campaign flow |
| Stale writer | Revision conflict; require reload |

</frozen-after-approval>

## Code Map

- src/domain/CozyCheckpoint.ts and CozyStock.ts: pure state schema, semantic validation and stock reconstruction.
- src/infrastructure/CozySaveRepository.ts: native atomic IndexedDB/latest envelope boundary.
- src/runtime/CozyCampaignSession.ts, MainMenuSession.ts, src/main.ts: load/start/continue orchestration.
- src/scenes/MainMenuScene.ts: approved menu/modal status and recovery actions.

## Tasks & Acceptance

- [x] Add bounded versioned pure checkpoint schema with validated detached reconstruction and content ID checks.
- [x] Implement typed native repository with atomic copies/latest manifest, safe migration/recovery and revision checks.
- [x] Create before Day1 purchases; connect honest loaded-day Continue and explicit replacement/temporary choices.
- [x] Focused domain/session tests and real browser IndexedDB cases for corruption, versions, recovery, unavailable storage and conflict.

## Design Notes

Use a separate Cozy database/content identity because existing prototype saves do not describe this runtime. A latest manifest provides recovery identity even when an active envelope is structurally corrupt. Snapshot only day boundaries, never tickets/oven/scene. Unsupported historical schemas return an explicit migration/incompatibility result rather than guessed repairs.

## Verification

Focused Vitest, Chromium390×844 native IndexedDB integration/E2E, build/typecheck and combined independent review. Approved screenshots unchanged.

## Spec Change Log

- 2026-10-03: User authorized implementation; existing manual-close and UI baseline preserved.

## Verified implementation — 2026-10-03

152 focused Vitest tests across 22 files passed; 16 unique Chromium390×844 scenarios passed across help/save/schedule/progress/market/day-end flows. Typecheck and production build passed. Combined blind/edge/acceptance review fixes are recorded in [review report](epic-4-final-review.md). UI evidence is separate from approved baseline screenshots.

## Suggested Review Order

- Nạp phiên đã kiểm tra, cần xác nhận khi khôi phục.
  [CozyCampaignSession.ts:35](../../src/runtime/CozyCampaignSession.ts#L35)

- Kiểm tra mốc ngày, kho và tính liên tục của sổ.
  [CozyCheckpoint.ts:36](../../src/domain/CozyCheckpoint.ts#L36)

- Đọc đúng mốc mới nhất; không lùi về backup cũ.
  [CozySaveRepository.ts:54](../../src/infrastructure/CozySaveRepository.ts#L54)

- Chỉ nạp khi khởi động, về menu giữ nguyên RAM.
  [main.ts:22](../../src/main.ts#L22)

- IndexedDB thật kiểm tra reload, dữ liệu hỏng và phiên bản.
  [epic-4-save.spec.ts:33](../../tests/epic-4-save.spec.ts#L33)

