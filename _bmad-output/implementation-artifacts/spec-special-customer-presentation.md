---
title: 'Khách đặc biệt: avatar, chào và lời thoại hư cấu'
type: feature
created: '2026-10-07'
status: done
baseline_commit: 4580445
context:
  - _bmad-output/project-context.md
  - _bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md
---

<frozen-after-approval reason="user explicitly requests implementation within special-customer scope">

## Intent

Thêm trình bày khách đặc biệt vào lịch khách hiện có: ảnh bộ 20 nhân vật, tên/loại cấu hình, khung vàng vương miện cho VIP, tím camera cho KOL và đỏ cam chỉ cho nhân vật gây chú ý hư cấu. Dùng đúng ba khung trong `public/assets/references/Ba khung avatar pizza cao cấp.png`, không thay bằng khung vector khi asset có sẵn. Hiệu ứng chào VIP/KOL có thảm đỏ, ánh vàng và banner “Khách nổi tiếng ghé quán!”, kéo dài 2–3 giây trước khi khách vào hàng chờ. Bong bóng tiếng Việt khi gọi món/nhận bánh tự ẩn sau 3 giây và không chồng nhau.

## Boundaries & Constraints

Giữ ngân sách lịch, giá, nguyên liệu, số bánh, kiên nhẫn, thanh toán và các thưởng VIP hiện có; không thêm thưởng/uy tín/KOL gameplay. Không voice/audio/dependency. Dùng seed ổn định và tránh trùng nhân vật đang chờ. Pause reason riêng sở hữu lease; kết thúc/shutdown chỉ giải phóng lease đó. Trong chào dừng ca/lò/kiên nhẫn; các pause khác còn giữ thì ca chưa chạy. Respect reduced motion bằng hiển thị tĩnh, không nhấp nháy. Asset lỗi dùng fallback và không chặn game. Giữ bố cục ngoài avatar/hiệu ứng/bong bóng được yêu cầu; bong bóng trong vùng hàng khách, không che nút.

Ảnh gốc có nền trong suốt: tách bằng texture frames đo khoảng trống, giữ toàn bộ tóc/mặt và fit hình vào khung thay vì crop khuôn mặt. Người dùng đã cung cấp bảng 20 tên/câu thoại theo thứ tự ảnh, lưu đầy đủ trong cấu hình; không suy nhận diện từ ảnh. Loại VIP/KOL được cấu hình bằng dữ liệu, khung attention chỉ cho nhân vật hư cấu; không gán khung này cho 20 nghệ sĩ thật. Câu chung fallback: “Cho mình một pizza nóng nha!” và “Cảm ơn quán nha!”. Câu gọi thêm nước hoặc sốt chưa có yêu cầu cụ thể dùng fallback để không hứa món ngoài đơn. Câu cấu hình gọi món cụ thể chỉ dùng khi recipe khớp đơn thực tế, còn lại fallback. Phân loại mặc định mười nhân vật đầu VIP/mười nhân vật sau KOL là dữ liệu có thể đổi; không thêm tính năng gameplay từ phân loại. KOL dùng cùng mốc ngày 10 và xác suất 10% như cấu hình VIP hiện có, trên kênh cosmetic riêng, không tăng lượt. Mọi thoại là hư cấu trong game, không phải phát ngôn thật.

Phần Nước/nhân viên/nhiệm vụ ẩn chỉ cập nhật ghi chú và gợi ý trong lượt này, không triển khai gameplay ngoài khách đặc biệt. Nước gồm nước suối, Coca, nước cam. Bỏ đào tạo/công thức gia truyền theo quyết định mới. Đã xác nhận cứ sau 5–7 ngày nhân viên nguyên liệu bận một ngày; chỉ ghi chú trong lượt này.

</frozen-after-approval>

## Code Map

