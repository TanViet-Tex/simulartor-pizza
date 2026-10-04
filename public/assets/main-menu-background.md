# Main menu background

- Asset: `main-menu-background.png` (940 x 1672).
- Generated with the built-in imagegen tool on 2026-10-01.
- User-supplied portrait menu illustration used as the style/composition reference.
- Inspected before integration: blank sign, no baked menu controls/lettering, pizza and oven positioned for independently rendered title, buttons, steam and glow.

## Final generation prompt

Use case: stylized-concept. Asset type: portrait 9:16 background illustration for a mobile pizza game menu. Input image 1 is a STYLE AND COMPOSITION REFERENCE only. Create a new hand-painted cozy pizza-shop illustration matching its warm daylight, cream plaster, terracotta-and-cream awning, hanging vines, left sunny window, glowing brick oven on the right and large fresh basil/tomato/cheese pizza on a wooden counter. At the top, a large BLANK cream hanging sign occupies normalized y=0.08 through 0.30, centered, for code-rendered Vietnamese title. Pizza board dominates y=0.48 through 0.67. Oven opening near normalized x=0.79,y=0.45. Bottom third y=0.70 through 1.0 should have uncluttered warm sage cabinet/wood texture and no objects, reserved for THREE code-rendered buttons. Keep pizza free of painted steam; animated steam will be added separately. Soft rounded cartoon forms, smooth outlines, painterly shading, warm cream/terracotta/sage/wood palette, inviting polished storybook game art. No lettering anywhere, NO buttons, NO UI, no symbols that resemble menu controls, no watermark. Preserve portrait 9:16 composition without stretching.

## User-requested refinement, 2026-10-01

The built-in imagegen tool edited the existing background to reduce the pizza and board. The inspected result replaces the workspace asset, with the rest of the composition retained.

Edit the supplied pizza-shop menu background. Preserve the exact 940x1672 portrait composition, blank hanging sign, awning, plants, window, oven, colors, lighting, entire bottom cabinet area and all other objects. Change ONLY the foreground pizza and wooden pizza board: reduce the pizza diameter by about 20 percent, reduce its wooden board by about 12 percent, keep both centered on the existing counter in the same perspective. Reveal matching wooden tabletop around them. The entire pizza and board should sit naturally WELL INSIDE the countertop edges, not loom over or overhang the table. Maintain the detailed melted cheese, basil, tomatoes, crust and warm painterly style. No text, no buttons, no new objects, no curtains baked into this image, no painted steam. Keep oven/window at their original coordinates for existing animations.

## Countertop repair, 2026-10-02

The built-in imagegen tool edited the current background to align the foreground countertop's rear edge across the left and right sides. The inspected result replaces the workspace asset; pizza steam remains rendered separately in code.

Edit the supplied cozy pizza-game menu background. Preserve the exact 940x1672 composition and all objects, colors, lighting, awning, BLANK sign, window frame and its crossbar, plants, brick oven, cabinet, pizza and wooden pizza board. FIX ONLY the foreground wooden countertop geometry behind and beside the pizza: its LEFT rear edge is currently lower than the RIGHT rear edge, so the left tabletop looks shallower and disconnected. Make this ONE continuous level tabletop spanning left to right, with the rear edge aligned around image y=925 to 935 pixels across the whole width. Raise/fill the missing left strip around y=930..965 with matching pale wood, naturally occluding the very bottom of the left checkered dining table if needed. Keep the foreground front edge at its current position and maintain coherent wood grain, consistent depth and perspective on both sides of the pizza. No mismatched step or abrupt vertical seam where the two sides join. Keep pizza and its board EXACTLY the same size and position. No steam painted into the image, no curtains, no text, no buttons, no other changes.

## Separate curtain asset

`menu-curtain.png` is a 724 x 2172 transparent curtain generated with the built-in imagegen tool. Phaser bends it from a fixed top anchor; the backdrop contains no duplicate curtain.

Use case: stylized-concept. Asset type: standalone animated game prop on TRANSPARENT background. A single narrow ivory linen window curtain panel hanging vertically, seen straight-on with a slight natural drape. Top edge fixed, four soft gathered folds descending into a gently uneven scalloped hem, muted terracotta narrow stitched trim near bottom. Soft sunlight from left, subtle cream/ochre shadows, softly outlined hand-painted cozy storybook pizza-cafe style. Curtain must fill most of a tall portrait image, approximately one unit wide and three units high, with a little transparent margin around ALL edges and the entire hem fully visible. Only one cloth curtain panel: no rod, no window, no room, no background, no text, no characters, no decorations. Cloth relaxed in neutral hanging pose, not permanently windswept; will be deformed and animated in code. Actual transparent alpha background.
