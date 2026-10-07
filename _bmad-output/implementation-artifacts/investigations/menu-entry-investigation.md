# Menu entry latency — 2026-10-06

Status: Concluded. Confidence: High for local cold-entry asset bottleneck; relative avatar CPU contribution unmeasured.

User symptom: Start / Continue from menu feels slow. Read-only investigation; no runtime or UI changes.

## Confirmed evidence

- `src/main.ts:52`: entering play stops menu, removes the existing CozyScene and adds a new scene instance.
- `src/scenes/CozyScene.ts:138`: preload waits for market, all seven shop images, summary/detail images, pause and all portrait sheets before create.
- `src/scenes/StartupScene.ts:66`: startup already loads kitchen, icons, box and first portrait sheet. Remaining cold-entry downloads were measured separately.
- `src/scenes/CozyScene.ts:150` and `src/presentation/CustomerPortraits.ts:69`: create registers all 150 avatars using full-image canvas readback and pixel scans; registration skips existing frames.
- `src/runtime/CozyCampaignSession.ts:110`: same-session Continue reuses RAM runtime. New campaign waits for checkpoint commit before entering (`src/runtime/CozyCampaignSession.ts:90`).

## Browser measurements

Headless Chromium, 360×640, local Vite server, fresh browser context on each run, no network or CPU throttling. Timing from before mouse dispatch to completed scene creation (does not measure first rendered frame).

- Cold Start: 1,496 ms, 1,266 ms, 1,492 ms across three successful runs.
- Additional images requested after click: 18 PNGs, 30,818,881 bytes (29.39 MiB). Requests include seven shop panels never initially visible.
- Scene create: 383 ms / 401 ms in two instrumented runs, including avatar registration and first UI draw. Avatar time not isolated.
- Warm Continue after returning to menu: 153 ms total, 134 ms scene create. Same context and runtime; cached textures and registered frames retained.
- No page errors during successful cold runs.

Reproduction script: `measure-menu-entry.mjs`. Uses opt-in `?perf=1` diagnostics and wraps scene creation in the browser only. Returns to menu using its registered callback to test the same continuation path.

## Conclusion and direction

Cold entry synchronously waits on a large mandatory image set and then CPU work to prepare portraits/UI. Local evidence explains slower first Start and persisted Continue after page reload; warm Continue is substantially faster. Exact duration on the user's device/network has not been measured. No evidence of a fixed intentional delay.

Recommended implementation direction: retain approved artwork/layout, optimize delivered image assets, load nonvisible shop/detail pages on demand with explicit readiness handling, and generate avatar crop metadata ahead of runtime. Reusing a live scene for menu return may reduce warm reconstruction but requires careful pause/input/cleanup verification. Moving everything into startup alone shifts the wait rather than reducing it.
