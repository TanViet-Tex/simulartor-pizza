---
title: Reduce shop visitors by twenty percent on days 1–30
type: balancing
created: 2026-10-14
status: done
route: one-shot
---

# Reduce shop visitors by twenty percent on days 1–30

## Intent

**Problem:** The user wants 20% fewer customers entering the shop throughout days 1–30.

**Approach:** Reduce the final shop arrival budget to round(previous count ×0.8), after app allocation and decoration/expansion bonuses. Preserve help/referral opportunities and app orders; retain the first ordinary customer and distribute retained visits across the original shift. Preserve slot IDs, times, duration, preparation and grace. Forecast and actual opening use the same builder. Day31+ and custom injected schedules are unchanged. Saved checkpoints require no migration; subsequent opened shifts use the new policy.

## Suggested Review Order

- Retain a stable subset of visits while preserving special opportunities.
  [ShopTraffic.ts](../../src/domain/ShopTraffic.ts#L5)
- Apply the reduced budget to the shared real-arrival/forecast builder.
  [CozyRuntime.ts](../../src/runtime/CozyRuntime.ts#L570)
- Check all thirty days with app/bonuses/seeds and opening-hour integration.
  [ShopTraffic.test.ts](../../src/domain/ShopTraffic.test.ts#L8), [CozySchedule.test.ts](../../src/runtime/CozySchedule.test.ts#L32)

## Verification

Build/typecheck passed. 37 focused tests passed across traffic, opening hours, base schedule/density and advertising/save restoration, including 360 day/seed/app/bonus combinations. Independent review found no functional issues; updated the full-queue assertion to address a retained arrival ID from the reduced schedule and reran that suite. No UI changes or checkpoint schema migration.
