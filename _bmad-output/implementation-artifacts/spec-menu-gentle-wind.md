---
title: 'Menu: soft pizza steam, smaller buttons and gentle wind'
type: feature
created: '2026-10-02'
status: done
completed: '2026-10-03'
baseline_commit: NO_VCS
context: []
---

<frozen-after-approval reason="User explicitly requested implementation in conversation">

## Intent

The menu steam looks artificial and its oversized buttons obscure the pizza. The user requests softer steam, slightly smaller buttons, animation for every plant and a sign gently swaying in the same breeze.

## Boundaries & Constraints

**Always:** Preserve the current background artwork, palette, pizza, oven, curtain and menu actions. Limit changes to the four requested menu details. Retain 48 CSS px touch targets, readable Vietnamese labels, reduced-motion support, hidden-tab suspension and scene cleanup. Motion is decorative and never changes gameplay.

**Ask First:** Any broader redesign or changes to other screens.

**Never:** Regenerate the full background, change gameplay, add dependencies or run the full browser matrix for this menu change.

## I/O & Edge-Case Matrix

| Scenario | State | Expected behavior |
| --- | --- | --- |
| Visible menu | Motion enabled | Soft steam rises and dissipates; all plant regions move gently with differing phases; sign and title move together. |
| Reduced motion | OS or setting enabled | Steam disappears and decorative objects remain in their neutral pose. |
| Hidden tab | Visibility hidden | Decorative animation stops without catch-up when shown. |
| Reentry | Game to menu | Motion resumes with no duplicated listeners or effects. |
| Short portrait | Smaller canvas scale | Buttons remain separate and touch targets measure at least 48 CSS px. |

</frozen-after-approval>

## Code Map

- `src/scenes/MainMenuScene.ts`: menu composition, current line-based steam, controls and lifecycle.
- `src/presentation/MenuAmbience.ts`: fire, breeze and curtain animation.
- `public/assets/main-menu-background.png`: approved illustration with plants and sign baked into it.
- `tests/menu.spec.ts`: menu input, lifecycle, short viewport and settings coverage.
- `tests/menu-ambience.spec.ts`: pixel-level motion and reduced-motion coverage.
- `_bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md`: current visual constraints.

## Tasks & Acceptance

- [x] Replace steam strokes with soft translucent vapor; use existing Phaser facilities and avoid new dependencies.
- [x] Animate baked plant/sign regions without double images or visible seams; title follows sign. Preserve the original texture and neutral composition.
- [x] Reduce button width from 244 to approximately 208 logic px; retain center alignment and bottom placement. Reduce visual height slightly while maintaining separate 48 CSS px touch areas at short viewport scales.
- [x] Extend focused menu E2E pixel checks to plant/sign movement, neutral freeze and reentry; verify hit geometry and labels.
- [x] Record the user-authorized menu change in related UI documentation without replacing approved screenshots before visual approval.

Acceptance criteria:
- Given a motion-enabled menu, when frames advance, then steam, all plant groups and the sign visibly move subtly while pizza and unaffected areas retain their illustration.
- Given reduced motion or a hidden tab, when time passes, then motion stops; reduced motion uses the neutral pose.
- Given a scaled portrait viewport, when the user taps any menu control, then its existing action works and targets remain separate and at least 48 CSS px.
- Given menu reentry, when animation runs, then the same effects work without runtime errors or duplicated effects.

## Design Notes

Plants and sign belong to a single painted image. Localized mesh deformation can preserve the artwork rather than extracting props and repainting the background. Inspect the installed Phaser 4 API before selecting a renderer. Keep displacement small and localized, and handle Canvas fallback. A procedural soft texture for particle vapor avoids introducing raster generation or new loading dependencies.

## Verification

- `npm.cmd run build-nolog`: typecheck and static build pass.
- `npx.cmd playwright test tests/menu.spec.ts tests/menu-ambience.spec.ts --project=chromium-390x844`: focused menu suite passes.
- Inspect captured menu screenshot for natural motion placement and smaller buttons.

## Spec Change Log

- 2026-10-03: Review identified perimeter coverage and Canvas triangle seams; fixed falloff at the image boundary and affine triangle drawing with continuous texture sampling. Added a fresh reduced-motion reference comparison to verify the neutral pose.
- 2026-10-03: Visual inspection found clipped rotating title glyphs despite passing text metadata checks. Kept original Phaser text styling, copied the complete lettering into one reusable code-generated texture, and rotate that image with the sign. Added a rendered ink-count regression that failed before the fix and passed afterward.

## Completion Evidence

- Final `npm.cmd run build-nolog` passed, including typecheck for the new Canvas test.
- Six focused menu tests passed on Chromium 390×844, covering motion in all 12 shop plant regions, sign/vapor/fire/curtain movement, unchanged pizza, rendered title completeness, hidden freeze, reduced neutral pose, reentry, navigation and short-portrait 48 CSS px targets.
- One additional focused Canvas fallback test passed after the final seam patch. Inspected its screenshot: no visible grid; complete title and existing composition retained.
- Inspected the WebGL [menu preview](menu-wind-preview-2026-10-03.png). This is a review artifact, not a replacement for approved baseline screenshots. User visual approval remains pending.
- Independent blind, edge-case and acceptance reviews completed; concrete findings were patched. No new dependencies, raster asset edits or gameplay changes. Full browser matrix was not run, following the user's test cadence.
- Local dev server restarted in a hidden background process at `http://127.0.0.1:8081/`; HTTP 200 verified. No VCS repository is available for a commit.

## Suggested Review Order

- Inspect the scoped composition and preserved title lettering.
  [MainMenuScene.ts:95](../../src/scenes/MainMenuScene.ts#L95)
- Inspect localized plant/sign deformation and renderer fallback.
  [MenuWind.ts:5](../../src/presentation/MenuWind.ts#L5)
- Inspect soft reusable vapor sprites.
  [MenuSteam.ts:4](../../src/presentation/MenuSteam.ts#L4)
- Check rendered movement, neutral pose, title completeness and Canvas behavior.
  [menu-ambience.spec.ts:28](../../tests/menu-ambience.spec.ts#L28)
