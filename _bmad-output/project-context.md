---
project_name: 'Game pizza - ten phat hanh chua chot'
user_name: 'CuTo'
date: '2026-10-02'
sections_completed: ['technology_stack', 'engine_rules', 'performance_rules', 'code_organization', 'testing_rules', 'platform_build_rules', 'critical_rules']
existing_patterns_found: 8
status: 'complete'
rule_count: 94
optimized_for_llm: true
sources:
  - 'implementation-artifacts/ui-baseline-2026-10-02.md'
  - 'planning-artifacts/pizza-gdd/gdd.md'
  - 'planning-artifacts/pizza-gdd/epics.md'
  - 'game-architecture.md'
---

# Project Context for AI Agents

_Tệp này chứa các quy tắc và patterns quan trọng mà AI agent phải tuân theo khi triển khai game. Chỉ giữ những chi tiết dễ bị bỏ sót; GDD và game-architecture.md vẫn là nguồn đầy đủ._

---

## Technology Stack & Versions

- Phaser `4.2.1`, TypeScript `5.7.2`, Vite `6.3.1`, Terser `5.39.0`.
- Node.js `24.21.0` LTS, npm `11.19.0`.
- IndexedDB native cho campaign checkpoint; không ORM hoặc database server.
- Vitest `4.1.11` cho unit/integration; Playwright `1.63.0` cho Chromium/WebKit.
- Mobile web dọc: Chrome Android và Safari iOS; desktop chỉ là nền tảng kiểm tra phụ.
- Không React, backend, auth, realtime, physics, service worker/PWA hoặc MCP trong baseline demo.
- Chưa có source tree hoặc dependency được cài; các phiên bản trên là quyết định kiến trúc, không phải trạng thái repository hiện tại.
- Không dùng API hoặc ví dụ Phaser 3 nếu chưa kiểm tra với Phaser `4.2.1`.
- Starter chính thức là `phaserjs/template-vite-ts` version `1.4.0`; khi được phép scaffold phải clone vào staging và ghi commit SHA, không clone đè repository.
- Giữ Vitest `4.1.11` với Vite `6.3.1`; không tự nâng Vitest 5 hoặc bất kỳ major nào để “dùng bản mới nhất”.
- Khi được phép cài, pin exact version và tạo lockfile; không thêm wrapper IndexedDB, ORM hoặc package ngoài bảng quyết định nếu chưa cập nhật kiến trúc.

## Critical Implementation Rules

### Epic 6: app và shipper — 2026-10-04

App mở miễn phí từ ngày5, mặc định tắt cho save cũ; bật/tắt trong chuẩn bị qua transaction checkpoint hiện có. Không lưu giữa ca. Đơn app1–3pizza cùng món: book shipper trước bake, từng bánh tiêu hao FEFO tại bake rồi đóng hộp/tích vào đơn. Theo yêu cầu tiếp theo, đủ hộp và rider tới thì **bấm Giao bánh hoàn tất/nhận tiền ngay**, không thời gian chuyến hoặc phạt đến trễ. Doanh thu gross/phí riêng/net cash; XP/mục tiêu một outcome/đơn, lượng pizza bán riêng. Cấu hình tạm: hạn90s, shipper tới10s (mưa15s), phí5xu; hết hạn chưa giao hủy. Một booking, giao xong giải phóng shipper/trả slot ngay. Availability nhân viên đóng băng đầu ca; default false, Epic8 cung cấp roster thật, không thuê/lương giả. Nhân viên cũng chốt đơn ngay nhưng vẫn trở về20s/mưa30s trước nhận đơn tiếp, chặn chốt ngày trong lúc về. Ngày6/7/8/9 lần lượt mưa/cao điểm/bình thường/lễ hội, lặp4ngày; event/app đóng băng đầu ca. Giữ Pause/background lease và UI đã duyệt. Xem [spec Epic6](implementation-artifacts/spec-6-delivery-and-events.md).

### Chạy khi rời tab, dừng bằng Pause — 2026-10-04

Người dùng xác nhận game vẫn chạy khi bấm ra ngoài/chuyển tab; chỉ chủ động Pause mới dừng. Yêu cầu này thay auto-pause visibility/gap và recovery Tiếp tục trong các tài liệu cũ. Browser có thể hạn chế render nền; đồng hồ simulation đồng bộ thời gian thực khi chạy lại, gồm ngày/lò/kiên nhẫn/sinh khách/hỏa tốc. Pause/Cài đặt/Menu và modal nghiệp vụ/save/tutorial giữ lease và không cộng thời gian đã dừng. Không bỏ chặn input modal, không lưu giữa ca, không đổi tiền/kho/UI. Xem [spec](implementation-artifacts/spec-background-play-until-manual-pause.md).

### Epic 5: chơi tiếp và mua công thức — 2026-10-04

Người dùng giao hoàn tất Epic 5, bỏ giới hạn demo 3 ngày và mua công thức bằng tiền. Runtime dùng catalog 19 nguyên liệu/8 pizza; Phô mai/Nấm mở sẵn, sáu món còn lại mua trong chuẩn bị và lưu atomic tiền + sở hữu, không ghi giữa ca. Save v1 được kiểm tra checksum gốc rồi chuyển schema 2, giữ tiền/lô/XP/công thức đã mở/campaign identity; kết thúc demo ngày 3 được tiếp ngày 4, phá sản vẫn giữ. Giá/định lượng trong config là tạm cần playtest. Ngày 4+ dùng lịch nối tiếp, mục tiêu riêng từng ngày, khách quen/referral và nhà cung cấp sau 500 xu mua thường (giảm 10% từ ngày sau, hỏa tốc không tính). Báo cáo lưu gọn, master progression lưu một lần và lịch sử đọc lại bằng prefix. Gợi ý Kho dùng menu đã sở hữu đang bán, số phần 0–100 do người chơi nhập, cộng nhu cầu rồi trừ available một lần; không tự mua. Giữ bố cục đã duyệt, chỉ phân trang phần Menu/gợi ý để đủ nội dung. Xem [spec Epic 5](implementation-artifacts/spec-5-1-expanded-ingredient-and-recipe-catalog.md). Không coi đây là nội dung cốt truyện 30 ngày hoặc hoàn tất E09.

### Thông báo hết Ngày1 trước Tổng kết — 2026-10-04

Người dùng tiếp theo yêu cầu Ngày1 kết thúc hiện thông báo một nút Đã hiểu rồi mới sang Tổng kết. CozyScene tự gọi closeDay hiện có khi Ngày1 awaiting-close, không pause và canCloseDay; kết thúc sớm vẫn xác nhận. Khung compact chặn input, sở hữu lease riêng; acknowledgement chỉ đóng thông báo/trả lease của mình và chọn Tổng kết. Ngày khác giữ cách chốt cũ, không đổi clock/grace, luật tiền/kho hoặc checkpoint. Yêu cầu này thay riêng ràng buộc chốt thủ công Ngày1 trong tài liệu trước. Save/recovery ưu tiên, reload vẫn dùng checkpoint hiện có. Xem implementation-artifacts/spec-day-one-ended-notice.md.

