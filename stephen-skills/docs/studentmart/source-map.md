# StudentMart — Bản đồ nguồn và truy vết

Các link wiki dưới đây trỏ đến bản local ở repository root. Bộ còn trong `stephen-skills/` thì đi lên ba cấp từ trang này; khi cài bộ vào root, cần chỉnh các link wiki thành `../../StudentMart.wiki/` hoặc dùng URL wiki tương ứng. Agent luôn kiểm tra vị trí thật trước khi đọc, không coi link sai là tài liệu không tồn tại.

## Chọn nguồn theo công việc

| Công việc | Nguồn cần đọc |
|---|---|
| Bối cảnh, người dùng, mô hình C2C | [Home](../../../StudentMart.wiki/Home.md), [Project Direction](../../../StudentMart.wiki/Project-Direction.md) |
| Scope, ranh giới tính năng | [MVP Scope](../../../StudentMart.wiki/MVP-Scope-and-Prioritization.md), [Product Decisions](../../../StudentMart.wiki/Product-Decisions.md), [Impact–Effort](../../../StudentMart.wiki/Impact–Effort-Matrix.md) |
| Tiêu chí chức năng | [User Stories](../../../StudentMart.wiki/User-Stories.md) |
| Nhánh xử lý, quyền, lỗi | [Critical User Flows](../../../StudentMart.wiki/Critical-User-Flows.md) |
| Liên kết R/US/UF/TASK chuẩn | [Traceability](../../../StudentMart.wiki/Traceability.md) |
| Mốc và phụ thuộc | [Project Plan](../../../StudentMart.wiki/Project-Plan.md) |
| Mobile, quyền thiết bị, lựa chọn nền tảng | [Mobile Product Rationale](../../../StudentMart.wiki/Mobile-Product-Rationale.md) |
| Giả định và thiết kế nghiên cứu | [Critical Assumptions](../../../StudentMart.wiki/Critical-Assumptions.md), [Evidence Plan](../../../StudentMart.wiki/Evidence-Plan.md) |
| Số liệu và giới hạn khảo sát | [User and Market Research](../../../StudentMart.wiki/User-and-Market-Research.md), [Evidence Evaluation](../../../StudentMart.wiki/Evidence-Evaluation.md) |
| So sánh phương án thay thế | [Existing Solutions](../../../StudentMart.wiki/Existing-Solutions-and-Alternatives.md) |
| Chỉ số, chi phí, mô hình sản phẩm | [Business Canvas](../../../StudentMart.wiki/Business-Canvas.md) |
| Vị trí bằng chứng/tham khảo | [Evidence Register](../../../StudentMart.wiki/Evidence-Register.md), [References](../../../StudentMart.wiki/References.md) — hiện chỉ ghi “Updating” |

Wiki dùng nhãn “MVP Scope”, nhưng tên file checkout thực tế là `MVP-Scope-and-Prioritization.md`. Dùng tên file thật khi đọc local.

## Mapping triển khai

UN/R/US cùng số chỉ các thành phần khác nhau trong chuỗi truy vết; không đổi tên hoặc gộp mã. Bảng dưới tóm tắt [Traceability](../../../StudentMart.wiki/Traceability.md); khi có thay đổi, kiểm tra lại bảng gốc.

| Requirement / User Story | Phạm vi | Nhánh User Flow chính | Task |
|---|---|---|---|
| R01 / US01 | Tài khoản và quyền | UF01b, UF02a, UF03, UF04; dùng chung quyền tại UF05 | TASK-16 |
| R02 / US02 | Đăng bán | UF02a | TASK-03, TASK-04 |
| R03 / US03 | Tìm mua | UF01a → UF02a, UF02b | TASK-03, TASK-04, TASK-07 |
| R04 / US04 | Trao đổi | UF02a, UF02b | TASK-03, TASK-04, TASK-07 |
| R05 / US05 | Duyệt, tìm, lọc | UF01a | TASK-05, TASK-15 |
| R06 / US06 | Chi tiết và hồ sơ | UF01a, kiểm tra lại tại UF01b | TASK-06, TASK-07 |
| R07 / US07 | Chat theo tin | UF01b, UF02b, UF04 | TASK-06, TASK-21 |
| R08 / US08 | Nội dung, vòng đời tin | UF02b | TASK-04, TASK-07 |
| R09 / US09 | Verify tùy chọn | UF03 | TASK-15, TASK-17, TASK-18 |
| R10 / US10 | Báo cáo/chặn | UF05a | TASK-22 |
| R11 / US11 | Quản trị báo cáo | UF05b | TASK-22 |
| R12 / US12 | Bản nháp tin trên thiết bị | UF02a | TASK-23, TASK-04 |
| R13 / US13 | Push và tiếp tục hội thoại | UF04 | TASK-17, TASK-19, TASK-20, TASK-21 |

