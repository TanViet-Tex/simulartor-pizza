---
title: 'Story 1.7 — Protect Active Play with Mobile HUD, Pause, Mute, and Lifecycle'
created: '2026-10-02'
status: review
baseline_commit: NO_VCS
---

## Story

As a mobile player, I want stable controls and safe interruption handling, so that locking, rotating, muting or pausing never causes hidden time loss or accidental input.

## Acceptance Criteria

1. At 360x640, preserve the user-approved [UI baseline](ui-baseline-2026-10-02.md): 48/112/251/229px status, queue/canopy, work and action/ingredient regions; queue/panel as subsequently amended by the explicit [compact-queue request](spec-compact-order-queue.md); phase action beside the ovens at y=411; five sauce tiles and the ten-tile two-row ingredient grid. Keep safe insets and post-scale 48x48 CSS actionable targets. This contract supersedes the original 96px ticket/176px action budget and does not authorize further redesign. The UI supports up to six entries; gameplay stays capped at three tickets.
2. Hiding/locking pauses simulation without catch-up. Returning requires explicit Continue. Landscape owns a distinct lease; returning to portrait releases only that lease. Repeated events and cleanup cannot release another owner's pause.
3. Overlay priority is orientation, foreground Continue, user pause, tutorial and consequence/customer choice, then feedback (fatal/recovery remains above all). Covered controls receive no input. Ticket and oven state remains visible and labeled frozen.
4. Mute is a real control; audio creation/resume follows a player gesture and failures leave play usable. All critical cues have icon/text equivalents.
5. Reduced motion suppresses optional animations. Equivalent 200% text scaling keeps modal explanations scrollable and recovery/primary actions reachable, without scrolling the gameplay page. Timers use stable m:ss labels and update within 100ms.

## Tasks / Subtasks

- [x] Add owned pause leases and a pure lifecycle controller; cover independent owners, repeated hide/return, cleanup, orientation and clock gaps while tickets are active.
- [x] Add browser lifecycle and gesture-only audio adapters with unit tests; compose them without gameplay state ownership.
- [x] Preserve the approved portrait HUD and kitchen composition while adding mute, stable timers, overlay input ownership and frozen status in CozyScene; preserve tutorial and delivery flow.
- [x] Add scrollable modal explanations and equivalent text-scale layout; retain reduced-motion behavior and safe-area shell.
- [x] Align the campaign path's audio, overlay priority and lifecycle protections without changing campaign rules or persistence.
- [x] Run focused unit/runtime/E2E regression, TypeScript/build and inspect portrait/modal screenshots. Keep full browser matrix for Epic 1 acceptance/release.

## Dev Notes

Current owners: CozyRuntime controls fixed 50ms simulation and commercial/practice state. Pause owners use individual leases, including independent owners of the same reason; legacy pause/resume releases only its legacy lease. Gaps protect both baking and active-ticket simulation. No new packages.

CozyScene renders cartoon Graphics/Text, persistent input zones, and runtime selectors. Preserve the approved composition, current theme, locked decorative tiles, control IDs, explicit delivery targets, discard consent, isolated tutorial and main-menu callback. Do not reflow into the retired 96/176px budgets or simplify ingredient shelves. The veil disables all lower zones and visible actions before installing modal input. Visibility/orientation listeners belong to a lifecycle adapter and cleanup releases only its owned leases.

BootScene is the optional campaign path. Preserve its checkpoint and delivery behavior, but share the audio policy, prioritize orientation/foreground over confirmations, retain pending confirmations beneath interruption overlays, and show frozen timers. Do not introduce E02+ rules or persistence changes.

Modal explanations use Phaser texture cropping and single-touch scrolling; primary recovery buttons stay outside the scroll region. Root font size is the equivalent text-scale source for verification. Existing CSS handles env safe-area insets and forbids page scrolling. The approved cartoon theme supersedes the old exact red/radius tokens.

### Project Context Rules

Use installed Phaser 4.2.1/TypeScript 5.7.2/Vite 6.3.1, native browser APIs, Vitest 4.1.11 and Playwright 1.63.0. Compose in main.ts; domain/runtime remain free of DOM/Phaser. Gameplay stays in runtime commands, never animation/audio callbacks. Single touch, Vietnamese labels, owned cleanup, no catch-up, no resume-all. Use build-nolog; no telemetry. Focused tests and one worker avoid known browser timing contention. Stories 1.5/1.6 are implemented at review status; this story does not certify the epic as done.

### References

- `_bmad-output/planning-artifacts/epics.md#Story 1.7` and UX-DR1–8, 13–21, 23.
- `_bmad-output/implementation-artifacts/epic-1-context.md`.
- `_bmad-output/game-architecture.md#IP03. Owned Pause Lease`.
- `_bmad-output/project-context.md#Testing Rules`.
- `_bmad-output/implementation-artifacts/1-6-box-and-deliver-once.md` (preserve target identity/idempotency).
- [MDN Web Audio best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices): create/resume only within a gesture; handle rejected resume promises.