### Tổng kết theo ba ảnh references — yêu cầu triển khai 2026-10-04

- Người dùng cho phép thay riêng tab Tổng kết theo `bảng tổng kết.png` (bốn thẻ, thanh Kho, footer đen viền đồng); hai modal theo mẫu đánh giá/doanh thu. Giữ năm tab và renderer các tab khác, bếp/menu; số liệu ảnh không phải config. Hai đánh giá gần nhất theo ngày, toàn bộ đánh giá trong modal cuộn; thu chi từ snapshot thật, nhập kho là dòng tiền, bánh bỏ/cháy đã nằm trong giá vốn. Metadata mới optional (`salesByRecipe`, `costByIngredient`, `review.avatarIndex`), save cũ giữ totals/ghi rõ thiếu chi tiết; không thêm lưu giữa ca hoặc đổi schema. Modal trả lease của mình, giữ visibility/owner khác. Spec [triển khai](implementation-artifacts/spec-reference-summary-and-details.md) là nguồn trạng thái kiểm tra, không chứng nhận toàn bộ E03 hay các tab khác đã xong.

### Pause theo ảnh ba nút — 2026-10-04

- Pause dùng nguyên PNG `references/Bảng tạm dừng tiệm pizza.png`, giữ tỷ lệ và3vùng Tiếp tục/Cài đặt/Menu. Settings giữ user lease, hiệu ứng có volume thật; nhạc chưa có, ghi rõ/disabled. Giảm chuyển động chia sẻ Menu/bếp. Tiếp tục trả user lease của scene và recovery hợp lệ, không trả order/tutorial/orientation hoặc owner khác; hidden vẫn chặn. Menu giữ cùng RAM runtime/đơn/lò/thời gian, không chốt ngày hoặc ghi giữa ca. Direct modes cũng có Menu/Continue/Newconfirm. Chốt ngày chuyển sang chạm đồng hồ ca hiện có, không thêm nút thứ4 trong ảnh pause. Không đổi mua Chợ/kho/tiền. Xem [spec](implementation-artifacts/spec-reference-pause-flow.md).

### Khung thông báo dùng chung — yêu cầu 2026-10-04

- Thông báo đơn giản có một hành động phải co chiều cao theo chữ: tiêu đề → nội dung → nút, khoảng cách 14px, padding giấy 18px sau viền, nút cao 48px; rộng 332px và căn giữa canvas. Ghép đầu/giấy/đáy và ba lát nút để giữ tỷ lệ art, không ép nhỏ toàn ảnh. Panel dài tối đa 600px, cuộn nội dung, giữ nút cố định. Bảng cài đặt/pause/hộp nhiều hành động giữ chức năng và bố cục riêng. Xem [spec](implementation-artifacts/spec-compact-notifications.md).

- Thông báo dùng hai PNG gốc trong `public/assets/references`: `Khung thông báo tiệm pizza ấm cúng.png` cho một hành động tiếp tục/đóng, `Hộp thoại thông báo pizza ấm cúng.png` cho hai quyết định. Khi mở, nền ngoài khung đen toàn canvas và input phía sau bị chặn. Controls phụ (âm thanh, số lượng, giá, lưu/recovery) vẫn truy cập được trong nội dung; không bỏ callback hoặc thay luật lưu/pause. Chữ dài/lớn cuộn trong vùng giấy. Hướng dẫn inline không bị biến thành modal chặn thao tác. Xem [spec](implementation-artifacts/spec-shared-notification-frames.md).

### Chợ mua chủ động và hỏa tốc bổ sung — đã triển khai 2026-10-04

- Chợ đã khôi phục mua chủ động trước ca/giữa ngày theo `references/chợ.png`: 19 nguyên liệu hiện có, bốn nhóm lọc, danh sách cuộn/kéo, chọn1–100 phần, giá ngày/tồn/tổng/tiền còn thật và xác nhận dùng khung2nút. `market.buy` trừ một lần và nhập Kho ngay; giữ nghiệp vụ, schema/checkpoint và giá tạm hiện có, không autosave khi mua. Kho chỉ sửa lời nhắc/nút mua thêm. Price editor và footer mở ngày hiện có giữ chức năng. Hỏa tốc vẫn chỉ bổ sung trong ca, `ceil(giá ngày ×1.6)`, nhận sau5s simulation, pause dừng giao. Build, 43unit và 6E2E tập trung đạt cả mua→Kho→mở→dùng→cuối ngày→mua/mở Ngày2; xem [spec](implementation-artifacts/spec-reference-market-purchases.md). Bộ lọc Kho/gợi ý theo menu và toàn bộ E03/E05 không được coi đã hoàn thành.

### Khóa hàng chờ và icon nút bếp — yêu cầu 2026-10-04

- Hai ô hàng chờ khóa dùng icon cân giữa trong vòng tròn hiện có, không vẽ thêm nền tròn lệch. Chạm mở “Hãy nâng cấp cửa hàng để được mở ô hàng chờ.”, đóng trả lease riêng, không mua/mở ô/trừ tiền. Cap6 không còn khóa. Hai nút Đóng hộp/Giao bánh có icon SVG trước chữ, giữ bounds/enable/action. Phô mai giữ nguyên. Xem [spec](implementation-artifacts/spec-queue-locks-and-action-icons.md).

### Avatar khách — yêu cầu 2026-10-04

- Avatar dùng5 sheet nền trong suốt riêng ở `public/assets/customer-portraits/`, giữ150 identity/thứ tự/tên và ảnh references gốc. Crop khoảng trống theo alpha, scale cùng tỷ lệ, căn giữa trong vòng xanh; không ép vuông gây méo. Giữ vị trí/vòng xanh/vùng chạm hàng chờ và UI khác. Xem [spec](implementation-artifacts/spec-customer-avatar-alignment.md).

### Bỏ bắt buộc xoay dọc — yêu cầu 2026-10-04

- Bỏ lời nhắc/overlay xoay điện thoại về chiều dọc và pause tự động theo orientation; màn ngang không chặn Tiếp tục. Giữ pause user/tutorial/order/visibility/gap và ownership hiện có. Resize vẫn cập nhật renderer; bố cục360×640 FIT giữ nguyên. Cập nhật bố cục ngang sẽ có yêu cầu riêng, chưa triển khai. Quyết định này thay các yêu cầu orientation gate cũ. Xem [spec](implementation-artifacts/spec-remove-portrait-gate.md).

### Bếp tự phối và đặt hỏa tốc — triển khai 2026-10-04

