# StudentMart — Phân tích yêu cầu và phạm vi

**Ngày đối chiếu:** 07/11/2026. **Nguồn chính:** Wiki local và `docs/`, theo lựa chọn của người dùng; không dùng PDF. Đây là baseline tài liệu, không phải báo cáo nghiệm thu ứng dụng.

Đọc cùng [kế hoạch và chỉ mục](make-doc-plan.md), [luồng người dùng](user-flow.md), [schema](schema-database.md) và [kế hoạch triển khai](work-flow.md).

## 1. Bối cảnh và mục tiêu

StudentMart là ứng dụng mobile C2C cho sinh viên học hoặc sinh sống trong Làng Đại học ĐHQG TP.HCM. Người dùng đăng **Bán / Tìm mua / Trao đổi**, tìm tin phù hợp, xem thông tin rồi liên hệ qua hội thoại gắn với tin. Hai bên tự hẹn gặp, kiểm tra hàng, thanh toán hoặc trao đổi ngoài ứng dụng.

Mục tiêu sản phẩm cần kiểm chứng là giúp tìm món đồ hoặc người giao dịch phù hợp trong khu vực thuận tiện. Chuỗi giá trị: **đăng tin → tìm/lọc → xem chi tiết → liên hệ → tự giao dịch → chủ tin cập nhật trạng thái**.

Theo [README](../README.md), dự án thuộc CO3043 — Phát triển ứng dụng di động, HK261. M1–M3 trong Wiki là milestone nội bộ, không tự diễn giải thành rubric, hạn nộp hoặc yêu cầu chấm điểm của một PDF chưa được cung cấp.

## 2. Căn cứ nghiên cứu và quyết định

Nguồn [Evidence Evaluation](../StudentMart.wiki/Evidence-Evaluation.md) ghi **13 phản hồi sàng lọc, 11 người tiếp tục**. Đây là mẫu nhỏ, dữ liệu tự báo cáo; chưa có bằng chứng sử dụng StudentMart. Không suy quy mô thị trường, tỷ lệ chuyển đổi hoặc tính hiệu quả của app từ những câu trả lời này.

| Mã nguồn | Kết luận được kế thừa | Hệ quả thiết kế |
|---|---|---|
| A1; D01 | Mức độ khó tìm tin/người giao dịch cần điều tra thêm | Giữ giả thuyết giá trị; không tuyên bố thay Facebook hoặc chống lừa đảo |
| A2; D05 | Giá trị và cách hiểu verify cần điều tra thêm | Verify tùy chọn, giải thích đúng giới hạn |
| A3; D04 | Giữ giao dịch gần để tiếp tục thử nghiệm | Chọn khu vực thủ công, tự hẹn gặp |
| D02 | Nhu cầu có tính thời điểm | Đo hoàn thành tác vụ và quay lại khi phát sinh nhu cầu |
| D03 | Ưu tiên chuẩn bị nguồn công nghệ/phụ kiện và gia dụng | Vẫn giữ sách/giáo trình; không biến ưu tiên tuyển thành giới hạn tính năng |
| A4–A5; D06 | Nguồn tin và khả năng tuyển người còn cần kiểm chứng | Pilot một cụm nhỏ, có người và tin thật được đồng ý |
| D07 | Thiếu phản hồi mở gốc Q21–Q22 | Chưa thêm Rating/Review hoặc mở rộng từ nhận định chưa đối chiếu |

Nguồn quyết định: [Product Decisions](../StudentMart.wiki/Product-Decisions.md). A1/A2/A4/A5 ở mức Investigate further; A3 là Keep cho vòng thử nghiệm tiếp theo, không phải giả định đã được xác nhận đầy đủ.

## 3. Ranh giới hệ thống và actors

| Actor | Trách nhiệm và phạm vi |
|---|---|
| Người tìm tin | Duyệt/tìm/lọc, xem chi tiết; phải đăng nhập trước liên hệ hoặc hành động riêng tư |
| Thành viên đã đăng nhập | Có thể vừa đăng tin vừa liên hệ; chưa verify vẫn đăng/chat nếu còn quyền |
| Chủ tin | Sửa và kết thúc tin của mình; tự báo hoàn tất theo loại tin |
| Người tham gia hội thoại | Đọc/gửi theo membership và quyền hiện tại; không có quyền vào chat khác trên cùng tin |
| Quản trị viên | Xem report và xử lý trong phạm vi được cấp; không mặc định đọc toàn bộ chat |
| Dịch vụ ngoài | Object storage, email và push thực hiện tác vụ theo provider sẽ chọn; không quyết định quyền nghiệp vụ |

