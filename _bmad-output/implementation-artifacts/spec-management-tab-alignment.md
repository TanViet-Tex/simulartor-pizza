---
title: Align management navigation tiles
type: bugfix
created: 2026-10-14
status: done
route: one-shot
---

# Align management navigation tiles

## Intent

**Problem:** The original illustration's unequal icon centers and tile borders did not match the selected overlay or centered labels, particularly Tổng kết.

**Approach:** Center the original transparent icon pixels within each of the five equal slots. Use the same cream rounded frame geometry for neutral and selected states. Preserve navigation bounds, labels, icon artwork/colors, hit regions, animation and reduced motion. Limit changes to the management navigation strip.

## Suggested Review Order

- Cache centered icon artwork on the existing raster grid.
  [HubHeader.ts](../../src/presentation/HubHeader.ts#L40)
- Paint matching tile frames and preserve input/motion behavior.
  [HubHeader.ts](../../src/presentation/HubHeader.ts#L78)

## Verification

Build/typecheck passed. Focused Chromium360×640 test passed across all five tabs, including 150ms selection, 96% press scale, unchanged icon color interiors, stable hit rectangles and reduced motion. Independent review found no actionable issues. Inspected summary-selected.png: all five icons share their label center and selected/neutral tile edges align. Proof: ui-baseline/management-tab-alignment-2026-10-14/summary-selected.png.
