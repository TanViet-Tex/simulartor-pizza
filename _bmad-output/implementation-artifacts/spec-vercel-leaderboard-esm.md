---
title: Fix leaderboard API imports on Vercel
type: bugfix
created: 2026-10-14
status: done
route: one-shot
---

# Fix leaderboard API imports on Vercel

## Intent

**Problem:** The first real production deployment returned FUNCTION_INVOCATION_FAILED: Node could not resolve the extensionless CozyCheckpoint import. Vite and Vitest had accepted it through their bundlers.

**Approach:** Add explicit .js specifiers to the API's transitive relative TypeScript imports. TypeScript resolves these to source .ts files and emitted Node ESM resolves the corresponding .js files. Set the API compiler to NodeNext so missing extensions fail at typecheck. No gameplay, UI, payload, credentials or database access changes.

## Suggested Review Order

- API entry and compiler enforce native Node module resolution.
  [leaderboard.ts](../../api/leaderboard.ts), [tsconfig.api.json](../../tsconfig.api.json)
- Checkpoint and its domain/config dependencies keep the same bindings.
  [CozyCheckpoint.ts](../../src/domain/CozyCheckpoint.ts)

## Verification

Frontend build and API NodeNext typecheck passed. 46 focused unit tests passed. Native emitted Node ESM loaded the handler and returned the expected 503/unconfigured response without database credentials. One independent review found no actionable issues, including all 37 transitive source targets. Live deployment will be checked after push; database activation still requires Supabase login and configuration.
