---
name: 'Pizza Demo Mobile UI'
description: 'Visual identity contract for the three-day portrait-mobile pizza demo.'
status: 'final'
sources:
  - '../../pizza-gdd/gdd.md'
  - '../../../game-architecture.md'
  - '../../../project-context.md'
updated: '2026-10-02'
visual_baseline: '../../../implementation-artifacts/ui-baseline-2026-10-02.md'
change_policy: 'Preserve approved UI unless the user explicitly requests a visual change.'
colors:
  surface-base: '#71352E'
  surface-raised: '#3E291F'
  surface-worktop: '#D99653'
  surface-paper: '#FFF0D8'
  text-primary: '#FFF0D8'
  text-secondary: '#DFCEBA'
  text-ink: '#362018'
  border: '#C69A6E'
  primary-action: '#35BE48'
  cheese-focus: '#FFC34C'
  basil-success: '#4FA66A'
  sky-info: '#4FA3C7'
  warning: '#F08A3C'
  error: '#E35D6A'
  disabled: '#737981'
typography:
  fontFamily: 'Trebuchet MS, Arial, sans-serif'
  fontWeight: 'bold'
  letterSpacing: '0'
  lineSpacing: '0'
  sizes: 'Preserve current per-component sizes from CozyScene.ts; do not apply a global font-size reflow.'
  numeric: { fontFamily: 'monospace', format: 'm:ss for timers' }
rounded: { sm: '9px', md: '11px', modal: '20px', ticket: '16px', full: '9999px' }
spacing: { '1': '4px', '2': '8px', '3': '12px', '4': '16px', '5': '24px', touch-min: '48px' }
components:
  action-button: { minHeight: '{spacing.touch-min}', background: '{colors.primary-action}', text: '{colors.text-ink}', border: '#1D7532', disabledBackground: '#527F42', disabledText: '{colors.text-primary}', radius: '{rounded.md}' }
  order-ticket: { touchCell: '56x79px, enlarged if needed after scale', maxVisible: 6, railHeight: '112px including fabric canopy', avatarDiameter: '40px', background: '#954A40', selectedBorder: '{colors.cheese-focus}' }
  ingredient-control: { minSize: '{spacing.touch-min}', background: '#593B28', count: 'current badge typography', radius: '{rounded.sm}' }
  oven-status: { background: '{colors.surface-raised}', ready: '{colors.basil-success}', warning: '{colors.warning}', error: '{colors.error}' }
  primary-status-bar: { height: '48px', background: '{colors.surface-base}', text: '{colors.text-primary}' }
  offer-modal: { background: '{colors.surface-paper}', border: '{colors.border}', radius: '{rounded.modal}' }
  feedback-strip: { background: '{colors.surface-raised}', text: '{colors.text-primary}', pointerPolicy: 'does not cover primary controls' }
  ledger-row: { label: 'current sans-serif body, for future summary surface', value: '{typography.numeric}', divider: '{colors.border}' }
  goal-mission-progress: { background: '{colors.surface-raised}', goalAccent: '{colors.sky-info}', missionAccent: '{colors.cheese-focus}' }
  pause-panel: { background: '{colors.surface-paper}', border: '{colors.border}', radius: '{rounded.modal}' }
  error-panel: { background: '{colors.surface-raised}', border: '{colors.error}', radius: '{rounded.md}' }
  save-progress: { background: '{colors.surface-raised}', accent: '{colors.sky-info}', busyMark: 'spinner + text' }
---

# Pizza Demo Mobile UI — Visual Spine

## Approved UI and change policy — 2026-10-02

The user explicitly requires the restored current interface to be retained in future work. [UI baseline](../../../implementation-artifacts/ui-baseline-2026-10-02.md) supplies the current composition, exact geometry, theme sources and durable screenshots. It supersedes the historical 96px ticket/176px action budgets, red primary action, 2/6px corners and earlier redesign sketches. New stories about gameplay, lifecycle, audio, performance or accessibility must preserve this interface; only an explicit user request authorizes a visual redesign, limited to the requested scope.

The illustrated animated main menu follows the approved menu/reference and subsequent fire/breeze/curtain/pizza/steam/countertop corrections linked in the baseline. It must not be replaced during HUD work. The user additionally authorized [soft vapor, smaller menu buttons and gentle plant/sign wind motion](../../../implementation-artifacts/spec-menu-gentle-wind.md) on 2026-10-02, preserving the illustration and 48 CSS px targets; approval of the resulting visuals is pending. The later explicit user request permits only the [compact queue/panel revision](../../../implementation-artifacts/spec-compact-order-queue.md): cream cloth/terracotta hem/yellow lamps, up to six round entries, gold selection and blue phone for app-source data. Component contracts below describe behavior within the approved composition, not authority to move other controls. Summary/save/goal components are future surfaces, not implemented kitchen decoration.

