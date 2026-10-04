# Story 4.1 / 4.2 implementation review

2026-10-03. Best-effort diff against `.tmp/epic4-baseline`; repository has no Git history. Three independent reviewers received no conversation context: blind diff review, changed-path edge review, acceptance audit against both specs and their context documents.

## Triaged implementation patches

- Bargain acceptance now checks `pending.recipe`, rather than the preparation recipe. A selected mushroom recipe cannot block a stocked cheese request after mushroom stock runs out. Added runtime coverage and the real browser progression scenario.
- Next-day viability considers all unlocked recipes, preserving the earlier cheaper-recipe option. A disabled expensive menu cannot incorrectly freeze a solvent campaign before it can enable cheese in preparation. Added the 20-coin / 23-coin mushroom / 17-coin cheese boundary case.
- Pure progression restore rejects XP unsupported by delivery-count and reward-claim bounds and rejects an unlock beyond the possible active day. Derived goal descriptions are rebuilt from validated data; snapshots remain detached. This is not persistent checkpoint integration.
- Counter delivery and summary text no longer claim a missing box or performed boxing. Existing lowercase target/detail labels remain compatible with the focused cooking regressions.
- The shift-end prompt overrides an abandoned oven timer once grace ends. Closing remains explicit and manual.
- Schedule validation requires unique increasing appointments on the fixed 50 ms grid, with grid-aligned duration/grace. Fractional deadlines and simultaneous injected slots cannot silently disappear or overshoot.
- The runtime event journal retains the latest 200 records; detached reads cannot mutate it.
- A default-schedule runtime scenario now completes the eight-cheese mission across Days 1–2, attributes the reward only to Day 2, and confirms no repeated mission reward in Day 3. The earlier injected oven/economy fixtures remain explicit test dependencies.

All accepted findings were implementation patches consistent with the frozen story intent. Duplicate findings were merged. No requirement, approved UI geometry, dependency version or baseline screenshot was changed.

## Verification scope

The focused unit suite covers all three days, thresholds, capacity/stock misses, referral, pauses, service type, reward claims, economic accounting and menu validity. Browser scenarios cover Day 1 shift/grace/manual close, real goals/rewards, next-day sausage assembly, differing bargain/preparation recipes, modal pauses, approved touch geometry, Epic 3 ledger/price regression and the terminal Day 3 boundary. The schedule browser title explicitly identifies its Day 1 coverage.

Help/Decline remains Story 4.3; its eligible schedule slot is journaled and skipped without commercial effects. Storage/checkpoint/reload acceptance remains Stories 4.4–4.5. Full campaign completion/save-failure/new-campaign acceptance remains Story 4.6. These are existing story boundaries, not newly discovered defects.

Final checks: 103 focused Vitest tests across 14 files, seven Chromium390×844 cases and production build/typecheck passed. New evidence was inspected separately from the approved baseline. Story4.1/4.2 moved to review; Epic4 remains in-progress.

Visual follow-up: the existing HUD timer caption uses 9px text so “Chốt ngày” clears the clock icon. A rebuilt focused schedule browser rerun passed, including explicit caption bounds x≥163 and right edge≤224. Approved positions and touch regions are unchanged.
