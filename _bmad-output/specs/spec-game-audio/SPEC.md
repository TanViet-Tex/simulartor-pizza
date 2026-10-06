---
id: SPEC-game-audio
status: implemented
date: '2026-10-06'
companions:
  - audio-assets.md
  - ../../project-context.md
  - ../../implementation-artifacts/ui-baseline-2026-10-02.md
sources: []
---

# Âm thanh game pizza

## Why

Người dùng đã thêm bảy file âm thanh trong `public/assets/audio/`, yêu cầu ghi cách sử dụng rồi yêu cầu triển khai. Các chức năng đã được tích hợp; kết quả build/unit/E2E và đường dẫn code nằm trong [spec triển khai](../../implementation-artifacts/spec-game-audio.md).

## Capabilities

- **CAP-1**
  - **intent:** Người chơi nghe tiếng lò trong suốt thời gian bánh đang nướng.
  - **success:** Phát `lò nướng.mp3` khi bắt đầu nướng thành công; lặp nếu file ngắn; dừng ngay khi bánh bắt đầu chín. Cấp 1/2/3 có cửa sổ chín vừa 6–8s, 4–6s, 2–4s; tiếng dừng khi clock chiếc bánh đạt `perfectStart` thật (6/4/2s), không lấy độ dài file hoặc timer âm thanh riêng.
- **CAP-2**
  - **intent:** Tiếng lò theo đúng trạng thái Pause và tiếp tục của ca.
  - **success:** Pause tạm dừng tại vị trí đang phát; tiếp tục phát từ vị trí đó nếu bánh vẫn đang nướng. Chỉ có một bản tiếng lò hoạt động, không tạo thêm bản khi redraw hoặc resume nhiều lần; bánh đã chín thì không phát lại.
- **CAP-3**
  - **intent:** Người chơi nghe và chọn giữa hai bài nhạc nền trong Cài đặt dùng chung Menu/Pause.
  - **success:** `nhạc nèn bán pizza 2.mp3` là bài mặc định khi chưa có lựa chọn; người chơi bật/tắt Music và đổi sang `nhac nền bán pizza.mp3` tại mục chọn nhạc hiện có. Đổi bài dừng bài cũ trước khi phát bài mới, không phát chồng.
- **CAP-4**
  - **intent:** Người chơi nghe hiệu ứng phù hợp khi mở Cài đặt, dùng sốt, đóng hộp pizza và khách đến.
  - **success:** Dùng đúng file trong bảng asset; phát một lần cho mỗi hành động/sự kiện thành công, không phát lại do render hoặc thao tác thất bại. Các loại sốt dùng chung `sốt.mp3`.
- **CAP-5**
  - **intent:** Người chơi điều khiển hiệu ứng qua Cài đặt hiện có.
  - **success:** Tiếng lò và các hiệu ứng tuân theo mute/bật tắt và `effectsVolume` của PlayAudio; thay đổi có tác dụng cả với tiếng lò đang chạy. Music có bật/tắt riêng, không bị mục Hiệu ứng tắt theo.

## Constraints

- Theo yêu cầu tiếp theo ngày2026-10-06: nhạc15%, tiếng lò6×effectsVolume qua WebAudio; các hiệu ứng khác1×effectsVolume. Media chỉ nối vào AudioContext đang chạy; browser không có/mở được context dùng HTML fallback nhạc15% và hiệu ứng theo volume (lò tối đa1). Giữ mute riêng và không thêm UI điều chỉnh âm lượng. Chi tiết/kiểm chứng trong [spec cân bằng âm](../../implementation-artifacts/spec-audio-mix-balance.md).

- Giữ bố cục/art/vị trí nút của Cài đặt đã duyệt; chỉ kích hoạt Music và chọn bài trong các vùng hiện có. Yêu cầu mới này thay riêng quy định nhạc disabled/“Chưa có nhạc” trong spec Cài đặt cũ khi triển khai xong.
- Không thêm lại nút −/+, phần trăm hoặc thanh âm lượng đã bỏ; mức nghe do âm lượng thiết bị và giá trị hiệu ứng hiện hành quyết định.
- Audio thuộc presentation, đọc trạng thái/sự kiện thật; không thay thời gian nướng, luật gameplay, pause lease hoặc campaign checkpoint để phục vụ âm thanh.
- Không dùng timer âm thanh độc lập để quyết định bánh chín. Khi game đồng bộ thời gian sau khi rời tab, dừng tiếng lò nếu bánh đã chín; không phát lại các hiệu ứng quá khứ hàng loạt.
- Pause/Cài đặt/Menu hoặc modal đang giữ pause của ca phải tạm dừng tiếng lò; chỉ tiếp tục khi mọi lease chặn ca đã được trả. Đóng Cài đặt không tự trả lease Pause khác.
- Chỉ phát sau tương tác hợp lệ theo chính sách browser; lỗi tải/phát âm thanh không làm gián đoạn game. Kết thúc ca/hủy mẻ/thay runtime/đóng scene phải dừng tiếng lò và dọn tài nguyên, không để bản phát cũ tồn tại.

## Non-goals

- Không thiết kế lại UI, thêm asset hiệu ứng ngoài bảy file hoặc thay cấp lò/thời gian nướng.
- Không thêm cơ chế lưu giữa ca hoặc tự nâng schema campaign vì lựa chọn âm thanh.

## Success signal

Kiểm tra tập trung ba cấp lò với thời gian nướng thật, file ngắn được lặp, Pause/tiếp tục nhiều lần và mute/volume khi đang nướng: tiếng dừng đúng lúc chín, không phát chồng. Cài đặt Menu/Pause đổi được hai bài, bài 2 mặc định; bốn hiệu ứng còn lại phát đúng sự kiện. Chạy unit/E2E tập trung khi triển khai, không full viewport matrix.

## Assumptions

- Yêu cầu thêm2026-10-06: dùng thanh toán.mp3 cho feedback giao dịch nhận/chi tiền thành công, thêm một voice payment preload. Theo steering “nhỏ lại tý”, payment75%effectsVolume, mute vẫn áp dụng. Receipt từ cash transaction thật, không từ redraw; nhiều click/receipt dùng cùngvoice, không chồng. Đây là bổ sung được người dùng cho phép ngoài bảy file ban đầu. Xem ../../implementation-artifacts/spec-cash-feedback.md.

- Theo yêu cầu tiếp theo2026-10-06, tiếng tinh cuối lò nướng.mp3 phải kêu một lần đúng mốc chín6/4/2s. Hai đoạn WAV dẫn xuất tách tiếng chạy và tinh, dùng cùngvoice; tiếng chạy loop đến chín rồi chuyển tinh không lặp, không thay thời gian/cao độ. Chi tiết ở ../../implementation-artifacts/spec-oven-ready-ding.md.

- Theo yêu cầu tiếp theo2026-10-06, `cài đặt.mp3` phát khi mở và thao tác các nút Cài đặt Menu/Pause (chuột/chạm/bàn phím); thay tiếng bíp cũ. Preload file nhỏ, bỏ qua390ms đầu gần im lặng; một voice restart khi bấm tiếp. Hiệu ứng Tắt dừng tiếng, bật lại phát theo trạng thái mới; không lặp suốt thời gian panel mở.
- Nhạc nền lặp bài đang chọn; chuyển Menu/bếp không tạo thêm bản. Bật/tắt Music và chọn bài giữ chung trong phiên; lưu qua reload chưa được người dùng yêu cầu.
- Pause yêu cầu tạm dừng tiếng lò; nhạc nền tiếp tục để có thể nghe/đổi bài trong Cài đặt.
