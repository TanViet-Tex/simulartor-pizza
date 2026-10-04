# Reviewer Gate: Accessibility

**Scope:** UX demo pizza ba ngày, E01-E04  
**Surfaces:** mobile web portrait, touch-first, Chrome Android và Safari iOS  
**Artifacts reviewed:** `DESIGN.md`, `EXPERIENCE.md`, GDD, game architecture và project context  
**Review date:** 2026-09-29

## Verdict

**Conditional pass.** UX đã có nền tốt cho khả năng đọc và thao tác cảm ứng, nhưng chưa sẵn sàng làm hợp đồng triển khai accessibility cho đến khi xử lý hai vấn đề High: semantics/focus của UI canvas và tương phản nút hành động. Các lỗi còn lại chủ yếu là thiếu tiêu chí kiểm thử cụ thể.

## Findings

### A11Y-01 — High — UI Phaser canvas chưa có semantics và focus contract

`EXPERIENCE.md` nói focus/read order đi từ trên xuống dưới, nhưng đồng thời quy định gameplay UI nằm trong Phaser và keyboard không bắt buộc. Canvas không tự cung cấp tên, role, state, focus order hoặc thông báo động cho screen reader. Hiện chưa rõ “focus/read order” sẽ được thực thi bằng gì; các màn quan trọng như Start/Continue, Customer Offer, Pause, Save Error và Day Summary có nguy cơ hoàn toàn vô nghĩa với công nghệ hỗ trợ.

**Required resolution:** chọn và ghi rõ một trong hai:

- Thêm accessibility DOM layer đồng bộ cho các control/trạng thái trọng yếu, có accessible name/role/state, thứ tự focus, thông báo lỗi và live updates được kiểm soát; hoặc
- Tuyên bố rõ screen reader/keyboard accessibility nằm ngoài phạm vi demo, bỏ cam kết focus/read order không thể kiểm thử, và ghi đây là giới hạn sản phẩm đã duyệt.

Nếu chọn DOM layer, cần cập nhật kiến trúc vì hiện HTML/CSS chỉ được phép làm canvas host, safe area và orientation notice.

### A11Y-02 — High — Nút hành động không đạt tương phản chữ thường

Token `action-button` dùng chữ `#FFF8EA` trên nền `#D94B3D`, tỷ lệ xấp xỉ **3.95:1**. Với chữ 16px/700, đây chưa phải “large text” theo ngưỡng WCAG và không đạt 4.5:1 cho văn bản thông thường. Token disabled (`#737981`) với chữ sáng cũng chỉ khoảng **4.16:1**; trạng thái disabled không nhất thiết phải đạt tiêu chí active control nhưng vẫn phải đọc được lý do bên cạnh.

**Required resolution:** đổi cặp foreground/background để đạt ít nhất 4.5:1 cho text 16px, hoặc tăng cỡ chữ đủ ngưỡng large text và giữ tối thiểu 3:1. Kiểm tra tất cả cặp trạng thái thực tế, không chỉ swatch riêng lẻ. Với nền status màu, ưu tiên chữ tối khi phù hợp: nhiều màu success/info/warning hiện đạt tốt với `surface-base` nhưng thất bại với chữ sáng.

### A11Y-03 — Medium — Reduced motion vẫn là giả định tùy chi phí

UX đã mô tả fallback không bounce/shake, nhưng việc cung cấp reduced motion lại là `[ASSUMPTION]` và có thể bị bỏ nếu tốn chi phí. Người nhạy cảm chuyển động cần hành vi xác định, đặc biệt cho nudge, feedback delivery, tăng XP và overlay transitions.

**Required resolution:** luôn tôn trọng `prefers-reduced-motion: reduce` và định nghĩa mức mặc định: không screen shake, không flashing, không animation lặp; chuyển động thiết yếu có phương án opacity/instant state. Tùy chọn trong game có thể để sau, nhưng media preference không nên tùy chọn theo ngân sách.

### A11Y-04 — Medium — Text scaling và zoom chưa có tiêu chí chấp nhận

“Text may wrap” và ba viewport không chứng minh nội dung còn dùng được khi người chơi tăng browser zoom hoặc text size. Chữ Phaser canvas thường không tự phản ứng như DOM text, và cố định 14–16px có thể quá nhỏ trên một số thiết bị. Modal copy cuộn nhưng chưa có giới hạn, chỉ báo cuộn hoặc hành vi khi text tăng.

**Required resolution:** thêm test ở 200% browser zoom hoặc cấu hình text scale tương đương; không mất control/nội dung, không đè timer, và modal vẫn có đường đọc/đóng rõ ràng. Xác định cỡ chữ tối thiểu hiển thị sau scale và cách người dùng tăng chữ nếu browser text scaling không tác động canvas.

### A11Y-05 — Medium — Timer cần redundancy và ngữ nghĩa rõ hơn

Timer đã luôn hiện, dùng chữ số ổn định và không chỉ dựa vào audio, nhưng “numeric/short time” chưa định nghĩa format hoặc cách biểu đạt urgency ngoài màu. Người chơi cần phân biệt thời gian còn lại, trạng thái lò và patience mà không phải suy từ màu/motion.

**Required resolution:** quy định format nhất quán (ví dụ `0:24` kèm label), icon + text cho các mốc “Sắp hết”, “Sẵn sàng”, “Sắp cháy”, và không flashing. Nếu timer cập nhật liên tục qua accessibility layer, không announce mỗi giây; chỉ announce mốc quan trọng.

