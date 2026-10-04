---
name: 'Pizza Demo Mobile Experience'
description: 'Behavior and interaction contract for demo epics E01-E04.'
status: 'final'
scope: ['E01', 'E02', 'E03', 'E04']
sources:
  - '../../../implementation-artifacts/ui-baseline-2026-10-02.md'
  - '../../pizza-gdd/gdd.md'
  - '../../../game-architecture.md'
  - '../../../project-context.md'
updated: '2026-10-02'
---

# Pizza Demo Mobile Experience — Experience Spine

## Foundation

Portrait mobile web, single-touch, relaxed pace. Primary browsers are Chrome Android and Safari iOS; desktop is a secondary test surface. Phaser owns gameplay UI; HTML/CSS only hosts canvas, safe area and orientation notice. `DESIGN.md` owns visual tokens; this file owns behavior.

The demo is E01–E04 only: three days, one shop, market/preparation, automatic customer orders and special price/help choices, pizza assembly/baking/boxing/delivery, customer/reputation feedback, daily summary, progression, one regular-customer branch and local end-day checkpoints. No delivery app, weather, staff, marketing, hidden mission, celebrity customer or day 4 UI.

| Epic | Verbatim source title |
| --- | --- |
| E01 | Vòng lặp làm và giao pizza |
| E02 | Khách và uy tín |
| E03 | Chợ và sổ thu chi |
| E04 | Demo ba ngày và quan hệ đầu tiên |

## Information Architecture

| Surface | Reached from | Purpose | Exit |
| --- | --- | --- | --- |
| Boot / Load | Page open | Validate config/storage/save and preload mandatory assets | Start/Continue or blocking error |
| Start / Continue | Boot | New campaign or newest valid checkpoint only | Preparation |
| Preparation / Market | Start or saved next day | Buy, inspect expiry, set menu/prices, see goals and financial risk | Explicit Open Shop |
| Shop / Kitchen HUD | Open Shop | Scheduled ordinary/hurried/demanding arrival → automatic ticket → pizza → delivery; no Accept/Decline | Day close |
| Special Customer Choice | Bargaining arrival or regular-customer story help | Separate price decision or Help / Decline while its own lease pauses the shift | Shop HUD |
| Tutorial Overlay | Day 1 steps | Teach one action at a time while simulation is paused | Shop HUD |
| Pause / Continue | Pause, foreground return | Explain active pause reasons; release only the owned user/continue reason | Prior surface |
| Orientation Notice | Landscape | Preserve state and require portrait | Prior surface when portrait |
| Order Feedback | Delivery/expiry | Explain stars and distinct deltas | Shop HUD |
| Day Summary | Day close | Resolve goals, books, expiry, XP, relationship and save | Next day, demo end or insolvency end |
| Save/Error Recovery | Boot or summary | Retry/recover without inventing gameplay outcome | Source surface after safe resolution |
| Demo / Campaign End | Day 3 or insolvency | Final results; new campaign with confirmation | Start |

Navigation is linear by game phase. There is no checkpoint picker, day select or back navigation from a committed day. Pause does not provide a route into a previous phase.

## HUD & Information Hierarchy

User decision (2026-10-02): preserve the restored [UI baseline](../../../implementation-artifacts/ui-baseline-2026-10-02.md), including the illustrated animated main menu, left board/right ovens, phase action y=411, five sauce tiles and ten ingredient tiles. The subsequent explicit [compact queue/panel request](../../../implementation-artifacts/spec-compact-order-queue.md) changes only the queue canopy/avatar row and detail card: up to six supplied entries in the old frame, gold explicit inspection and matching panel, with the prompt “Chọn đơn để xem chi tiết” when none is inspected. Source app uses blue phone art; current gameplay still has three tickets and no app arrivals. Selecting an avatar follows the real runtime target without pausing or altering oven ownership. Adding behavior below does not authorize further changes to composition, theme or locked decorative slots.

The scoped menu update authorized on 2026-10-02 adds [gentle plant/sign wind motion, soft pizza vapor and smaller buttons](../../../implementation-artifacts/spec-menu-gentle-wind.md). Sign text follows its artwork. Hidden tabs suspend animation; reduced motion returns a still scene without vapor. Start/Continue/Settings behavior and minimum 48 CSS px touch targets remain unchanged. This does not authorize changes to shop play.