- Yêu cầu mới thay luật/hiển thị tương ứng của bếp cũ: pizza vẽ code theo thứ tự lớp19 nguyên liệu; có đế thì nướng được dù sai công thức, giao mới chấm sai. Hai nút chính Đóng hộp/Giao bánh; nguyên liệu/lò là vùng chạm, thớt không chữ, không viền vàng. Giữ tọa độ360×640/nền sạch; font chỉnh trong ô, chạm có feedback.
- Khách đến tự hiện đơn; chạm khách khác đổi thứ tự làm nhưng không đổi oven-owner. Hàng chờ4/nâng6; avatar150 từ năm sheets references, tên/ID ổn định, clip tròn/vòng xanh. Lò0 chín6–8s, lò1 4–6s, lò2 2–4s, cháy khi `> perfectEnd`; thanh bo góc trắng→xanh→đỏ.
- **Luồng mua đã khôi phục:** Chợ mua thường trước ca/giữa các ngày, trừ tiền và nhập Kho; ca dùng tồn kho. Hỏa tốc chỉ bổ sung trong ca: xác nhận giá `ceil(giá ngày ×1.6)`, nhận sau5s simulation/vòng tiến độ. Pause dừng giao hàng; đang giao chưa chốt ca. Bánh tiêu hao đúng lớp thật một lần tại bake; giá vốn theo lô đã dùng, mua kho/giá vốn không trừ hai lần. Việc khôi phục Chợ không thay luật mở ca/nhận đơn khi kho0.
- Mặc cả sau làm xong/giao: đồng ý chốt giá giảm/khách quay lại; từ chối giá gốc nhưng sao thấp/loại identity khỏi lượt sinh sau. Không thanh toán/ghi kết quả trước quyết định hoặc thanh toán lặp.
- Nâng cấp chỉ chuẩn bị; checkpoint thêm `upgrades`/`customerMemory`, save cũ mặc định0/cap4. Campaign lưu tiền/cấp cùng commit IndexedDB, khóa gameplay khi chờ/lỗi lưu, retry cùng payload. Mở rộng lưu chuẩn bị riêng **lò/hàng chờ**, không lưu giữa ca/triển khai toàn bộ đồ E07. `capitalPurchases` chỉ trừ dòng tiền; `pendingSpent` chờ ca sau, không trừ lại khi reload.
- Giá14 nguyên liệu mới/nâng cấp hiện **tạm** trong `src/config/kitchenEconomy.ts` (lò150/250 xu, hàng chờ200 xu), không lấy từ ảnh. Một đơn vị mỗi loại/bánh; chỉ3 công thức bán đã hỗ trợ, chưa tự mở8 món. Xem [spec](implementation-artifacts/spec-kitchen-free-assembly-and-express.md).

### Bếp theo ảnh bán hàng — yêu cầu triển khai 2026-10-04

- Màn bếp dùng nền sạch riêng `reference-kitchen-clean.png`, sáu khung khách/tám món2×4/nguyên liệu19+trash5×4, tọa độ chung360×640/FIT tại `ReferenceKitchenLayout.ts`. Dữ liệu động và sprites riêng, không đưa ảnh có chữ/khách/lò cố định vào nền runtime. Các mục chưa được domain hỗ trợ vẫn khóa.
- Hai nút chỉ **Đóng hộp / Giao bánh**. Đủ nguyên liệu chạm lò nướng; chạm lò để lấy; bỏ bánh qua ô xóa; remake/chọn kho qua thớt khi cần. Thớt `dough-board` và nguyên liệu `dough` có ID riêng, vùng chạm tối thiểu48CSS làm tròn lên và ưu tiên hình thật khi padding chồng. Giữ domain/luật tiền/đơn/timing, menu/hub cũ. Xem [spec](implementation-artifacts/spec-reference-kitchen.md).

### Trang trí/Tiện nghi chức năng — 2026-10-04, chỉ ghi tài liệu

- [Yêu cầu](implementation-artifacts/requirement-decoration-and-amenity-effects.md) chốt: trang trí tăng khách theo từng đồ3/5/5/8/5/3%; tiện nghi ghế5%, Wi-Fi8%, quạt5%, máy lạnh10%, loa5%, bàn ghế+10% kiên nhẫn, không tăng sức chứa. Mỗi loại một bản, đồ sở hữu chưa đặt không bonus; cộng trên gốc, quạt/máy lạnh lấy max, cap khách30%/kiên nhẫn40%. Chốt bộ hiệu ứng khi mở ngày, nối scheduler/patience thật, không đổi đồ trong ca hoặc tăng giá/sao/nướng.
- Mua chỉ trong chuẩn bị: tiền/sở hữu cùng giao dịch, lưu thành công rồi UI xác nhận; lỗi không mất tiền thiếu đồ, double-tap/retry một lần. Đặt vị trí hợp lệ/xem trước/xác nhận, cất giữ sở hữu; save đồ/vị trí/cấp, tính lại bonus không cộng lặp; save cũ giữ tiền/tiến độ và chưa có đồ mới. Đây là **bổ sung ranh giới lưu chuẩn bị cho đồ**, chưa triển khai, không tự áp dụng lưu mỗi tap/giữa ca. Giá dùng config dự án, không ảnh; nguồn giá/vị trí/sức chứa/scheduler policy còn cần xác định trước làm.
- BacklogE07: mở rộng7.1/7.2 và thêm7.4 hiệu ứng gameplay,7.5 giao dịch/save/migration. UI vẫn ưu tiên theo3.8, nhưng nút bật phải có chức năng thật, phần chưa làm có trạng thái rõ. **Chỉ note; chưa code/xem references/chạy build/test.**

### Tab Quán đề xuất — 2026-10-04, chỉ ghi tài liệu

- [Yêu cầu Quán](implementation-artifacts/requirement-shop-tab.md): xem trước + sáu mục Menu/giá, Trang trí, Thiết bị, Tiện nghi, Mở rộng, Nhân viên. UI/luồng là backlog3.8, giá ngày sau3.9; đơn cũ giữ giá lúc đặt, lãi/bánh chưa trừ chi phí chung. Mua đủ tiền/xác nhận/sở hữu và trừ tiền một lần, báo tiền thiếu, đặt/cất không mất sở hữu; lưu sở hữu/bố trí/nâng cấp cùng tiến độ theo checkpoint cần chi tiết hóa. Không suy ra giá/chỉ số/bonus từ ảnh, phần chưa làm phải rõ trạng thái.
- Phân epic mới của người dùng: giá/phản ứng khách E02–E03 (không mở lại E02 done); trang trí/thiết bị/tiện nghi/mở rộng **E07**; nhân viên **E08**, chuyển từ E07 cũ, vẫn giữ câu chuyện/khách đặc biệt E08. Epics/sprint đã thêm7.1–7.3 và8.1 backlog. **Chưa code hoặc xem references; chức năng vẫn là đề xuất/chưa triển khai.**

### Phân bổ epic và ưu tiên UI — 2026-10-04, chỉ ghi tài liệu

