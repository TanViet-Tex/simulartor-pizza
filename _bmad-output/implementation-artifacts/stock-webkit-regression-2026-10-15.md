# Stock WebKit and remaining regression repair — 2026-10-15

Baseline: `85f888b1700354d1352a6817594ef3c93812c4f3`. The user requested continuing both outstanding gaps, recording results and reporting back. No new game mechanic, save migration, external service change, push or deployment is included.

## Eleven unit failures

The six CozyCustomers and four CozyProgress failures shared a stale fixture wait: custom commercial arrivals occur every20seconds, while baking now uses4seconds. Waiting14more seconds reaches18, before the next arrival. Their helpers already read the configured oven timing; the post-service waits now use20minus perfectStart. The bargain pause check also reads that configured timing. All original money, sales, XP, mission, relationship, referral, clamp, pause and duplicate-command assertions remain intact.

CozyHelp expected the old day2budget22–28. The approved20% reduction makes that18–22 (rounded), while preserving the first commercial visit. Update only those bounds, retaining help exclusion, first customer, campaign seed and restore/forecast assertions. All37tests in the three files passed (`stock-regression-unit-focused-2026-10-15.json`).

## WebKit diagnosis and resource correction

The original focused reproduction failed during the Market screenshot. A diagnostic rerun recorded `Target.targetDestroyed` with `crashed:true`; this proves a renderer crash, not a game JavaScript assertion or a normal page close. Retained reports: `stock-regression-webkit-initial-2026-10-15.json`, `stock-regression-webkit-protocol-summary-2026-10-15.json`. The full protocol log and its5.8MBembedded JSON report remain local diagnostic artifacts; Git retains the exact crash event, result statistics and test error in the concise summary.

No invalid crop or missing list cleanup was found. One run with resource instrumentation passed, then all three unmodified baseline repeats passed (`stock-regression-webkit-resources-2026-10-15.json`, `stock-regression-webkit-baseline-repeat-2026-10-15.json`). Therefore neither a deterministic game failure nor insufficient RAM as its sole cause has been established. Adding a delay or dropping screenshots is not the repair.

There was a concrete avoidable upload cost: HubHeader allocated a720×1280 transparent shell although header/navigation drawing ends at logical y129. Its animation refreshed the entire texture every frame. It now uses720×258, with the same2×raster, artwork, position, logical scale, controls and animation. RGBA upload area falls from921600to185760pixels, a79.84%reduction (about2.81MiB less per full upload). This reduces resource pressure without forcing Canvas rendering, reducing graphics quality or changing gameplay. It does not prove the native crash's root cause.

The Stock browser flow retains every original purchase, low-threshold, detail, scrolling, shell, money and navigation assertion. It additionally checks expiry threshold1with an actual matching dough row and no permanent sauce row, inventory immutability and ten Market/Stock round trips with identical retained texture count/pixel area. All screenshots remain enabled. Browser execution is serial and separate from unit/build load.

## Final verification

### Follow-up after the initial header correction

Header resizing alone passed four Stock runs, but the expanded reviewed run passed7/8 and still experienced one native WebKit crash during repeated navigation (`stock-regression-browser-reviewed-2026-10-15.json`). It was not accepted as a complete fix. A temporary audio-isolation control passed4/4, but earlier real-audio runs also passed four times; this does not prove an audio defect. The override was removed, and all final runs use the real audio implementation. A diagnostic sample observed about952MiB private WebProcess memory and644MiB GPUProcess memory, without establishing native crash causality.

The remaining concrete resource issue was Phaser CanvasTexture construction: it reads a full blank raster with getImageData and performs an extra blank upload before the caller paints. Every uiCanvas caller uses only painting/context/refresh, so those raw-pixel buffers were unused. UiRaster now creates a pooled2Dcanvas and an ordinary canvas-backed Texture, owns it immediately through TextureManager, and refreshes its source after painting. This removes the unused full-size pixel copy and one redundant blank upload. It preserves2×raster, actual WebGL/Canvas selection, artwork, gameplay, audio and destruction/pool cleanup. Immediate registration was retained to own cleanup if painting fails; duplicate creation releases any unsuccessful allocation. Both normal and per-key texture-added events keep their original arguments and fire once after a complete __BASE frame exists.

The next eight-case browser run passed8/8 with real audio (`stock-regression-browser-paint-only-2026-10-15.json`). It checks Stock and the existing tab animation/icon/reduced-motion flow twice on each browser, including stable used-canvas/texture totals and zero large pixel readbacks over ten round trips. Final lifecycle-compatibility checks were then added: immediate ownership, complete-frame event arguments, two refreshes without repeated events, duplicate rejection with no extra used canvas and pool restoration after removal.

### Whole-project unit result

All760/760tests pass,0failed,0pending (`stock-regression-unit-all-2026-10-15.json`). The first full run after the renderer dependency change passed754but could not load six pure WorkbenchDrink selector cases in Node because Phaser requires window; its report is retained as `stock-regression-unit-all-initial-2026-10-15.json`. That test module now explicitly mocks its unused rendering dependency. All six selection assertions remain unchanged, and real rendering remains tested in the browser.

### Independent review

Four initial test findings were patched: use preparationDay for the expiry boundary, assert the actual shell budget/display size, compare complete lots as well as inventory aggregates, and wait for animation completion before the final screenshot. Additional lifecycle findings preserved texture events and cleanup ownership. Independent follow-up inspection found no remaining concrete defects. No review findings were deferred. Detailed triage is in `spec-stock-webkit-and-unit-regression.md`.

### Final acceptance evidence

| Check | Result | Evidence |
|---|---|---|
| Final Stock + tab animation, Chromium/WebKit360×640 |4/4passed, no skips/retries|stock-regression-browser-confirmed-2026-10-15.json|
| Additional final WebKit Stock stability runs |3/3passed,10Market/Stock round trips per run, real audio|stock-regression-webkit-stability-2026-10-15.json|
| Whole-project units |760/760passed,0failed/pending|stock-regression-unit-all-2026-10-15.json|
| Frontend TypeScript + production build |Passed|npm run build-nolog|
| API TypeScript |Passed|npx tsc -p tsconfig.api.json|
| Scoped whitespace check |Passed|git diff --check|

The browser reports overlap; do not sum them as unique scenario coverage. Both final engines retain exactly93textures,31used pooled canvases and54089596source pixels before/after the ten round trips. The navigation loop performs zero large getImageData readbacks. These are managed-resource measurements, not a claim that native process RSS is constant. The720×258shell source displays at360×129without changing approved art/geometry. Complete lot IDs/dates/costs/expiry, inventory aggregates and money remain unchanged through read-only operations; actual market purchasing still changes the real quantity and cash exactly once.

Final screenshots in `stock-webkit-evidence-2026-10-15/` were copied from the confirmed run, with Stock and tab images visually inspected. `retained-resources.json` preserves measured counts for both engines. No graphics-quality reduction, forced Canvas fallback, disabled animation, skipped screenshot or audio mock remains in the final Stock flow.

Epic3is now9/9technically accepted; story3.7andEpic3are marked done in sprint-status. This closes the earlier WebKit acceptance gap using current passing evidence. The original native crash trigger was not conclusively isolated, so the result does not certify universal crash freedom, physical phones, native memory limits or the full browser/viewport release matrix. Vite retains its existing>500kBchunk warning (game533.92kB, Phaser1376.36kB before gzip); no startup-download improvement is claimed. Epic1/4/9status is unchanged. The three unrelated dirty specifications and historical untracked artifacts remain excluded. No remote push or deployment was performed.
