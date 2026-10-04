---
title: 'Align the menu curtain with the angled window beam'
type: fix
created: '2026-10-02'
status: done
route: one-shot
baseline_commit: NO_VCS
---

# Align the menu curtain with the angled window beam

## Intent

**Problem:** The curtain's hanging edge and rod were horizontal despite the angled perspective of the illustrated window beam.

**Approach:** Align the curtain directly with the existing painted window beam using its measured downward-to-the-right slope. Remove the separately drawn rod that duplicated the beam. Shear regenerated WebGL cloth vertices so the body hangs down and its top remains anchored during flutter. Use narrow texture columns with the same sloped anchors for Canvas rendering. Reuse the existing curtain image and preserve reduced-motion behavior.

The final anchor is measured against the painted crossbar: center (16, 144), slope 23/60 (approximately 0.383). A 28 x 92 curtain stays within the window while retaining a fluttering hem. Correcting both hanging position and slope, without drawing a second rod, removes the earlier floating gap and doubled hanging edge. A fresh browser inspection on the user's confirmed URL `http://127.0.0.1:8082/` verified the final alignment; an enlarged window screenshot was also inspected.

Production build and the existing targeted ambience test passed in Chromium 390x844, covering rendered motion, reduced-motion freeze and menu reentry. Inspected the screenshot for curtain/window alignment. One-file independent review found no actionable regressions; no patches or deferrals remained. The local Phaser implementation confirms that vertex regeneration clears dirty before the shear, so rendering retains the correction. No full browser matrix, new dependencies or VCS commit.

## Suggested Review Order

- Follow the measured painted-beam slope directly with the cloth anchors.
  [MenuAmbience.ts:5](../../src/presentation/MenuAmbience.ts#L5)

- Keep the cloth hanging vertically while its upper edge follows the window perspective.
  [MenuAmbience.ts:99](../../src/presentation/MenuAmbience.ts#L99)
