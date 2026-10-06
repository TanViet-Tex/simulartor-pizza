# Chợ/Kho scroll performance — 2026-10-06

Baseline commit: `abea9791dc2d8de26cd05eb20dfe93a9b9ebe4b7`.

Method: Headless Chromium, 360×640, local Vite development server, fresh IndexedDB context via `?mode=shop&perf=1`. One drag per tab: 24 steps of 9 logical pixels, with 20ms requested waits between steps. Captured after feedback settles. `investigations/measure-hub-scroll.mjs` runs the same sequence before/after. Object creation uses the existing opt-in runtime diagnostics. Phaser smoothed frame delta is not a reliable raw latency/FPS measurement.

## Before

| Metric per drag | Chợ | Kho |
|---|---:|---:|
| Window texture key changes | 24 | 24 |
| New Graphics | 1,416 | 1,416 |
| New Text | 1,392 | 1,392 |
| New Image | 360 | 360 |
| New Zone | 880 | 868 |
| Offset at end | 216 | 216 |
| Input/scene listener count before → after | 73 → 73 | 74 → 74 |

Texture counts remain bounded, but each movement rebuilds the whole Cozy UI before drawing the hub. This is repeated allocation/rasterization, not a confirmed growing memory leak.

## After

Same sequence: offset 216 on both tabs. The static hub and list texture keys remain unchanged. No new Graphics, Text, Image or Zone were recorded during either drag. Listener count stayed 75 → 75 on both tabs. No page errors in this successful measurement.

| Metric per drag | Chợ | Kho |
|---|---:|---:|
| Window/list texture key changes | 0 | 0 |
| New Graphics/Text/Image/Zone | 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 |
| Live objects before → after | 92 → 92 | 34 → 34 |
| Texture count before → after | 94 → 94 | 94 → 94 |

The implementation retains row zones, so idle object counts are higher than baseline. The additional raster list holds all 19 rows (~360×1007 pixels), with a retained thumb texture; the track stays in the static hub image. The tradeoff is bounded additional memory versus eliminating per-movement full scene rebuilding. Actual physical-phone FPS/input latency is not measured; smoothed Phaser delta does not support an FPS claim.

## Verification

- Build/typecheck and 4 controller unit tests passed.
- 9 focused Chromium360×640 E2E cases passed across runs: filter/scroll/cancellation, numeric quantity, stock filters/detail/drag/planner, large quantity, retained identity/gesture/modal/cleanup, unaffordable/save guard, shared header, purchase→stock→use→next-day, terminal market.
- Two longer tests initially exceeded30s while checks ran concurrently; rerun with90s passed (43.2s /1.4m). No runtime assertion was weakened.
- Three independent reviews completed. Edge review found modal quantity Apply/Cancel falsely classified as row controls; matching now requires a valid ingredient ID, with regression tapping both canvas buttons. Edge recheck resolved it.
- Start/end/intermediate images in `scroll-verification/` visually inspected for clipping/header/footer. No approved baseline overwritten.