- Người dùng yêu cầu đưa các yêu cầu mới vào epic chưa hoàn tất và **ưu tiên giao diện cùng các luồng theo giao diện**. Đã bổ sung backlog **E03: 3.4 hub UI/luồng, 3.5 modal đánh giá, 3.6 modal thu chi, 3.7 Kho/lọc/xem lô**; **E05: 5.1 danh mục 19 nguyên liệu/công thức mở rộng, 5.2 gợi ý mua theo menu**. Không mở lại E02 đã done. Xem [epics](planning-artifacts/pizza-gdd/epics.md) và [sprint](implementation-artifacts/sprint-status.yaml).
- Thứ tự: 3.4 → modal 3.5/3.6 → UI/luồng Kho 3.7 → dữ liệu 5.1 → gợi ý 5.2 → hoàn tất tích hợp Kho. Phần dữ liệu/gameplay E05 vẫn theo ranh giới sau demo và các giá/định lượng/ngưỡng chưa chốt; UI trước không được giả dữ liệu hoặc tự mở toàn bộ món. Đây là note/backlog, **chưa code, chưa xem ảnh references, chưa phải story ready-for-dev**.

### Kho và gợi ý mua — yêu cầu 2026-10-04, chỉ ghi tài liệu

- Người dùng xác nhận **19 nguyên liệu đã chốt**; Kho hiển thị icon/tên/lượng còn dùng được/hạn dùng, bộ lọc Tất cả/Sắp hết/Sắp hết hạn, bấm xem lô, ưu tiên lô sắp hết hạn và không dùng hàng hết hạn. “Đi chợ mua thêm” chuyển tab Chợ.
- Gợi ý theo menu/số phần/định lượng: `max(0, nhu cầu − khả dụng)`, khả dụng loại hàng hết hạn và giữ cho đơn; chỉ nguyên liệu liên quan menu, không tự mua/trừ tiền. Ngưỡng bộ lọc, cách chọn số phần và định lượng chưa chốt. Ví dụ nấm ít/tôm và giăm bông hết/phô mai và nấm gần hết hạn không phải dữ liệu mặc định. Xem [yêu cầu](implementation-artifacts/requirement-stock-and-purchase-suggestions.md). **Chưa triển khai; chỉ xem ảnh references khi được yêu cầu làm.**

### Nguyên liệu và công thức đề xuất — 2026-10-04, chỉ ghi tài liệu

- Người dùng gửi **19 nguyên liệu chợ, 8 công thức pizza** và sau đó xác nhận **danh mục 19 nguyên liệu đã chốt**, theo [danh mục](planning-artifacts/pizza-gdd/proposal-market-ingredients-and-recipes.md). Tám công thức vẫn là đề xuất; mọi pizza dùng 1 đế, giá mua và lượng sốt/phô mai/topping chưa chốt. Kem trắng/pesto/sốt cay dành cho biến thể hoặc tùy chỉnh chưa xác định. Mỗi nguyên liệu cần ID/tên/icon/giá mua/tồn/hạn dùng/đơn vị; “Xóa tất cả” là thao tác, không phải nguyên liệu.
- **Chưa triển khai, chưa thay phạm vi demo/công thức/mở khóa/UI đã duyệt.** Không tự đặt giá, định lượng hoặc thêm tất cả vào runtime từ danh sách đề xuất này.

### Ảnh mẫu và modal thu chi — đã triển khai 2026-10-04

- Người dùng đã thêm ảnh vào thư mục `references`: **chỉ khi người dùng yêu cầu triển khai mới xem ảnh trong đó rồi làm theo mẫu**. Lượt ghi yêu cầu không xem ảnh và không sửa code; không giả định tên ảnh hoặc đường dẫn thư mục khi chưa xác định.
  Sau đó người dùng yêu cầu triển khai Tổng kết; đã dùng ba ảnh liên quan, cập nhật mốc và kiểm tra theo [spec](implementation-artifacts/spec-reference-summary-and-details.md).
- Thẻ “Lợi nhuận hôm nay” thêm “Chi tiết ›”, mở “Thu chi ngày {day}” với lợi nhuận, doanh thu theo món/số lượng, giá vốn, chi phí khác, dòng tiền và số dư đầu/cuối. Dùng dữ liệu thật của đúng ngày, không hardcode ảnh. Tách nhập kho khỏi giá vốn đã dùng; hao hụt/bánh cháy tính một lần, không đổi cách tính tiền. Modal cuộn, × đóng, nền tối chặn input, kem–gỗ–viền đồng, vừa 360×640. Xem [yêu cầu thu chi](implementation-artifacts/requirement-day-finance-modal.md). **Đã triển khai; build và kiểm tra tập trung đạt.**

### Đánh giá trên tổng kết — đã triển khai 2026-10-04

- Trong “Khách nói gì?”, giữ hai đánh giá gần nhất của đúng ngày và nút “Xem tất cả ›”. Modal “Đánh giá ngày {day}” có điểm trung bình/tổng lượt từ toàn bộ đánh giá ngày đó, danh sách cuộn avatar/tên/sao/nhận xét, bộ lọc và nút ×; nền tối, chặn input phía sau. Dữ liệu thật, không trộn ngày, giữ kem–gỗ–viền đồng. Xem [yêu cầu](implementation-artifacts/requirement-day-reviews-modal.md). **Đã triển khai, kiểm tra cả trạng thái trống và danh sách dài ở cỡ chữ 200%.**

### Onboarding — yêu cầu và triển khai 2026-10-03

- Người dùng yêu cầu **Bắt đầu chiến dịch mới → vào thẳng tutorial**, không vào Chợ hoặc bắt mua hàng trước tutorial. Quyết định này thay các mô tả cũ đặt bước mua hàng trước phần hướng dẫn.
- Dùng fixture luyện tập riêng như hợp đồng tutorial hiện có: nguyên liệu tập không trừ tiền/kho thật, không doanh thu/XP, không tự mua thay người chơi. Không tự diễn giải thành bỏ chợ hoặc cấp miễn phí kho thương mại.
- Giữ UI đã duyệt và các quy tắc ca thương mại/checkpoint. Xem [nhật ký quyết định](planning-artifacts/pizza-gdd/decision-log.md).
- Ghi chú ban đầu chỉ sửa tài liệu. Sau đó người dùng cho phép sửa luồng: **hoàn tất tutorial → giao diện hub tổng kết, tab Chợ → mua nguyên liệu thật → mở Ngày 1**. Đã triển khai theo `implementation-artifacts/spec-post-tutorial-market-hub.md`. Hub trước ca không tạo báo cáo giả, không chốt/tăng ngày hoặc trao thưởng tập; dùng `openShop()` cho Ngày 1. Giữ bố cục hub và luồng tổng kết cuối ngày. Marker chuẩn bị sau tutorial chỉ thuộc phiên RAM; checkpoint/reload vẫn theo hợp đồng hiện có.

