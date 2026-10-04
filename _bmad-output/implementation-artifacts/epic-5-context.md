# Epic 5 Context: Kinh tế và khách dài hạn

## Latest user direction — supersedes initial compilation below

After this context was compiled, user explicitly removed the3daydemo and requested money-purchased recipes, then delegated completion of thewholeEpic5. The current implementation authority/scope is spec-5-1-expanded-ingredient-and-recipe-catalog.md, including provisional balance there, tracked5.1/5.2 plus supplier/day4+economy. Do not use older pending/catalog-only statements below to restore demo limits or stop alreadydelegatedimplementation. Preserve savedmoney/lots/previouslyunlockedrecipes and unrelatedUI. Recipeprice/quantity/suppliervalues are provisionalimplementationconfig, not playtest-certifiedbalance.

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Extend the established economy beyond the three-day demo: consistent ingredient and recipe data, preparation purchasing based on actual menu needs, familiar suppliers, customer return/referral behavior, and stock/profit/demand across days within shop capacity. E05 depends on E04 and remains a post-demo epic. The current request starts Story 5.1 preparation; it does not authorize activating every proposed recipe or the remaining long-term economy systems.

## Stories

- Story 5.1: Danh mục 19 nguyên liệu và dữ liệu công thức mở rộng
- Story 5.2: Gợi ý mua theo menu và số phần chuẩn bị

## Requirements & Constraints

- The ingredient membership is approved: one pizza base; tomato, white cream, BBQ, pesto and spicy sauces; mozzarella; sausage, pepperoni, chicken and ham; shrimp and squid; mushroom, bell pepper, onion, sweet corn, olive and pineapple. “Xóa tất cả” is an action, never an ingredient. Each ingredient requires stable identity, name, icon, purchase price, unit and lotted stock/expiry. Player stock and lot dates are real state, never fixed catalog defaults.
- Eight recipe compositions remain proposed: cheese; mushroom; sausage; pepperoni; vegetable (bell pepper/onion/sweet corn/olive); BBQ chicken (chicken/onion); seafood (shrimp/squid); ham-pineapple. Every pizza uses one base and mozzarella. BBQ chicken uses BBQ sauce; the other seven use tomato sauce. Tomato means sauce, not an additional topping. White cream, pesto and spicy sauces belong only to future selected variants/custom requests; do not require them for these eight recipes or invent variants.
- Approval of the 19 ingredient names does not approve prices, units, non-base quantities, expiry rules, new recipe identities/mappings or unlock schedules. The sole confirmed quantity is one base per pizza. Do not silently set every sauce/cheese/topping to one portion.
- **Unresolved before activation:** final purchase prices and units per ingredient; sauce/mozzarella/topping quantities per recipe; per-ingredient shelf life and its compatibility with existing lot-day rules; identity/icon mappings that preserve existing content; whether new recipes are catalog-only or activated in the demo/campaign, and their unlock timing. User choices on quantities/prices/expiry and catalog-only versus demo activation are still unanswered. Existing temporary values are implementation compatibility data, not newly approved balance. Preserve them until an explicit decision or record proposals separately; do not invent replacements.
- The long-term supplier price table, supplier discounts, return/referral rates and recovery after a loss-making day also require decisions before those systems can be implemented. They are outside the present 5.1 request.
- Current documented delivery already includes 19 ingredient entries in Market/Stock and free assembly, while only three sale recipes are supported. New-ingredient prices remain temporary. Stock filters, real lot detail and an informational planner already work for supported recipes. These delivered UI flows do not mean all of E05 or the eight proposed recipes are complete; earlier “documentation-only” notes are historical where later implementation records supersede them.
- Purchasing remains player-driven: normal Market purchases before/between days spend once and immediately add lots; the shift consumes purchased stock. Express replenishment is only supplemental during a shift, at `ceil(day price × 1.6)`, delivered after five simulation seconds, with pause stopping delivery. Keep current money, lots, cost accounting and opening-day behavior.
- Planning sums ingredient demand across selected dishes before subtracting usable stock once: `max(0, total need − available)`. Exclude expired/future lots and quantities reserved for orders; evaluate validity for the preparation day. Suggest only ingredients used by the selected supported menu. Planning never purchases, spends, reserves or changes inventory.
- No global low-stock/near-expiry thresholds are approved. Current UI explicitly asks players to select criteria and preparation portions. Retain those working interactions unless separately changed; do not introduce invented warning thresholds or customer forecasts. Existing supported-recipe quantities do not approve quantities for the full proposed catalog.
- Verification for implementation must focus on affected config/domain and Market/Stock flows, compatibility with old saves, expiration/reservations, purchasing and shared-ingredient demand. Use focused unit/E2E checks. Full Chromium/WebKit viewport matrices are reserved for the agreed release/epic milestone, not context compilation.