On 2026-10-03 the user requested [closer menu buttons, a centered replacement Continue icon and stronger plant/sign wind](../../../implementation-artifacts/spec-menu-compact-stronger-wind.md). Keep the208px button width and roughly6px visual gaps; short portrait adapts visual height to retain separate48 CSS px targets. Plant/sign amplitudes increase3×/2.5× relative to the previous gentle wind; title follows the sign and reduced/hidden motion behavior stays. This permission covers only those menu details. New visual evidence awaits user review and does not replace approved baseline images.

## Brand & Style

User-confirmed style (2026-09-30): a compact, readable 2D cartoon kitchen interface: food and customer sprites carry the warmth; UI uses warm wood and cream surfaces with clear contrast so toppings, timers and status changes scan quickly. The posture is relaxed but operational, not decorative or arcade-frantic. Visual hierarchy comes from stable regions, contrast and icon+label pairs rather than large headings or card-heavy composition.

The release name and future cultural/content choices remain open. The current warm cartoon composition, artwork, palette and typography are approved as the UI baseline; do not treat them as open redesign decisions.

## Colors

The current theme uses warm wood/cream/terracotta, green actions and gold selection. Preserve `src/presentation/theme.ts` and the baseline screenshots. Status accents for future surfaces do not authorize replacing the current artwork.

| Role | Token | Use |
| --- | --- | --- |
| Base | `{colors.surface-base}` | Canvas shell, pause scrim |
| Raised | `{colors.surface-raised}` | Tickets, overlays, summary rows |
| Worktop | `{colors.surface-worktop}` | Kitchen interaction zone |
| Primary text | `{colors.text-primary}` | Critical labels and values |
| Secondary text | `{colors.text-secondary}` | Explanations and metadata |
| Action | `{colors.primary-action}` | Green primary commands with dark text |
| Focus | `{colors.cheese-focus}` | Selected ticket/ingredient and tutorial focus |
| Success | `{colors.basil-success}` | Completed/ready states with icon+text |
| Information | `{colors.sky-info}` | Neutral guidance, XP and save progress |
| Warning | `{colors.warning}` | Low patience, oven warning and financial risk |
| Error | `{colors.error}` | Invalid delivery, save failure and fatal state |

No state relies on color alone. Ready/burned/raw use distinct icon, short Vietnamese label and shape/motion treatment. Shop reputation, customer relationship and order stars never share the same icon.

Contrast targets remain normal text ≥4.5:1 and essential UI boundaries/focus ≥3:1. Current foreground/background contracts are `CONTRAST_PAIRS` in `src/presentation/theme.ts`; historical dark/red palette measurements do not apply to the current theme. Disabled actions retain their label, inactive styling and named reason without moving other controls.

## Typography

Use a readable Vietnamese-capable sans-serif for functional UI. Rounded cartoon heading fonts require license and diacritic verification. Do not use pixel fonts.

- Keep the current Vietnamese-capable `Trebuchet MS, Arial, sans-serif`, bold labels and existing per-component sizes from CozyScene; do not apply the older uniform 14/16px tokens.
- Timers use monospace and `m:ss` so values do not shift width. Other numbers retain their current rendering.
- Modal explanations support equivalent 200% text scale with their own cropped scrolling region; headings and primary/recovery buttons remain fixed and reachable.
- Letter spacing is always `0`; no viewport-scaled font sizes.
- Text may wrap within the approved controls; preserve neighboring geometry. A necessary layout change outside a requested UI correction must be discussed with the user, not applied as an automatic reflow.

## Layout & Spacing

Use a 4px scale with 8px as the common rhythm. All interactive controls have at least `{spacing.touch-min}` effective CSS size after Phaser scaling.

Portrait gameplay preserves the current composition:

1. 48px HUD and 112px queue/fabric-canopy region, with up to six equal round avatar/phone entries, order numbers and textual timers. Gameplay still supplies at most three customer tickets; presentation support does not add app arrivals.
2. Cream order bubble, recipe row, left wooden prep board and right ovens.
3. Phase action beneath the board beside the ovens; five sauce tiles plus trash; ten ingredient tiles in two rows, including decorative locks.

`[ASSUMPTION]` At 360×640, secondary text collapses before controls shrink. Tickets preserve equal width; long recipe names wrap. Market and summary use full-width bands and rows, not nested cards. Overlays leave the paused kitchen visible behind a restrained scrim so context is not lost.

At 360×640 the approved overview is 48px status, 112px ticket/awning, 251px work and 229px action/ingredient regions. The phase action begins y=411, sauces y=464 and ingredient grid y=524/578. Exact geometry and exceptions crossing band boundaries are in the baseline. Browser chrome must not reduce any actionable target below 48 CSS px. The gameplay canvas never page-scrolls; modal copy and the future Day Summary may own internal vertical scrolling. Do not restore the retired 96/176px budget.

Show only supplied active entries, up to six, in the existing queue frame. Each uses a small round customer avatar or blue app-source phone, order number, real patience arc when available and textual deadline. Gold border identifies the explicitly inspected entry. The cream panel below shows matching source/name, recipe/quantity, takeaway packaging and time; unselected text is “Chọn đơn để xem chi tiết”. Selecting does not pause or change row geometry. Tutorial retains its existing guide area. Do not restore the earlier three large customer cards.