### Giao diện đã duyệt — quyết định người dùng ngày 2026-10-02

- Trước khi sửa UI hoặc triển khai story có HUD/menu, đọc [mốc giao diện](implementation-artifacts/ui-baseline-2026-10-02.md) và đối chiếu ảnh/tọa độ liên quan. Chỉ đọc file liên quan; không đọc toàn bộ project.
- Giữ bố cục cartoon hiện tại: hàng chờ tối đa sáu avatar nhỏ trong khung cũ theo [chỉnh sửa người dùng đã yêu cầu](implementation-artifacts/spec-compact-order-queue.md), mái vải kem viền cam đất/đèn vàng và panel đơn được chọn; thớt trái/lò phải, nút chính y=411, năm ô sốt y=464 và bảng mười ô nguyên liệu hai hàng y=524/578. Giữ ô khóa trang trí; không rút thành hai nút nguyên liệu. UI sáu vị trí không tự nâng gameplay cap ba phiếu hoặc tạo đơn app.
- Dải hiện hành ở 360×640 là 48/112/251/229px. Mốc này thay thế yêu cầu cũ 96px hàng khách/176px vùng thao tác và màu nút đỏ/góc 2/6px. Dùng theme hiện tại; không tự reflow để khớp tài liệu cũ.
- Giữ menu minh họa, assets và animation đã được người dùng chỉnh. Story gameplay, lifecycle, audio, performance hoặc accessibility không tự cho phép redesign.
- Yêu cầu menu bổ sung 2026-10-02: hơi nước mềm, ba nút nhỏ hơn, mọi cụm cây đung đưa và bảng hiệu lắc nhẹ theo gió, theo `implementation-artifacts/spec-menu-gentle-wind.md`. Chỉ sửa bốn chi tiết này, chữ đi cùng bảng hiệu, giữ vùng chạm 48 CSS px và reduced motion; không tự thay ảnh mốc trước khi người dùng duyệt kết quả.
- Chỉ thay bố cục/phong cách khi người dùng yêu cầu rõ ràng, và chỉ sửa đúng phạm vi đó. Nếu yêu cầu mới buộc đổi bố cục, nêu xung đột và phương án cụ thể để người dùng quyết định; tiếp tục phần độc lập.
- Các chỉ dẫn mới của người dùng có thể thay mốc; khi được duyệt phải đồng bộ lại UX, epics và story liên quan. Quyết định này chỉ thay yêu cầu hình ảnh, không thay luật gameplay hoặc ownership kiến trúc.

### Engine-Specific Rules

- Phaser scene chỉ quản lý lifecycle/presentation; không sở hữu tiền, kho, XP, uy tín, quan hệ, nhiệm vụ hoặc kết quả đơn.
- `domain/` là TypeScript thuần: cấm import Phaser, DOM, IndexedDB và console logger.
- Mọi gameplay mutation đi qua `GameRuntime.dispatch`; animation, callback âm thanh và Phaser event không được tự cập nhật state.
- Scene/component chỉ đọc selector/view model và phát typed intent.
- Domain entity không phải Phaser `GameObject`; view được tạo qua factory/presenter.
- Dùng discriminated-union state machine cho ngày, đơn, lò và nhiệm vụ; scene không gán trực tiếp state discriminator.
- Simulation clock 20 Hz là nguồn thời gian gameplay duy nhất; rendering chạy độc lập.
- Pause dùng owned lease/token. Cấm `resumeAll()`, `clearAll()` và không dùng engine pause làm cơ chế duy nhất.
- Phaser event chỉ dùng trong presentation; typed domain events không đi qua global event bus.
- Scene phải gỡ listener/subscription và trả lease do scene sở hữu khi `shutdown`.
- Không bật physics, thêm React hoặc dùng editor-specific prefab trong baseline.
- Đồ họa 2D cartoon phải có đường nét mượt, rõ và đúng tỷ lệ sau scale, nhưng vùng chạm vẫn tối thiểu 48×48 CSS px.

### Performance Rules

- Mục tiêu 60 FPS; không để dưới 30 FPS liên tục quá 1 giây trong ca đầy ba phiếu.
- Simulation tick cố định 50 ms; không gắn luật gameplay vào render delta hoặc wall-clock.
- Không tạo object, format chuỗi, ghi log hoặc chạy lookup cấu hình nặng mỗi frame/tick.
- Không log từng frame; performance marks chỉ dùng cho boot, asset load, day start/end và save commit.
- Asset tải đầu tối đa 10 MB; vào màn bắt đầu trong 5 giây ở mạng 20 Mbps với cache trống.
- Tải trước asset bắt buộc của demo và không bắt đầu ca khi thiếu asset; nội dung sau demo dùng manifest theo giai đoạn.
- Ngân sách runtime mục tiêu dưới 200 MB trên baseline mobile; đo bằng browser tooling.
- Không dùng object pool mặc định; chỉ thêm khi profiling chứng minh GC hoặc frame spike.
- Không cache selector nếu không khóa theo state revision; giữ selector thuần và view model nhỏ.
- Event journal giới hạn 200 sự kiện đã lược dữ liệu nhạy cảm.
- Kiểm tra `360×640`, `390×844`, `412×915`; desktop không thay kiểm tra mobile.
- Baseline là Chrome Android trên thiết bị 4 GB RAM và Safari iOS từ iPhone 11.

### Code Organization Rules

- `src/main.ts` là composition root; inject dependency, không dùng service locator hoặc global singleton.
- `domain/` sở hữu model, commands, events, rules, state machines và invariants.
- `runtime/` sở hữu dispatch, simulation clock, pause registry, event journal và selectors.
- `features/`, `scenes/`, `presentation/` chỉ điều phối UI và gửi intent.
- `infrastructure/` chứa IndexedDB, browser adapters, asset loader và logging; không chứa luật kinh tế.
- `config/` chứa dữ liệu thô, được validate một lần thành `ValidatedGameConfig`.
- Không tạo module rỗng cho E05–E09 trong demo; chỉ tạo khi epic tương ứng bắt đầu.
- Không import `_bmad-output/` hoặc `docs/` vào runtime.
- Không dùng barrel `index.ts` xuyên dự án; import trực tiếp từ owner module.
- Tránh tên chung `Manager`, `Helper`, `Utils`; đặt tên theo đúng trách nhiệm.
- Class/type/scene dùng `PascalCase`; hàm/biến/file hàm dùng `camelCase`; constant dùng `UPPER_SNAKE_CASE`.
- File chứa class/type chính trùng tên `PascalCase`.
- Content ID dùng `namespace.kebab-case`; command dùng `namespace.verb`; event dùng dạng quá khứ.
- Asset/key dùng `kebab-case` có namespace; test dùng `<subject>.test.ts` hoặc `<flow>.spec.ts`.
- Mỗi gameplay mutation chỉ có một owner handler; không sao chép công thức domain vào scene hoặc selector.

