---
title: Resolve the Stock WebKit verification failure and eleven remaining regression failures
type: bugfix
created: 2026-10-15
status: done
route: oneshot
review_loop_iteration: 0
baseline_commit: 85f888b1700354d1352a6817594ef3c93812c4f3
---

<frozen-after-approval reason="user explicitly requests fixing both remaining acceptance gaps and recording results">

## Intent

Given the current approved game rules, when the regression suite and real WebKit Stock flow run, then every test must exercise the correct timing and economics, and Stock purchase/filter/threshold/detail/scroll/navigation must complete with unchanged money for read-only actions and the approved layout intact. Investigate the actual page closure rather than calling it low RAM without evidence. Correct stale fixtures without removing substantive assertions; repair a demonstrated small runtime/rendering defect if necessary. Preserve current gameplay, save compatibility, approved artwork, geometry and browser coverage. No dependency upgrades, data deletion, remote push or deployment. Record initial failures, root causes, corrected runs, screenshots and honest remaining limitations in a report; update Epic3 only after its outstanding criterion has evidence.

</frozen-after-approval>

## Implementation Notes

The three existing unrelated dirty specifications and untracked historical artifacts are excluded, as authorized during the continuing task. This is the requested continuation with both gaps retained. No missing product choice or irreversible action is planned; bounded test/render investigation adds no public API. The current 11-unit failure map is known: CozyCustomers six and CozyProgress four use a20second custom schedule but retain14second waits after current4second cooking; CozyHelp retains the unthinned22–28 day2budget instead of18–22. Preserve economic, XP, relationship, referral, pause, first-visit, seed and reload assertions. Use fixture-defined arrival times/configured oven timing rather than weakening checks.

Stock map: tests/reference-shop-screens.spec.ts contains the actual purchase/filter/detail/threshold/scroll/shell case, its fundedShopCheckpoint fixture and native list helper. playwright.config.ts selects real mobile WebKit. Initial reproduction with browser logging closed during the second canvas screenshot after Market navigation; browser exited gracefully during cleanup. A page/resource/render cause is not yet established. Inspect CozyScene and only related Stock/Market presentation if needed; preserve graphics quality and screenshots. Run one browser worker and avoid concurrent unit/build loads. The previous full report is epic3678-unit-all-2026-10-15.json. Final unit scope is all760tests plus focused Stock Chromium/WebKit and production/API type checks. Use a context-free blind review before the local conventional commit.

Investigation: protocol explicitly reports Target.targetDestroyed with crashed:true, confirming a renderer crash. No concrete bad crop or missing disposal found. An instrumented run and three subsequent unmodified baseline repetitions passed; the root trigger remains unproven. Avoid claiming a timing delay fixed it. HubHeader's transparent shell was720x1280 although its drawing ends at navigation.y+height=129logical pixels; animation refreshed this full canvas each frame. Bound only that canvas/image to the same visible shell height (2x retained), leaving geometry/art/input unchanged. This reduces shell upload area by79.8%; it is a resource-pressure reduction, not proof of the native crash cause. Strengthen the existing Stock test with non-vacuous expiry filtering, full inventory read-only checks and ten Market/Stock round trips asserting stable retained texture count/pixels, then preserve a final screenshot. The three unit files now pass37/37 after only timing/traffic expectation corrections.

## Review Triage Log

- Low / patch: expiry boundary used runtime.day although Stock uses preparationDay between shifts. Read the actual preparationDay and assert the inclusive nonexpired one-day window.
- Low / patch: stable retained resources alone would not catch reverting the shell upload budget. Assert the720x258source and360x129display bounds in the real browser and retain measured resources as an attachment.
- Low / patch: aggregate inventory could hide lot ID/date/expiry/cost mutation. Compare detached runtime.stockLots before and after the read-only flow in addition to aggregate stock.
- Low / patch: two RAFs can leave the150msselection transition unfinished in the final evidence image. Poll the actual animation state until false before capture; do not disable animation or replace it with a delay.

Further investigation: four optimized Stock runs passed, but the expanded reviewed eight-case run had seven passes and one WebKit native crash during repeated navigation; header resizing alone is insufficient evidence of a complete fix. An audio-isolated diagnostic passed four times, but earlier real-audio runs also passed four times, so this does not isolate the root cause. The temporary audio override was removed. Observed native process footprint was roughly952MiB WebProcess plus644MiB GPUProcess even with audio isolated; low RAM is still not a proven sole cause.

Phaser CanvasTexture's constructor eagerly calls update(): getImageData for a full blank raster and another blank GPU upload, while every uiCanvas caller only uses context/refresh for painting. UiRaster now keeps the same paint contract, creates a pooled2Dcanvas at2x, registers an ordinary canvas-backed Texture only after first painting, and uses source.update thereafter. TextureSource.destroy returns the canvas to Phaser's pool. No raw-pixel editor API is used by these callers. This avoids unused full-size CPU pixel buffers and blank uploads; extend browser resource checks to pool usage and zero large pixel readbacks during ten round trips. All real audio, screenshots and native inputs remain enabled. The global helper requires the existing tab icon/motion/reduced-motion checks, build and full unit regression, with a fresh independent review.

- Low / patch (additional review): preserve TextureManager ADD and per-key ADD events, each once with its original argument shape after __BASE exists; refreshes only update pixels.
- Low / patch (additional review): retain a cleanup owner before painting. Revised the initial lazy registration to immediate ordinary-Texture registration, with pool release and a clear error on duplicate-key failure. TextureManager now owns cleanup even if a caller subsequently throws while painting. Browser probe checks immediate ownership, both complete-frame event arguments, two refreshes without repeated events, duplicate-key rejection without extra used canvas and pool restoration after removal. One initial blank upload remains; the unused ImageData copy and extra constructor upload are eliminated.

The paint-only eight-case browser run passed8/8 with real audio before those final compatibility refinements. The first full unit run passed754tests but could not load six WorkbenchDrink selector tests because its imported render helper now loads browser-only Phaser in Node. Preserve that report as stock-regression-unit-all-initial-2026-10-15.json. The selector tests now explicitly mock their unused Phaser rendering dependency; all six selection assertions remain unchanged. Actual renderer behavior remains under the real-browser tests.

## Completion

Final source passes760/760units, frontend production build and API TypeScript check. The final four-case native Chromium/WebKit Stock and tab-motion run passes4/4, including the new lifecycle probe, followed by3/3extra WebKit Stock runs with10roundtrips each. Real audio and all screenshots remain enabled. Retained resources are93textures,31used pooled canvases and54089596source pixels both before/after navigation on both engines; shell720x258maps to360x129. Complete lots, inventory, cash, icon pixels, hit geometry, animation and reduced motion remain correct. Representative final screenshots inspected. All six review findings patched; independent follow-up found no remaining concrete defects and nothing deferred. Epic3story3.7andEpic3are technically accepted; original native crash causality remains unproven, and no universal/physical-device/full-matrix certification is claimed. Full evidence: stock-webkit-regression-2026-10-15.md. Unrelated dirty files excluded; local commit only.