Chủ tin/người liên hệ là vai trò theo từng đối tượng, không phải role BUYER/SELLER cố định. Backend là nơi kiểm tra quyền cuối cùng. Xem [ma trận quyền](user-flow.md).

## 4. Yêu cầu chức năng

Giữ nguyên R01–R13 và US01–US13 của [Traceability](../StudentMart.wiki/Traceability.md); tiêu chí đầy đủ ở [User Stories](../StudentMart.wiki/User-Stories.md). Các dòng dưới đây là bản tổng hợp có truy vết.

| R / US | Nội dung bắt buộc trong MVP | Flow | TASK |
|---|---|---|---|
| R01 / US01 | Đăng ký/login/logout, hồ sơ cơ bản; ownership/membership/admin; bảo vệ dữ liệu sau logout | UF01b, UF02a, UF03, UF04, UF05 | TASK-16 |
| R02 / US02 | Tin Bán có ảnh, tình trạng, giá, mô tả, danh mục và khu vực | UF02a | TASK-03, TASK-04 |
| R03 / US03 | Tin Tìm mua có nhu cầu; ngân sách và ảnh tùy chọn; kết thúc Đã tìm được | UF01a → UF02a, UF02b | TASK-03, TASK-04, TASK-07 |
| R04 / US04 | Tin Trao đổi có món đang có/ảnh/tình trạng và món hoặc điều kiện muốn đổi | UF02a, UF02b | TASK-03, TASK-04, TASK-07 |
| R05 / US05 | Duyệt/từ khóa/kết hợp loại, danh mục, khu vực và giá/ngân sách khi có | UF01a | TASK-05, TASK-15 |
| R06 / US06 | Chi tiết đúng loại và trạng thái, public profile, phân biệt trường tự khai với verify | UF01a, UF01b | TASK-06, TASK-07 |
| R07 / US07 | Chat văn bản giữa hai người theo tin; một hội thoại/cặp/tin; lịch sử/unread/ACK/retry | UF01b, UF02b, UF04 | TASK-06, TASK-21; phối hợp TASK-23 |
| R08 / US08 | Chủ tin sửa/gỡ/đóng/hoàn tất; xác nhận trước kết thúc; admin xử lý bằng quyền riêng | UF02b | TASK-04, TASK-07 |
| R09 / US09 | Verify email trường bằng OTP đúng miền; tùy chọn sử dụng, bắt buộc có chức năng trong MVP | UF03 | TASK-15, TASK-17, TASK-18 |
| R10 / US10 | Report tin/tài khoản, chặn liên hệ độc lập; giữ lịch sử theo quyền | UF05a | TASK-22 |
| R11 / US11 | Admin xem xét có căn cứ; lưu actor/time/reason và hiệu lực ở chức năng liên quan | UF05b | TASK-22 |
| R12 / US12 | Nháp tin trên thiết bị, ảnh/lỗi/retry; không đăng trùng hoặc đồng bộ nháp đa thiết bị | UF02a | TASK-23, TASK-04 |
| R13 / US13 | Push bản đầu, inbox khi từ chối quyền; tap kiểm phiên/quyền; binding đúng account | UF04 | TASK-17, TASK-19, TASK-20, TASK-21 |

**Đo lường** thuộc TASK-25 và **nghiệm thu** thuộc TASK-24; không tự tạo R14/US14. TASK-08/09 tổ chức và đánh giá pilot, không phải tính năng marketplace mới.

## 5. Yêu cầu chất lượng và cách kiểm tra

Wiki chưa có bộ mã NFR chính thức. Bảng này nhóm các yêu cầu chất lượng đã thể hiện trong US/UF; không tạo hệ mã NFR có vẻ thuộc đề bài.

