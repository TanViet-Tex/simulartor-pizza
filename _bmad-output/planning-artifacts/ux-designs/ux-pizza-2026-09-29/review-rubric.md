# Spine Pair Review — Pizza Demo Mobile

## Overall verdict

The pair is a coherent, implementation-oriented mobile UX draft, but it is not yet a reliable downstream contract. The largest blockers are mechanically broken source paths, an incomplete/mismatched component inventory, and missing Key Flows for load-bearing E04 behavior; the document shape and core interaction posture are otherwise strong.

## 1. Flow coverage — thin

Checked the confirmed intake, the E01–E04 scope stated in the GDD, every IA surface, and all four named Key Flows. Each existing flow has a named protagonist, numbered steps and a climax; applicable failure handling is present in the Day 1 and end-day flows.

### Findings

- **high** The stated E04 scope includes a regular-customer relationship branch and one help/refuse choice, but neither has a protagonist Key Flow; their relationship-only rewards and separation from commercial revenue/XP therefore have no end-to-end UX contract (`EXPERIENCE.md` Foundation, Key Flows). *Fix:* add a numbered Day 2/3 regular-customer/help flow with a climax, refuse/help branches, feedback placement, and the rule that help orders do not affect commercial totals.
- **medium** The Day 3 demo/campaign ending is only an IA row and is not exercised by a Key Flow, leaving the final summary, demo completion state, insolvency precedence, and New Campaign confirmation underspecified (`EXPERIENCE.md` Information Architecture, Key Flows). *Fix:* add a compact Day 3 completion flow or extend Mai's flow through both normal demo end and insolvency failure.
- **medium** Boot/storage recovery has several important states but no protagonist flow connecting corrupt/incompatible data, same-commit backup recovery, Play Without Saving, and safe exit (`EXPERIENCE.md` State Patterns). *Fix:* add one recovery flow focused on the choice points a player actually sees.

## 2. Token completeness — adequate

All YAML color tokens have hex values, all prose `{path.to.token}` references resolve, and typography/rounding/spacing references use valid paths. The palette is single-mode by design, which is acceptable for the demo.

### Findings

- **critical** No contrast targets or measured pairs are recorded, and the load-bearing primary action pairing `{colors.text-primary}` on `{colors.tomato-action}` measures about 3.95:1, below the 4.5:1 target for 16px text (`DESIGN.md` Colors, frontmatter `components.action-button`). *Fix:* commit an AA target, adjust the action foreground/background pair, and record measured ratios for primary text, secondary text, disabled text, focus, warning/error and action states.
- **high** The frontmatter tokenizes only four of the ten visual components described in the body, so downstream generation cannot resolve stable component-level values for ingredient, oven, status bar, offer, feedback and ledger UI (`DESIGN.md` frontmatter `components`, Components). *Fix:* add component tokens for every canonical component or deliberately reduce the body inventory and name inherited values.
- **medium** Pressed, disabled, busy, focus and error states are required in prose but have no state tokens or explicit color/border treatment (`DESIGN.md` Components). *Fix:* define state values in the relevant component token objects, including a non-color distinction.

## 3. Component coverage — broken

Compared every named component in DESIGN.md.Components with EXPERIENCE.md.Component Patterns. Only Ticket/Order ticket can be interpreted as the same component, and even that name is inconsistent.

### Findings

- **high** Visual-only components lack behavioral rows: Action button, Order ticket (exact name), Oven status, Primary status bar, Offer modal, Feedback strip, Ledger row, Pause panel and Error panel (`DESIGN.md` Components; `EXPERIENCE.md` Component Patterns). *Fix:* establish one canonical component inventory and add meaningful behavior for each in EXPERIENCE.md.
- **high** Behavior-only components lack visual rows: Bake / Remove, Box, Deliver, Accept / Decline, Goal / Mission, Pause reason row and Retry Save (`EXPERIENCE.md` Component Patterns; `DESIGN.md` Components). *Fix:* either map these to a canonical Action button variant in both files or add explicit visual component rows.
- **medium** Ingredient control is called `Ingredient` in EXPERIENCE.md, and Order ticket is called `Ticket`; this breaks exact-name extraction (`DESIGN.md` Components; `EXPERIENCE.md` Component Patterns). *Fix:* use identical singular names in both spines and in frontmatter keys.

## 4. State coverage — thin

Boot/storage, active-play pause ownership, end-day commit failure and schema/revision distinctions are unusually well covered. Coverage becomes thinner when walking every IA surface beyond those cross-cutting states.

