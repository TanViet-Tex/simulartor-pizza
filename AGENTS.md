# Hướng dẫn làm việc trong dự án

- Đọc `_bmad-output/project-context.md`, rồi chỉ đọc các file liên quan đến yêu cầu đang làm; không đọc toàn bộ project.
- Giao diện đã duyệt nằm tại `_bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md`. Đọc tài liệu này trước khi sửa scene, HUD, menu, art, theme hoặc viết story có UI.
- Giữ bố cục, bảng màu, hình minh họa, số ô hiển thị và vị trí nút của giao diện đã duyệt. Làm story mới, sửa gameplay, pause, audio, performance hoặc accessibility không tự cho phép thiết kế lại giao diện.
- Màn cuối ngày cũng đã duyệt: giữ bảng treo, cụm tiền/cấp/đánh giá, 5 tab, 3 thẻ nội dung, 4 ô chuẩn bị và nút xanh mở ngày sau theo phần cuối ngày trong mốc UI. Không coi chữ “tham khảo” trong spec cũ là quyền tự thiết kế lại; số liệu/nhận xét thay theo ca thật, bố cục giữ nguyên.
- Chỉ đổi bố cục/phong cách khi người dùng yêu cầu rõ ràng. Với thay đổi UI đã được yêu cầu, giới hạn sửa trong đúng phần đó; không nhân tiện thay các phần còn lại.
- Mốc giao diện ngày 2026-10-02 thay thế ngân sách hàng khách 96px/vùng thao tác 176px và màu nút đỏ trong tài liệu cũ. Không dùng yêu cầu cũ để tự reflow màn chơi. Luật gameplay và ranh giới kiến trúc vẫn theo GDD/architecture.
- Nếu yêu cầu kỹ thuật mới cần thay bố cục đã duyệt, nêu chỗ xung đột và phương án cụ thể để người dùng quyết định; tiếp tục các phần độc lập.
- Kiểm tra đúng phần sửa bằng unit/E2E tập trung. Chỉ chạy full Playwright Chromium/WebKit với nhiều viewport khi hoàn thành Epic 1 hoặc trước release, theo yêu cầu người dùng.

Các chỉ dẫn mới, rõ ràng của người dùng có quyền thay đổi mốc này. Khi người dùng duyệt giao diện mới, đồng bộ lại mốc và các tài liệu liên quan.
