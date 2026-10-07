# Investigation: Sáu file điều tra/debug chưa commit

## Hand-off Brief

1. **What happened:** Sáu file cũ chưa được commit là artifact điều tra/review; không phải code game bị bỏ sót khi push. main và origin/main đều ở `6c1c916`.
2. **Where the case stands:** Đã đối chiếu bốn diff với lịch sử Git và chạy lại probe menu. Bốn diff đã được đại diện bởi các commit; đường tải nhiều ảnh lúc vào chơi lần đầu vẫn còn.
3. **What's needed next:** Giữ báo cáo/script đo để tái hiện. Nếu xử lý độ trễ, tối ưu asset/preload trong một thay đổi riêng, giữ giao diện đã duyệt. Không áp dụng lại các diff lịch sử.

## Case Info

| Field | Value |
| --- | --- |
| Date opened | 2026-10-06 |
| Status | Concluded |
| System | Windows, repo game-pizza-ong-VDB-ne, HEAD6c1c916 |
| Evidence sources | Git status/log,6file debug, code preload/portrait, probe local |

## Problem Statement

Sau khi đẩy các thay đổi game lên GitHub, người dùng yêu cầu “điều tra đi” về6file debug còn lại. Không có triệu chứng gameplay mới được báo.

## Evidence Inventory

| Source | Status | Notes |
| --- | --- | --- |
| Version control | Available | main...origin/main=0/0;6untracked cũ |
| Four review diffs | Available | Đối chiếu snapshot, không áp dụng patch |
| Menu report/probe | Available | Báo cáo cũ cold1.27–1.50s; script hardcode localhost4175 |
| User device/network | Missing | Không suy rộng latency local thành thời gian thiết bị thật |

## Investigation Backlog

| # | Path to Explore | Priority | Status | Notes |
| --- | --- | --- | --- | --- |
| 1 | Review diff ownership/staleness | High | Complete | Bốn snapshot đã có trong lịch sử commit |
| 2 | Menu entry bottleneck current code | High | Complete | Probe mới xác nhận lượng ảnh tải ban đầu và chênh lệch cold/warm |
| 3 | Retention/commit decision | Medium | Complete | Khuyến nghị giữ báo cáo/script; diff là bản nháp review |

## Confirmed Findings

- Git status6file; `git rev-list --left-right --count origin/main...main` trả0/0.
- `src/scenes/CozyScene.ts:147`: preload art Chợ/tổng kết; `src/scenes/CozyScene.ts:158`: đăng ký portraits khi create.
- `src/main.ts:54`: bỏ scene cũ rồi tạo scene mới khi vào chơi.
- `src/presentation/CustomerPortraits.ts:69`: getImageData toànsheet, quét alpha; frame có rồi được skip.

## Hypothesized Paths

### Hypothesis 1: Sáu file chứa code game chưa đẩy

**Status:** Refuted. Đối chiếu hash postimage và bản cuối commit cho thấy các thay đổi đã được commit. Các khác biệt còn lại là chỉnh sửa review cuối hoặc code đã được thay thế ở commit mới hơn; không tìm thấy implementation đang chờ áp dụng.

### Hypothesis 2: Nút Start/Continue còn chậm do preload asset

**Status:** Supported, with limits. Confirmed: đường cold tải 18 ảnh PNG và chậm hơn warm trong lần đo mới. Deduced: tải/khởi tạo asset góp phần vào độ trễ. Chưa đo riêng thời gian decode ảnh, quét portrait hay vẽ scene, nên chưa xác định tỷ trọng từng nguyên nhân.

## Artifact Classification

