---
title: Named players and shared cash leaderboard on Vercel
type: feature
created: 2026-10-14
status: done
baseline_commit: d1e5f85
context: []
---

<frozen-after-approval reason="Direct user request and confirmed ranking rules">

## Intent

**Problem:** Players sharing the game link cannot identify themselves or compare cash and days because campaign saves are local to each browser.

**Approach:** Ask for a player name before a normal menu start and expose a shared leaderboard from the menu. Publish successfully committed campaign checkpoints through a Vercel API to Supabase; sort by current cash descending, then day descending, then stable player ID. Highlight the current player's row, including when outside the top list.

## Boundaries & Constraints

**Always:** Include money from VIETVUIVE, as explicitly approved. Preserve existing save schema, local play, menu buttons and kitchen/management layouts. Use native name input with mobile keyboard positioning and current cream/brown dialog style. Guest identity is one persistent random ID/token per browser, independent of display name; names may duplicate. Preserve name on Continue/reload. Never let network operations pause gameplay or block local saving.

**Ask First:** Account creation, paid services, deploying external resources, or changing scoring beyond the confirmed current-money rule.

**Never:** Embed database secret/service-role keys in frontend, trust a supplied player ID without token on an existing row, publish unsaved midshift state, replace real online data with fake/local competitor rows, auto-push without authorization, or claim live shared functionality before an actual database is configured.

## I/O & Edge-Case Matrix

| Scenario | Expected behavior |
|---|---|
| Fresh Start | Ask valid 2–20-character name; cancel leaves campaign unchanged |
| New campaign | Existing overwrite confirmation remains; accepted name belongs to new saved campaign |
| Continue/reload | Keep browser identity/name; latest saved cash/day updates shared row |
| Invalid name | Show inline error, no start or remote publication |
| Network unavailable | Local game/save remain available; leaderboard explains failure and offers refresh |
| API not configured | Explicit unavailable/setup message, no fake rankings |
| Older in-flight update | Serialized publication and database sequence guard prevent overwriting newer progress |
| Same name | Separate identities, no name-based ownership |
| Token mismatch | Reject update/read-own-info, leave other player's row unchanged |
| Temporary play/no committed save | Do not publish |

</frozen-after-approval>

## Code Map

- `src/domain/Leaderboard.ts` — shared types and name/row validation.
- `src/runtime/LeaderboardSession.ts` — browser identity, nonblocking sync and list state.
- `src/runtime/CozyCampaignSession.ts` — expose cloned successfully committed snapshot only.
- `src/main.ts` — bind leaderboard to normal menu and committed-save notifications.
- `src/scenes/MainMenuScene.ts` — optional name/leaderboard integration, preserve existing controls.
- `src/presentation/PlayerNamePanel.ts`, `LeaderboardPanel.ts` — owned dialogs, keyboard/lifecycle.
- `api/leaderboard.ts` — Vercel handler using private Supabase REST credentials, checkpoint validation.
- `supabase/leaderboard.sql` — denied direct access, token hash ownership and sequenced atomic upsert/read RPCs.

## Tasks & Acceptance

- [x] Implement client identity/session, name/response validation, serialized durable pending snapshot retry and focused unit tests.
- [x] Add only menu leaderboard entry and name/ranking dialogs, with focused canvas E2E coverage.
- [x] Connect committed saves, including test-code and purchases, without affecting local persistence.
- [x] Implement API and SQL migration with ownership, input bounds and sequence guards; focused handler tests.
- [x] Add deployment guide and environment template; typecheck/build, focused tests and visual checks.
- [x] Complete three independent reviews and record results/context/UI baseline.

**Acceptance Criteria:**
- Given a new player, when they press Start and submit a valid name, then play begins and name persists on reload.
- Given two different browser identities, when each publishes a saved campaign, then the real shared list shows name, cash and day in descending cash order.
- Given an existing identity, when another token attempts an update, then API/database reject it.
- Given failed/offline publication, when the player saves locally, then gameplay and save still succeed and later refresh retries the latest checkpoint.
- Given a received test-code checkpoint, then ranking cash includes that award.

## Design Notes

This adds optional backend support beyond the old demo boundary, as directly requested. No new package is necessary: native fetch and Web Crypto on frontend/Vercel, REST RPC in Supabase. Existing checkpoints remain local; online publication is a scoreboard, not cross-device save recovery. Client checkpoint validation is consistency checking, not a fully authoritative anti-cheat game server. Deployment requires the user's Supabase project and server environment variables; preserve runnable local UI if these are absent.

## Verification

- Production build and API TypeScript check.
- Unit tests for names, identity persistence, queued/stale/offline sync, handler validation and ownership responses.
- Focused Chromium360×640 E2E with controlled API responses and screenshots for naming and leaderboard.
- Live two-browser database test only after a real Supabase project is supplied/configured.

## Spec Change Log

## Completion Notes

Code implementation completed 2026-10-14. Frontend/API TypeScript and production build passed. 43 focused unit tests passed; four Chromium360×640 E2E cases passed across focused runs, including two independent browser contexts publishing actual saved checkpoints to a shared controlled API and the VIETVUIVE award. Name keyboard and ranking screenshots visually inspected. Three independent reviewers identified cross-tab pending acknowledgement loss, failed-storage retry and IME Enter submission; all patched and covered, with a follow-up edge review clean. Browser native fetch receiver was fixed after E2E. Database revision guard and persisted campaign/revision prevent stale browser captures. Supabase SQL is not yet executed on a real project; live shared deployment remains pending user configuration. See leaderboard-vercel-setup.md for precise activation steps. No production deployment or GitHub push performed in this feature task.

## Spec Change Log — implementation review

- Preserve newer durable pending updates when an older tab receives an acknowledgement; retry storage persistence on refresh.
- Keep explicit campaign/revision binding so stale tab snapshots cannot reset a newer run. Only an intentional new Start replaces campaign binding.
- Ignore composition Enter before name submission; preserve native input/mobile positioning and existing menu geometry.

## Suggested Review Order

- Commit-boundary wiring keeps online publication outside gameplay and save ownership.
  [main.ts:50](../../src/main.ts#L50)
- Durable identity, pending acknowledgement merge and network retry.
  [LeaderboardSession.ts:22](../../src/runtime/LeaderboardSession.ts#L22)
- Menu name and leaderboard lifecycle retain existing controls.
  [MainMenuScene.ts:180](../../src/scenes/MainMenuScene.ts#L180)
- Validate checkpoints and keep Supabase credentials exclusively on the server.
  [leaderboard.ts:17](../../api/leaderboard.ts#L17)
- Atomic token ownership, revision guard and public ranking projection.
  [leaderboard.sql:21](../../supabase/leaderboard.sql#L21)
- Browser integration verifies two players and actual saved test-code funds.
  [leaderboard-menu.spec.ts:61](../../tests/leaderboard-menu.spec.ts#L61)