| Nhóm | Điều kiện cần đáp ứng | Nguồn / kiểm chứng dự kiến |
|---|---|---|
| Phân quyền | Danh tính từ session; quyền đọc/gửi tách riêng; kiểm tra lại ở thao tác thật | US01/US07/US11/US13; API integration với actor trái quyền |
| Riêng tư | Public profile không lộ email trường/địa chỉ; push dùng nội dung chung; account switch không lộ dữ liệu cũ | US06/US09/US13; mobile/device và kiểm tra response/log |
| Toàn vẹn | Publish/message/action nguyên tử; retry và request đồng thời không nhân bản | US02/US07/US11/US12; PostgreSQL thật, rollback/race/mất ACK |
| Phục hồi | Giữ nội dung khi mạng lỗi/phiên hết; nháp và pending theo account | US07/US12; restart app, retry, logout/switch |
| Phản hồi UI | Loading, rỗng, lỗi riêng; thành công chỉ sau xác nhận lưu | US02/US05/US07/US08; kiểm tra trạng thái và response đến muộn |
| Thiết bị | Camera có lựa chọn thay thế; denied push vẫn inbox; xử lý nền/đóng/mở và tap cũ | UF02a/UF04; TASK-17/TASK-24 trên thiết bị thật |
| Khả năng bảo trì | Three-Layer theo chức năng; mobile MVVM nhẹ; backend Controller → Service → Repository | [Solution tree](../docs/solution_tree.md); review dependency và transaction |
| Vận hành | Report/admin có audit; dữ liệu test/spam tách khi đo | US10/US11, TASK-25; kiểm tra effect, quyền và dữ liệu mẫu |

Chưa có SLA hiệu năng/uptime, kích thước app, tải đồng thời hoặc thời gian OTP chính thức. Không đặt “OTP dưới 30 giây”, “app dưới 30 MB” hay cam kết push luôn đến. Chỉ số kỹ thuật và ngưỡng chấp nhận sẽ được nhóm chốt khi có thiết bị/workload và provider.

## 6. Quy tắc nghiệp vụ xuyên suốt

1. Verify trường là tùy chọn; thiếu nhãn không chặn đăng/chat khi đã login và còn quyền. Nhãn chỉ xác nhận quyền truy cập email được hỗ trợ tại thời điểm verify.
2. Bán/Trao đổi cần ảnh; Tìm mua không bắt ảnh hoặc ngân sách. Khu vực chọn từ lookup phục vụ, không dùng GPS bắt buộc.
3. Thiếu giá/ngân sách là NULL. Khi lọc giá phải loại tin thiếu; bỏ lọc có thể thấy lại; không hiển thị thiếu thành 0/miễn phí.
4. Chỉ tạo chat mới từ tin đang mở và được phép liên hệ. Không tự chat; cùng cặp/tin lấy lại hội thoại cũ.
5. Tin hoàn tất hoặc chủ tin đóng không tự khóa hội thoại đã có. Quyền gửi/đọc vẫn xét theo block/restriction và trạng thái hiện tại.
6. Hoàn tất tự báo cáo khác đóng/gỡ. Chủ tin không được tự phục hồi tin bị admin gỡ. Quyền sau chủ tin gỡ hoặc admin gỡ còn cần chốt chi tiết.
7. Gửi/publish chỉ thành công khi server xác nhận lưu; retry giữ định danh thao tác để tránh nhân bản.
8. Message phải lưu trước yêu cầu push; lỗi provider không làm mất chat. Tap mọi thông báo phải kiểm tra phiên/quyền hiện tại.
9. Report không tự phạt. Block không tự report hoặc xóa lịch sử. Admin xử lý đúng target và ghi audit.
10. Không suy giao dịch đã thành công từ message đã lưu, push được provider tiếp nhận, cuộc hẹn hay đóng/gỡ tin.

## 7. Phạm vi và tích hợp

Trong phạm vi là 13 requirement ở §4, catalog/media để phục vụ chúng, đo lường tối thiểu và các việc chuẩn bị pilot. Ba loại tin dùng chung một cơ chế, không tạo ba hệ thống độc lập.

