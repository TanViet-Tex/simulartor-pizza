---
title: 'Game Architecture - Pizza'
project: 'Game pizza - ten phat hanh chua chot'
date: '2026-09-29'
author: 'CuTo'
version: '1.0'
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9]
status: 'complete'
currentStep: 9
engineSelection: 'confirmed'
starterSelection: 'confirmed'
engine: 'Phaser 4.2.1'
platform: 'Mobile web portrait - Chrome Android and Safari iOS'
gdd: 'planning-artifacts/pizza-gdd/gdd.md'
epics: 'planning-artifacts/pizza-gdd/epics.md'
brief: null
---

# Kiến trúc game pizza

## Executive Summary

**Game pizza (tên phát hành chưa chốt)** dùng Phaser 4.2.1, TypeScript và Vite cho mobile web dọc trên Chrome Android và Safari iOS.

**Key Architectural Decisions:**

- Domain TypeScript thuần tách khỏi Phaser scene; mọi gameplay mutation đi qua typed command pipeline.
- Đồng hồ mô phỏng dùng owned pause leases; chỉ chạy lại khi tất cả lý do pause đã được giải phóng.
- IndexedDB chỉ transaction tại tạo chiến dịch và checkpoint cuối ngày; ngày đã chốt không thể chơi lại.

**Project Structure:** tổ chức lai theo domain với 16 hệ thống GDD được ánh xạ vào domain, runtime, feature, presentation và infrastructure.

**Implementation Patterns:** 8 patterns `IP01–IP08` bảo đảm các agent triển khai nhất quán.

**Ready for:** kiểm tra implementation readiness, tạo/cập nhật stories và triển khai demo ba ngày sau khi người dùng cấp quyền sửa code.

## Trạng thái tài liệu

Khởi tạo theo BMAD Game Dev Studio, gds-game-architecture. Người dùng đã duyệt GDD v0.2 và epics, đồng thời yêu cầu bắt đầu kiến trúc. Hoàn thành bước 1/9: phát hiện đầu vào và khởi tạo. Không có kiến trúc trước đó; không tìm thấy game brief hoặc narrative riêng.

GDD/epics đã duyệt là nguồn thiết kế. Tài liệu kiến trúc đã hoàn tất qua 9 bước và sẵn sàng làm đầu vào triển khai. Việc hoàn tất tài liệu không tự cấp quyền cài dependency, scaffold hoặc sửa code game.

## Project Context

Người dùng xác nhận phần bối cảnh bằng C. Hoàn thành bước 2/9; tiếp theo là chọn engine/starter. Đoạn khởi tạo phía trên ghi lịch sử bước 1.

### Game Overview

Game quản lý tiệm pizza 2D cartoon, mobile web dọc, cảm ứng, nhịp thư giãn. Demo ba ngày thuộc E01–E04; giữ đường mở rộng E05–E09 cho đủ 16 hệ thống và chiến dịch 30 ngày. Tên phát hành chưa chốt.

### Core Systems

| Nhóm | Yêu cầu kiến trúc | Độ phức tạp |
| --- | --- | --- |
| Làm pizza và đơn hàng | Trạng thái bánh/lò/phiếu, đóng gói, thời hạn | Vừa |
| Khách và quan hệ | Tách đánh giá đơn, uy tín, tính cách, quan hệ khách quen | Vừa |
| Kho và kinh tế | Giữ nguyên liệu, hạn dùng, giá vốn, dòng tiền, lợi nhuận | Cao |
| Tiến độ | Mục tiêu, nhiệm vụ, XP, mở khóa, thưởng một lần | Vừa |
| Ngày chơi và lưu | Pause thống nhất, checkpoint cuối ngày, tiếp tục ngày chưa hoàn tất | Cao |
| Sau demo | Nhà cung cấp, giao hàng, thời tiết, nhân viên, quảng bá, nhiệm vụ ẩn, khách đặc biệt | Cao khi tích hợp |

### Technical Requirements

- Mobile web là chính; Chrome Android và Safari iOS. Desktop là nền tảng kiểm tra phụ.
- Màn dọc từ 360×640 CSS px, kiểm tra 390×844 và 412×915; vùng chạm tối thiểu 48×48 CSS px.
- Mục tiêu 60 FPS, không dưới 30 FPS kéo dài quá một giây theo GDD. Asset tải đầu tối đa 10 MB; vào màn bắt đầu trong 5 giây ở mạng 20 Mbps, cache trống.
- Không có multiplayer, tài khoản hoặc yêu cầu đồng bộ máy chủ. Không có tiến độ ngoài giờ chơi.
- Baseline kiểm tra là Chrome Android trên thiết bị 4 GB RAM và Safari iOS từ iPhone 11; đo cả ba viewport đã nêu. Ngân sách runtime mục tiêu là dưới 200 MB theo công cụ trình duyệt trong ca đầy phiếu; nếu thiết bị thực tế của nhóm thấp hơn baseline thì hạ baseline trước khi chốt asset.

### Complexity Drivers and Risks

Demo có độ phức tạp tổng thể vừa; tích hợp toàn chiến dịch cao hơn. Rủi ro trọng tâm: mất/nhân đôi tiến độ khi lưu hoặc retry thao tác lưu; tính tiền/phần thưởng hai lần; đồng hồ vẫn chạy khi tab ẩn, xoay màn hoặc mở lời đề nghị. Kiến trúc cần giữ các luật này độc lập với hiển thị và animation. Hai mẫu riêng Day Commit Boundary và Owned Pause Lease xử lý các luồng nhiều hệ thống này; các phần còn lại ưu tiên mẫu thông dụng với ranh giới trách nhiệm rõ.

## Decision Summary

| Category | Decision | Version | Rationale |
| --- | --- | --- | --- |
| Engine | Phaser | 4.2.1 | 2D web, scene/input/audio phù hợp mobile và template chính thức |
| Language/build | TypeScript + Vite từ template chính thức | TypeScript 5.7.2; Vite 6.3.1 | Giữ baseline template, tránh nâng major không cần thiết |
| Runtime/package manager | Node.js LTS + npm | Node 24.21.0; npm 11.19.0 | Nhánh LTS, hỗ trợ toolchain đã chọn |
| Minification | Terser do starter cung cấp | 5.39.0 | Giữ cấu hình production của starter |
| Unit/integration test | Vitest | 4.1.11 | Tương thích dòng Vite 6, phù hợp module TypeScript thuần |
| Browser test | Playwright | 1.63.0 | Kiểm tra Chromium/WebKit, viewport, lifecycle và IndexedDB |
| State/API | Typed in-process commands, events và selectors | N/A | Không có HTTP API; một đường mutation cho gameplay |
| Persistence | IndexedDB native, snapshot versioned | Web platform API | Transaction tại tạo chiến dịch/chốt ngày; không ghi mỗi lần chạm |
| Authentication | Không có tài khoản, auth hoặc authorization | N/A | Single-player local, ngoài phạm vi đã duyệt |
| Backend/network | Không backend, không realtime | N/A | Demo không cần server hoặc đồng bộ |
| UI | Phaser UI; HTML/CSS chỉ làm shell/safe area | Phaser 4.2.1 | Một hệ input/layout gameplay, không thêm React |
| Physics | Không bật physics | N/A | Tương tác quầy không cần mô phỏng vật lý |
| Deployment | Static `dist/` qua HTTPS; nhà cung cấp host hoãn tới phát hành | Vite 6.3.1 output | Không khóa nhà cung cấp; mọi host tĩnh chuẩn đều phù hợp |
| Optional tooling | Không đưa MCP vào baseline demo | N/A | Chưa có MCP nào được người dùng chấp nhận; có thể duyệt bổ sung sau |

Phiên bản được kiểm tra ngày 2026-09-29 từ nguồn chính thức. Phaser hiện ở 4.2.1; template 1.4.0 khai báo TypeScript 5.7.2, Vite 6.3.1 và Terser 5.39.0; Node 24.21.0 là nhánh LTS. Vitest 5 yêu cầu Vite từ 6.4 nên baseline giữ Vitest 4.1.11 thay vì kéo Vite khỏi starter; Playwright 1.63.0 là bản stable được kiểm tra cùng ngày.