## Dev Agent Record

### Debug Log

- Created context from approved Story 1.7, prior story and relevant current files. Customization defaults are empty, overrides absent, uv unavailable; manual defaults used. No VCS is available.
- New lifecycle/audio/lease tests were first run red before implementation, then passed with the adapters and runtime ownership changes.
- The initial HUD reflow replaced the old sauce/ingredient shelves and moved phase actions. The user reported the old interface disappearing and requested restoration, then explicitly requested documentation synchronization to prevent future unsolicited changes. AC1, Dev Notes, UX and epics now state the approved kitchen composition. The former 96px ticket/176px action budgets are superseded, not claimed satisfied unchanged. History is retained here; effective bands are 48/112/251/229px with post-scale actionable targets at least 48x48 CSS px.
- Overlay input zones are disabled before drawing higher-priority actions. Pause leases distinguish owners even for the same reason; scene/session/browser cleanup releases only owned leases.
- Modal cropping replaces the ineffective container text mask. Gesture scrolling moves only the cropped explanation; heading and buttons remain fixed. A screenshot capture exceeded the original 30s test budget under local load after functional assertions passed; the text-scale test now allows 60s and passed on the restored layout.
- A three-ticket render sample exposed expensive repeated Graphics drawing. Scene-owned cropped texture caching preserves the artwork and input/text layers, caps retained cache entries, and frees textures on shutdown. This is a local Chromium sample, not mobile hardware certification.

### Completion Notes

- Technical implementation: owned pause leases and active-ticket gap protection; explicit foreground Continue; independent orientation pause; gesture-unlocked audio/mute; frozen timer labels; modal input priority, scrolling, reduced motion and 100ms timer text updates. Optional campaign recovery remains above interruption overlays.
- User-directed visual correction: restored the pre-1.7 kitchen shelves, ingredient grid, customer positions and action positions. The animated illustrated main menu and its assets were not changed by this correction.
- Verification: TypeScript/Vite build passed; 41 focused unit tests passed across nine files. All 12 restored-layout Chromium E2E tests passed: `tests/cozy.spec.ts`, `tests/story17.spec.ts`, `tests/tutorial.spec.ts`, project `chromium-390x844`, one worker (3.8 minutes). These cover touch assembly/delivery, burnt retry, nested pause/orientation, target geometry/safe insets/audio/covered input, stalled render protection, campaign recovery priority, foreground ownership, 200% modal scrolling, system reduced motion, three-ticket oven ownership/frame sample, and tutorial isolation. Portrait, text-scale and three-ticket frozen screenshots inspected.
- Three-ticket cache/frame thresholds passed on this host: no continuous slow-frame run over one second in the 1.5s sample, retained textures at most 96 and estimated texture memory under 32MiB. Full Chromium/WebKit viewport matrix and physical-device performance remain deferred to Epic 1 acceptance/release per user instruction. Epic 1 is still in progress; Story 1.7 is ready for review with the documented user override to AC1.

## File List

- `index.html`
- `src/main.ts`
- `src/runtime/CozyRuntime.ts`
- `src/runtime/CozyRuntime.test.ts`
- `src/runtime/MainMenuSession.ts`
- `src/runtime/MainMenuSession.test.ts`
- `src/runtime/PlayLifecycle.ts`
- `src/runtime/PlayLifecycle.test.ts`
- `src/infrastructure/BrowserPlayLifecycle.ts`
- `src/infrastructure/BrowserPlayLifecycle.test.ts`
- `src/presentation/PlayAudio.ts`
- `src/presentation/PlayAudio.test.ts`
- `src/presentation/PlayHud.ts`
- `src/presentation/PlayHud.test.ts`
- `src/presentation/ModalText.ts`
- `src/presentation/StaticGraphics.ts`
- `src/scenes/CozyScene.ts`
- `src/scenes/BootScene.ts`
- `tests/story17.spec.ts`
- `_bmad-output/implementation-artifacts/1-7-mobile-hud-and-lifecycle.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-10-02: Created Story 1.7 implementation context.
- 2026-10-02: Implemented lifecycle/audio/modal protections; restored the approved kitchen layout after user correction. Exact original band budgets superseded by user-directed layout preservation.
- 2026-10-02: Build, 41 focused unit tests and 12 focused Chromium E2E tests passed; marked Story 1.7 review.
- 2026-10-02: At the user's explicit request, synchronized AC1 and implementation guidance to the approved UI baseline; documentation update only, no gameplay or presentation change.
- 2026-10-02: A separate explicit user request supersedes only the queue/panel artwork with cream canopy and compact six-position presentation. Linked its separate spec; historical Story 1.7 evidence remains unchanged, gameplay capacity/lifecycle protections remain intact.
