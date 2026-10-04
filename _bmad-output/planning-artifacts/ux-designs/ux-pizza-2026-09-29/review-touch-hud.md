# Reviewer Gate: Touch / HUD

**Scope:** Demo E01-E04, portrait mobile web  
**Reviewed:** `DESIGN.md`, `EXPERIENCE.md`, GDD, game architecture, project context  
**Smallest required viewport:** 360 x 640 CSS px  
**Result:** **CONDITIONAL PASS** - the interaction model is sound, but the HUD needs three blocking clarifications before implementation stories are treated as layout-complete.

## Severity Summary

| Severity | Count | Disposition |
| --- | ---: | --- |
| High | 3 | Resolve in UX spines before implementation handoff |
| Medium | 5 | Resolve or turn into explicit story acceptance criteria |
| Low | 3 | Track during visual/layout implementation |

## High Findings

### TH-01 - Three-ticket rail is not specified tightly enough for 360 px

`DESIGN.md` requires three equal ticket slots containing recipe icon/name, customer marker, order type, patience meter and numeric/short time. At 360 px, safe-area/padding and two gaps leave roughly 108-112 px per ticket. A two-line Vietnamese recipe name plus all five signals cannot reliably fit while preserving 48 px selection targets and stable height.

**Required resolution:** define a compact ticket anatomy for the rail. Keep all three tickets simultaneously selectable and show, at minimum, slot/customer cue, recipe abbreviation or icon+short name, order-type icon+label, patience/time and selected state. Move full recipe and consequence detail for the selected ticket to the center work-state strip. Specify a fixed ticket-rail height and overflow behavior; no horizontal page/scroll that hides an active timer.

**Verification:** at 360 x 640 with three longest localized ticket fixtures, all timers and order types remain visible, each slot is at least 48 px high, no text overlaps, and selecting a ticket causes no rail reflow.

### TH-02 - Delivery target/confirmation contract is ambiguous

The flow says tap a ticket, then Deliver, but does not define how the selected ticket remains unmistakable when three timers, a boxed pizza and transient feedback coexist. A stale selection or rapid ticket-to-deliver tap could cause an expensive wrong-order action even if command idempotency prevents duplicate delivery.

**Required resolution:** make Deliver name or visually echo the target ticket and recipe (for example, `Giao cho #2 - Phô mai`) and keep the selected ticket state persistent in both rail and current-pizza/action region. Delivery is one tap when pizza and ticket are an exact valid match. When it would knowingly produce a wrong recipe or unboxed takeaway, require an explicit consequence confirmation; do not use double-tap as confirmation.

**Verification:** automated touch tests cover changing selection immediately before Deliver, rapid double-tap, expired/closed target, wrong recipe, and unboxed takeaway. Each command resolves at most once and the target is visible before the destructive tap.

### TH-03 - Tutorial pause/resume timing is internally unclear

The onboarding table says the tutorial keeps its pause lease through oven-state teaching, while the journey says the clock later resumes for the first commercial order. The GDD requires tutorial practice not to award money/XP and time to stop while learning. The UX does not state whether the practice oven advances under simulated time, how a ready range can be demonstrated while paused, or exactly when the commercial clock begins.

**Required resolution:** define tutorial time as a controlled training clock or scripted state progression separate from commercial simulation. State the exact lease transitions: practice steps cannot age customer patience or award commerce outcomes; the first real timer starts only after a clear `Bắt đầu ca`/equivalent acknowledgment. Never silently resume while tutorial copy is still open.

**Verification:** first-order playtest and automated clock test prove that tutorial reading time cannot burn pizza or expire a customer, and that all commercial timers begin from the documented transition.

## Medium Findings

### TH-04 - The vertical budget is not allocated

The three stable bands are directionally correct, but no minimum/fixed heights are defined for ticket rail, persistent oven/current-pizza status, ingredient controls and safe-area action row. Modal copy is allowed to scroll, yet the gameplay HUD has no fallback for short browser height, address-bar changes or enlarged text.

**Recommendation:** add a 360 x 640 layout budget with fixed/stable top and bottom bands and a flexible center minimum. Define which secondary labels collapse, where selected-ticket detail lives, and which region may internally scroll outside active shop play. Gameplay must never require page scroll.