Ngoài MVP: giỏ/đơn hàng, thanh toán/escrow, giao vận, GPS thời gian thực, ghép trao đổi tự động/nhiều bên, chat nhóm/gọi/tệp, đặt lịch/giữ chỗ, Rating/Review/điểm uy tín, AI, yêu thích/chia sẻ, quảng cáo/đẩy tin/gói phí, dashboard nâng cao và mở rộng ngoài địa bàn.

| Tích hợp | Mục đích và giới hạn |
|---|---|
| PostgreSQL | Lưu dữ liệu và outbox; chưa có migration hoặc kết nối DB trong bootstrap |
| Object storage | File ảnh; DB giữ metadata và trạng thái READY; provider chưa chọn |
| Email | Gửi OTP; accepted không bảo đảm đã đến inbox; provider chưa chọn |
| Push + API hệ điều hành | Tin mới và điều hướng; phụ thuộc quyền/OS/kết nối; provider chưa chọn |
| Persistence mobile | Draft/pending/session theo chính sách từng loại dữ liệu; công cụ chưa chọn |

## 8. Milestone, đầu ra và điều kiện bàn giao

| Mốc nội bộ | Đầu ra | Điều kiện |
|---|---|---|
| M1 — nghiên cứu/nền tảng | Đánh giá nguồn, A/D, phạm vi, lookup, truy vết và kế hoạch | Giới hạn evidence rõ, không gọi nghiên cứu dự kiến là đã làm |
| M2 — thiết kế/triển khai/nghiệm thu | App cài thử, API/DB, ba loại tin/chat, verify/push, report/block/admin, nháp và đo lường | TASK-24 kiểm toàn chuỗi và lỗi/quyền; có bằng chứng thiết bị thật |
| M3 — pilot/điều chỉnh | Người/tin thật, nhật ký, kết quả và quyết định/backlog cập nhật | TASK-08 chuẩn bị được từ M2; TASK-09 sau nghiệm thu và nguồn lực sẵn sàng |

Ngày, assignee và capacity chưa được xác nhận trong nguồn local. Không biến milestone thành lịch tuần hoặc ngày nộp giả.

Đo lường theo [Business Canvas](../StudentMart.wiki/Business-Canvas.md): tìm được tin phù hợp, liên hệ hữu ích, công sức/thời gian thực hiện, hoàn tất tự báo cáo và quay lại khi có nhu cầu mới. TASK-25 phải chốt định nghĩa, cách loại test/spam, consent và retention trước pilot. Không lấy số tải hoặc số Issue đóng làm bằng chứng giá trị.

## 9. Hiện trạng và điểm cần chốt

Đã quan sát backend health/config và mobile shell qua [technical decisions](../docs/technical-decisions.md) cùng source; chưa có nghiệp vụ, schema thực thi, tích hợp provider hoặc bằng chứng pilot. Mô tả “chưa có manifest/app” trong README, solution tree và backlog phản ánh thời điểm cũ; xem [kế hoạch §3](make-doc-plan.md) để đối chiếu.

| Điểm mở | Nơi xử lý tiếp |
|---|---|
| Auth local/provider, session/crypto; ORM/migration; router/state/form | BL-001/002 trong [backlog](../docs/back-log.md) |
| Provider ảnh/email/push, OS và môi trường phát hành | BL-001/011; TASK-17 |
| Giá 0, giới hạn ảnh/text, reopen/đổi loại sau publish | BL-002; giữ là đề xuất cho đến khi duyệt |
| Quyền sau WITHDRAWN/REMOVED, phạm vi restriction, retention | BL-002; không để schema quyết định ngầm |
| Miền/trường/khu vực/danh mục thật, uniqueness email trường, TTL/quota OTP | BL-002/003; TASK-15/18 |
| Evidence gốc, tuyển người/tin, metric, capacity và lịch | TASK-01/08/10/11/12/25 và nhóm phụ trách |

## 10. Cách duy trì tài liệu

Khi đổi phạm vi: đối chiếu evidence → quyết định → R/US → UF → schema/architecture → TASK/BL → kiểm chứng. Wiki giữ yêu cầu sản phẩm; `docs/schema.md` giữ chi tiết cột; `docs/back-log.md` giữ BL. Bộ `doc/` là lối đọc tổng hợp và đối chiếu, không tự thay quyết định chưa chốt hoặc trạng thái Project.