During active shop play:

1. **Critical, always visible:** up to three order tickets, patience state, selected ticket, oven state/time, current pizza composition, delivery/box readiness.
2. **Contextual:** ingredients/actions for the selected pizza; stock reason; automatic ticket or special price/help choice; result feedback.
3. **Secondary:** day/shift progress, mute and pause. Money, goal and mission are available without occupying the central work area.

Shop reputation, per-order stars and regular-customer relationship are separate models and surfaces. Daily goal and three-day mission are separate. Cash, revenue, bonus and business profit are separate ledger concepts.

## Voice and Tone

Vietnamese microcopy is short, literal and calm. It explains cause and next action.

| Prefer | Avoid |
| --- | --- |
| “Thiếu 1 phô mai để nhận đơn.” | “Không thể!” |
| “Bánh đã sẵn sàng.” | Audio-only oven cue |
| “Ngày 2 chưa được lưu. Thử lại trước khi đóng trang.” | “Database transaction failed.” |
| “Tiến độ trong ca này sẽ mất; bạn trở lại đầu ngày 2.” | “Chơi lại ngày 2?” |
| “Chưa có đánh giá.” | Defaulting an empty day to 5 stars |

`[ASSUMPTION]` Customer dialogue is friendly and concise; cultural voice remains open until setting/character direction is approved.

## Component Patterns

Canonical keys match `DESIGN.md` frontmatter exactly. Bake/Remove/Box/Deliver, bargaining price choices and story Help / Decline are `action-button` variants. Ordinary, hurried and demanding customers have no order Accept/Decline controls.

| Component key | Behavioral contract |
| --- | --- |
| `action-button` | Submits one typed intent and shows pressed → busy → result. Deliver echoes target (`Giao đơn 2 · Phô mai`); exact match is one tap, while wrong recipe or unboxed takeaway requires explicit consequence confirmation. Double-tap resolves once. |
| `order-ticket` | Tap selects; selection persists in rail and center detail. Expired/closed tickets cannot receive delivery; changing selection causes no rail reflow. |
| `ingredient-control` | One tap requests one ingredient. Disabled/failed state shows missing or reserved-stock reason. |
| `oven-status` | Shows state/time even under blocking overlays, marked `Đang tạm dừng` when frozen. Result comes from domain transition, never animation completion. |
| `primary-status-bar` | Keeps phase/pause visible; pause/mute are 48px targets outside the three ticket slots. |
| `offer-modal` | Special decisions only: agreeing to a bargain price creates a commercial ticket; Help creates a non-commercial story ticket. Rejecting the price or Decline creates none. No ticket, reservation or patience before this choice resolves. Ordinary orders bypass the modal and create tickets atomically on valid arrival. |
| `feedback-strip` | Nonblocking, never consumes the next gameplay tap, and auto-dismisses after readable dwell unless consequence needs acknowledgment. |
| `ledger-row` | Keeps arithmetic groups together; values do not animate into different accounting categories. |
| `goal-mission-progress` | Daily goal and three-day mission each retain independent progress, expiry and one-time reward acknowledgment. |
| `pause-panel` | Lists owned reasons; only user/continue action can release its own lease. Lower-priority overlays remain paused. |
| `error-panel` | Presents heading, effect, action, busy state and remaining pause reasons; successful recovery returns visual attention to the originating context. |
| `save-progress` | Reuses the same pending commit/result; busy state blocks duplicate retry and day advance. |

## State Patterns

### Boot and storage

- Loading names the current stage without fake progress.
- Missing mandatory asset/config or renderer failure blocks gameplay and offers Retry/Reload.
- Storage unavailable before campaign start offers Retry or explicit Play Without Saving with consequence copy; never silently switches modes.
- Valid newest checkpoint offers Continue. Corrupt/incompatible data uses distinct messages and never silently resets.
- If offline/network prevents fetching mandatory assets, boot is blocked with Retry; cached assets do not imply an offline-play promise.

