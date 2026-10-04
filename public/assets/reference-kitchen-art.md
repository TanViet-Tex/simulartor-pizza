# Tài nguyên bếp theo ảnh mẫu — 2026-10-04

Nguồn: `references/bán hàng.png`. Công cụ: imagegen built-in, lưu ảnh gốc sinh ở Codex generated_images và chép bản dùng trong dự án vào assets. Không dùng ảnh mẫu chứa chữ/khách làm nền runtime.

## Bộ ảnh và prompt cuối

- `reference-kitchen-clean.png` (941×1672): Edit target portrait game UI. Preserve full aspect ratio, all positions, wood/copper/cream, plants/awning/lighting. Remove all text/numbers, six customer portraits and selection, eight recipe pizzas, both ovens, tutorial icon and action icons. Keep six empty circles, eight recipe frames, board/two buttons, static ingredient illustrations and trash/pause/coin/clock. No reflow or redesign.
- `reference-kitchen-sprites.png` (1254×1254, alpha): Exact4×4 atlas, no labels/background. Row0 Linh/Mai/Nam/Vy portrait busts; row1 Minh/An/cheese/mushroom; row2 sausage/pepperoni/vegetable/BBQ; row3 seafood/ham-pineapple/two empty. Warm polished cartoon matching reference, centered subjects inside equal cells.
- `reference-kitchen-ovens.png` (2172×724, alpha): Exact3 horizontal equal cells, same red cream-rim gold-handle oven silhouette, left empty, middle occupied golden pizza, right charred pizza, each isolated/centered, green light/feet, no labels/background.
- `reference-kitchen-assembly.png` (2172×724, alpha): Exact3 horizontal equal cells, same oblique round dough silhouette, bare dough / tomato spread / tomato with shredded mozzarella. No bowls/board/tools/text/background, matching cartoon style.

Atlas frames đăng ký tại `src/presentation/ReferenceKitchenArt.ts`; khoảng trong suốt bỏ bằng metadata frame Phaser, không sửa raster. Hộp dùng riêng `references/hộp pizza.png` từ yêu cầu trước.

Tiền/ngày/clock, tên/đơn/patience, nhãn/khóa/count và selection render theo runtime. Các hình recipe chỉ minh họa; khóa món/nguyên liệu không được runtime hỗ trợ. Chưa triển khai danh mục/mua19nguyên liệu từ backlog.