### TH-05 - Oven visibility needs a stronger persistence rule

The documents say the oven remains visible while selecting toppings, but not while customer offers, tutorial, pause or order feedback occupy the top overlay. These are precisely the moments when players need confidence that time is stopped or still running.

**Recommendation:** every blocking overlay must show a compact frozen/running oven state and an explicit `Đang tạm dừng` status, or leave the persistent oven strip unobscured. On overlay dismissal, no timer should jump.

### TH-06 - Bottom action density can exceed one thumb-safe row

Ingredients, Bake/Remove, Box, Deliver and Discard can all be contextual bottom actions. The spine does not define mutual exclusivity or priority; fitting these as simultaneous 48 px controls risks crowding and accidental destructive taps.

**Recommendation:** define phase-based action sets. Ingredient selection and oven actions should not occupy the same primary row; Box/Deliver should replace preparation actions only when eligible. Put Discard behind a secondary control and confirmation, spatially separated from Deliver.

### TH-07 - Overlay priority is described but not deterministic

The visual spine says one top overlay plus a list of other pause reasons, but it does not define priority when visibility Continue, landscape, offer, tutorial and save error coexist. Landscape is shell-level and may prevent reaching a Phaser overlay.

**Recommendation:** specify priority and ownership: fatal/save recovery > orientation shell > explicit foreground Continue > user pause > tutorial > customer offer > transient feedback. Lower layers retain leases and state but do not receive input. Returning portrait must not release visibility or user pause.

### TH-08 - Summary density lacks progressive disclosure

Day Summary must show order outcomes, goals, mission, revenue, bonuses, costs, waste, rent, cash, profit, XP, reputation, relationship and save status. A single 360 x 640 screen cannot show all of this legibly with 48 px actions.

**Recommendation:** define one vertically scrollable summary surface with sticky save/Next Day status, or a short staged summary with explicit sections. Keep ledger arithmetic together and ensure Next Day cannot be mistaken for scrolling content. Do not use nested cards.

## Low Findings

### TH-09 - Ticket tap and ingredient tap need pressed/busy timing

Specify immediate pressed feedback and a short busy/acknowledged state until dispatch returns. This helps distinguish input receipt from a second required tap without making UI locking the idempotency mechanism.

### TH-10 - Pause and mute placement needs safe-area and conflict guidance

Keep both in a persistent top-level utility region with 48 px targets; they must not reduce ticket slots below feasibility or collide with browser/device insets. Pause should remain reachable when no blocking system overlay is active.

### TH-11 - Feedback strip dismissal must not steal a gameplay tap

Define whether feedback auto-dismisses or is tap-through-proof. A tap intended for an ingredient must not both dismiss feedback and mutate gameplay. Prefer nonblocking timed feedback outside primary controls, with explicit acknowledgment only for consequential results.

## What Already Works

- Single tap is the only required gameplay gesture; there is no drag, hover, multitouch or precision input dependency.
- Minimum 48 x 48 CSS px touch targets and the three required viewport checks are explicit.
- The HUD correctly separates ticket/order stars, reputation, relationship, goals, mission and financial concepts.
- Oven and ticket time share simulation time; background time is not accrued.
- Double-submit protection is correctly assigned to runtime command idempotency, not only disabled buttons.
- Pause is modeled as owned leases, and the UX correctly forbids Resume All.
- Landscape and visibility preserve state and do not independently resume unrelated pause reasons.
- Day summary respects pending-save blocking and immutable completed days.
- The demo does not expose unavailable E05-E09 surfaces.

## Touch/HUD Gate Criteria

This lens becomes **PASS** when TH-01 through TH-03 are incorporated into the UX spines and TH-04 through TH-08 are either incorporated or represented as explicit, testable implementation-story acceptance criteria. Required evidence later:

1. Screenshot/layout checks at 360 x 640, 390 x 844 and 412 x 915 with three active tickets and longest Vietnamese fixtures.
2. Touch-flow tests for select/build/bake/remove/box/deliver, selection changes and double-tap.
3. Nested pause tests covering visibility + offer, orientation + user pause, and tutorial + offer ownership.
4. Tutorial clock test proving no commercial timer or reward advances during instruction.
5. Summary overflow test with all demo sections, pending save, save failure and safe-area insets.

