---
title: Reference summary with real day reviews and finance details
type: feature
created: 2026-10-04
status: done
baseline_commit: NO_VCS
context:
  - _bmad-output/implementation-artifacts/requirement-day-finance-modal.md
  - _bmad-output/implementation-artifacts/requirement-day-reviews-modal.md
  - _bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md
---

<frozen-after-approval reason="User explicitly requested implementation using references and documented notes">

## Intent

**Problem:** The summary still uses its earlier layout and lacks the documented all-reviews and detailed-finance flows.

**Approach:** Implement the Summary surface using `bảng tổng kết.png`, with real profit, service statistics, recent reviews and progression. Implement the finance and review overlays using the corresponding reference compositions, replacing sample text/numbers with actual closed-day data.

## Boundaries & Constraints

**Always:** Scope the new composition to Summary and its overlays. Keep five tabs and working navigation, cash/stock/accounting rules, persistence boundaries and pause ownership. Continue before first shift opens Summary with truthful empty state. Closing a modal returns to the same day/tab; its lease never releases another owner's pause. Existing start/next-day actions and terminal-day guards remain functional. Sample figures are not gameplay configuration.

**Ask First:** Only an unresolved gameplay rule or transaction-policy change; no such change is currently necessary.

**Never:** Change kitchen/menu/other-tab renderers, implement decoration/staff systems, add dependencies, reset saves or save during shifts. Do not infer historical recipe counts or costs by dividing totals by prices.

## I/O & Edge-Case Matrix

| State | Behavior |
| --- | --- |
| Before first shift | No fake sales/reviews; existing cash/stock and opening action retained |
| Closed day with sales | Live profit/statistics/progression; latest two reviews; detail links |
| 0/1/2/many reviews | Exact count/average, same-day rows with true identities; empty state supported |
| Old save lacking breakdown | Keep existing totals and show missing-detail state |
| Long overlay content | Scroll body only; accessible fixed close button and blocked background |
| Buying next day's stock | Closed-day report does not change |
| Burnt/discarded pizza | Consumed ingredients charged once; no extra invented loss |
| Day 3/insolvent | Existing final result behavior; no fabricated fourth day |

</frozen-after-approval>

## Code Map

- `src/scenes/CozyScene.ts`: Summary routing, controls, modal leases and legacy statement entry.
- `src/presentation/ReferenceSummary.ts`: scoped reference artwork/composition and dynamic fields.
- `src/domain/CozyStock.ts`: actual lot cost metadata at existing commit point.
- `src/runtime/CozyRuntime.ts`: successful commercial-sales metadata, review identity and report snapshot.
- `src/domain/CozyCheckpoint.ts`: optional bounded metadata preserving old saves.

## Tasks & Acceptance

**Execution:**
- [x] Add optional sales/cost/review identity metadata, preserve financial formulas and checkpoint compatibility.
- [x] Render reference Summary with real numbers, exact recent-two reviews and truthful preparation/terminal states.
- [x] Add scoped finance/review overlays with scroll, × and input isolation.
- [x] Add focused data/interaction tests, build and inspect durable screenshots.
- [x] Review changed code and update applicable baseline/requirement status without claiming unrelated stories complete.

**Acceptance Criteria:**
- Given a completed day, when Summary opens, then displayed figures reconcile with its immutable report.
- Given a report with more than two reviews, when the all-reviews link opens, then every same-day review and average/count are available and underlying controls cannot activate.
- Given a finance report, when details opens, then sales quantities/revenue use actual transactions, lot costs use actual commits, purchases remain cash flow and expired stock is counted once.
- Given an older report without metadata, when restored, then totals are retained and missing detail is explicit.
- Given visibility pause, when an overlay closes, then that independent reason remains.

## Design Notes

The user's new instruction authorizes replacing only the Summary composition with the supplied newer reference. Keep other tabs' established renderers. Use reference art as reusable frames/illustrations with code-rendered live labels; no static sample figures remain visible. Finance and reviews use their dedicated reference shapes rather than forcing their rich content into the simple notification shell. Unknown old avatar identity uses a neutral placeholder, never another person's portrait. Filters shown in review reference may be supported without changing global totals.

## Verification

Run focused runtime/stock/checkpoint tests, `npm run build-nolog`, and one Chromium 390×844 Summary/modal suite. Inspect screenshots against references. Full browser matrix is outside scope.

### Results — 2026-10-04

- Production build passed (`npm run build-nolog`); existing bundle-size warning remains.
- 34 focused unit tests passed across CozySummaryData, CozyAccounts, CozyKitchenV2, CozyCheckpoint and CozyStock. Coverage includes actual negotiated sale amounts, lot costs, duplicate delivery, discarded/burnt ingredients counted once, next-day purchases leaving the closed report unchanged, reset and old optional metadata.
- 6 Chromium 390×844 tests passed in `tests/reference-summary.spec.ts` and `tests/preparation-summary.spec.ts`: real report values, recent-two reviews, empty/one/two reviews, filters, scrolling and pixel clipping, background isolation, independent visibility pause, day-one preparation, next-day opening and long review content at 200% text size.
- Inspected and retained screenshots: [Summary](ui-baseline/reference-summary-2026-10-04.png), [finance](ui-baseline/reference-summary-finance-2026-10-04.png), [reviews](ui-baseline/reference-summary-reviews-2026-10-04.png).
- No dependencies installed, schema version changed, save reset or mid-shift persistence added. Regular Market restoration remains a separate documentation-only request; this change does not claim it or all E03 stories complete.

### Review and fixes

Blind, edge-case and acceptance reviews completed. Fixed Phaser WebGL body clipping and graphics lifetime by rendering the scrolling body into a viewport-sized texture; fixed text scaling and long-content GPU bounds. Modal close releases only its own pause lease. Native frame corners, paper and header art were checked against the supplied images after the final build/test run.

### Suggested review order

1. `src/presentation/ReferenceSummary.ts` and retained screenshots: scoped composition, dynamic fields and viewport scrolling.
2. `src/scenes/CozyScene.ts`: modal ownership and unchanged day-opening actions.
3. `src/runtime/CozyRuntime.ts`, `src/domain/CozyStock.ts`, `src/domain/CozyCheckpoint.ts`: optional historical detail and old-save compatibility.
4. `src/runtime/CozySummaryData.test.ts` and `tests/reference-summary.spec.ts`: accounting and interaction evidence.