### Start and preparation

- User decision2026-10-03: New Campaign/Start goes directly into the isolated pizza tutorial, with no market screen or purchase prerequisite before tutorial. Practice ingredients do not affect real cash/stock/rewards. This overrides any older journey that places purchases before learning. Commercial preparation rules still apply to the real shift. Implemented after subsequent user authorization on 2026-10-03: tutorial completion opens the existing day hub on Chợ for real Day 1 preparation. No day report is fabricated or day advanced; the footer opens Day 1 through the real stock gate.

- No checkpoint: New Campaign only. Valid newest checkpoint: Continue plus protected New Campaign confirmation. Completed demo: View Summary/New Campaign; no Day 4 or replay.
- Preparation cold-load displays validated cash, rent, lots/expiry, prices, menu, goal and mission before enabling purchases.
- Unaffordable purchase keeps state unchanged and names the shortfall. Expired stock is not selectable.
- Invalid price/menu, empty menu, inability to make one open recipe, or projected rent risk blocks or warns Open Shop exactly as GDD specifies.
- Ready-to-open state summarizes enabled recipes, available servings, set prices and unresolved warnings before confirmation.

### Active play

- Gameplay rejection is inline and preserves state.
- Bargaining-price choice, story-help choice, tutorial, user pause, hidden tab, landscape and save error are independent pause leases. Ordinary/hurried/demanding arrivals acquire no pause lease.
- Simulation runs only in a phase that permits time and when no pause lease remains.
- Hidden/locked app does not accrue time. Foreground replaces the hidden lease with “Chạm để tiếp tục.”
- Interruption beyond the architecture threshold pauses rather than advancing unseen oven/patience time.
- Idle/no-arrival leaves the kitchen ready without fake activity. Full three-ticket capacity discards a scheduled arrival without penalty or hidden queue.
- Selected expired/closed ticket clears delivery eligibility and explains closure. Grace period shows no new arrivals and its remaining cleanup state.
- Discard is secondary, separated from Deliver and confirmed. Simultaneous ready oven + expiring ticket preserves both signals; oven status remains above transient feedback.
- The primary control at the approved position beneath the prep board beside the ovens is phase-based: Bake while assembling; Remove while baking; Box then Deliver after removal, with named discard/retry states where appropriate. Changing phase updates that control's action/label; it does not move the button or remove the five-sauce shelf and two-row ten-ingredient grid.

### End day and save

- Summary calculations appear before the save boundary, but Next Day/Finish stays disabled while commit is pending.
- Save failure names the unsaved day and risk; Retry uses the same pending result.
- Revision conflict requires reload; never merge.
- Backup recovery requires confirmation and only accepts the same latest commit/revision.
- Newer schema is “không tương thích”, not “dữ liệu hỏng”.
- Day Summary is one internally scrollable surface with ordered sections: orders, goal/mission, ledger, inventory waste/value, progression/relationships, save state. Save/Next Day action is sticky and cannot be mistaken for content.
- Day 3 success replaces Next Day with Finish Demo. Insolvency takes precedence when triggered and explains the cause before final results.

## Interaction Primitives

- Single tap is the only required gesture.
- No hover, right-click, keyboard, precision drag or multitouch dependency.
- Destructive campaign reset and discard-pizza actions require clear confirmation; routine ingredient taps do not.
- Touch targets are at least 48×48 CSS px after scaling.
- Inputs are idempotent at the runtime boundary; visual disabled state is never the only double-submit defense.
- Resource-consuming actions do not execute while a blocking overlay/pause reason is active.
- Acknowledgment appears immediately on tap; busy state lasts only until dispatch returns and never substitutes for runtime idempotency.

## Input Schemes

- **Touch primary:** tap tickets, ingredients, oven and actions.
- **Mouse secondary testing:** click maps to the same pointer intents; hover is not informative.
- **Keyboard:** not required for demo gameplay and not shown as prompts.
- **Browser gestures:** safe-area and page shell prevent gameplay controls from colliding with device insets; kitchen does not require page scrolling.

## Onboarding

Day 1 uses interaction-led steps. Tutorial has its own pause lease and awards no money/XP.