- `src/config/specialCustomers.ts`: danh mục tên/loại/frame/thoại và cấu hình trình bày.
- `src/domain/SpecialCustomers.ts`: chọn theo seed và fallback thoại khớp recipe.
- `src/runtime/CozyRuntime.ts`: metadata khách, intro lease opt-in theo scene, transient thoại và hoàn thành intro; không thay đường thanh toán.
- `src/presentation/SpecialCustomerPortraits.ts`: đăng ký 20 texture frame an toàn từ ảnh gốc.
- `src/scenes/CozyScene.ts`: preload, avatar/khung, chào và bong bóng, cleanup theo vòng đời.

## Tasks & Acceptance

- [x] Danh mục/seed/thoại có test selection ổn định, tránh trùng và mismatch fallback.
- [x] Runtime giữ lượt lịch và pause độc lập; test hết chào chỉ bỏ reason của nó.
- [x] Renderer tôn trọng giảm chuyển động, fallback và cleanup; hiển thị tách biệt thoại hư cấu.
- [x] Kiểm chứng giao một lần, không thêm thưởng/ảnh hưởng kinh tế.
- [x] Ghi quyết định Nước/nhân viên và đề xuất nhiệm vụ ẩn riêng.

Given cùng seed/day/slot và tập khách đang chờ, when chọn nhân vật, then kết quả giống nhau và không trùng active. Given intro cùng pause user, when intro kết thúc, then user pause còn. Given lò đang nướng, when chào, then giờ ca/lò/kiên nhẫn không tiến. Given thoại yêu cầu món khác, when hiển thị, then dùng câu chung. Given giao lại cùng đơn, when gọi giao, then không trả tiền/thoại nhận bánh lần hai. Given ảnh không tải hoặc reduced motion, when khách đến, then ca tiếp tục sau chào tĩnh/fallback và không lỗi.

## Verification

Typecheck, build-nolog và Vitest tập trung khách đặc biệt/VIP/lifecycle/portrait. Kiểm tra renderer Chromium tập trung nếu khả dụng; không full E2E.

## Kết quả kiểm chứng 2026-10-07

Build-nolog gồm typecheck đạt. 69/70 unit tập trung đạt; một assertion CozyKitchenV2 vẫn cho phép đặt đế đơn thứ hai khi lò đang làm đơn đầu, thất bại giống hệt runtime HEAD 4580445 trong test baseline riêng. Đây là test cũ trái luật một đơn đang làm, chưa sửa gameplay/test lịch sử trong lượt này. Ba Chromium 360×640 tập trung đạt: 20 avatar/3 khung nguồn giữ alpha, asset thật, reduced motion/thiếu asset, pause user và timer theo monotonic elapsed sau gián đoạn. Không full E2E.

Ba review độc lập đã đối chiếu: giả thuyết intro chồng lease bị loại vì guard arrival từ chối khi đang pause; vị trí chào đổi tâm y310 để banner không che crown/camera; timer chuyển khỏi smoothed Phaser delta sang performance.now với time-boundary rebase để tránh giữ bong bóng sau gián đoạn. Không đổi ngân sách/tiền/kho/VIP hiện có. Chưa triển khai nước hoặc nhân viên bận.

## Suggested Review Order

- Lượt khách hiện có nhận metadata, giữ guard và đường thanh toán.
  [CozyRuntime.ts:599](../../src/runtime/CozyRuntime.ts#L599)
- Pause lease chỉ dừng chào, không mở lại pause khác.
  [CozyRuntime.ts:65](../../src/runtime/CozyRuntime.ts#L65)
- Khung ảnh gốc và bong bóng hư cấu trong scene.
  [CozyScene.ts:619](../../src/scenes/CozyScene.ts#L619)
- Danh mục và thoại do người dùng cung cấp.
  [specialCustomers.ts:7](../../src/config/specialCustomers.ts#L7)
- Tách asset giữ đủ tóc/mặt/vương miện/camera.
  [SpecialCustomerPortraits.ts:95](../../src/presentation/SpecialCustomerPortraits.ts#L95)
- Bằng chứng pause và thanh toán một lần.
  [CozySpecialCustomers.test.ts:32](../../src/runtime/CozySpecialCustomers.test.ts#L32)