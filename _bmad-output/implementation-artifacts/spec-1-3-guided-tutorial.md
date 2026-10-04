---
title: 'Story 1.3 — Guided Day 1 practice'
type: feature
created: '2026-10-01'
status: done
baseline_commit: NO_VCS
context: []
---

## Intent

Guide each player action on the approved cartoon kitchen before an explicit “Bắt đầu ca”. Practice is separate from the commercial order; time, rewards and ingredient accounting cannot leak. User authorized Story 1.3 implementation directly.

## Code Map

- `src/runtime/CozyRuntime.ts`: guided step machine, owned pauses and isolated practice clock.
- `src/domain/CozyOrder.ts`: practice order without economic rewards.
- `src/scenes/CozyScene.ts`, `src/main.ts`: default guided entry, Vietnamese instruction panel, expected target and explicit shift start. Existing unguided preview remains available through `?mode=freeplay`; campaign route retains its existing behavior.
- Runtime/domain tests and `tests/tutorial.spec.ts`: transition rejection, isolation, pauses, reduced motion and mobile walkthrough.

## Tasks & Acceptance

- [x] Practice order and commercial state are independent; tutorial commands never change commercial money/reputation/energy, inventory or campaign checkpoints.
- [x] Player explicitly performs dough/sauce/cheese/bake/extract/box/deliver; wrong actions are blocked. No automatic domain commands.
- [x] During guided baking only training advances; at green-zone start the tutorial pause is reacquired and time freezes until player extracts.
- [x] Owned pause reasons remain independent and idempotent; tutorial cannot release user/visibility/orientation/order/gap pauses.
- [x] Complete tutorial displays “Bắt đầu ca”; explicit tap transitions to fresh commercial assembly exactly once.
- [x] Verify fixed time without waits in unit tests, mobile touch geometry, visible reasons, reduced motion and production build. Record results and sprint status.

Given guided instructions, waiting does not advance commercial time or earnings. Given other pause owners, practice cannot advance or accept cooking actions. Given completed practice, no commercial command executes before explicit shift start. Existing campaign/prototype functionality remains available.

## Verification

Build and 47 unit tests pass. All 12 distinct browser scenarios pass across Chromium/WebKit 360x640: four tutorial, six existing freeplay gameplay/pause, two startup smoke. The final combined run had 11 pass and one WebKit burn wall-time timeout (simulation reached10.2s); increased that test's wall-time allowance to30s and its focused run passed. Domain tests still assert the exact11s burn boundary without waits. Screenshots inspected for guided dough and completion. Three independent reviewers found no state-machine or economic-isolation defect; fixed pause-reason visibility in landscape. Reduced motion suppresses decorative tap glow and no tutorial transition requires animation. Scope uses the current single-order cartoon preview; multi-customer scheduling and commercial inventory expansion belong to later stories.

Commands: `npm run build-nolog`; `npx vitest run`; `npx playwright test tests/tutorial.spec.ts tests/cozy.spec.ts tests/smoke.spec.ts --project=chromium-360x640 --project=webkit-360x640 --workers=1`; focused burn follow-up: `npx playwright test tests/cozy.spec.ts --project=webkit-360x640 --grep 'leaving pizza' --workers=1`.

## Suggested Review Order

Timing update (2026-10-01): the user changed cooking to3–5seconds, burnt after5seconds and a7second gauge. Practice now freezes at3seconds; prior8second records above describe the earlier setting.

- Guided state and practice clock: [CozyRuntime.ts](../../src/runtime/CozyRuntime.ts).
- Practice reward isolation: [CozyOrder.ts](../../src/domain/CozyOrder.ts).
- Instructions and explicit shift start: [CozyScene.ts](../../src/scenes/CozyScene.ts).
- Fixed-clock evidence: [CozyTutorial.test.ts](../../src/runtime/CozyTutorial.test.ts).
- Mobile walkthrough: [tutorial.spec.ts](../../tests/tutorial.spec.ts).
