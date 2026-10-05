# Mobile rendering performance — 2026-10-05

## Confirmed causes and fix

- `CozyScene.update()` included changing oven/customer/courier/express seconds in its structural signature. Each second called `draw()`, destroyed the entire UI layer and recreated Text/Image/Graphics. Destroy was present: this was allocation churn, not an ever-growing object leak. Text rasterization/upload and `StaticGraphics.bake()` full 360×640 alpha scans on cache misses amplified transition stalls.
- Retained countdown labels, heat and customer/express rings now update independently of structural redraws. Unchanged text/graphics are skipped. Extraction readiness still triggers its required structural update.
- Twenty static quantity/selection decorations were marked dynamic and submitted as Graphics every frame. They now use the existing bounded static texture cache. Masked oven pizza and changing rings/heat remain dynamic.
- Hit regions were already retained, but listeners were removed/re-added and `setInteractive()` reapplied per redraw. Their handlers are now installed once and resolve current bounds/actions. Audio unlocking no longer causes an extra full redraw unless status changes.
- Tap rectangles lived outside the UI layer and could remain above a new panel until their fade finished. They now have explicit object/tween/timer ownership, completion/stop cleanup, and removal on phase/pause transition/shutdown. This was bounded stale feedback, not a confirmed infinite tween leak.
- `daySummary` is a structured-clone getter; polling it each frame copied report data unnecessarily. Payroll warning lookup now happens once per summary day.
- High-frequency debug state publishing is limited to the existing 100ms label cadence. Opt-in `?perf=1` adds counters only; normal play has no probe listener or diagnostics overlay.

No runtime/domain/config/save or UI geometry/art changes. Fixed50ms simulation is unchanged; rendering remains Phaser/browser frame based.

## Measured production counts

Chromium360×640, desktop CPU throttled4×. Same active customer and baking scenario, 4.5-second observation before any structural transition. Raw captures are `mobile-performance-before.json` and `mobile-performance-after.json`.

| Metric | Before | After |
|---|---:|---:|
| New Text |305|0|
| New Graphics |310|0|
| New Image |275|0|
| Live objects, start → end |177 →177|178 →178|
| Live Graphics |22|3|
| Active tweens / scene timers after feedback settles |0 /0|0 /0|
| Counted scene/input/scale/keyboard listeners |69 →69|69 →69|
| Texture count |174|194|
| Texture pixels |42,990,523|42,996,551|
| Canvas size |360×640|360×640|

The extra live object is a separately retained patience ring; twenty cached tiny textures replace per-frame vector decorations. No steadily increasing object/tween/timer/listener count was observed. Three Menu/Continue scene transitions and repeated Pause cycles also retain bounded counts; reduced-motion delayed feedback settles to zero timers/tweens.

Frame counts were105/129 over approximately4.5seconds under4×CPU. This is desktop emulation evidence, **not** a claim of60FPS on a physical phone. Probe `meanFrameMs`/`p95FrameMs` use Phaser's smoothed delta; they are not raw frame-latency percentiles and should not be treated as a reliable FPS comparison.

## Other requested audit items

- No duplicate runtime subscriptions/browser/media/keyboard/scale listeners or orphan scene timers/tweens confirmed. Existing shutdown cleanup releases leases/subscriptions, browser lifecycle and static textures; production restart counts remain stable.
- Hidden browser rendering is browser-throttled. Existing wall-time reconciliation and explicit pause leases are untouched; no hidden-object/update policy redesign.
- No50ms visual FPS cap:50ms is the deterministic simulation step. Rendering is still requestAnimationFrame/Phaser driven.
- No DPR multiplier currently inflates the logical canvas. Assets are sizeable (~43MP source textures, theoretical164MiB RGBA before driver/browser overhead); portrait alpha registration is memoized once. This is a memory risk, not evidence of a growing leak. Assets were preserved; no speculative resizing/compression or library installation.
- MainMenu's dense wind weights and Canvas fallback are potential costs. No measured gameplay leak arose there, so no unrelated motion/asset refactor was included.

## Verification and review

- Production build including typecheck passed.
-39 current lifecycle/kitchen/order-queue units passed (`PlayLifecycle`, `BrowserPlayLifecycle`, `CozyKitchenV2`, `OrderQueue`).
- Three focused mobile performance production tests passed: zero clock-driven allocations + live visual changes/restart/feedback cleanup; freeplay readiness/extraction; staff return countdown without inspected order.
- Six focused pause/settings/background/Menu tests passed earlier in this change. No full Playwright suite.
- Initial mixed unit selection reproduced the already documented legacy `CozyRuntime.test.ts`3s extraction assertion failure; current law is6–8s. No gameplay or stale legacy test was changed to hide it.
- Three independent reviewers identified two rendering regressions (readiness threshold/courier label) and test coverage/CDP portability gaps. Patched with focused production regressions; edge/acceptance recheck recorded in spec.

Physical-phone verification remains necessary to establish actual device FPS/input latency; the confirmed allocation/cleanup fixes and production emulation results are complete.