### A11Y-06 — Medium — Safe-area và vùng chạm thiếu kiểm thử hình học đầy đủ

UX yêu cầu 48×48 CSS px và safe-area, nhưng chưa quy định khoảng cách giữa target, trạng thái khi browser chrome thay đổi chiều cao, hoặc kiểm thử notch/home indicator. “Effective CSS size after Phaser scaling” cần đo thực tế thay vì suy từ logical canvas.

**Required resolution:** thêm acceptance test đo bounding box sau scale ở ba viewport, portrait/landscape transition và iOS safe-area; control quan trọng không nằm dưới browser chrome/home indicator. Khuyến nghị có khoảng hở đủ để hai nút kề nhau không dễ chạm nhầm, đặc biệt Ingredient, Box và Deliver.

### A11Y-07 — Medium — Error recovery thiếu quy tắc đưa người dùng về đúng ngữ cảnh

Thông điệp lỗi/save recovery rất tốt: literal, không lộ exception, không reset thầm lặng, retry idempotent. Tuy nhiên chưa quy định focus/attention sau khi lỗi xuất hiện, sau Retry thất bại, hoặc sau khi recovery thành công. Người dùng có thể không biết trạng thái nào vừa thay đổi, nhất là khi nhiều pause lease cùng tồn tại.

**Required resolution:** error surface phải có heading ngắn, mô tả ảnh hưởng, hành động chính và trạng thái busy; khi mở, đưa attention/focus vào heading/action; khi đóng thành công, trả về control/ngữ cảnh gây lỗi hoặc Next Day. Thông báo rõ khi clock vẫn pause vì lý do khác.

### A11Y-08 — Low — Tiếng Việt cần bộ chuỗi kiểm thử thay vì chỉ cam kết font

UX đã chọn system font hỗ trợ dấu và cho phép wrap, đây là hướng đúng. Tuy nhiên chưa có dữ liệu worst-case cho tên pizza, nguyên liệu, lý do từ chối, số tiền và lỗi save. Việc dùng all-caps hoặc sprite text sau này cũng có thể làm dấu khó đọc.

**Required resolution:** tạo fixture chuỗi Việt dài nhất cho mỗi component; kiểm tra đầy đủ dấu, line-height, wrap hai dòng và số tiền lớn ở 360×640. Không rasterize text chức năng vào sprite; không dùng uppercase bắt buộc cho microcopy.

### A11Y-09 — Low — Trạng thái không màu/không âm thanh tốt nhưng icon cần tên nhất quán

Các spine đã yêu cầu icon + nhãn cho ingredient, order type, oven, goal và lỗi; audio đều có visual equivalent. Tuy nhiên chưa có bảng ánh xạ icon/label cụ thể, nên cùng một biểu tượng có thể bị dùng khác nghĩa hoặc chỉ còn icon trên màn hẹp.

**Required resolution:** mỗi trạng thái critical có icon + nhãn Việt ổn định ở mọi viewport; không bỏ nhãn để giải phóng chiều ngang. Kiểm tra mute từ đầu ca và toàn bộ flow vẫn hoàn thành được.

## Strengths Confirmed

- Single tap, không hover/drag/multitouch; target tối thiểu 48×48 CSS px.
- Tiếng Việt ngắn, trực tiếp; text quan trọng được wrap thay vì truncate.
- Trạng thái bếp, đơn, goal và lỗi không phụ thuộc chỉ vào màu.
- Audio có visual equivalent; mute không làm mất tín hiệu gameplay.
- Timer/lò vẫn hiện khi chọn topping; layout ổn định giúp giảm tải nhận thức.
- Pause lease, orientation và visibility bảo toàn state, không để thời gian chạy ngầm.
- Save/recovery mô tả hậu quả và không âm thầm reset dữ liệu.
- Không flashing nhanh; feedback thường ngắn và không block input.

## Required Acceptance Checks

1. Contrast audit cho mọi foreground/background/state; text thường đạt 4.5:1, indicator/UI boundary đạt 3:1 khi áp dụng.
2. Mỗi interactive target đo được ít nhất 48×48 CSS px sau scale ở `360×640`, `390×844`, `412×915` và không bị safe-area che.
3. Chạy toàn bộ order flow với mute bật; không mất cue cần thiết.
4. Chạy flow bằng mô phỏng deuteranopia/grayscale; raw/ready/warning/burned và success/error vẫn phân biệt được.
5. Kiểm tra 200% zoom/text scale: không mất nội dung, timer, action hoặc recovery path.
6. `prefers-reduced-motion: reduce`: không shake/bounce/flashing; state feedback vẫn rõ.
7. Kiểm tra chuỗi Việt dài, dấu đầy đủ, hai dòng và số tiền lớn ở viewport nhỏ nhất.
8. Xác nhận và test quyết định semantics/focus: DOM accessibility layer hoặc giới hạn phạm vi được ghi rõ.
9. Error/retry giữ đúng attention, busy state, return context và giải thích pause còn lại.

## Severity Summary

| Severity | Count |
| --- | ---: |
| High | 2 |
| Medium | 5 |
| Low | 2 |

**Gate condition:** xử lý A11Y-01 và A11Y-02 trước khi UX chuyển `status: final`; đưa A11Y-03 đến A11Y-07 thành acceptance criteria hoặc quyết định phạm vi rõ ràng.