## Technical Decisions

- Domain owns stock, economy and order results in pure TypeScript. All gameplay mutations go through typed runtime dispatch; presentation reads selectors/view models and sends intents. Scenes never calculate a second economic rule or write persistence directly.
- Validate raw configuration once into immutable validated data. Keep stored IDs stable; missing/duplicate IDs, invalid references and unsupported values must fail validation rather than fall back silently. Balance changes require deliberate content-version handling. Do not import planning documents into runtime.
- Inventory remains lotted, with earliest valid expiry consumed first. Commands apply atomically or leave state unchanged. Consume actual selected layers once at bake; release unused reservations when appropriate. Cost follows consumed lots. Purchasing is cash flow; do not subtract its cost again as ingredient consumption or count burnt/discarded pizzas twice.
- Preserve current campaign money, inventory, progress, upgrades and checkpoint compatibility. Do not rename existing save IDs, reset campaigns or silently repair unknown content. Any required content migration must be explicit, validated on a copy and retain the original on failure.
- Ingredient purchases and shift actions update RAM. Retain campaign-creation/end-day checkpoint boundaries and the already authorized preparation-upgrade boundary; no per-tap autosave or mid-shift save. Reload restores the latest unclosed day's checkpoint. Day commit remains prepare → commit → confirm; retry uses the same commit ID/payload, and closed days cannot replay.
- Simulation clock is the gameplay time source. Each modal/adapter owns its pause lease and releases only that lease; closing planning or confirmation must not resume another owner's pause.

## UX & Interaction Patterns

- Preserve the approved 360×640 FIT geometry, cartoon artwork/theme and existing controls. Latest scoped approvals supersede older baseline sections: kitchen has six customer frames, eight recipe slots in 2×4 and 19 ingredients plus trash in 5×4; unsupported dishes stay locked. Story 5.1 data work does not authorize reflow, changing slot counts, redesigning the kitchen or other tabs.
- Preserve the common five-tab header/wood background, Market's 19-item scrolling list and quantity/confirmation controls, and Stock's 19-item scrolling list, three filters, lot details and Market navigation. Stock/Shop/Missions already use the shared paper/copper theme; Summary has its separately authorized reference layout. Respect the latest baseline rather than restoring older screenshots.
- Stock shows real usable quantities and per-lot dates, distinguishes reserved stock, and links “Đi chợ mua thêm” to Market in the same session. Unsupported recipe planning must clearly remain unavailable. Never turn example screenshot stock/prices/expiry into defaults.

## Cross-Story Dependencies

- E04 supplies the campaign/progression/persistence foundation. E03 owns the delivered hub/Market/Stock presentation; 3.7 integration depends on coherent 5.1 data and 5.2 planning, not a duplicate UI rewrite.
- 5.2 depends on finalized 5.1 recipe quantities/units and activation scope. Its existing supported-menu subset can remain operational while the expanded catalog is unresolved.
- Subsequent E06–E09 systems build on long-term economy data but are not authorized by starting 5.1. Keep supplier/customer expansion and recipe activation separate from catalog preparation until their parameters and scope are approved.
