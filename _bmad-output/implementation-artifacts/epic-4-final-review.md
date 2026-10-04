# Stories 4.3–4.6 — Implementation review

Date: 2026-10-03. Baseline: **NO_VCS**. Review used source snapshots taken before Story4.3 and best-effort reconstruction of previous test/accounting files. No commit or push was created.

Three independent reviewers received no conversation history: blind diff review, edge-path review and acceptance audit against specs/context. Root deduplicated findings and checked them against canonical requirements. Findings below were classified **patch** and resolved within the authorized scope; no unresolved intent decision or deferred issue remained from this review.

| Finding | Resolution / focused evidence |
| --- | --- |
| Menu re-entry silently reloads checkpoint and loses RAM | Startup initialization runs once; menu-return browser case checks cash/session preservation. |
| In-game backup recovery has no confirmation action | Existing save modal now confirms recovery and replaces runtime explicitly. |
| Dismissing save/recovery modal removes retry route | Existing footer reopens status; native abort and in-game recovery cases cover dismissal/reopen. |
| Valid active identity mismatch recovers but cannot commit | Confirmed same-manifest backup can authorize next end-day repair; in-game case changes active campaign ID. |
| Empty store reload leaves stale playable runtime | Explicit empty reload clears runtime/lifecycle; gate is bound to currently installed runtime. |
| Latest stock differs from historical closing inventory | Boundary validates stock against the latest immutable report. |
| Report cumulative profit differs from actual history | Each report must equal accumulated profit through its day. |
| Cash/inventory continuity and inventory reconciliation missing | First-day constants, predecessor values and stock-value equation are checked; malformed ledger rejection tests added. |
| Day3 referral can disagree with settled Day2 referral | Validator requires the terminal report to retain Day2 referral. |
| A help pizza sold commercially remains gift expense | Its actual baked cost leaves the gift subset on paid delivery; total consumption stays unchanged. |
| New campaign locks explicit temporary play when storage remains unavailable | Replacing a temporary campaign stays in temporary mode without database writes. |
| Early insolvency labels active mission expired | Final result distinguishes completed, expired and unfinished mission states. |

Acceptance reviewer reread the fixes and identified the recovery-dismissal follow-up, which was also resolved. Regression helpers now acknowledge the actual Day3 thanks choice and await transaction confirmation before next-day UI interaction. Native browser touch helpers wait for Phaser frames; they do not mutate gameplay or inject production cheat controls.

## Evidence

Implementation evidence and final check results are recorded in the four story specs. Native IndexedDB tests cover creation, midshift reload, immutable closed-day reports, transaction abort, stable retry identity, same-latest recovery, unsupported versions/migration refusal, conflicting tabs, terminal reload and confirmed campaign replacement. Domain tests cover economic continuity, malformed shapes, help exclusions, viability thresholds and absence of Day4.

Visual inspection used separate [help choice](epic-4-evidence/help-choice.png), [save failure](epic-4-evidence/save-failed.png) and [final result](epic-4-evidence/final-result.png) captures. Existing menu/kitchen assets, hanging board, five tabs, three summary cards, four preparation cells and footer coordinates remain. Approved baseline images were not replaced. Main-menu hit regions include a subpixel margin to preserve the 48 CSS px minimum after browser rounding; visual buttons retain their size and position.

## External acceptance

**Five-person human playtest has not happened.** No participant result was supplied, simulated or inferred from automation. The [script and blank sheet](epic-4-playtest.md) record this explicitly. Story implementation can be reviewed, but full Epic4 human acceptance remains pending.