TASK-23 phối hợp TASK-06 cho retry chat theo US07; không biến US12 thành offline toàn app. TASK-24 nghiệm thu toàn bộ R01–R13/US01–US13 và các nhánh UF.

## Công việc hỗ trợ và phụ thuộc

- M1: TASK-01/02 phân tích/evaluation; TASK-10/11/12 công cụ, tuyển, phỏng vấn; TASK-13 đối chiếu ít nhất năm phương án; TASK-14 nền tảng; TASK-15 danh sách khu vực, trường và miền email.
- M2: TASK-03/16 thiết kế và tài khoản → TASK-04 → TASK-05/06 → TASK-07. TASK-17 thử OTP/push sớm, trước tích hợp TASK-18/19/20/21. TASK-22/23 vận hành và phục hồi. TASK-25 đo lường trước TASK-24 nghiệm thu.
- M3: TASK-08 nguồn người/tin thật (chuẩn bị được từ M2), TASK-09 pilot sau TASK-24. Phụ thuộc thực tế theo Project Plan, không ép thành thứ tự tuần tự tuyệt đối.
- Issue chuẩn tra link từ Traceability; `TASK-01` trỏ Issue #2, không suy diễn TASK bằng số Issue.
- Assignee, hạn và trạng thái lấy từ GitHub Project khi có quyền truy cập. Không bịa dữ liệu đang thiếu.

## Evidence và quyết định

SV1 có 13 phản hồi sàng lọc, 11 tiếp tục; dữ liệu tự báo cáo trong mẫu nhỏ. Chưa có dữ liệu từng phản hồi, phản hồi mở gốc Q21–Q22 hoặc hành vi sử dụng StudentMart.

- A1, A2, A4, A5: Investigate further; A3: Keep để tiếp tục thử nghiệm.
- D01: tìm hiểu khả năng tìm tin/người phù hợp, chưa tuyên bố thay Facebook/chống lừa đảo.
- D02: nhu cầu theo thời điểm; D03: ưu tiên nguồn tin công nghệ/gia dụng, không loại sách.
- D04: tự giao dịch gần; D05: giới hạn ý nghĩa verify; D06: chuẩn bị nguồn cung nhỏ; D07: chưa mở rộng từ phản hồi chưa đối chiếu.
- Q10/Q11 nhiều lựa chọn: không cộng số đếm thành số người; Q17 dẫn dắt, không chứng minh verify tạo tin cậy; Q18 thay nhiều yếu tố, không chứng minh riêng tác động khoảng cách.
- Không đặt SLA OTP dưới 30 giây, app dưới 30 MB, tỷ lệ adoption hoặc lời hứa cải thiện nếu chưa có căn cứ.
- Bổ sung phỏng vấn 5–8 người/15–20 phút là kế hoạch, chưa phải kết quả thu thập. Ẩn danh, lưu đồng ý phù hợp và phân biệt quan sát với diễn giải.

## Những gì còn chờ thiết kế

Stack được nêu trong README sản phẩm: React Native + Expo, Node.js, PostgreSQL; TypeScript dự kiến. Chưa chốt framework/ORM, routing/state/form, dịch vụ ảnh/email/push, giao thức chat, phiên bản, package manager, scripts hay hệ điều hành phát hành.

Chưa có schema/enum/API contract chính thức, giới hạn độ dài/ảnh, TTL OTP/cooldown, danh sách miền/khu vực hoặc chính sách retention/khôi phục tin đầy đủ. Khi đề xuất, ghi nhãn “đề xuất kỹ thuật”, nêu R/US/UF được đáp ứng và quyết định cần chốt; không biến ví dụ thành yêu cầu từ wiki.