## Elevation & Depth

Use three layers only: gameplay, modal scrim, transient feedback. Tonal contrast and 1px borders carry hierarchy; no stacked floating cards. Special price/help decisions, tutorial and pause reasons may coexist logically, but UI presents one top overlay and a small list of other active pause reasons.

## Shapes

Preserve current rounded forms: theme tile 9px, panel/button 11px, modal 20px; customer slots and illustrations retain their own current curves. Do not restore 2/6px corners globally. Cartoon illustrations use smooth curves, anti-aliased edges, consistent outlines and proportional scaling.

## Components

- **`action-button`** — min 48px, icon+verb, explicit pressed/disabled/busy states. Disabled actions retain label and show a nearby reason.
- **`order-ticket`** — up to six 56×79px touch cells at x=12+56×i/y=79, avatar centers x=40+56×i/y=103, inside the fixed 112px queue/canopy region. Artwork is smaller than its touch cell. Gold inspection follows the same ID as panel details; app-source data uses the blue phone icon.
- **`ingredient-control`** — ingredient sprite, Vietnamese label and available/reserved count; never icon-only at narrow width.
- **`oven-status`** — empty/baking/ready/warning/burned have distinct sprite frame, icon and text; blocking overlays retain a compact frozen/running view.
- **`primary-status-bar`** — day, phase, pause, mute and pause controls; safe-area aware, fixed height.
- **`offer-modal`** — reserved for special choices: bargaining shows original/reduced price with “Đồng ý giá giảm” / “Từ chối giá”; regular-customer story help shows Help / Decline and relationship consequences. Ordinary, hurried and demanding arrivals create tickets directly without Accept/Decline and never show this modal.
- **`feedback-strip`** — stars, reasons and distinct deltas; nonblocking and outside primary touch controls.
- **`ledger-row`** — left label, right fixed-width value; section dividers separate cash flow, bonuses and profit.
- **`goal-mission-progress`** — separate goal/mission labels, time scope, progress and one-time reward state.
- **`pause-panel`** — Resume appears only for a releasable user/continue lease; other reasons are read-only.
- **`error-panel`** — safe heading, effect, recovery action and busy state; never raw exception/save contents.
- **`save-progress`** — named day/commit phase, busy state and disabled advance action.

## Do's and Don'ts

| Do | Don't |
| --- | --- |
| Keep tickets, oven state and current action stable in position | Reflow the kitchen when a label or timer changes |
| Pair every status color with icon and Vietnamese text | Use red/green alone for raw/ready/burned |
| Separate order stars, shop reputation and relationship visually | Collapse them into one “happiness” meter |
| Separate daily goal, three-day mission and unlock reward | Show all progress as one bar |
| Separate cash, pizza revenue, bonus and business profit | Present a single unexplained end-day number |
| Use restrained, short feedback animation | Shake the full screen or block input for routine actions |
| Preserve 48px touch targets at 360×640 | Shrink controls to keep every secondary label on one line |
| Keep error/retry copy literal and calm | Blame the player or silently reset corrupted progress |


## Art direction update — 2026-09-30

Historical direction decision. Implementation status and current approval are now captured by the 2026-10-02 baseline above; the pending-work statement below describes the state on 2026-09-30 only.

User-confirmed direction: **2D cartoon**, replacing the previous pixel-art direction. Use soft rounded forms, clear smooth outlines, warm wood/cream/tomato/amber colors, expressive characters, and subtle shading. Keep Vietnamese text readable and retain existing gameplay, portrait layout, and touch-target requirements. This direction supersedes earlier conflicting visual assumptions; existing palette tokens require validation during implementation. This update changes documentation only: cartoon artwork/rendering and visual verification remain pending. Prior completion and test records describe the previous implementation.


## Approved end-of-day surface — 2026-10-02

The user confirmed the implemented “Kết thúc ngày 1” screenshot as the visual baseline. Preserve the hanging title, balance/level/rating capsules, five tabs in their current order, three summary cards, four preparation tiles and green next-day footer at the exact geometry in the [UI baseline](../../../implementation-artifacts/ui-baseline-2026-10-02.md). Preserve existing tab surfaces, icons, font, colors and rounded shapes. Live figures and reviews may change; new behavior or stories do not authorize a redesign or replacement of baseline screenshots.

The user's supplied reference authorizes a dedicated outside-shift hub with warm wood, a hanging day title, gold balance/rating capsules, cream cards, terracotta selected tab and a green next-day footer. Five tabs: Tổng kết / Chợ / Kho / Quán / Nhiệm vụ. Summary cards show actual finances, completed/abandoned orders and actual reviews; preparation tiles lead into the same tab content. Unsupported decoration, mission and level features say “Chưa mở”, rather than drawing invented progress. See [scope and implementation contract](../../../implementation-artifacts/spec-end-of-day-reference.md). This new surface leaves all approved kitchen/menu geometry unchanged; it must not become a reason to redesign those surfaces.
