---
title: 'Epic9.3 — VIP10% và thưởng đúng một lần'
type: feature
created: '2026-10-05'
status: done
baseline_commit: a479559
context:
  - _bmad-output/project-context.md
  - _bmad-output/implementation-artifacts/ui-baseline-2026-10-02.md
---

<frozen-after-approval reason="user supplied VIP day/reward and clarified 10% repeatable arrivals">

## Intent

VIP mở từ ngày10, cơ hội10% mỗi lượt khách đủ điều kiện; có thể nhiều lần/ngày. Giao đúng món, bánh chín và trước hạn nhận thêm500 ngoài giá bán và+2uy tín. Đã thông báo với người dùng hiểu chỉ đổi tần suất, giữ đề xuất1bánh/đơn và100giây. Không áp cooldown/giới hạn sự kiện xấu lên VIP. Giữ luồng30ngày, Chợ/Kho/ca/tiền/lương/công thức và lưu dữ liệu hiện có.

## Boundaries & Constraints

Không tự thêm nhiệm vụ cuối30, đơn nhiều bánh, cấp/XP mới, giá premium, phí giao VIP hoặc art/layout mới. VIP là đơn tại quầy trong các ô hiện tại4/6, không sinh ô phụ hoặc đẩy khách. Đơn app/help/câu chuyện không trở thành VIP; khách thương mại thông thường/referral có thể thành VIP nếu được nhận vào hàng, sau kiểm tra capacity và món menu đầu ca. Giữ avatar/identity; tên/nhãn VIP và thưởng trong khung đơn/kết quả hiện có, finance hiện có. Không ghi giữa ca; report reward optional giữ save cũ và checksum gốc.

## I/O & Edge-Case Matrix

| Given | When | Then |
|---|---|---|
| Ngày9 hoặc help/app | Xét arrival | Không VIP |
| Ngày10–30, quầy/món hợp lệ/chỗ trống | Roll<0.1 | VIP1bánh, hạn100s |
| Roll=0.1,invalid | Arrival | Khách bình thường |
| Hai roll hợp lệ trong ca | Nhận cả hai | Hai VIP; không dailycap/cooldown |
| Hàng đầy/món khóa | Arrival | Không thêm đơn/đẩy khách hoặc reroll |
| VIP đúng món/chín/trước hạn | Giao | Giá thường+500cash,2uytín riêng,XP thường một đơn |
| VIP sai/raw/burnt/expired | Xử lý | Không500/+2; luật đánh giá thường vẫn áp dụng |
| Đã giao VIP | Giao/retry/restore | Không thưởng lại; report/cash/rewards khớp |
| Save cũ | Normalize | Giữ báo cáo/tiền/XP cũ, không tạo VIP lịch sử |

</frozen-after-approval>

## Code Map

- `src/config/vipCustomers.ts`, `src/domain/VipCustomers.ts`: thông số/config và roll theo seed/day/arrival ID, channel riêng vớiA; testdeps vipRoll.
- `src/runtime/CozyRuntime.ts`: đánh dấu ticketVIP, patience100 không buff để giữ hạn đã chốt, đóng băng món/menu và giá thông thường; thưởng nguyên tử sau deliverguard; terminalreview optionalvip/vipReward.
- `src/domain/CozyCheckpoint.ts`: receipt/bonus/review eligibility bounded, đối soát rewards500×VIP thành công cùng phần thưởng cũ; optional legacy.
- `src/domain/DayAccounts.ts`: lời giải thích rewards gồmVIP, giữ profit/revenue không cộng thưởng.
- `src/scenes/CozyScene.ts`, `src/presentation/ReferenceSummary.ts`: nhãn/chi tiết VIP và thưởng trong panel/kết quả/finance hiện có; tránh ghi thưởng VIP thành nhiệm vụ.
- `src/runtime/CozyVipCustomers.test.ts`, `tests/vip-customers.spec.ts`: biên xác suất/tần suất/deadline/reward/idempotence/cash/report/native-save/UI360×640.

## Tasks & Acceptance

