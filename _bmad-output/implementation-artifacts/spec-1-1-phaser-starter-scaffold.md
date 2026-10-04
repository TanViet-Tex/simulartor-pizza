---
title: 'Story 1.1 - Set Up the Initial Project from the Official Phaser Starter'
type: 'chore'
created: '2026-09-29'
status: 'done'
baseline_commit: 'NO_VCS'
context:
  - '_bmad-output/implementation-artifacts/epic-1-context.md'
  - '_bmad-output/project-context.md'
  - '_bmad-output/game-architecture.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The repository contains approved planning artifacts but no runnable game project. Development needs a reproducible Phaser baseline that preserves those documents and enforces the architecture's exact toolchain.

**Approach:** Clone the official `phaserjs/template-vite-ts` 1.4.0 repository into staging, record its commit SHA, integrate only the minimal Vite/TypeScript/Phaser shell, replace sample gameplay with a neutral boot canvas, pin all approved dependencies, and verify unit, build, and Chromium/WebKit smoke baselines.

## Boundaries & Constraints

**Always:** Use Node 24.21.0 and npm 11.19.0 for lockfile/install/build; pin Phaser 4.2.1, TypeScript 5.7.2, Vite 6.3.1, Terser 5.39.0, Vitest 4.1.11, and Playwright 1.63.0 exactly. Clone only into `.scaffold/phaser-vite-ts`, record the upstream SHA, preserve all planning/docs, keep `src/main.ts` as composition root, use Phaser-only gameplay presentation with a minimal HTML/CSS host, and use `dev-nolog`/`build-nolog` scripts without template telemetry.

**Ask First:** Installing or replacing a machine-wide Node/npm runtime; adding any package beyond the approved version table; accepting an upstream starter whose package version is no longer 1.4.0 or whose structure materially differs from the reviewed template.

**Never:** Clone over repository root; copy starter `.git`, README, screenshots, sample assets, telemetry `log.js`, or sample gameplay; add React, physics, backend, auth, ORM, PWA/service worker, IndexedDB wrapper, gameplay systems, or E05-E09 placeholders.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Approved starter | Official main branch still reports template 1.4.0 | SHA recorded and approved files integrated | Preserve staging source for audit |
| Upstream drift | Version is not 1.4.0 or required starter files changed materially | Root remains untouched | Halt and report diff before integration |
| Toolchain mismatch | Active Node/npm is not 24.21.0/11.19.0 | No lockfile is generated with the wrong runtime | Request approval for runtime installation/change |
| Clean build | Exact dependencies installed | Typecheck, Vitest, build, Chromium and WebKit smoke pass | Fix scaffold-only failures before completion |

</frozen-after-approval>

## Code Map

- `.scaffold/phaser-vite-ts/` -- Auditable upstream staging clone; excluded from shipped source and version control.
- `_bmad-output/implementation-artifacts/starter-provenance.md` -- Upstream repository, template version, commit SHA, and integration record.
- `package.json` / `package-lock.json` -- Exact approved dependencies and nolog verification scripts.
- `index.html` / `src/style.css` -- Minimal portrait-safe canvas host without application UI framework.
- `src/main.ts` -- Composition root that creates the Phaser game.
- `src/scenes/BootScene.ts` -- Neutral minimal scene proving renderer/canvas boot; no pizza gameplay.
- `tests/smoke.spec.ts` / `playwright.config.ts` -- Chromium/WebKit boot and console-error baseline.
- `vitest.config.ts` / `src/scaffold.test.ts` -- Fast unit baseline for scaffold-owned configuration.

## Tasks & Acceptance

**Execution:**
- [x] `.scaffold/phaser-vite-ts/` and `starter-provenance.md` -- clone official starter, verify version 1.4.0, capture SHA, and document only approved integration inputs.
- [x] `package.json`, TypeScript/Vite configs, `.gitignore` -- integrate minimal starter/build configuration and exact dependency/script contract without telemetry.
- [x] `index.html`, `src/main.ts`, `src/style.css`, `src/scenes/BootScene.ts` -- replace sample gameplay/assets with a minimal portrait-safe Phaser canvas and composition root.
- [x] `vitest.config.ts`, `src/scaffold.test.ts` -- add a unit-test baseline that does not require Phaser canvas/DOM initialization.
- [x] `playwright.config.ts`, `tests/smoke.spec.ts` -- add Chromium/WebKit smoke verification for canvas visibility and uncaught console/page errors.
- [x] `package-lock.json`, `dist/` -- install with the approved runtime, run all checks, and produce the static build artifact.

**Acceptance Criteria:**
- Given the official starter is cloned into staging, when its metadata is inspected, then template version 1.4.0 and its exact commit SHA are recorded before any root integration.
- Given the starter is integrated, when root contents are inspected, then planning artifacts are unchanged and no starter Git metadata, README, screenshot, sample asset/gameplay, telemetry script, or unapproved dependency is present.
- Given the approved runtime and a clean install, when version and package checks run, then every tool/dependency matches the pinned table and a lockfile exists.
- Given the minimal app, when tests and `npm run build-nolog` run, then typecheck, Vitest, Chromium/WebKit smoke, and production build pass; `dist/` contains a bootable Phaser canvas without console errors.

## Spec Change Log

- Implementation completed with a project-local Node 24.21.0/npm 11.19.0 runtime; system Node remains unchanged. No gameplay was added.

## Verification Results

- Exact direct dependency versions confirmed by `npm ls --depth=0`.
- TypeScript check and production build passed; static output is in `dist/`.
- Vitest: 1 test passed. Playwright: 6 tests passed across Chromium/WebKit at all three target mobile viewports, including nonblank pixel checks and console-error assertions.
- Build reports the expected large Phaser vendor chunk: 1,376.36 kB minified / 356.54 kB gzip. This is a warning, not a build failure.
- Blind review reported no concrete bug. Edge reviewer noted build-before-smoke ordering, documented in README. Independent acceptance/edge reviews did not finish due to agent resource limits; parent completed the acceptance checks.
- Browser screenshots stored under `test-results/`; 360x640 screenshot visually inspected.

## Suggested Review Order

- Composition root and minimal scene: [main.ts](../../src/main.ts), [BootScene.ts](../../src/scenes/BootScene.ts).
- Exact toolchain and scripts: [package.json](../../package.json).
- Browser rendering checks: [smoke.spec.ts](../../tests/smoke.spec.ts).
- Local runtime instructions: [README.md](../../README.md).

## Verification

**Commands:**
- `node --version; npm --version` -- expected: `v24.21.0` and `11.19.0`.
- `npm ls --depth=0` -- expected: only approved exact dependencies.
- `npm run typecheck` -- expected: TypeScript exits 0.
- `npm test -- --run` -- expected: Vitest baseline passes.
- `npx playwright test` -- expected: Chromium and WebKit smoke projects pass.
- `npm run build-nolog` -- expected: exits 0 and creates static `dist/` without invoking telemetry.
- `rg "react|log\.js|serviceWorker|physics" package.json src index.html` -- expected: no prohibited scaffold/runtime integration.
