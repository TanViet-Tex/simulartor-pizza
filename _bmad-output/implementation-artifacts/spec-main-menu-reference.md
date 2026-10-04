---
title: 'Main game entry menu from the user illustration reference'
type: feature
created: '2026-10-01'
status: done
baseline_commit: NO_VCS
context: ['_bmad-output/project-context.md']
---

> Current visual contract (user-confirmed 2026-10-02): [approved UI baseline](ui-baseline-2026-10-02.md). Preserve the implemented illustrated menu and the later fire/breeze/curtain/pizza/steam/countertop corrections. This spec records the initial menu work; future stories do not authorize replacing its artwork or composition.

<frozen-after-approval reason="human-owned intent">

## Intent
The main game currently starts directly in its tutorial. Use the user-supplied portrait illustration as the visual direction for a welcoming entry screen before the existing main-game loop. The completed campaign demo remains a development route rather than the main entry experience.

The menu uses a warm illustrated pizza shop: terracotta-and-cream awning, daylight from the left window, leafy plants, a glowing brick oven, a wooden counter and a large fresh pizza. A hanging cream sign occupies the upper portion. Three rounded, vertically stacked controls occupy the lower portion: Bắt đầu, Tiếp tục, Cài đặt. Keep the existing display wording Tiệm Pizza Ấm Áp without treating this as a new release-name decision.

The user also wants animation on the main menu. Layer subtle code-rendered pizza steam and a softly fluctuating oven glow over the static illustration. Add a short button entrance and press response while keeping controls immediately usable. Do not animate the entire background or constantly move the controls.

## Boundaries & Constraints
Always: retain the existing gameplay/runtime, guided tutorial, 360x640 logical canvas, portrait scaling and 48px minimum CSS touch targets. Render Vietnamese text, icons and buttons in Phaser over the illustration; do not bake interactive text into the background. The reference supplies style and composition, not gameplay rules.

Continue resumes a real in-memory main-game session after returning to the menu. At first launch or after reload without such a session, it is visibly disabled. This change does not introduce a new save/checkpoint system or redirect Continue into the old campaign demo.

Settings provides a real reduced-motion preference used by the main-game presentation. Do not present an audio toggle until the main-game audio system exists. Leaving the menu restores only the menu's own pause reason; visibility/orientation pauses retain their ownership.

Ask First: adding reload persistence, changing the release name, or expanding this menu task into Story 1.7/audio/day progression.

Never: rewrite the gameplay scene, alter money/inventory/ticket rules, install dependencies, silently erase an active session, or run the full browser/viewport test matrix for this menu change.

## I/O & Edge-Case Matrix
| Scenario | State/input | Expected behavior |
|---|---|---|
| Initial entry | Open default URL | Show illustrated menu; Continue is disabled without a session |
| Start | Tap Bắt đầu | Enter the existing guided main-game flow |
| Start with active session | Tap Bắt đầu again | Confirm before replacing the current in-memory session |
| Continue | Return to menu, then Tiếp tục | Preserve runtime state and clock; release only menu pause |
| Settings | Toggle reduced motion | Menu steam, fluctuating glow and entrance/press motion stop immediately; controls remain usable and main-game interaction effects honor the preference |
| Menu lifecycle | Leave menu or hide browser | Stop menu animation work; recreate it without duplicate effects when returning |
| Direct development route | mode=shop/freeplay/campaign | Retain direct access for focused verification |
| Required background failure | Failed illustration load | Show retry/error rather than a broken menu |

</frozen-after-approval>

## Code Map
- `src/main.ts`: composition root and URL-mode routing.
- `src/scenes/StartupScene.ts`: config/asset boot gate.
- `src/scenes/MainMenuScene.ts` (new): illustrated menu, settings and start/continue controls.
- `src/scenes/CozyScene.ts`: existing play presentation; add a return-to-menu action in its pause overlay.
- `src/runtime/CozyRuntime.ts`: add an owned menu pause reason; retain all domain behaviors.
- `src/presentation/MenuPreferences.ts` (new): presentation preference shared by menu and play scene.
- `public/assets/main-menu-background.png` (new): generated, workspace-local illustration.
- `tests/menu.spec.ts` (new): focused menu navigation tests.

## Tasks & Acceptance
- [x] Generate and inspect a background based on the reference, with blank sign/button space, then save the final asset inside the project.
- [x] Add a Phaser menu with independently rendered Vietnamese heading/buttons, clear focus/disabled states and smooth outlines.
- [x] Add subtle steam, oven glow and button entrance/press animation with lifecycle cleanup and reduced-motion support.
- [x] Route the default URL through the menu, keeping direct development modes available.
- [x] Connect start, session continuation, new-session confirmation and return-to-menu without losing or secretly advancing gameplay state.
- [x] Connect a working reduced-motion setting to presentation effects.
- [x] Verify TypeScript/build and focused menu tests at one portrait Chromium configuration.

Acceptance: Given a fresh launch, opening the game shows the reference-inspired menu before the tutorial. Given an active session, returning to the menu and continuing preserves ingredients, ticket selection, cash and oven time. Given no session, Continue cannot imply unavailable saved progress. Given a portrait phone, all three controls remain readable and touchable without overflow.