### Findings

- **high** Preparation/Market has no explicit cold-load, unaffordable purchase, empty/expired stock, invalid menu/price, insufficient recipe coverage, or Open Shop blocked states (`EXPERIENCE.md` Information Architecture, State Patterns). *Fix:* add a Preparation/Market subsection with entry/loading, valid/invalid, affordability and ready-to-open states.
- **high** Shop/Kitchen lacks explicit no-offer/idle, ticket-capacity-full, grace-period, expired-ticket-selected, discard confirmation, and simultaneous ready-oven/expiring-ticket states (`EXPERIENCE.md` HUD & Information Hierarchy, State Patterns). *Fix:* specify the UI response and focus priority for each state.
- **medium** Start/Continue and Demo End do not define empty/new-only, valid-continue, completed-demo and reset-confirmation states in State Patterns (`EXPERIENCE.md` Information Architecture). *Fix:* add surface-specific state rows and their available actions.
- **medium** Error/offline semantics are incomplete: the product does not promise offline play, but the UX never states what happens when the page is offline after assets are cached or when reload cannot fetch mandatory assets (`EXPERIENCE.md` State Patterns, Responsive & Platform). *Fix:* state that network/offline errors are boot-blocking when required assets are unavailable and distinguish them from IndexedDB availability.

## 5. Visual reference coverage — strong

No mockups or wireframes exist by explicit user choice. `imports/` contains only `.gitkeep`, so there are no visual artifacts to link and no orphaned references. The pair does not falsely imply visual approval.

### Findings

No findings.

## 6. Bloat & overspecification — adequate

Most detail is load-bearing for mobile game implementation. Architecture constraints are repeated where they affect player-visible behavior, though a few passages drift into implementation language.

### Findings

- **low** Command idempotency, runtime revalidation and transaction terminology occasionally read as architecture restatement rather than a player-visible behavior contract (`EXPERIENCE.md` Component Patterns, Interaction Primitives, State Patterns). *Fix:* keep the observable result in the spine and link to architecture for mechanism where detail is not needed for UX acceptance.
- **low** `Game Feel & Juice` conditionally proposes a reduced-motion option while Open Decisions leaves it unresolved, creating a soft scope suggestion downstream (`EXPERIENCE.md` Game Feel & Juice, Open Decisions). *Fix:* choose restrained defaults for demo or explicitly commit the option before stories are generated.

## 7. Inheritance discipline — broken

The two spines agree on pizza, demo scope and document ownership, but their source inheritance and shared names are not mechanically dependable.

### Findings

- **critical** Every `sources` path in both frontmatters is off by one directory level and does not resolve from the UX workspace: the GDD should be `../../pizza-gdd/gdd.md`, while architecture and project context should be `../../../game-architecture.md` and `../../../project-context.md` (`DESIGN.md` and `EXPERIENCE.md` frontmatter). *Fix:* correct and revalidate all six paths.
- **high** Shared component names are not canonical across frontmatter, DESIGN.md and EXPERIENCE.md (`action-button` vs Action button; `order-ticket` vs Order ticket vs Ticket; Ingredient control vs Ingredient). *Fix:* define a single display name/key mapping and reuse it exactly.
- **medium** E01–E04 are cited only as IDs and are not paired with their verbatim GDD epic names, weakening extraction for story creation (`EXPERIENCE.md` frontmatter and Foundation). *Fix:* include a small source-scope table with exact epic ID and title.

## 8. Shape fit — strong

DESIGN.md follows the canonical section order exactly. EXPERIENCE.md contains every required default plus the applicable HUD, Input Schemes, Onboarding, Pause, Responsive and Inspiration sections; the additional sections earn their place for a touch-first game.

### Findings

- **low** Open Decisions contains visual decisions already represented as `[ASSUMPTION]`, but there is no explicit approval status or owner per item (`EXPERIENCE.md` Open Decisions; `.decision-log.md`). *Fix:* add owner/status or keep these items only in the decision log so downstream agents cannot mistake them for blockers.

## Mechanical notes

- Broken source paths: 6 references across the two frontmatters.
- Token references checked: all prose/component `{...}` paths resolve.
- Meaningful visual files: none; `imports/.gitkeep` is scaffolding, not an orphaned reference.
- Mermaid: none present, so no syntax issue.
- Canonical component inventory is currently absent; exact naming mismatches prevent deterministic source extraction.
- Existing Key Flows all use numbered steps and named protagonists; Minh's flow has a clear climax but no explicit labeled failure branch.
