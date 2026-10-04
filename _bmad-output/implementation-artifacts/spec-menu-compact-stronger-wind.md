---
title: 'Menu: closer buttons, aligned continue icon and stronger wind'
type: feature
created: '2026-10-03'
status: done
baseline_commit: NO_VCS
context: ['_bmad-output/project-context.md', '_bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md']
---

<frozen-after-approval reason="User explicitly requested these scoped visual changes with a screenshot">

## Intent

Bring the three menu buttons closer together, replace the crooked Continue icon, and make plants/sign sway more visibly. Preserve the existing illustration, smaller button width, colors, lettering, steam/fire/curtain, gameplay and menu actions.

## Boundaries & Constraints

Always: Limit edits to main-menu spacing, Continue icon and plant/sign motion. Keep 208px visual button width and lower-menu placement, with a compact roughly6px visual gap. At short portrait scales, fit visual height to the minimum touch space so the buttons look close while all targets remain separate and at least48 CSS px. Keep icon vertically centered even when Continue has a subtitle. Use a simple balanced forward/resume symbol.

Always: Increase existing localized deformation, approximately3× plant displacement and2.5× sign angle, with relaxed wind timing. Sign text follows its board. All12 plant regions remain animated, painted image remains continuous, unaffected pizza/art stays still. Preserve WebGL/Canvas fallback, neutral reduced-motion pose, hidden-tab suspension and scene cleanup. Inspect the result in actual rendering; do not overwrite approved baseline screenshots.

Never: Broader UI redesign, regenerated raster art, changed persistence/gameplay, new dependencies or full browser matrix for this scoped change.

## I/O & Edge-Case Matrix

| Scenario | Expected |
| --- | --- |
| Normal portrait menu | Three close buttons; new Continue icon is balanced with/without subtitle. |
| Short portrait menu | Compact visible gaps, separate48 CSS px touch targets, all controls inside canvas. |
| Wind enabled | Stronger plants and sign motion; lettering stays with sign; no seams/clipping. |
| Reduced motion / hidden | Neutral pose / frozen animation; no catch-up. |
| Reentry / resize / existing save | Correct buttons/actions and motion lifecycle; progress unchanged. |

</frozen-after-approval>

## Code Map

- src/scenes/MainMenuScene.ts: adaptive button spacing and procedural Continue icon.
- src/presentation/MenuWind.ts: localized plant deformation and sign/title rotation.
- tests/menu.spec.ts: menu geometry, settings, actions and short portrait coverage.
- tests/menu-ambience.spec.ts: real rendered motion/freeze/neutral/reentry/Canvas fallback.

## Tasks & Acceptance

- [x] Update MainMenuScene layout/icon within the approved menu and retain accessible touch regions.
- [x] Increase MenuWind movement while preserving localized bounds, title alignment and lifecycle.
- [x] Run focused menu browser checks and build; inspect new WebGL/Canvas screenshots.
- [x] Record requested adjustment and review evidence without replacing approved baseline art.

Acceptance:
- Given a normal or short portrait, when the menu renders, then its three buttons appear close and each action has its own48 CSS px target.
- Given Continue with/without saved progress, when shown, then its new icon remains vertically centered.
- Given enabled motion, when frames advance, then every plant and the sign move more visibly; title follows and pizza remains unchanged.
- Given reduced motion or hidden state, when time advances, then decorative motion stops as before.

## Design Notes

The previous layout combined oversized touch slots with an extra8px gap. Keep a small visible gap by adapting visual height only when short viewports need larger logical touch regions. The baked artwork uses a continuous mesh; increase bounded displacements rather than duplicating painted objects.

## Verification

Build/typecheck and focused Chromium390×844 menu/ambience tests, including existing short-portrait and Canvas cases. Separate review captures; no full matrix.

## Spec Change Log

- 2026-10-03: User authorized compact spacing, replacement icon and stronger plants/sign motion. Existing small width and menu artwork retained.
- 2026-10-03: Short-portrait testing exposed floating-point contact between adjacent touch regions; added0.2 CSS px spacing margin. Kept6px visual gaps and original width.
- 2026-10-03: Independent blind/edge review identified shared screenshot paths; tests now use per-project output, selected evidence is copied after the run. Acceptance review requested peak-motion inspection; added longer WebGL/Canvas samples and rendered lettering checks. Existing vapor occasionally enters the old pizza fingerprint area, so sample the static lower crust instead, without changing steam/artwork.

## Completion Evidence

- Production build and final typecheck passed.
- Seven distinct focused Chromium390×844 menu/ambience scenarios passed across final runs, including the320×400 short-portrait check, menu reentry, saved Continue, settings, hidden/reduced motion, title ink, all12 plants and Canvas fallback. No full viewport/browser matrix.
- Independent blind, edge and acceptance review completed; actionable evidence findings were resolved. No production blocker remained.
- Visually inspected [menu](menu-compact-wind-evidence/menu.png), [saved Continue](menu-compact-wind-evidence/menu-continue.png), [peak wind](menu-compact-wind-evidence/wind-peak.png), [Canvas](menu-compact-wind-evidence/canvas-wind-peak.png) and short portrait. Artwork continuity, lettering and compact spacing retained.
- New screenshots are review evidence, not approved baseline replacements. User visual approval remains pending. Scoped request recorded in UI baseline/project context/UX design.
- Dev server at http://localhost:8081/ returns200. No VCS repository available for a commit.

## Suggested Review Order

- Khoảng cách gọn và vùng chạm tách biệt ở màn thấp.
  [MainMenuScene.ts:127](../../src/scenes/MainMenuScene.ts#L127)

- Icon Tiếp tục cân giữa độc lập với dòng trạng thái.
  [MainMenuScene.ts:175](../../src/scenes/MainMenuScene.ts#L175)

- Biên độ cây và bảng tăng; chữ giữ cùng chuyển động.
  [MenuWind.ts:79](../../src/presentation/MenuWind.ts#L79)

- Kiểm tra chữ và ảnh gần biên độ lớn nhất.
  [menu-ambience.spec.ts:40](../../tests/menu-ambience.spec.ts#L40)