### Testing Rules

- User-confirmed test cadence (2026-10-01): During individual stories or small UI changes, run focused unit/E2E tests for the affected behavior. Run the full Playwright Chromium/WebKit suite across all viewports only after Epic 1 is complete or before release. A small button change does not require the full browser matrix.

- Unit test domain/runtime/config không khởi tạo Phaser, canvas, DOM hoặc IndexedDB.
- Kiểm tra handler bằng state trước/sau và typed events; animation không chứng minh gameplay thành công.
- Mỗi state machine cần test transition hợp lệ, transition bị từ chối và exhaustive handling.
- Clock dùng simulated time; test không chờ thời gian thật.
- Pause tests phủ lease lồng nhau, release idempotent, scene shutdown và tab hiện lại khi còn pause khác.
- Command tests phủ double-tap/cùng `commandId`; tiền, XP và thưởng không được áp dụng hai lần.
- Persistence integration tests phủ transaction failure, retry cùng `commitId`, revision conflict, corruption, backup sai commit và migration lỗi.
- Day-flow tests chứng minh reload giữa ngày về đầu ngày hiện tại và ngày đã chốt không thể mở lại.
- Config tests từ chối ID thiếu/trùng, liên kết sai và giá trị ngoài giới hạn; không fallback ngầm.
- Playwright kiểm tra Chromium/WebKit tại ba viewport đã chốt, gồm orientation, visibility, touch, double-tap, save failure, reload và overflow.
- Fake adapter tại dependency boundary; không mock nội bộ domain để làm test xanh.
- Test E01–E04 trước; không tạo test giả cho E05–E09 chưa triển khai.

### Platform & Build Rules

- Mobile portrait là chính; input dùng single touch, không phụ thuộc hover, right-click, keyboard hoặc multi-touch.
- Vùng chạm tối thiểu 48×48 CSS px sau scale; text/nút không tràn hoặc che nhau.
- Xoay ngang tạo pause lease riêng và yêu cầu trở lại dọc; không mất state.
- Tab ẩn/khóa màn hình dừng simulation, không chạy bù; quay lại phải chạm tiếp tục.
- Visibility/orientation adapter chỉ quản lý lease của mình, không giải phóng pause nguồn khác.
- HTML/CSS chỉ làm canvas host, safe area và orientation notice; gameplay UI nằm trong Phaser.
- Audio unlock sau tương tác; trạng thái quan trọng luôn có phản hồi hình ảnh.
- Dùng `npm run dev-nolog` và `npm run build-nolog`; không chạy telemetry `log.js`.
- Build tạo static `dist/`; không thêm server route, secret client-side hoặc backend assumption.
- Deploy HTTPS và smoke test IndexedDB, audio unlock, orientation, reload trên URL thật.
- Không tuyên bố offline; demo không có service worker/PWA.
- Thiếu asset bắt buộc hoặc renderer boot lỗi phải dừng trước gameplay với error/retry.
- Không clone template vào root đã có tài liệu; dùng staging clone và tích hợp có kiểm soát.
- Không chạy scaffold/install nếu chưa có quyền rõ ràng từ người dùng.

### Critical Don't-Miss Rules

- Command cập nhật RAM không phải transaction IndexedDB; không ghi database sau mỗi lần bấm.
- Baseline demo: IndexedDB chỉ ghi khi tạo campaign và chốt cuối ngày; player settings dùng store riêng. Yêu cầu Trang trí/Tiện nghi2026-10-04 bổ sung giao dịch mua đồ trong chuẩn bị ở E07/7.5, **chưa triển khai**; xem yêu cầu/architecture trước làm. Không áp dụng bổ sung này thành ghi mỗi tap hoặc lưu giữa ca.
- Day commit luôn `prepare → commit → confirm`; không chuyển ngày trước khi transaction hoàn tất.
- Retry save dùng cùng `commitId` và payload; không tính lại thưởng, tiền, XP hoặc tồn kho.
- Ngày đã chốt bất biến. Cấm API/UI `replayDay`, `rollbackDay`, chọn checkpoint cũ hoặc tạo nhánh tiến độ.
- Reload giữa ca trở về checkpoint đầu ngày hiện tại và bỏ thay đổi RAM sau checkpoint.
- Active/backup là hai bản của cùng checkpoint mới nhất; backup khác `commitId/revision` không dùng để lùi ngày.
- Validate schema, kiểu, giới hạn và ID trước khi nạp save; không tự sửa tiền/kho hoặc reset campaign khi dữ liệu hỏng.
- Revision conflict giữa hai tab yêu cầu tải lại; không tự merge.
- Không dùng exception cho kết quả gameplay hợp lệ như thiếu hàng, giá cao hoặc đơn hết hạn.
- Không thu tiền/trao thưởng trong animation callback; mỗi reward có ID và cờ nhận một lần.
- Giữ nguyên liệu theo lô; command áp dụng toàn bộ hoặc không đổi state.
- Đơn giúp đỡ không tính vào doanh thu, XP, đánh giá ngày hoặc nhiệm vụ thương mại.
- Pause chỉ kết thúc khi mọi lease đã hết; đóng overlay không resume clock nếu nguồn pause khác còn hiệu lực.
- E01–E04 là phạm vi demo đầu tiên. P01–P16 vẫn thuộc kiến trúc nhưng không triển khai sớm E05–E09.
- Thông số chiến dịch sau demo chưa đủ để code; phải chi tiết hóa trước epic tương ứng.
- Không tự đổi tên phát hành hoặc thêm multiplayer, cloud save, account, thanh toán thật, endless mode hay điều khiển xe giao hàng.
- Khi tài liệu mâu thuẫn, ưu tiên GDD đã duyệt cho luật gameplay và `game-architecture.md` cho ranh giới kỹ thuật; dừng và hỏi nếu vẫn không thể hòa giải.

---

## Usage Guidelines

**For AI Agents:**

- Đọc tệp này trước khi triển khai hoặc review code game.
- Tuân thủ toàn bộ quy tắc; khi chưa rõ, chọn phương án hạn chế hơn và đối chiếu tài liệu nguồn.
- Không tự cập nhật quy tắc để hợp thức hóa implementation; thay đổi kiến trúc cần người dùng duyệt.

**For Humans:**

- Cập nhật khi stack, architecture hoặc phạm vi demo thay đổi.
- Giữ tệp ngắn và chỉ chứa chi tiết agent dễ bỏ sót; luật thiết kế đầy đủ ở GDD.
- Xem lại trước mỗi epic mới, đặc biệt trước E05–E09.

Last Updated: 2026-10-02


## Art direction update — 2026-09-30

Historical direction decision; the pending implementation statement below describes 2026-09-30. The current interface is implemented and governed by the approved 2026-10-02 UI baseline above.