| File | Evidence | Recommendation |
| --- | --- | --- |
| `mobile-code-review.diff` | Base `124dbc0`, represented by `fa602b3`; bốn indexed postimage trùng commit | Bản nháp review lịch sử, không cần push như code |
| `reference-settings-review.diff` | Base `fa602b3`, represented by `9877cc3`; năm postimage trùng, test cuối thêm kiểm tra persistence | Bản nháp; chứa snippets âm thanh/cài đặt cũ đã thay thế |
| `scroll-review.diff` | Base `abea979`, represented by `9900910`; bản cuối có kiểm tra ingredient chặt hơn và thêm assertions | Bản nháp; không áp dụng lại mua hàng/regex cũ |
| `test-code-review.diff` | Base `9900910`, represented by `124dbc0`; 11 indexed postimage trùng | Bản nháp review lịch sử, không có code chưa đẩy |
| `menu-entry-investigation.md` | Báo cáo độ trễ trước đây; đường preload vẫn tồn tại | Nên giữ làm tài liệu lịch sử; line numbers/timing cần đọc theo thời điểm đo |
| `measure-menu-entry.mjs` | Probe Chromium, viewport 360×640, localhost port 4175 | Nên giữ cùng báo cáo; script chẩn đoán, không phải acceptance test |

Các diff còn chứa phần source chép thêm ngoài metadata patch chuẩn. Không coi chúng là patch đang chờ áp dụng. Rà soát không phát hiện credential hoặc đường dẫn máy cá nhân trong sáu file; `VIETVUIVE` là mã hỗ trợ trong game.

## Current Reproduction and Measurements

Preview bản build hiện tại bằng `npm.cmd run preview -- --port 4175 --strictPort`, rồi chạy `node _bmad-output/implementation-artifacts/investigations/measure-menu-entry.mjs`. Probe tạo browser context riêng, không dùng save trình duyệt của người chơi.

| Metric | 2026-10-06 local probe |
| --- | --- |
| Cold Start: click đến scene create hoàn tất | 2561,4 ms |
| Cold create riêng | 760,6 ms |
| Warm Continue: click đến scene create hoàn tất | 323,7 ms |
| Warm create riêng | 297,1 ms |
| PNG cold tải | 18 ảnh, 30.818.881 bytes (~29,39 MiB) |
| Page errors | Không có |

Đây là một lần đo headless Chromium local, không throttling. Mốc kết thúc là `create` hoàn tất, không phải chứng minh frame đầu đã hiển thị. Không dùng chênh lệch với báo cáo cũ (1,27–1,50 s cold) để khẳng định regression: chưa kiểm soát tải máy và chưa có nhiều mẫu mới.

## Conclusion and Confidence

**Confirmed, high confidence:** Không có commit local chưa push; bốn diff không chứa tính năng game bị bỏ sót. Sáu artifact cũ vẫn chưa được đưa lên GitHub.

**Confirmed locally:** Vào chơi lần đầu vẫn tải lượng ảnh lớn, kể cả art các màn Chợ/tổng kết chưa mở (`src/scenes/CozyScene.ts:147`). Scene mới được tạo khi vào chơi (`src/main.ts:54`), và portrait có đọc/quét dữ liệu ảnh (`src/presentation/CustomerPortraits.ts:69`).

**Deduced, moderate confidence:** Giảm dung lượng ảnh và trì hoãn tải art các màn chưa mở có thể giảm độ trễ cold. Quét portrait có thể đóng góp CPU, nhưng chưa đo riêng để kết luận mức ảnh hưởng.

Không xác lập thêm lỗi correctness từ việc kiểm tra bốn diff. Bước tiếp theo có giá trị là đo riêng tải/decode/portrait, rồi tối ưu theo bằng chứng; giữ nguyên bố cục và gameplay. Trong phiên này chỉ thêm báo cáo này, không sửa code game, không xóa artifact, không áp dụng diff hay push thêm.

## Tooling Notes

Máy thiếu uv và python nên resolver customization không chạy được. Đã đọc defaults và kiểm tra không có team/user override; activation_steps/persistent_facts/on_complete đều rỗng. Dùng điều tra trực tiếp; không cài thêm tool hay dừng giữa các bước vì task đã được người dùng giao.