Entry requirement2026-10-03: `Bắt đầu → Tutorial` immediately, without buying ingredients first. Existing practice-fixture isolation supplies training ingredients; no automatic commercial purchase is allowed. The decision is recorded for later implementation, not proof of current runtime behavior.

| Step | Focus | Completion |
| --- | --- | --- |
| 1 | Read the practice ticket | Practice ticket is visible; no commercial Accept/Decline |
| 2 | Select ticket and build recipe | Required ingredients are present |
| 3 | Put pizza in oven | Bake command succeeds |
| 4 | Read oven states | Player acknowledges ready range and warning |
| 5 | Remove pizza | Remove command resolves quality |
| 6 | Box when takeaway | Packaging command succeeds when applicable |
| 7 | Deliver to ticket | Delivery succeeds and feedback is read |

Tutorial copy exposes one next action, keeps tickets/oven visible and never auto-performs the domain command. After tutorial, ordinary arrivals create commercial orders automatically under the real clock. UX test target follows the GDD: at least 4/5 new players finish the first order within 60 seconds of active play.

`[ASSUMPTION]` Tutorial uses a controlled practice fixture separate from commercial simulation. Reading/assembly steps keep all commercial timers frozen. Starting the practice bake advances only a controlled training clock; customer patience, inventory accounting, money and XP do not advance. Tutorial reacquires pause between milestones. A clear `Đến Chợ mua hàng` acknowledgment removes the tutorial lease and opens the approved hub on Chợ for Day 1; buying uses real cash and stock, and only `Mở quán — Ngày 1` starts commercial play; tutorial copy can never silently resume commercial time.

## Pause Model

The pause panel shows all active reasons in plain language. Closing one overlay releases only its own lease.

- User Pause: Resume releases user lease.
- Special Customer Choice: agreeing/rejecting a bargaining price or choosing Help / Decline releases only its decision lease after the result. Ordinary/hurried/demanding arrivals create tickets while the shift runs.
- Tutorial: completing/dismissing permitted step releases tutorial lease.
- Hidden/Lock: foreground becomes explicit Continue lease.
- Landscape: only returning portrait releases orientation lease.
- Save Error: successful retry or explicit allowed resolution releases save-error lease.

If other reasons remain, Resume/Continue updates the list but does not start the clock. No “Resume All” control exists.

Overlay priority is deterministic: fatal/save recovery → orientation shell → foreground Continue → user pause → tutorial → special price/help choice → transient feedback. Lower layers keep their leases/state and receive no input. Returning portrait never releases visibility or user pause.

## Game Feel & Juice

Feedback is immediate, modest and never the source of truth:

- Ingredient accepted: short placement animation plus count update.
- Invalid ingredient/stock: local nudge and reason; no full-screen shake.
- Oven ready/warning: sprite/icon/text plus optional sound.
- Delivery: ticket resolves once, then a compact breakdown shows stars and causes.
- XP/reputation/relationship changes animate beside their own labels; no combined shower of numbers.
- Always honor `prefers-reduced-motion: reduce`: no shake, bounce, flashing or looping decoration; use immediate state/opacity changes. An in-game toggle is optional, but the browser preference is mandatory.

## Accessibility Floor

- Touch targets ≥48×48 CSS px with separation sufficient to prevent adjacent Box/Deliver/Discard mistakes.
- Vietnamese diacritics render fully; critical text wraps instead of truncating.
- Ingredient, order type, oven quality, goal result and errors use icon+label, not color alone.
- Every audio cue has a visual equivalent; mute never hides state.
- Timers use stable-width digits and remain visible while selecting toppings.
- Avoid rapid flashing; routine animation is short and non-blocking.
- Error messages identify effect and recovery action without raw technical detail.
- At 360×640, no interactive control is hidden behind page scroll or safe-area inset.
- Timer format is `m:ss` with a stable label. Milestones add text/icon (`Sắp hết`, `Sẵn sàng`, `Sắp cháy`) without flashing or per-second announcements.
- Test 200% browser zoom or equivalent canvas/text scale: controls and timers remain reachable, modal content can scroll, and recovery actions remain visible.
- Screen-reader and keyboard navigation are explicitly outside the canvas-only demo scope. The document does not claim semantic focus/read order; adding a synchronized DOM accessibility layer requires a future architecture decision.
- Errors move visual attention with heading + action placement, preserve busy feedback, and return the player to the originating control/context after successful recovery.