User-confirmed direction: **2D cartoon**, replacing the previous pixel-art direction. Use soft rounded forms, clear smooth outlines, warm wood/cream/tomato/amber colors, expressive characters, and subtle shading. Keep Vietnamese text readable and retain existing gameplay, portrait layout, and touch-target requirements. This direction supersedes earlier conflicting visual assumptions; existing palette tokens require validation during implementation. This update changes documentation only: cartoon artwork/rendering and visual verification remain pending. Prior completion and test records describe the previous implementation.

### Luồng cuối ngày Cozy — quyết định 2026-10-02

- Màn cuối ngày trong ảnh người dùng xác nhận ngày 2026-10-02 là giao diện đã duyệt, không còn là hướng thiết kế mở. Trước khi sửa hub, đọc phần cuối ngày và ảnh `ui-baseline/day-end-summary.png` trong [mốc UI](implementation-artifacts/ui-baseline-2026-10-02.md). Giữ bảng treo, cụm tiền/cấp/đánh giá, năm tab, ba thẻ nội dung, bốn ô chuẩn bị và nút xanh mở ngày sau đúng vị trí; chỉ dữ liệu thật thay đổi. Sửa logic hoặc thêm story không cho phép reflow, đổi theme hay tự chụp đè ảnh mốc để hợp thức hóa redesign.
- Người dùng chọn bấm “Kết thúc ngày” trong bảng pause; không tự hết ca theo thời lượng. Theo [spec cuối ngày](implementation-artifacts/spec-end-of-day-reference.md), thêm hub tổng kết/chuẩn bị riêng ngoài ca, giữ nguyên bếp/menu.
- Tổng kết dùng dữ liệu thật; Chợ/Kho dùng tiền/lô đang có và giữ qua ngày. Ngày đã chốt không replay trong phiên. Quán/Nhiệm vụ/cấp chưa có ghi “Chưa mở”.
- Luồng Cozy này giữ phiên RAM và không thay campaign/IndexedDB. Không tuyên bố lưu bền hoặc hoàn thành Epic 3/4 chỉ vì có màn tổng kết mới.

### Cozy persistence implementation — 2026-10-03

The earlier RAM-only statements describe the approved UI work on 2026-10-02. After user authorization for Stories4.3–4.6, the default menu and direct shop now use CozyCampaignSession and native IndexedDB in pizza-cozy-checkpoints. Saves occur only at campaign creation/end-day; in-app menu return preserves RAM, page reload restores the current unclosed day. Stable pending retry, same-latest confirmed recovery, revision conflict and terminal Day3 are implemented. Existing mode=campaign prototype remains separate. UI baseline/geometry restrictions remain unchanged. Focused automated implementation checks passed; five-person human playtesting is still pending, so do not claim complete Epic4 human acceptance.

### Scoped menu adjustment — 2026-10-03

User explicitly requested closer buttons, a replacement centered Continue icon and stronger plant/sign wind. Follow implementation-artifacts/spec-menu-compact-stronger-wind.md: roughly6px visible gaps, existing208px width, distinct48 CSS px touch regions with short-portrait height adaptation; balanced Continue chevrons; plant amplitude3× and sign2.5×. Other approved UI/artwork remains fixed. Keep neutral reduced motion and hidden suspension; new review captures do not replace approved baseline images.

### Scoped Market refinement — 2026-10-04

User requested transparent ingredient icons and direct quantity entry. Market uses its own transparent 19-icon sheet; tapping the quantity opens a native numeric input within the existing notification frame, accepting integers 1–100. Selection changes do not purchase; existing purchase confirmation and runtime rules remain. The editor owns/releases only its own pause lease and is removed on scene shutdown. See implementation-artifacts/spec-market-transparent-icons-and-quantity-input.md and the updated UI baseline. Build and 8 focused Chromium tests passed.

### Shared hub theme — Market preview first, 2026-10-04

User requests consistent Summary/Market/Stock/Shop presentation, explicitly Market first to inspect before other screens. `HubTheme.ts` and `HubCanvasUI.ts` now provide scoped palette/typography/rounded paper-copper frames, wood background, header, navigation and black-gold buttons/footer. Market and its native quantity field use them. Vector frames avoid baked miniature source labels; dynamic data/actions stay unchanged. Final build and9 focused Chromium360×640 E2E passed. See implementation-artifacts/spec-shared-hub-theme-market-first.md. Summary/Stock/Shop renderer adoption remains pending user feedback on this preview; do not claim all four screens are unified or replace their approved baseline.

### New shared reference header — 2026-10-04

User subsequently supplied `references/Giao diện game pizza gỗ tối giản.png` and explicitly authorized replacing ONLY header/navigation of all5hub tabs plus an even wooden backdrop, keeping lower contents. `HubHeader.ts` now paints the common artwork with live labels/cash/tab controls; all branches use one wood painter at the same origin. Keep existing content/filter/list/footer coordinates (Summary fromy130, Market filtersy133, legacy contentsy183); do not reflow them into empty space below the new header. Header approval scope supersedes the earlier Market-only header preview limit; full body theme adoption remains outside this request. Build and10 focused Chromium360×640 E2E passed. See implementation-artifacts/spec-shared-reference-header.md and updated UI baseline.

### Stock, Shop and Missions bodies — 2026-10-04

User next explicitly authorized continuing these three tabs using notes and references. Their bodies now use HubTheme/HubCanvasUI, the same reference header/wood and dynamic content; the preceding header-only restriction describes the earlier request. Stock has19ingredients, real lot detail/usable stock, explicit player-selected filter criteria, read-only current-menu purchase planning and Market navigation. Shop has six category pages with illustrative art, existing price editing and confirmed oven/queue upgrades; new items missing purchase/save configuration remain explicitly unavailable. Missions presents actual day goals, latest closed result, cheese8mission, XP/unlock and automatic reward status. Do not fabricate full8recipe quantities, art-derived prices/ownership, new purchases or reward claims. Summary/Market/kitchen/save/runtime rules remain unchanged. See implementation-artifacts/spec-stock-shop-missions-ui.md and updated UI baseline.

### Epic 7 — triển khai phần đã chốt, 2026-10-04

Đã triển khai 12 món Trang trí/Tiện nghi giá 500–10.000 xu: mua một lần, đặt/cất ở vị trí cố định trong preview Quán, chỉ đồ đang đặt có bonus. Giữ sáu mục Quán, header/footer và bếp đã duyệt. Ca đóng băng hiệu ứng khi mở; bonus sinh khách chỉ nhân cơ hội thương mại tại quầy, bonus kiên nhẫn áp dụng khách trả tiền tại quầy (kể cả referral), không tăng hạn đơn app. Lò cấp 2/3 giá 2.000/5.000; mở rộng 4→6 giá 6.000.

Mua/đặt/cất/nâng cấp chuẩn bị staging trên candidate; commit thành công mới cập nhật chính runtime hiện tại, lỗi/retry không trừ trùng. Metadata lưu sở hữu/vị trí/giá thực trả; save cũ giữ tiền/kho/tiến độ và giá nâng cấp lịch sử. Không lưu giữa ca. Build, 110 unit và 7 E2E Chromium 360×640 đạt; ba review độc lập hoàn tất.