## Design Notes
Use the supplied image as the style/composition reference. Upper sign: cream panel, green/red/brown title hierarchy. Center: appetizing pizza on a wooden board with light steam. Lower third: sage-green primary button, cream/terracotta secondary button and peach settings button. Preserve airy daylight, soft shadows and small plant details; avoid flat placeholder art or stretching the pizza.

Keep steam separate from the background so it can rise and fade naturally in Phaser. Anchor the glow to the illustrated oven opening. Use gentle motion that does not obscure the title or compete with menu controls. With reduced motion enabled, retain a static warm glow and standard nonmoving button feedback.

Background prompt for the built-in imagegen tool: "Portrait 9:16 hand-painted cozy pizza-shop illustration matching the supplied reference's warm daylight, cream plaster, terracotta awning, green vines, glowing brick oven and large fresh pizza on a wooden counter. Leave a blank cream hanging sign in the upper quarter for separately rendered Vietnamese title text. Leave clean uncluttered space in the lower third for three code-rendered menu buttons. Keep the pizza free of painted steam; steam will be animated separately. No lettering, no buttons, no UI, no watermark. Soft rounded cartoon forms, smooth outlines, painterly shading and the reference's cream, terracotta, sage and wood palette."

## Verification
- Production build and TypeScript check.
- Focused menu navigation/pause tests, using simulated runtime time where possible.
- Playwright menu tests only, one Chromium portrait viewport; inspect entry/settings screenshots, 48px touch geometry, reduced-motion behavior and animation cleanup when leaving/returning.
- Full Chromium/WebKit viewport matrix deferred until Epic 1 completion or release.

## Spec Change Log
- 2026-10-02: User authorized softer pizza vapor, slightly smaller menu buttons, gentle movement for every plant and wind-driven sign sway. The limited update is tracked in `spec-menu-gentle-wind.md`; existing artwork and all other screens remain governed by the approved UI baseline. New visual approval is pending.
- 2026-10-01: Recorded the user's image reference and a scoped menu plan. Implementation has not started; the reference alone does not settle new save/audio requirements.
- 2026-10-01: Added the user's requested main-menu animation to the draft: separate steam, fluctuating oven glow, button entrance/press feedback and reduced-motion/lifecycle behavior. Implementation remains pending plan approval.
- 2026-10-01: User authorized implementation. Added the generated background, animated Phaser entry menu, shared motion preference and RAM-session continuation. Existing gameplay rules and direct development routes remain intact.
- 2026-10-01: Reviewed with blind, edge-case and acceptance roles. Applied two patch findings: responsive button heights/visible-target priority prevent short-screen touch overlap, and focus-owned keyboard handling allows Tab to leave the canvas. No unresolved intent/spec findings. Available BMAD adversarial/edge-case lens files substituted for the absent legacy reviewer skill names.
- 2026-10-01: User requested a visual correction: animate actual fire tongues, add incoming window breeze and a fluttering curtain, and reduce the foreground pizza. Implemented as isolated menu presentation polish; details and focused validation are in `spec-menu-fire-breeze-and-pizza-size.md`. The initial approved snapshot above is retained as history.

## Completion Evidence

- `npm run build-nolog`: TypeScript and production build passed after final UI fixes.
- Focused Vitest: 9 tests passed across MainMenuSession, MenuPreferences and CozyTutorial.
- Final focused Playwright run: 6 passed, 1 intentionally skipped in Chromium 390x844 (four menu cases plus cold boot and safe area). Includes a dedicated short portrait regression within the same Chromium project.
- Existing tutorial tests (2) and smoke test (1) also passed in Chromium 390x844 after route adaptation. Full browser/viewport matrix remains deferred.
- Inspected menu and settings screenshots: title fits the blank hanging sign, all three controls are visible, Vietnamese text is readable, no clipping. Local cold boot measured approximately 1.17 seconds and 3.47 MB decoded transfer; this is local production evidence rather than a network/device benchmark.
- Required background failure/retry, OS motion preference, explicit motion setting, menu reentry, RAM continuation, replacement consent and nested visibility pause were exercised.
- Asset saved in the workspace at `public/assets/main-menu-background.png`; generation prompt and provenance are in the adjacent Markdown file. No new dependencies or persistence system.
- Local development server available at `http://127.0.0.1:8082/`; HTTP 200 verified. No VCS baseline/commit available.

## Suggested Review Order

- Route the default entry through the menu; keep development routes explicit.
  [main.ts:16](../../src/main.ts#L16)

- Own RAM continuation and release only the menu pause.
  [MainMenuSession.ts:4](../../src/runtime/MainMenuSession.ts#L4)

- Return through the pause screen without changing gameplay rules.
  [CozyScene.ts:336](../../src/scenes/CozyScene.ts#L336)

- Layer text, controls and animation over the supplied-reference illustration.
  [MainMenuScene.ts:30](../../src/scenes/MainMenuScene.ts#L30)

- Let keyboard focus leave the menu naturally.
  [MainMenuScene.ts:179](../../src/scenes/MainMenuScene.ts#L179)

- Share reduced-motion state between menu and play presentation.
  [MenuPreferences.ts:10](../../src/presentation/MenuPreferences.ts#L10)

- Gate entry on the required background and retain retry behavior.
  [StartupScene.ts:54](../../src/scenes/StartupScene.ts#L54)

- Verify navigation, settings, continuation, retry and short-screen input.
  [menu.spec.ts:12](../../tests/menu.spec.ts#L12)