## Engine & Framework

### Quyết định đã xác nhận

Người dùng chọn Phaser và template TypeScript + Vite chính thức: [phaserjs/template-vite-ts](https://github.com/phaserjs/template-vite-ts). Lựa chọn này không phải phê duyệt toàn bộ kiến trúc và không cấp quyền cài dependency hoặc sửa code game.

Phiên bản engine mục tiêu là **Phaser 4.2.1**, theo đề xuất đã trình và [release chính thức](https://github.com/phaserjs/phaser/releases/tag/v4.2.1) được kiểm tra ngày 2026-09-29. Phaser phù hợp định hướng game 2D chạy trên trình duyệt, tích hợp TypeScript và vòng đời scene; không cần editor riêng để sử dụng template đã chọn.

### Starter và chính sách phiên bản

[package.json của template](https://raw.githubusercontent.com/phaserjs/template-vite-ts/main/package.json) tại thời điểm kiểm tra ghi phiên bản template 1.4.0, Phaser 4.0.0, TypeScript ~5.7.2, Vite ^6.3.1 và Terser ^5.39.0. Đây là khai báo upstream, không phải bộ dependency đã cài hoặc lockfile đã kiểm chứng của dự án. Mô tả package còn nhắc Phaser 3; lấy dependency thực tế làm bằng chứng phiên bản.

Khi kiến trúc được duyệt và bước triển khai được phép bắt đầu: chọn một commit template xác định, ghi SHA nguồn, đưa Phaser về phiên bản mục tiêu 4.2.1 và kiểm tra typecheck/build cùng tương thích mobile trước khi chốt lockfile. Không tự coi các dải TypeScript/Vite trong template là phiên bản mới nhất; phiên bản toolchain chính xác và Node.js sẽ được xác minh ở phần môi trường phát triển. Không tự nâng major của toolchain chỉ vì có bản mới.

Template cung cấp cấu hình TypeScript, Vite dev/build và mã scene mẫu. Chỉ dùng làm bộ khung, không coi gameplay mẫu là thiết kế pizza. Kiến trúc quyết định không dùng React hoặc framework UI bổ sung; gameplay UI nằm trong Phaser, HTML/CSS chỉ làm shell.

Các lệnh tương lai từ template gồm npm install, npm run dev-nolog và npm run build-nolog; chỉ ghi tham chiếu, chưa chạy. Ưu tiên biến thể nolog có sẵn để không chạy log.js của template. Chưa clone/download template, tạo package.json hoặc cài package vào dự án.

### Kiến trúc do engine và starter cung cấp

| Thành phần | Nguồn | Trách nhiệm / giới hạn |
| --- | --- | --- |
| Hiển thị 2D | Phaser | Sprite, animation, camera và renderer; chọn cấu hình render/scale cụ thể ở bước quyết định |
| Input | Phaser | Pointer cho touch/mouse; game vẫn phải bảo đảm vùng chạm và không nhận thao tác lặp |
| Âm thanh | Phaser | Tải/phát âm thanh; game phải xử lý mute và tương tác đầu tiên trên mobile |
| Scene và tài nguyên | Phaser | Vòng đời scene, loader; không tự lưu tiền, kho hoặc ngày chơi |
| Physics | Khả năng của engine, không phải yêu cầu demo | Đề xuất không bật physics cho thao tác quầy; quyết định ở bước 4 |
| Build và ngôn ngữ | Template, Vite, TypeScript | Phát triển cục bộ và đóng gói web; không cung cấp mô hình kinh tế/save game |

Không mặc định mọi ví dụ trong knowledge fragment Phaser cục bộ đều khớp Phaser 4. Kiểm tra API theo phiên bản mục tiêu khi chốt render, scale và vòng đời ở bước tiếp theo; chưa cam kết cơ chế fallback renderer chỉ từ ví dụ cũ.

### Phạm vi quyết định đã xử lý

Các bước 4–7 đã chốt ranh giới domain/scene/UI/config, clock và pause, giao dịch tiền/kho, save cuối ngày, layout dọc, asset, test, toolchain và triển khai static web. Thông số cân bằng chi tiết của E05–E09 vẫn thuộc thiết kế epic tương ứng, không phải khoảng trống của kiến trúc nền.

### Công cụ AI tùy chọn

Không có MCP nào được chọn, cài hoặc đưa thành dependency bắt buộc; baseline demo ghi nhận **không dùng MCP**. [Context7](https://github.com/upstash/context7) là lựa chọn tra tài liệu/API theo thư viện để cân nhắc sau. [Phaser Editor MCP](https://github.com/phaserjs/editor-mcp-server) dành cho Phaser Editor v5, không tự áp dụng cho template Vite đã chọn. Nếu người dùng duyệt bổ sung MCP sau này, phải xác minh phiên bản/hoạt động và điều kiện cài ở bước môi trường; quyết định đó không chặn triển khai bằng tài liệu chính thức.

### Trạng thái bước 3

Engine và starter đã được người dùng xác nhận và lưu theo yêu cầu. Người dùng tiếp tục bằng C; bước 3 hoàn thành và các bước quyết định sau đó đã chốt. Không dùng MCP trong baseline demo; có thể duyệt bổ sung sau nhưng đây không phải điều kiện để thiết kế hoặc chạy game.

## Architectural Decisions - Bước 4 đã duyệt

Trạng thái: đã được người dùng duyệt bằng C, kèm ba điều kiện làm rõ bên dưới. Đây là baseline kiến trúc cho bước 5; không thay luật GDD v0.2.

Người dùng đã xác nhận toàn bộ bước 4 và ba nguyên tắc của D02–D04: lưu checkpoint cuối ngày và xử lý lỗi/dữ liệu hỏng an toàn; cập nhật tiền/kho trong logic tách khỏi transaction IndexedDB, không ghi mỗi lần bấm; theo dõi riêng lý do pause và chỉ chạy khi tất cả đã hết.

### Ưu tiên và lựa chọn

| ID / mức | Hạng mục | Đề xuất | Phương án khác và đánh đổi |
| --- | --- | --- | --- |
| D01 / thiết yếu | State | Logic TypeScript độc lập với Phaser, một nơi sở hữu trạng thái; state machine cho ngày/đơn/lò | Đặt state trong từng scene viết nhanh hơn ban đầu nhưng khó kiểm tra và hoàn nguyên đồng bộ; ECS tăng chi phí tổ chức mà demo chưa cần |
| D02 / thiết yếu | Đồng hồ và pause | Một đồng hồ mô phỏng dùng thời gian chơi; tập hợp các lý do pause | Timer rải ở scene hoặc giờ hệ thống dễ lệch khi ẩn tab, mở lời đề nghị hoặc pause lồng nhau |
| D03 / thiết yếu | Cập nhật logic | Command kiểm tra điều kiện và cập nhật tiền/kho/phiếu/thưởng thống nhất trong RAM; không ghi database theo mỗi thao tác | Listener UI tự sửa từng biến đơn giản nhưng dễ tính tiền hoặc thưởng lặp |
| D04 / thiết yếu | Save | IndexedDB native, snapshot có phiên bản; checkpoint cuối ngày để tiếp tục ngày mới; báo lỗi lưu/dữ liệu hỏng; không quay lại ngày đã chốt | localStorage ít API hơn nhưng đồng bộ và khó tổ chức giao dịch nhiều bản ghi; cloud save cần backend/tài khoản ngoài phạm vi |
| D05 / quan trọng | Scene/UI | Boot, Preload, Shop, Summary và Overlay; UI gameplay bằng Phaser, HTML/CSS chỉ cho vỏ trang/vùng an toàn | UI DOM hỗn hợp thuận lợi cho biểu mẫu nhưng thêm đồng bộ vị trí/input; chưa cần React |
| D06 / quan trọng | Khách và dữ liệu | State machine + bảng công thức, lịch khách, nhiệm vụ và hội thoại có ID ổn định | Behavior tree/GOAP phức tạp hơn nhu cầu khách theo lịch; không cần dịch vụ AI bên ngoài |
| D07 / quan trọng | Asset | Tải tài nguyên demo trước ca đầu, cache dùng lại; manifest tách theo giai đoạn cho chiến dịch | Tải tất cả asset 30 ngày làm tăng tải đầu; streaming trong ca tăng rủi ro gián đoạn |
| D08 / quan trọng | Audio | Sound Manager của Phaser, nhóm nhạc/SFX và mute; kích hoạt sau tương tác người dùng | Thêm thư viện audio tạo hệ thống thứ hai mà demo chưa cần |
| D09 / quan trọng | Vật lý và mạng | Không bật physics; không backend trong demo, phát hành static web | Physics/đồng bộ server không phục vụ thao tác quầy hiện tại |

Có thể để sau: MCP, service worker/PWA offline, cloud save. Không bổ sung những mục này thành yêu cầu demo. Chơi sau khi tài nguyên đã tải không đồng nghĩa bảo đảm mở lại trang khi mất mạng.

### D01–D03: Trạng thái, thời gian và giao dịch

Luồng đề xuất: input → command → kiểm tra luật → trạng thái mới → hiệu ứng/UI. Scene chỉ gửi ý định và hiển thị kết quả; không trực tiếp cộng tiền, trừ kho hoặc phát thưởng. Logic không giữ tham chiếu Sprite/Scene, nhờ đó kiểm tra kinh tế và save không cần canvas.

Ngày chuyển qua chuẩn bị → bán → kết thúc đơn → tổng kết → ngày mới/kết thúc demo. Pause là trạng thái trực giao, không xóa giai đoạn ngày. Đơn giúp đỡ có loại riêng để không bị tính nhầm vào doanh thu, sao hoặc nhiệm vụ thương mại. Animation hoàn thành không phải tín hiệu xác nhận thu tiền.

Đề xuất đồng hồ theo bước 50 ms (20 Hz), rendering độc lập. Mọi hạn đơn/lò/lịch khách lấy cùng thời gian mô phỏng; không dựa ngày giờ ngoài đời. Pause giữ tập lý do: người chơi, lời đề nghị, hướng dẫn, tab ẩn, xoay ngang. Chỉ chạy khi không còn lý do; quay lại ứng dụng cần chạm tiếp tục. Overlay vẫn nhận được thao tác tiếp tục. Bỏ thời gian nền, không chạy bù khi quay lại; nếu gián đoạn bất thường dài hơn 250 ms, tự dừng với thông báo thay vì làm cháy bánh trong khoảng người chơi không điều khiển được. Ngưỡng này là quyết định kỹ thuật đề xuất cần duyệt.

Nhận đơn giữ nguyên liệu theo lô; nướng trừ đúng lô/nguyên liệu đã chọn; hủy giải phóng phần chưa dùng. Mỗi command áp dụng toàn bộ hoặc không thay đổi gì khi điều kiện thất bại. Tiền lưu bằng số nguyên xu, không cộng tiền trong callback animation. Phiếu kết thúc chỉ có một kết quả; mỗi phần thưởng có ID và cờ đã nhận trong trạng thái. Mọi input phải được kiểm tra lại theo trạng thái hiện hành, không chỉ khóa nút để chống double-tap.

**Hai loại thao tác khác nhau:** cập nhật logic là kiểm tra và áp dụng một command trong bộ nhớ, không phải transaction database. Transaction IndexedDB chỉ dùng ở ranh giới lưu: khởi tạo chiến dịch và chốt cuối ngày. Các lần chạm thêm topping, nhận đơn, mua nguyên liệu hoặc giao bánh chỉ cập nhật RAM; không gọi ghi database trực tiếp. Trạng thái đang chơi có thể mới hơn checkpoint đã lưu, đúng chính sách không khôi phục giữa ca.

**Bổ sung yêu cầu 2026-10-04, chưa triển khai — chỉ Trang trí/Tiện nghi:** người dùng yêu cầu mua đồ trong chuẩn bị phải ghi tiền và sở hữu cùng giao dịch, lưu thành công rồi UI xác nhận; reload giữ sở hữu/bố trí/cấp, save cũ giữ tiền/tiến độ. Bổ sung này mở ranh giới giao dịch chuẩn bị cho đồ, không đổi topping/đơn/mua nguyên liệu/giao bánh thành ghi mỗi tap hoặc lưu giữa ca. Thiết kế schema/version/revision/commit/lỗi/retry/migration và xác nhận đặt/cất cần chi tiết hóa ở backlog7.5, trước khi bật chức năng; không coi cơ chế hiện tại đã hỗ trợ. Xem [yêu cầu chức năng](implementation-artifacts/requirement-decoration-and-amenity-effects.md). Bảo toàn snapshot chung, chặn mở ngày khi pending, không lùi ngày đã chốt; scene không ghi database hoặc sở hữu tiền trực tiếp.

**Quyền sở hữu pause:** mỗi nguồn giữ token/lý do riêng, chỉ giải phóng token của mình. Đóng lời đề nghị không được xóa pause do tab ẩn hoặc người chơi. Nếu nhiều đối tượng cùng một loại lý do tồn tại, dùng token riêng để một đối tượng không bỏ pause của đối tượng khác. Khi tab hiện lại, thay lý do tab ẩn bằng yêu cầu chạm tiếp tục; chạm chỉ bỏ yêu cầu đó, không bỏ các lý do còn hiệu lực. Điều kiện chạy là tập token rỗng và giai đoạn ngày cho phép chạy đồng hồ; UI pause luôn có thể tương tác.

### D04: Lưu cuối ngày và tiếp tục chiến dịch

Snapshot có schemaVersion, contentVersion và dữ liệu ngày/tiền/kho/XP/uy tín/quan hệ/nhiệm vụ/cờ thưởng/lịch khách. Không serialize scene hoặc animation. **Cuối ngày là mốc lưu tiến độ chính.** Khi tạo chiến dịch, lưu mốc trước mua hàng ngày 1; khi chốt ngày D, ghi trạng thái đầu ngày D+1. Chỉ checkpoint mới nhất được dùng để tiếp tục, không lưu danh sách ngày cho người chơi chọn. Phiên chơi trong ca ở RAM; tải lại trở về đầu ngày hiện tại chưa chốt, không khôi phục giữa ca và không mở lại ngày đã chốt.

Tại tổng kết, tính kết quả một lần trong bộ nhớ rồi ghi kết quả và checkpoint ngày tiếp theo trong cùng transaction. Ngày cuối chỉ ghi tổng kết, không tạo ngày 4 chơi được. Chỉ đánh dấu đã lưu khi transaction hoàn thành, không chỉ khi một yêu cầu ghi riêng lẻ thành công. Lỗi ghi giữ checkpoint cũ và kết quả đang chờ lưu trong RAM, thông báo rõ ngày nào chưa được lưu và rủi ro mất phần chưa lưu nếu đóng trang. Cho thử ghi lại cùng kết quả, không tính thưởng lại; không tự chuyển ngày. Đây là retry thao tác lưu, không phải chơi lại ngày. Mỗi lần chốt có ID ổn định để kiểm tra một lần ghi đã hoàn tất hay chưa trước khi retry. Nếu storage không dùng được ngay khi bắt đầu, báo rõ và cho chọn thử lại hoặc chủ động chơi tạm không lưu; không tự chuyển sang chế độ này khi đang lưu lỗi.

Ngày đã chốt là bất biến: không có command, UI hoặc transaction để chọn ngày cũ, xóa kết quả ngày đã chốt hay tạo nhánh tiến độ khác. Nếu checkpoint đầu ngày mới cho thấy không đủ vốn theo GDD, chiến dịch kết thúc; chỉ có xem tổng kết hoặc tạo chiến dịch mới. Revision được kiểm tra khi ghi để hai tab không ghi đè tiến độ nhau; tab có revision cũ phải tải lại, không tự merge. Trình duyệt có thể xóa dữ liệu local; không cam kết sao lưu đám mây.

**Dữ liệu hỏng hoặc không tương thích:** kiểm tra cấu trúc, kiểu/giới hạn giá trị, phiên bản và liên kết ID trước khi đưa snapshot vào logic. Không sửa tiền/kho tùy tiện hoặc tự reset về game mới. Mỗi lần chốt giữ hai bản vật lý của cùng checkpoint mới nhất (active và backup trước khi thay active); backup không phải checkpoint ngày cũ có thể chọn. Nếu active hỏng, chỉ tự đề xuất backup khi nó có cùng commitId/revision; người chơi xác nhận phục hồi. Nếu cả hai không hợp lệ hoặc khác commit, cho thử đọc lại hoặc bắt đầu chiến dịch mới có xác nhận, không lùi về một ngày đã hoàn tất. Phiên bản save mới hơn game hiện tại được báo là chưa tương thích, không đánh đồng với dữ liệu hỏng. Migration chỉ chạy trên bản sao được kiểm tra và thay bản chính sau khi thành công. Chi tiết schema và thông báo sẽ được hoàn thiện ở bước xử lý lỗi.

IndexedDB là API trình duyệt, không phải package cần cài. Cơ sở lựa chọn là dữ liệu có cấu trúc, API bất đồng bộ và transaction; không coi transaction là bảo đảm chống mọi mất dữ liệu do hệ điều hành hoặc người dùng xóa storage. [Tài liệu IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API).

### D05–D09: Trình bày và tài nguyên

Shop hiển thị chuẩn bị và ca bán theo trạng thái domain; Summary hiển thị kết quả đã tính; Overlay sở hữu lời đề nghị/pause và không sở hữu đồng hồ. Bố cục responsive dọc phải bảo đảm nút 48 CSS px sau scale; renderer/scale policy và ngân sách cụ thể sẽ chốt trong phần hiệu năng, không tự suy ra từ kích thước canvas.

Phaser hỗ trợ nhiều scene và vòng đời pause/resume, nhưng không dùng việc pause toàn engine làm cơ chế duy nhất vì giao diện tiếp tục vẫn cần nhận input. Tài nguyên dùng lại được tải trước ca, báo lỗi và retry khi thiếu tài nguyên bắt buộc; không bắt đầu bán trong trạng thái thiếu asset. Nhạc/SFX dùng một Sound Manager, dừng/phát theo chính sách trạng thái, không tự giả định nhạc ngừng khi đổi scene. [Scene](https://docs.phaser.io/phaser/concepts/scenes), [Loader](https://docs.phaser.io/phaser/concepts/loader), [Audio](https://docs.phaser.io/phaser/concepts/audio).

Không thêm package hoặc phiên bản thư viện mới trong các đề xuất bước 4. Phaser mục tiêu vẫn 4.2.1; IndexedDB là API nền tảng. Phiên bản Node/TypeScript/Vite chính xác chốt ở môi trường phát triển trước triển khai.

### Truy vết và điểm duyệt

- E01–E02: D01–D03 và D05–D09 cung cấp vòng lặp, khách, UI và phản hồi.
- E03: D01/D03/D04 bảo đảm kho, tiền và sổ thu chi nhất quán.
- E04: D01–D06 bảo đảm ba ngày, thưởng và nhánh khách quen không lặp khi tải lại.
- E05–E09: mở rộng dữ liệu và hệ thống nghiệp vụ trong cùng ranh giới, chưa tạo module/code cho tính năng sau demo.

Ba nguyên tắc người dùng nêu cho D02–D04 đã được ghi nhận. Người dùng chọn C, vì vậy bước 4 hoàn thành và workflow chuyển sang bước 5. Việc duyệt này không cấp quyền sửa code hoặc cài dependency.

## Cross-cutting Concerns - Bước 5 đã duyệt

Trạng thái: người dùng đã duyệt bằng C. Các quy tắc dưới đây áp dụng cho mọi hệ thống E01–E09 và mọi agent triển khai sau này.

### X01. Error Handling

**Chiến lược:** domain trả về `Result` có kiểu cho lỗi dự kiến; adapter trình duyệt/Phaser bắt exception kỹ thuật tại ranh giới; một Error Coordinator quyết định thông báo, pause và khả năng thử lại. Không dùng exception cho kết quả gameplay hợp lệ như thiếu nguyên liệu, giá quá cao hoặc đơn hết hạn.

| Mức | Ví dụ | Hành vi |
| --- | --- | --- |
| Domain rejection | Thiếu nguyên liệu, command không hợp lệ | Không đổi state; UI giải thích gần thao tác; không pause toàn game |
| Recoverable technical | Asset tải lỗi, IndexedDB transaction thất bại | Giữ state an toàn; pause bằng token riêng nếu cần; cho thử lại |
| Data integrity | Save sai schema, ID không tồn tại, revision xung đột | Không nạp vào domain; giữ bản gốc; thông báo mốc phục hồi hợp lệ |
| Fatal boot | Không thể khởi tạo renderer hoặc thiếu asset bắt buộc sau retry | Dừng trước gameplay; hiển thị màn lỗi có tải lại; không tạo save mới |

Ví dụ hợp đồng bắt buộc:

```ts
type GameResult<T, E extends GameError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

type GameError = {
  code: string;
  severity: "notice" | "recoverable" | "integrity" | "fatal";
  messageKey: string;
  context?: Readonly<Record<string, string | number | boolean>>;
};
```

Mỗi lỗi có `code` ổn định cho log/test và `messageKey` cho UI; không đưa exception thô, stack trace hoặc dữ liệu save vào thông báo người chơi. Catch chỉ đặt tại ranh giới có phương án xử lý; không bắt rồi bỏ qua. Khi lỗi ghi cuối ngày, Error Coordinator thêm pause token `save-error:<commitId>` và chỉ bỏ token sau khi retry thành công hoặc người chơi chọn rõ chế độ không lưu.

### X02. Logging

**Định dạng:** bản ghi có cấu trúc trong code, xuất console dễ đọc ở development. Không có dịch vụ telemetry trong demo. Release chỉ giữ `ERROR`, `WARN` và các mốc `INFO` cần chẩn đoán; `DEBUG` bị loại hoặc tắt mặc định.

Trường chuẩn: `level`, `event`, `system`, `sessionId`, `gameDay`, `simulationTimeMs`, `revision`, `context`. Không log tên thật, thông tin thiết bị nhận dạng, toàn bộ snapshot/save, nội dung IndexedDB hoặc chuỗi hội thoại. Tiền/kho chỉ log delta và ID khi debug; không log mỗi tick/render frame.

```ts
logger.info("save.commit.completed", {
  system: "save",
  gameDay: 2,
  revision: 7,
  commitId: "day-2-summary",
});
```

Các mốc luôn log: boot/version, asset load thất bại, bắt đầu/kết thúc ngày, save commit bắt đầu/thành công/thất bại, migration, phục hồi checkpoint, revision conflict và fatal error. Domain rejection thông thường chỉ log `DEBUG`; không biến lựa chọn hợp lệ của người chơi thành cảnh báo.

### X03. Configuration

**Phân loại:**

- `gameRules`: công thức, thời gian, giá, XP, lịch khách và nhiệm vụ; dữ liệu bất biến sau khi phiên bắt đầu.
- `platform`: kích thước logic, scale, safe area, asset budget và cờ khả năng trình duyệt.
- `playerSettings`: mute, âm lượng và tùy chọn hiển thị; lưu riêng khỏi tiến độ chiến dịch.
- `buildInfo`: phiên bản app, contentVersion, schemaVersion và chế độ development/release.

Dữ liệu cân bằng là module TypeScript/JSON có schema và ID ổn định, được kiểm tra một lần lúc boot. Domain chỉ nhận `ValidatedGameConfig`, không tự đọc file hoặc biến môi trường. Không có remote config trong demo. Không sửa object cấu hình trong runtime; thay đổi balance yêu cầu contentVersion mới. Player settings có thể ghi ngay khi đổi vì không thuộc checkpoint kinh tế, nhưng lỗi ghi settings không được làm hỏng save chiến dịch.

```ts
type ValidatedGameConfig = Readonly<{
  contentVersion: string;
  recipes: Readonly<Record<RecipeId, RecipeDefinition>>;
  days: Readonly<Record<DayId, DayDefinition>>;
  missions: Readonly<Record<MissionId, MissionDefinition>>;
}>;
```

### X04. Events và Commands

**Mẫu:** commands đồng bộ đi vào domain; domain trả state mới và danh sách typed domain events. Event chỉ mô tả điều đã xảy ra, dùng tên quá khứ; không dùng string tùy ý. Phaser adapter render state và xử lý hiệu ứng từ event nhưng không được thay đổi domain trực tiếp.

```ts
type GameCommand =
  | { type: "order.accept"; orderId: OrderId }
  | { type: "pizza.bake"; orderId: OrderId; ingredientIds: IngredientId[] }
  | { type: "order.deliver"; orderId: OrderId };

type DomainEvent =
  | { type: "order.accepted"; orderId: OrderId }
  | { type: "inventory.consumed"; orderId: OrderId; lotIds: LotId[] }
  | { type: "reward.granted"; rewardId: RewardId };
```

Xử lý một command hoàn tất đồng bộ và theo thứ tự. Side effect bất đồng bộ như lưu IndexedDB hoặc tải asset nằm ngoài reducer/domain. Không có event bus toàn cục cho mọi thứ: một Game Runtime điều phối commands/events; scene subscribe qua adapter có lifecycle rõ và hủy đăng ký khi shutdown. Phaser events chỉ dùng ở lớp presentation. Không replay event để dựng save trong demo; snapshot là nguồn persistence. Event history debug là ring buffer giới hạn 200 sự kiện đã lược dữ liệu nhạy cảm.

### X05. Debug và Development Tools

Development build có overlay bật bằng query `?debug=1` trên desktop hoặc thao tác chạm giữ tiêu đề 3 giây rồi xác nhận trên mobile. Release production không hiển thị activation path và tree-shake các command thay đổi state.

Overlay chỉ đọc mặc định: FPS/frame time, phase ngày, simulation time, pause tokens, phiếu/lò, tiền/kho, revision, commitId cuối và asset memory ước tính. Các lệnh test thay đổi state chỉ có trong development: tiến đồng hồ có kiểm soát, tạo khách theo fixture, kết thúc ngày, mô phỏng save lỗi/revision conflict/save hỏng và nạp fixture đầu ngày. Mọi lệnh ghi `DEBUG` và gắn cờ `taintedSession`; session bị taint không được dùng làm kết quả playtest chính thức.

Không đặt secret, API key hoặc công cụ chạy mã tùy ý trong debug overlay. Không để debug overlay che vùng thao tác khi đo viewport mobile; có nút thu gọn. Profiling dùng browser DevTools và chỉ thêm performance marks cho boot, asset load, day start/end và save commit; không đo/log từng frame bằng object mới.

### X06. Quy tắc nhất quán bắt buộc

1. Chỉ domain command được đổi tiền, kho, XP, uy tín, quan hệ, nhiệm vụ và trạng thái đơn.
2. Event, animation, âm thanh và UI callback không được tự cập nhật các giá trị đó.
3. IndexedDB chỉ ghi tại ranh giới đã duyệt; settings là store riêng, không trộn vào transaction tiến độ.
4. Mọi pause có token sở hữu; không có hàm “resume all” trong gameplay.
5. Mọi ID lưu vào save/config/event phải ổn định, có namespace và được kiểm tra tồn tại.
6. Lỗi kỹ thuật không được tự biến thành kết quả gameplay; không mất tiền/kho vì asset hoặc storage lỗi.
7. Tất cả listener/subscription phải được hủy theo lifecycle; retry phải idempotent theo command/commit ID.
8. Release không chứa cheat state mutation, log verbose hoặc dữ liệu save trong console.

### Trạng thái bước 5

Người dùng chọn C và yêu cầu loại bỏ chơi lại ngày đã hoàn tất. X01–X06 được duyệt; quy tắc save đã được sửa đồng bộ trước khi chuyển bước. Bước 5 hoàn thành, workflow chuyển sang bước 6. Chưa sửa code game hay cài dependency.

## Project Structure - Bước 6 đã duyệt

Trạng thái: người dùng đã duyệt bằng C. Cấu trúc dùng mô hình lai theo domain: logic game chia theo nghiệp vụ, adapter Phaser và trình duyệt chia theo công nghệ. Mục tiêu là mỗi hệ thống có đúng một nơi sở hữu và không để scene trở thành nơi chứa luật kinh tế.

### Cây thư mục dự kiến

```text
project-root/
├── public/
│   └── assets/
│       ├── atlases/             # Sprite atlas và metadata
│       ├── audio/
│       │   ├── music/
│       │   └── sfx/
│       ├── fonts/
│       └── images/              # Ảnh boot/loading không nằm trong atlas
├── src/
│   ├── main.ts                  # Composition root duy nhất
│   ├── app/
│   │   ├── createGame.ts        # Phaser config và khởi tạo runtime
│   │   ├── createRuntime.ts     # Ghép domain, persistence, clock, logger
│   │   └── buildInfo.ts
│   ├── domain/
│   │   ├── model/               # GameState, money, inventory, order, day
│   │   ├── commands/            # Command types và handlers
│   │   ├── events/              # Typed domain events
│   │   ├── rules/               # Công thức, điểm, uy tín, XP, kinh tế
│   │   ├── state-machines/      # Day, order, oven, mission lifecycle
│   │   └── validation/          # Invariants và Result/GameError
│   ├── runtime/
│   │   ├── GameRuntime.ts       # Cổng duy nhất gửi command/đọc state
│   │   ├── SimulationClock.ts   # Tick mô phỏng 20 Hz
│   │   ├── PauseRegistry.ts     # Token pause theo chủ sở hữu
│   │   ├── EventJournal.ts      # Ring buffer debug, không phải persistence
│   │   └── selectors/           # View data thuần từ GameState
│   ├── features/
│   │   ├── kitchen/             # Điều phối UI làm/nướng/giao
│   │   ├── customers/           # Presenter khách và đề nghị
│   │   ├── market/              # Presenter chợ, giá và tồn kho
│   │   ├── progression/         # Presenter XP, mục tiêu, nhiệm vụ
│   │   └── summary/             # Presenter sổ thu chi/tổng kết
│   ├── scenes/
│   │   ├── BootScene.ts
│   │   ├── PreloadScene.ts
│   │   ├── ShopScene.ts
│   │   ├── SummaryScene.ts
│   │   └── OverlayScene.ts
│   ├── presentation/
│   │   ├── components/          # Button, label, progress/timer, order ticket
│   │   ├── layout/              # Portrait layout và safe-area calculation
│   │   ├── input/               # Pointer/touch → typed intent
│   │   ├── audio/               # Music/SFX policy và mute
│   │   ├── animation/           # Animation adapters, không đổi domain
│   │   └── feedback/            # Thông báo gameplay/lỗi có messageKey
│   ├── infrastructure/
│   │   ├── persistence/
│   │   │   ├── IndexedDbSaveRepository.ts
│   │   │   ├── saveSchema.ts
│   │   │   ├── saveValidation.ts
│   │   │   └── saveMigration.ts
│   │   ├── assets/
│   │   │   ├── assetManifest.ts
│   │   │   └── PhaserAssetLoader.ts
│   │   ├── browser/
│   │   │   ├── VisibilityAdapter.ts
│   │   │   ├── OrientationAdapter.ts
│   │   │   └── StorageCapability.ts
│   │   └── logging/
│   │       ├── Logger.ts
│   │       └── ConsoleLogSink.ts
│   ├── config/
│   │   ├── gameRules.ts
│   │   ├── recipes.ts
│   │   ├── days.ts
│   │   ├── missions.ts
│   │   └── validateConfig.ts
│   ├── debug/
│   │   ├── DebugOverlay.ts
│   │   ├── debugCommands.ts
│   │   └── fixtures/
│   └── styles/
│       └── shell.css             # Canvas host, safe area, orientation notice
├── tests/
│   ├── unit/
│   │   ├── domain/
│   │   ├── runtime/
│   │   └── config/
│   ├── integration/
│   │   ├── persistence/
│   │   └── day-flow/
│   ├── browser/
│   │   ├── mobile-layout/
│   │   └── lifecycle/
│   └── fixtures/
├── docs/                         # BMAD/project documentation hiện có
├── _bmad-output/                 # Planning artifacts, không import từ runtime
├── index.html
├── package.json
├── tsconfig.json
└── vite/                         # Cấu hình dev/prod từ template chính thức
```

Không tạo các thư mục/file này ở bước kiến trúc. Tên file cấu hình Vite thực tế sẽ giữ theo commit template được pin khi triển khai; cây trên mô tả ranh giới, không giả định đã scaffold.

### Ánh xạ hệ thống

| Hệ thống | Nơi sở hữu | Nơi hiển thị/tích hợp |
| --- | --- | --- |
| Tiền, kho, đơn, lò, đánh giá | `src/domain/model`, `commands`, `rules`, `state-machines` | `features/*`, `ShopScene`, `SummaryScene` |
| Đồng hồ và pause | `src/runtime/SimulationClock.ts`, `PauseRegistry.ts` | `OverlayScene`, browser adapters |
| Checkpoint cuối ngày | `domain` tạo snapshot hợp lệ; `infrastructure/persistence` ghi/đọc | `SummaryScene`, feedback lỗi |
| Khách, quan hệ, nhiệm vụ, XP | `domain/rules`, `state-machines`, `config` | `features/customers`, `progression` |
| Cấu hình ngày/công thức | `src/config`, kiểm tra ở `validateConfig.ts` | Domain nhận `ValidatedGameConfig` |
| Asset/audio/input | `infrastructure/assets`, `presentation/*` | Phaser scenes/components |
| Debug/log | `src/debug`, `infrastructure/logging` | Chỉ có trong development build; domain không phụ thuộc |
| Hệ thống E05–E09 | Mở rộng domain/config/feature tương ứng | Không tạo trước module rỗng trong demo |

### Truy vết GDD và epics

Các đường dẫn “sau demo” là nơi sở hữu bắt buộc khi epic đó bắt đầu, không phải yêu cầu tạo module rỗng trong demo.

| GDD | Epic | Nơi sở hữu kiến trúc | Phạm vi |
| --- | --- | --- | --- |
| P01 Tính cách khách | E02, E05 | `domain/model/customers`, `domain/rules`, `config/days`, `features/customers` | Bốn kiểu cơ bản trong demo; mở rộng dữ liệu sau |
| P02 Nguyên liệu và chợ | E03, E05 | `domain/model/inventory`, `domain/rules`, `features/market`; sau demo `config/suppliers` | Giá/hạn dùng demo; nhà cung cấp sau |
| P03 Uy tín quán | E02, E05 | `domain/rules/reputation`, selectors, `features/customers` | Có trong demo và mở rộng dài hạn |
| P04 Thời tiết và sự kiện | E06 | Sau demo: `domain/rules/events`, `config/events`, `features/events` | Không triển khai demo |
| P05 Đơn và giao hàng | E01, E06 | `domain/model/orders`, `state-machines`; sau demo `features/delivery` | Tại quầy/mang đi demo; app/đơn lớn sau |
| P06 Nhân viên | E07 | Sau demo: `domain/model/staff`, `domain/rules/staff`, `features/staff` | Không triển khai demo |
| P07 Mục tiêu ngày | E04, E09 | `domain/state-machines/missions`, `config/missions`, `features/progression` | Một mục tiêu/ngày trong demo |
| P08 Sổ thu chi | E03, E09 | `domain/rules/economy`, `features/summary`, `SummaryScene` | Baseline demo; thêm lương/thuê/sửa sau |
| P09 Quảng bá | E07 | Sau demo: `domain/rules/marketing`, `config/marketing`, `features/marketing` | Không triển khai demo |
| P10 Câu chuyện khách quen | E04, E08 | `domain/model/relationships`, `config/days`, `features/customers`; sau demo `config/stories` | Một chuỗi ba ngày trong demo |
| P11 Nhiệm vụ thường | E04, E09 | `domain/state-machines/missions`, `config/missions`, `features/progression` | Có trong demo và mở rộng |
| P12 Nhiệm vụ ẩn | E08 | Sau demo: cùng mission state machine, trigger trong `config/missions` | Không triển khai demo |
| P13 Khách nổi tiếng | E08 | Sau demo: `config/customers`, `config/stories`, `features/special-guests` | Không triển khai demo |
| P14 Khách cần giúp đỡ | E04, E08 | `domain/model/orders`, relationship rules, `features/customers` | Một tình huống demo; mở rộng sau |
| P15 Lên cấp | E04, E09 | `domain/rules/progression`, `config/gameRules`, `features/progression` | Ba cấp thử nghiệm trong demo |
| P16 Chiến dịch 30 ngày | E09 | `domain/state-machines/day`, `config/days`; sau demo `features/campaign` | Khung ba ngày demo, đủ 30 ngày sau |

| Epic | Location chính | Patterns bắt buộc |
| --- | --- | --- |
| E01 Vòng lặp pizza | `domain/commands`, order/oven state machines, `features/kitchen`, `ShopScene` | IP01, IP04, IP05, IP07 |
| E02 Khách và uy tín | customer/reputation rules, `features/customers` | IP01, IP04, IP05, IP07 |
| E03 Chợ và sổ thu chi | inventory/economy rules, `features/market`, `features/summary` | IP01, IP02, IP05, IP07 |
| E04 Demo ba ngày | day/mission/relationship, progression, persistence | IP01–IP03, IP05–IP08 |
| E05 Kinh tế/khách dài hạn | supplier/customer config và rules mở rộng | IP01, IP05–IP07 |
| E06 Giao hàng/sự kiện | `features/delivery`, `features/events`, event/delivery rules | IP01, IP03, IP05–IP07 |
| E07 Nhân sự/quảng bá | `features/staff`, `features/marketing`, staff/marketing rules | IP01, IP05–IP07 |
| E08 Câu chuyện/khách đặc biệt | story configs, mission triggers, `features/special-guests` | IP01, IP03, IP05–IP07 |
| E09 Chiến dịch 30 ngày | day/campaign config, progression và summary | IP01–IP03, IP05–IP08 |

### Quy ước đặt tên

| Thành phần | Quy ước | Ví dụ |
| --- | --- | --- |
| Class/type/scene | `PascalCase` | `ShopScene`, `GameState`, `PauseRegistry` |
| Hàm/biến/file không chứa class chính | `camelCase` | `calculateOrderRating.ts`, `validateSave.ts` |
| File chứa class/type chính | Trùng tên `PascalCase` | `SimulationClock.ts` |
| Constant cố định trong code | `UPPER_SNAKE_CASE` | `MAX_ACTIVE_ORDERS` |
| ID nội dung | `namespace.kebab-case` | `recipe.cheese`, `mission.sell-cheese-8` |
| Command/event type | `namespace.verb` / quá khứ | `order.deliver`, `order.delivered` |
| Asset file/key | `kebab-case`, có nhóm | `customer-rushed-idle.png`, `sfx.oven-ready` |
| Test | `<subject>.test.ts`; browser `<flow>.spec.ts` | `economy.test.ts`, `pause-lifecycle.spec.ts` |

Không dùng barrel `index.ts` xuyên toàn dự án. Import trực tiếp từ module sở hữu; chỉ cho phép public API nhỏ ở ranh giới feature/domain nếu cần. Không đặt tên chung như `Manager`, `Helper`, `Utils` khi có thể gọi đúng trách nhiệm.

### Ranh giới bắt buộc

1. `domain/` chỉ dùng TypeScript chuẩn và config/type thuần; không import Phaser, DOM, IndexedDB hoặc logger console.
2. `runtime/` được import domain và interface adapter; không import scene cụ thể.
3. `scenes/`, `presentation/`, `features/` được gửi command và đọc selectors; không ghi trực tiếp `GameState`.
4. `infrastructure/` hiện thực interface do lớp trong định nghĩa; persistence không chứa luật kinh tế hoặc quyết định ngày.
5. `config/` không import scene; mọi ID được kiểm tra trước khi tạo runtime.
6. Scene lifecycle phải hủy listener của chính nó; listener dùng chung thuộc runtime và sống cùng runtime.
7. Tests unit cho domain không khởi tạo Phaser/canvas. Tests persistence không giả định UI. Tests browser xác minh layout, visibility, orientation và luồng save.
8. Nội dung `_bmad-output/` và `docs/` không được runtime import hoặc đóng gói vào game.
9. Ngày đã chốt không có API `replayDay`, `rollbackDay` hoặc danh sách checkpoint lịch sử. Save repository chỉ đọc checkpoint active/backup của cùng commit mới nhất.

### Trạng thái bước 6

Cấu trúc và ánh xạ trên đã được người dùng duyệt bằng C. Bước 6 hoàn thành, workflow chuyển sang bước 7. Chưa tạo source tree, scaffold, dependency hoặc code.

## Implementation Patterns - Bước 7 đã duyệt

Trạng thái: người dùng đã duyệt bằng C. Các mẫu dưới đây cụ thể hóa ranh giới đã duyệt để agent triển khai không tự chọn các kiểu giao tiếp, tạo đối tượng hoặc cập nhật state khác nhau.

### IP01. Command Pipeline

**Mục đích:** mọi thay đổi gameplay đi qua một đường duy nhất và có kết quả xác định. Scene/component tạo command; `GameRuntime` kiểm tra revision/phase, gọi handler thuần, thay state một lần, ghi domain events vào journal rồi thông báo presentation render lại.

```ts
const result = runtime.dispatch({
  type: "order.deliver",
  commandId: "cmd.session-42.order-7.deliver",
  orderId: "order.7",
});

if (!result.ok) feedback.show(result.error.messageKey);
```

Quy tắc:

- `commandId` duy nhất trong phiên; runtime nhớ một cửa sổ ID đã xử lý để double-tap trả cùng kết quả hoặc bị từ chối, không áp dụng lại.
- Handler nhận state/config/command và trả `GameResult<{ state; events }>`; không gọi Phaser, IndexedDB, âm thanh hoặc thời gian hệ thống.
- Một command chỉ có một owner handler. Không có listener thứ hai âm thầm cộng tiền/XP.
- Presentation không suy ra thành công từ animation; chỉ phản hồi kết quả command/event.

### IP02. Day Commit Boundary

**Mục đích:** chốt ngày đúng một lần, lưu an toàn và chỉ chuyển sang ngày mới sau khi IndexedDB commit hoàn tất.

```ts
type PendingDayCommit = Readonly<{
  commitId: string;
  sourceRevision: number;
  completedDay: number;
  nextCheckpoint: SaveSnapshot | CampaignSummary;
}>;

const pending = runtime.prepareDayCommit();
const saved = await saves.commit(pending);
if (saved.ok) runtime.confirmDayCommit(pending.commitId, saved.revision);
```

Luồng bắt buộc:

1. Domain ở phase `summary` tạo `PendingDayCommit` bất biến, gồm mọi thưởng/kho/tiền đã tính một lần.
2. Runtime giữ pending trong RAM và thêm pause token lưu.
3. Repository ghi active/backup của cùng commit trong một transaction, kiểm tra revision.
4. Chỉ khi transaction hoàn tất, runtime xác nhận commit và chuyển sang ngày mới hoặc kết thúc demo.
5. Retry dùng cùng `commitId` và payload; repository trả kết quả đã lưu nếu commit đó đã tồn tại.
6. Không có API commit để quay về ngày cũ. Nếu hết vốn, `nextCheckpoint` là tổng kết kết thúc chiến dịch.

Đây là mẫu riêng của dự án vì nó nối luật kinh tế một lần, IndexedDB bất đồng bộ, chống double-tap và quy tắc không chơi lại ngày.

### IP03. Owned Pause Lease

**Mục đích:** nhiều nguồn pause độc lập không vô tình resume đồng hồ của nhau. Nguồn xin một lease và chỉ lease đó mới được giải phóng.

```ts
const lease = pauseRegistry.acquire("offer", "offer.customer-12");
try {
  await overlay.showOffer(viewModel);
} finally {
  lease.release();
}
```

Quy tắc:

- Lease có ID duy nhất và `release()` idempotent; release hai lần log `WARN` nhưng không ảnh hưởng lease khác.
- Clock chạy khi phase cho phép và `activeLeaseCount === 0`.
- `visibility:hidden`, hướng màn hình, tutorial, offer, user pause và save error dùng namespace riêng.
- Khi scene shutdown phải trả lease do scene sở hữu; lease của browser/runtime không thuộc scene.
- Không có `clearAll()` hoặc `resumeAll()` trong gameplay. Debug chỉ được xem danh sách lease, không xóa trong production.

### IP04. Factory cho đối tượng trình bày

Domain entity là dữ liệu thuần, không phải Phaser GameObject. Scene dùng factory/presenter để tạo và cập nhật view từ ID/domain view model; không `new` sprite rải rác trong command handler.

```ts
const customerView = customerViewFactory.create(scene, {
  customerId: "customer.regular-01",
  archetype: "regular",
  position: queueSlot,
});
```

Các đối tượng ít và vòng đời rõ nên chưa cần pool chung. Chỉ thêm object pool khi profiling cho thấy tạo/hủy lặp gây GC hoặc frame spike; factory giữ quyền chuyển sang pool mà không đổi domain. Không dùng prefab/editor-specific format vì đã chọn template code-first.

### IP05. Explicit State Machines

Mỗi state machine dùng union type và transition function thuần; không dùng nhiều boolean có thể tạo tổ hợp vô nghĩa.

```ts
type OvenState =
  | { kind: "idle" }
  | { kind: "baking"; pizzaId: PizzaId; elapsedMs: number }
  | { kind: "ready"; pizzaId: PizzaId; readyAtMs: number }
  | { kind: "burned"; pizzaId: PizzaId };
```

Transition không hợp lệ trả domain rejection và giữ state cũ. Không cho scene gán `kind`; scene chỉ gửi command. Day/order/oven/mission có máy trạng thái riêng nhưng được thay cùng `GameState` trong một command khi luật cần tính nguyên tử.

### IP06. Validated Data Access

`src/config` xuất dữ liệu thô; `validateConfig` dựng một `ValidatedGameConfig` duy nhất ở boot. Domain chỉ nhận object đã validate qua dependency injection; không import JSON trực tiếp và không dùng service locator/global singleton.

```ts
const configResult = validateGameConfig(rawConfig);
if (!configResult.ok) return bootFailure(configResult.error);

const runtime = createRuntime({ config: configResult.value, saveRepository, logger });
```

Lookup thiếu ID là lỗi integrity, không fallback ngầm sang món/khách đầu tiên trừ khi GDD quy định cụ thể. Dữ liệu test dùng cùng schema validator. Sau boot, config chỉ đọc và không bị scene/debug mutation.

### IP07. Selector-driven Presentation

UI đọc view model từ selector thuần; scene không tự ghép công thức kinh tế hoặc tính thời gian còn lại khác domain/runtime.

```ts
const hud = selectShopHud(runtime.getState(), runtime.clock.now());
shopHud.render(hud);
```

Selector không side effect, không cache sai revision; kết quả chỉ chứa dữ liệu UI cần. Component nhận model và phát intent typed. Tất cả subscription được đăng ký trong `create()` và hủy ở `shutdown`; handler phải dùng reference ổn định để `off()` đúng.

### IP08. Repository Adapter

Domain/runtime phụ thuộc interface `SaveRepository`; IndexedDB là adapter duy nhất của demo. Không để kiểu `IDBRequest`, transaction hoặc object store thoát khỏi `infrastructure/persistence`.

```ts
interface SaveRepository {
  loadLatest(): Promise<GameResult<LoadedCheckpoint | null, SaveError>>;
  commit(pending: PendingDayCommit): Promise<GameResult<CommitReceipt, SaveError>>;
}
```

Repository chịu trách nhiệm transaction, active/backup cùng commit, schema envelope và revision conflict. Migration/validation chạy trước khi trả snapshot. Runtime chịu trách nhiệm quyết định pause/thông báo/chuyển phase; repository không tự sửa gameplay state.

### Bảng thực thi nhất quán

| Mẫu | Quy ước bắt buộc | Kiểm tra |
| --- | --- | --- |
| Command | Mọi gameplay mutation qua `runtime.dispatch` | Unit tests tìm state trước/sau; review cấm direct assignment từ scene |
| Day commit | `prepare → repository commit → confirm` với cùng commit ID | Integration test retry, lỗi transaction, double-submit |
| Pause lease | Acquire/release theo owner, không resume toàn cục | Unit test pause lồng nhau và scene shutdown |
| Factory | Phaser object chỉ tạo ở presentation/factory | Import-boundary review; browser profiling trước khi pool |
| State machine | Discriminated union, transition thuần | Exhaustive switch và invalid-transition tests |
| Config | Validate một lần, inject object chỉ đọc | Boot tests với ID thiếu/trùng/sai kiểu |
| Selector | UI chỉ đọc selector/view model | Unit tests selector; scene test không chứa công thức domain |
| Repository | IndexedDB không rò vào domain/runtime | Integration test adapter với revision/schema corruption |

### Những mẫu không dùng

- Không ECS: số entity nhỏ, trọng tâm là giao dịch và tiến trình ngày.
- Không Redux package: command/state pipeline riêng đủ nhỏ; không thêm dependency chỉ để có store.
- Không service locator/singleton toàn cục: dependency được ghép tại composition root.
- Không event sourcing: domain events phục vụ UI/debug; snapshot cuối ngày là nguồn lưu.
- Không behavior tree/GOAP: lịch khách và hành vi demo theo state/config.
- Không object pool mặc định: chỉ thêm khi đo được vấn đề hiệu năng.

### Trạng thái bước 7

Người dùng chọn C. Tám mẫu với ví dụ, gồm hai mẫu đặc thù trọng yếu Day Commit Boundary và Owned Pause Lease, đã được duyệt. Bước 7 hoàn thành và workflow chuyển sang bước 8 để validation; chưa sửa code hay cài dependency.

## Architecture Validation

### Validation Summary

| Check | Result | Notes |
| --- | --- | --- |
| Decision Compatibility | PASS | Engine, domain/runtime boundaries, persistence và static deployment tương thích |
| GDD Coverage | PASS | P01–P16 đều có owner, epic và phạm vi demo/sau demo |
| Pattern Completeness | PASS | Entity/view creation, communication, state, error, data và lifecycle đều có pattern |
| Epic Mapping | PASS | E01–E09 đều có location và implementation patterns |
| Document Completeness | PASS | Có summary, decision table, source tree, setup, naming và không còn placeholder |

### Coverage Report

**Systems Covered:** 16/16  
**Epics Mapped:** 9/9  
**Patterns Defined:** 8  
**Decisions Summarized:** 14

### Issues Resolved

- Bổ sung executive summary, decision summary, toolchain version và chiến lược scaffold trong repository đã có tài liệu.
- Làm rõ không có HTTP API, backend, auth, React, physics hoặc MCP trong baseline demo.
- Thêm mapping cụ thể cho toàn bộ hệ thống GDD và epics sau demo.
- Đổi mã implementation patterns từ `P01–P08` sang `IP01–IP08` để không trùng mã GDD.
- Loại các trạng thái “chờ duyệt” đã lỗi thời và giữ nhất quán luật không chơi lại ngày đã chốt.

### Validation Date

2026-09-29

## Development Environment

### Prerequisites

- Git có thể clone HTTPS và ghi lại commit SHA của starter.
- Node.js `24.21.0` LTS cùng npm `11.19.0`.
- Trình duyệt kiểm tra Chromium và WebKit; thiết bị hoặc emulation cho các viewport mobile đã chốt.
- Không yêu cầu Python, backend, database server hoặc Phaser Editor để chạy game.

### AI Tooling (MCP Servers)

Không chọn MCP dành riêng cho engine trong baseline. Có thể bổ sung sau bằng một quyết định kiến trúc mới; Phaser Editor MCP không tự áp dụng vì dự án dùng template Vite code-first.

### Toolchain đã pin

- Node.js `24.21.0` LTS và npm `11.19.0`.
- Phaser `4.2.1`, TypeScript `5.7.2`, Vite `6.3.1`, Terser `5.39.0`.
- Vitest `4.1.11` cho unit/integration; Playwright `1.63.0` cho Chromium/WebKit browser tests.
- Không dùng ORM, server database, API client, auth SDK, React hoặc physics package.

### Chiến lược khởi tạo sau khi kiến trúc được duyệt

Repository hiện có tài liệu nên không clone đè vào root. Agent triển khai phải dùng staging clone, ghi SHA trước khi tích hợp và chỉ mang các file starter được duyệt vào root:

```powershell
git clone --depth 1 --branch main https://github.com/phaserjs/template-vite-ts.git .scaffold/phaser-vite-ts
git -C .scaffold/phaser-vite-ts rev-parse HEAD
```

Search term kiểm tra lại trước lúc chạy: `phaserjs template-vite-ts official Phaser 4 Vite TypeScript`. Ghi SHA trả về vào decision log và lock nguồn đó; nếu upstream template không còn version `1.4.0`, dừng để đánh giá diff thay vì tự lấy cấu trúc mới. Không chép `.git`, README mẫu, screenshot hoặc gameplay mẫu đè tài liệu dự án.

Sau khi tích hợp starter vào root, pin dependency bằng exact version rồi mới tạo lockfile:

```powershell
npm install --save-exact phaser@4.2.1
npm install --save-dev --save-exact typescript@5.7.2 vite@6.3.1 terser@5.39.0 vitest@4.1.11 @playwright/test@1.63.0
npx playwright install chromium webkit
npm run build-nolog
```

Đây là lệnh triển khai tương lai, chưa được chạy trong workflow kiến trúc. `npm run dev-nolog` là lệnh phát triển; `npm run build-nolog` phải tạo `dist/` mà không gọi telemetry `log.js` của template.

### Test và deployment

Vitest chạy domain, selectors, clock, pause và config không cần Phaser/canvas. Integration tests dùng IndexedDB test environment trong browser cho commit/retry/corruption/revision; Playwright kiểm tra 360×640, 390×844 và 412×915 trên Chromium/WebKit, gồm orientation, visibility, double-tap, save failure và tải lại đầu ngày hiện tại. Browser test không được dựa vào timing animation để xác nhận mutation.

Artifact phát hành là nội dung `dist/` trên static hosting HTTPS. Cache dùng HTTP cache theo asset fingerprint của build; không có service worker/PWA trong demo. Không có secret phía client, route server, background job, upload hoặc storage ngoài IndexedDB. Host cụ thể có thể chọn ở bước release mà không đổi kiến trúc; smoke test phải chạy trên URL HTTPS thật trước phát hành.

### First Steps

1. Chạy kiểm tra implementation readiness với GDD, epics và kiến trúc này.
2. Sau khi người dùng cấp quyền triển khai, clone starter vào staging, ghi SHA và tích hợp các file được duyệt.
3. Pin dependency đúng bảng phiên bản, tạo lockfile rồi chạy typecheck/build trước khi viết gameplay.
4. Triển khai story đầu tiên theo E01, giữ domain độc lập với Phaser và thêm unit test cho command/state machine trước scene integration.


## Art direction update — 2026-09-30

User-confirmed direction: **2D cartoon**, replacing the previous pixel-art direction. Use soft rounded forms, clear smooth outlines, warm wood/cream/tomato/amber colors, expressive characters, and subtle shading. Keep Vietnamese text readable and retain existing gameplay, portrait layout, and touch-target requirements. This direction supersedes earlier conflicting visual assumptions; existing palette tokens require validation during implementation. This update changes documentation only: cartoon artwork/rendering and visual verification remain pending. Prior completion and test records describe the previous implementation.