## Responsive & Platform

Verify portrait layouts at 360×640, 390×844 and 412×915. Measure actual post-scale target boxes, safe-area insets, browser chrome and longest Vietnamese fixtures. Stable bands preserve muscle memory. At narrow height, explanation copy scrolls inside the modal; gameplay controls do not shrink below target. Landscape acquires pause and shows a shell-level return-to-portrait notice. Desktop centers the portrait canvas and does not add hover-only behavior.

## Key Flows

### Lan completes her first commercial pizza on Day 1

1. Lan opens the game on a 360×640 Android phone; boot validates storage and loads mandatory assets.
2. She completes isolated guided practice using a practice ticket, without Accept/Decline or commercial money/stock/timers.
3. She explicitly starts the shift, sees cash/rent/menu in preparation, buys ingredients and opens the shop; a valid ordinary arrival automatically creates a commercial ticket, reserves stock and starts patience once.
4. She selects the ticket and taps dough, sauce, cheese and oven; the interface keeps the recipe and oven visible.
5. Commercial time runs during ordinary arrival and cooking; she can pause explicitly to read the ready/warning guidance. Only special price/help decisions acquire an arrival-related pause.
6. **Climax:** Lan removes a ready pizza, delivers it to the matching ticket and sees stars, reasons, money and XP in distinct places.
7. The tutorial recedes; the stable ticket/kitchen/action layout remains unchanged.

Failure: missing reservable stock prevents automatic ticket creation and displays the exact reason; no Accept/Decline appears and the requested recipe never changes silently. A full rail skips the arrival without a hidden queue or capacity penalty.

### Minh handles a bargain takeaway without losing the oven

1. A Day 2 bargaining arrival pauses only for a separate price choice and shows original and −10% price.
2. Minh chooses “Đồng ý giá giảm”; only then is stock reserved, the final-price ticket created and patience started. “Từ chối giá” creates no ticket and adds no penalty.
3. While selecting toppings, the oven and all ticket deadlines remain visible.
4. He removes the pizza in range. The ticket visibly requires a box.
5. He taps Box, then Deliver. A second fast tap is ignored by command idempotency.
6. **Climax:** feedback confirms packaging, final price, stars and reputation change; play resumes without hidden time jump.

Failure: changing selection immediately before Deliver updates the action label. Wrong recipe or unboxed takeaway opens a consequence confirmation; expired/closed ticket rejects without consuming the pizza.

### Mai closes Day 2 and safely reaches Day 3

1. The shift stops spawning customers, then resolves remaining tickets within the grace period.
2. Summary separates order results, goal, mission, revenue, bonus, costs, waste, rent, cash, profit, XP, reputation and relationship.
3. Save begins; Next Day is disabled and the active save state is named.
4. First commit fails. The panel says Day 2 is unsaved and closing risks losing it.
5. Mai retries the same commit; rewards are not recalculated.
6. **Climax:** save succeeds, Next Day becomes available and Day 2 becomes immutable. There is no replay button.

Failure: if the new checkpoint cannot fund rent or one open recipe, an insolvency explanation replaces Next Day and offers only Summary or New Campaign.

### An returns after locking the phone

1. An locks the phone while a pizza is baking; visibility acquires a pause lease.
2. On return, “Chạm để tiếp tục” appears. A bargaining price choice is also open beneath it.
3. An taps Continue; only visibility clears, so the clock remains paused for the price choice.
4. **Climax:** after the price choice resolves, the final lease clears and the oven resumes from the exact simulation time An left.

Failure: returning portrait clears orientation only; visibility, user pause or special-decision leases remain listed and keep time frozen.

### Huy chooses whether to help the regular customer on Day 2