Bàn ghế 4.000 tăng10% kiên nhẫn, mua/đặt/cất được; không tăng sức chứa. Chỉ mở rộng quán tăng4→6 khách, tối đa6; giữ6 ô khách cố định, không avatar cuộn. Mở rộng lần2 giá10.000 chưa có tác dụng được chốt và chưa bật mua. Thiết bị mới/quảng bá/hư hỏng chưa có luật. Toàn Epic7 vẫn in-progress. Ghi chú này thay các nhận định trước đây rằng đồ mới chưa có giá hoặc toàn bộ luồng mua chưa triển khai. Chi tiết: `_bmad-output/implementation-artifacts/spec-7-shop-development.md`.
### Luật Epic 7 thay thế — 2026-10-04

Chỉ mở rộng quán tăng sức chứa: mặc định4 khách, mở rộng lần1 lên6, tối đa6. Bàn ghế4000xu chỉ tăng10% kiên nhẫn khi đang đặt; không tăng khách hoặc chỗ chờ phụ. Tổng tiện nghi sau lấy max quạt/máy lạnh là38%, cap40%. Giữ6 ô khách cố định, loại bỏ đề xuất cap8/10 và hàng avatar cuộn. Mở rộng lần2 giá10000 chưa có tác dụng được chốt, chưa cho mua và không tự gán bonus. Các luật bàn ghế/chỗ chờ trước đây được thay bằng quyết định này. Xem spec-7-capacity-and-table-patience.md trong implementation-artifacts.
## Luật nhân viên đã chốt — 2026-10-05

Epic 8.1 đã triển khai bốn loại phụ bếp/thợ nướng/đóng hộp/giao hàng theo bốn thẻ hiện có. Mở thuê ngày8, phí2000xu/người, mỗi loại tối đa1. Vai trò cố định theo loại thuê, không phân công lại. Lương200xu/người/ngày, thu cuối ngày. Thiếu tiền báo rõ số thiếu và giữ lương chưa trả; không tự sa thải, cho vay hoặc tính lãi. Công đoạn xử lý nhanh, thời gian đặt trong cấu hình; giữ cửa sổ chín của nâng cấp lò hiện có. Giao hàng1đơn/chuyến, chốt ngay lúc giao và trở về20s/mưa30s trước nhận đơn tiếp. Không tăng sức chứa hay đổi6ô khách.

Mua thuê trong chuẩn bị dùng giao dịch tiền+roster atomic và checkpoint hiện có, không lưu giữa ca; save cũ chưa có nhân viên. Lương phát sinh là chi phí của ngày, tiền mặt chỉ trừ phần thực trả; khoản chưa trả đối soát qua báo cáo/metadata, thử trả cùng lương ngày mới vào cuối ngày sau. Khi thiếu tổng tiền lương thì chưa trả khoản đó, giữ toàn bộ nghĩa vụ và báo số tiền cần thêm. Những đề xuất cũ lương50xu/ca, phân công/nghỉ hoặc chỉ có một nhân viên giao được thay bởi luật này. Đào tạo/mệt/giữ người và truyện/nhiệm vụẩn/khách nổi tiếng vẫn chưa có luật, không coi8.1 là toànEpic8.

Chi tiết trong `_bmad-output/implementation-artifacts/spec-8-1-delivery-staff.md`; build đạt, 121 unit hiện hành và 11 E2E tập trung 360×640 đạt; ba review độc lập không còn phát hiện cần sửa. Một test cũ giới hạn demo ba ngày thất bại cả ở baseline f65e737, ghi riêng trong deferred-work.md. Story 8.1 ở review; toàn Epic 8 còn in-progress.
### Epic9.1 — khung30ngày, 2026-10-05

Cozy mới chạy tối đa30ngày, giữ Chợ→Kho→ca→chốt→chuẩn bị. Chốt30 thanh toán/thưởng theo luật hiện có đúng một lần rồi complete, không cần vốn31 và không mở31. Kết quả readonly từ reports/progression: tiền cuối, XP/cấp, uy tín, lợi nhuận/doanh thu, đơn/pizza, mục tiêu/nhiệm vụ. Xem tổng kết và xác nhận lượt mới dùng khung chung; chỉ thay save sau commit thành công, phiên RAM thay runtime/lifecycle thật. Không thêm thưởng/XP/VIP, không lưu giữa ca. Save thiếu campaignEndDay suy ra max(30,day), giữ toàn bộ tiền/kho/lịch sử; save vượt30 hoàn tất chính ngày đã chuẩn bị rồi kết thúc. Old insolvent giữ nguyên. Build,65unit tập trung,7E2E360×640 đạt; ba review hoàn tất, một lỗi RAMrestart đã sửa/test lại. Story9.1 review, toànEpic9 vẫn in-progress. Chi tiết implementation-artifacts/spec-9-1-thirty-day-campaign.md.
### Chỉnh nhãn và Cài đặt dùng chung — yêu cầu2026-10-05

Người dùng yêu cầu nhích chữ năm tab lên để không lẹm xuống, giữ khung/vùng bấm; ô tiền header giữ icon đồng xu và chỉ số, bỏ hậu tố xu. Các thông báo click/tự hiện cùng Menu/Pause dùng lớp đen bán trong suốt nhẹ thay nền đen kín; vẫn chặn input nền và giữ lease riêng. Cài đặt Menu/Pause dùng cùng panel và cùng PlayAudio/MenuPreferences, điều khiển hiệu ứng/mute/giảm chuyển động; nhạc chưa có ghi rõ, không tạo tính năng nhạc giả. Bố cục/art/body hub và gameplay/save không đổi. Quyết định này thay các yêu cầu nền đen kín lịch sử; chi tiết spec-shared-settings-and-hub-label-refinement.md.
Kiểm chứng phạm vi trên: build,6unit và15E2E tập trung360×640 đạt; ba review không còn phát hiện. Mốc UI đã ghi ảnh đúng phần sửa.

### Epic9.2 — Sự kiện A, 2026-10-05

A xét một lần khi mở ca, xác suất10%, mất đúng200 kể cả tiền âm. Cooldown khoảng cách3ngày (10→13), tối đa1sự kiện xấu/ngày và không liền2ngày. Seed gắn campaign identity trước chơi, reload/mua chuẩn bị không reroll; save cũ xác minh checksum trước chuẩn hóa và giữ lịch sử. Thông báo một nút dùng lease riêng; loss vào chi phí khác, không trừ vào kho/giá vốn. Retry/restore không trừ trùng. Không lưu giữa ca hoặc thêm loại sự kiện xấu. Build,45unit và2E2E360×640 đạt; ba review độc lập. Xem implementation-artifacts/spec-9-2-random-loss-events.md.