- [x] Config/policy: đúng10%, từ10, nhiều lần/ngày, ổn định theo identity/seed/day/slot; không xét lại mỗi frame.
- [x] Runtime: chỉ đơn quầy đủ điều kiện; menu sở hữu/đang bán, capacity4/6;100s/1pizza; correct/good/ontime500/+2once; không đổi nhiệm vụ/XP bình thường.
- [x] Checkpoint/accounts: validate receiptbonus/reward, negativecashA và lương cùng ca; báo cáo lịch sử không sửa, old checksum trước normalize; no midshiftwrite.
- [x] UI: nhận diện VIP và điều kiện thưởng đọc được trong khung hiện có, tiền bán/thưởng riêng; giữ UIbaseline.
- [x] Focused units/E2E/build, ba review độc lập, đồng bộ docs/sprint.

Given cùng checkpoint/arrival, when reload hoặc mua nguyên liệu/đóng menu, then roll không đổi. Given giao sai cần xác nhận, when xác nhận, then không nhận thưởngVIP; raw/burnt cũng không. Given rep99, when đủ thưởng, then chạm cap100 theo luật uy tín hiện có và ghi delta thực nhận; quy tắc thưởng cấu hình vẫn+2. Given late, when đến deadline, then expire theo clock hiện có và không thưởng. Given haiVIP đúng, when chốt/retry/reload, then rewards thêm1000 đúng một lần và doanhthu/XP chỉ theo hai đơn thường.

## Design Notes

Giữ CustomerKind hiện có; flagVIP thuộc ticket và review, không thay source app/shop. VIP bỏ bargain negotiation để không gắn giảm giá chưa chốt; chọn profilepicky khi được promote giữ maxprice/penalty rõ ràng. Xét một lần theo slot sau kiểm tra chỗ/menu, tên giữ customeridentity với nhãnVIP. Report lưu điều kiện đạt thưởng (correct/good/onTime) để validator không dựa hoàn toàn vào stars: gần hạn có thể đánh giá thấp nhưng vẫn đủ thưởng. Delta thực nhận reputation cần ghi riêng với bonus mong muốn để không vượt cap100. Award trước terminal snapshot hoặc điều chỉnh review một cách nguyên tử; các guard source/target/command có sẵn chặn trùng. Seedreuse từcampaignEventSeed nhưng salt/channelVIP riêng tránh tương quanA. Save cũ không có marker không tính thưởng hồi tố.

## Verification

Unit: ngày9/10/29/30;0.099/0.1invalid; nhiềuVIP; capacity/help/app/menu;100sPause; đúng/sai/raw/burnt/late; commands/reload; report500/rewards/profit/XP và caprep. Native IndexedDB: end/retry/restore giữbonus một lần;UI360×640 đọc nhãn/thưởng, không reflow. Build-nolog, không chạy fullmatrix hoặc khẳng định balance đã playtest.

Kết quả: build đạt;50unit/6files và12testVIP sau bản sửa avatar đạt.2VIP E2E và5E2E sự kiện/chiến dịch360×640 đạt. Ba reviewer độc lập: một P2 avatar khách quen đổi khi promoteVIP, đã sửa bằng chọn identity theo kind gốc rồi áp profileVIP; có regression149 và reviewer xác nhận. Getter daySummary/completedReports/exportCheckpoint đều deepclone receipt. Finance/notice giữ art, số ô và kích thước. Fixture E2E dùng simulation clock có điều khiển để thao tác browser chậm không làm bánh cháy ngẫu nhiên; production clock không sửa.

## Suggested Review Order

- Xét từng slot đủ điều kiện, giữ identity trước khi áp profileVIP.
  [CozyRuntime.ts:286](../../src/runtime/CozyRuntime.ts#L286)
- Thưởng sau guard giao, lưu receipt và delta uy tín thực nhận.
  [CozyRuntime.ts:264](../../src/runtime/CozyRuntime.ts#L264)
- Đối soát receipt và tiền thưởng, giữ lịch sử save cũ.
  [CozyCheckpoint.ts:52](../../src/domain/CozyCheckpoint.ts#L52)
- Hiển thị nhãn/thưởng trong khung đơn và thông báo đã duyệt.
  [CozyScene.ts:554](../../src/scenes/CozyScene.ts#L554)
- Tách thưởng khỏi doanh thu trong chi tiết tài chính hiện có.
  [ReferenceSummary.ts:169](../../src/presentation/ReferenceSummary.ts#L169)
- Biên xác suất, nhiềuVIP, chất lượng và avatar khách quen.
  [CozyVipCustomers.test.ts:26](../../src/runtime/CozyVipCustomers.test.ts#L26)
- Giao diện360×640 và native-save/retry/restore đúng một lần.
  [vip-customers.spec.ts:21](../../tests/vip-customers.spec.ts#L21)