1. Huy sees the returning customer only because the Day 1 condition was met.
2. The help request pauses the shift, names a free cheese pizza, 120-second limit and relationship consequence.
3. If stock is missing, Help is disabled with the exact reason; Decline remains available and does not remove cash/reputation.
4. Huy chooses Help. The ticket is visibly marked `Giúp đỡ · không tính doanh thu/XP` and occupies one normal slot.
5. He delivers a correct, ready pizza before the limit.
6. **Climax:** feedback changes relationship once and explicitly shows zero commercial revenue, XP, daily rating, goal and mission progress.
7. On Day 3, the customer’s return/thanks and one-time 20-xu reward follow the documented relationship condition.

Failure: decline leaves relationship unchanged; wrong/late/raw/burned help changes relationship once without commercial reputation penalties and never blocks finishing the demo.

### Vy safely recovers a local save problem

1. Vy opens the page; boot finds an invalid active snapshot.
2. The error distinguishes corruption from a newer incompatible schema and never creates a new campaign silently.
3. A same-commit backup, when available, is explained and requires confirmation. Otherwise Retry Read or confirmed New Campaign is offered.
4. If mandatory assets cannot load offline, Retry remains boot-blocking; local save availability does not imply offline gameplay.
5. **Climax:** successful recovery returns Vy to the newest valid checkpoint and names the day; no completed day can be reopened.

Failure: recovery fails again with the same safe choices and no raw exception/save content.

### Lan finishes Day 3 without a false Day 4 promise

1. Lan closes the final shift and scrolls through the ordered summary sections.
2. Save completes before Finish Demo becomes active.
3. **Climax:** final results show cumulative cash/profit, level/XP, reputation, relationship and mission; no Day 4 control or placeholder appears.
4. New Campaign requires confirmation and explains that committed days cannot be revisited.

Failure: insolvency, if triggered by the final close rules, explains the cause before the same final-results surface and still offers only Summary or New Campaign.

## Inspiration & Anti-patterns

- Preserve the legibility of a compact food-service ticket rail, but reject frantic multi-gesture cooking interactions.
- Prefer deterministic, explainable feedback over reward bursts.
- Reject replay/day-select affordances, hidden autosave assumptions, overlay stacks that resume time, and accounting that merges cash with profit.
- Reject delivery-map, staff, weather or day-4 placeholders in this demo; they imply unavailable features.

## Open Decisions

- Release name, future cultural/content choices and dialogue voice. Current character art, palette, typography, 360×640 canvas and composition are fixed by the approved UI baseline, not open decisions.
- Final customer dialogue voice and licensed audio/asset direction.
- Whether an in-game reduced-motion toggle is added; honoring browser `prefers-reduced-motion` is already required.
- Exact visual forms for raw/ready/burned and customer archetype cues require art-direction approval; behavior and non-color redundancy are fixed.

## Cozy manual day-close flow — user decision 2026-10-02

The implemented end-of-day hub is an approved interface, confirmed by the user's screenshot on 2026-10-02. Keep summary/preparation navigation within the existing five tabs, four preparation tiles and fixed footer described in the visual baseline. Adding behavior must preserve the approved layout and style; changing actual day results is not permission to move or restyle controls.

For the existing RAM-only Cozy shop session, the user explicitly chose a manual “Kết thúc ngày” action in the user-pause panel. Confirm before closing pending tickets; cancellation preserves pause and shop state. Accepted settlement resolves remaining tickets once, releases unused reservations, retains consumed costs, charges rent, expires due lots and freezes the day's actual summary. Other pause owners cannot be bypassed.

Summary → Chợ / Kho → explicit “Mở quán — Ngày N+1” carries cash/valid lots and opens one subsequent shift. Preparation purchases are dated to the next day and belong to its purchase ledger. Summary, reviews and tab navigation never advance ovens or customer clocks. No orders means “Chưa có đánh giá”; unsupported Quán/Nhiệm vụ systems remain clearly unavailable. Completed days cannot be replayed in-session; day 3/insolvency ends this demo. This change adds no durable saving and does not alter the separate campaign checkpoint flow. See [spec](../../../implementation-artifacts/spec-end-of-day-reference.md) and [visual baseline](../../../implementation-artifacts/ui-baseline-2026-10-02.md).
