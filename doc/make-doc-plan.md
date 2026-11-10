# StudentMart — Kế hoạch và chỉ mục bộ tài liệu

**Ngày đối chiếu:** 07/11/2026. **Trạng thái:** Draft — đang viết và kiểm tra tài liệu.

## 1. Đầu vào và cách áp dụng

Thực hiện yêu cầu tạo bộ doc theo [make-doc-skill-plan.md](../make-doc-skill-plan.md). Repository có bản kế hoạch thiết kế skill, chưa có thư mục skill `make-doc` với `SKILL.md` và hợp đồng tài liệu riêng. Nhiệm vụ này áp dụng quy trình và bộ tên đầu ra trong bản kế hoạch; không triển khai hoặc cài đặt skill.

**Ngoại lệ đầu vào đã được người dùng chốt:** “Dùng Wiki và docs hiện có làm nguồn chính”. Workspace không có PDF đặc tả. Vì vậy bộ tài liệu dùng bản Wiki local và `docs/` thay PDF; không có dẫn nguồn trang PDF hoặc tuyên bố đã đọc PDF. Những đầu ra còn lại của kế hoạch vẫn được giữ.

Đích lưu là `doc/` tại root StudentMart. Dự án được xử lý theo chế độ **dự án đã có mã cần kế thừa**, ở mức bootstrap: backend có health endpoint, mobile có shell; các module nghiệp vụ chưa triển khai. Kiểm kê dựa trên file thực tế, không dựa riêng vào mô tả scaffold cũ.

Áp dụng thêm [studentmart-requirements](../stephen-skills/.agents/skills/studentmart-requirements/SKILL.md) để giữ phạm vi MVP, mã R/US/UF/TASK và cách phân biệt bằng chứng với đề xuất. Không áp dụng chỉ dẫn ở `stephen-skills/AGENTS.md` như quy tắc bắt buộc cho `doc/`, vì file đó thuộc cây con khác.

## 2. Thứ tự ưu tiên và bản đồ nguồn

| Nguồn | Vai trò trong bộ tài liệu | Giới hạn |
|---|---|---|
| Chỉ dẫn người dùng trong nhiệm vụ | Chọn Wiki/docs thay PDF; tạo đủ bộ tài liệu | Không tự đổi các quyết định sản phẩm |
| [MVP Scope](../StudentMart.wiki/MVP-Scope-and-Prioritization.md), [Product Decisions](../StudentMart.wiki/Product-Decisions.md) | Phạm vi, địa bàn, giới hạn và D01–D07 | Hiệu quả sản phẩm chưa được kiểm chứng |
| [User Stories](../StudentMart.wiki/User-Stories.md), [Critical User Flows](../StudentMart.wiki/Critical-User-Flows.md) | Tiêu chí US01–US13, nhánh UF và lỗi | Mô tả yêu cầu, không chứng minh đã có chức năng |
| [Traceability](../StudentMart.wiki/Traceability.md), [Project Plan](../StudentMart.wiki/Project-Plan.md) | Mã chuẩn, TASK và milestone M1–M3 | Không xác nhận trạng thái GitHub hiện tại |
| [Evidence Evaluation](../StudentMart.wiki/Evidence-Evaluation.md), [Business Canvas](../StudentMart.wiki/Business-Canvas.md) | Giả định A1–A5, giới hạn khảo sát, định hướng đo lường | Chưa có dữ liệu pilot hoặc phản hồi gốc đầy đủ |
| [Schema](../docs/schema.md) | Từ điển chi tiết của 25 bảng, ERD, C01–C24, local data | Thiết kế đề xuất, chưa có migration |
| [Solution tree](../docs/solution_tree.md) | Quyết định Three-Layer, MVVM nhẹ, module và ownership | Các đoạn “chưa có manifest/app” đã cũ so với source |
| [Technical decisions](../docs/technical-decisions.md) và manifests | Fastify, TypeScript, Zod, Vitest và bootstrap đã chọn | Không suy rộng thành ORM/provider đã chọn |
| [Backlog](../docs/back-log.md) | Danh mục BL-001…BL-049 và mẫu ticket đầy đủ | Là kế hoạch; một số mô tả bootstrap đã cũ |
| [README](../README.md), README mobile/backend | Giới thiệu, bối cảnh học phần và khung làm việc | Đối chiếu source trước khi dùng khẳng định hiện trạng |

`docs/schema.md` tiếp tục là nguồn duy nhất của từ điển cột chi tiết; `docs/back-log.md` tiếp tục giữ danh mục BL và mẫu issue. Các file mới tổ chức lại việc đọc, bổ sung đối chiếu và liên kết đến nguồn chi tiết, tránh hai bản đặc tả độc lập.

## 3. Hiện trạng và khoảng cách đã quan sát

| Thành phần | Bằng chứng local | Kết luận và việc còn lại |
|---|---|---|
| Backend bootstrap | [package.json](../backend/package.json), [app.ts](../backend/src/bootstrap/app.ts), [server.ts](../backend/src/bootstrap/server.ts), [env.ts](../backend/src/shared/config/env.ts) | Đã có Fastify `/health` và validate env; chưa có API nghiệp vụ |
| Kiểm tra bootstrap | [bootstrap.test.ts](../backend/tests/unit/bootstrap.test.ts) | Có hai ca health/config; phiên viết doc chưa chạy lại test ứng dụng |
| Mobile bootstrap | [package.json](../mobile/package.json), [App.tsx](../mobile/App.tsx), [app.json](../mobile/app.json) | Có Expo shell; chưa có navigation hoặc màn hình nghiệp vụ |
| Phân tầng | `mobile/src/features/`, `backend/src/modules/` và `.gitkeep` | Có 6 feature mobile, 9 module backend ở mức khung |
| Database | `backend/database/` giữ khung migrations/seeds/reference-data | 25 bảng mới ở mức thiết kế; chưa có DDL/migration thực thi |
| Tích hợp | Chưa thấy implementation auth/media/OTP/push/worker trong source nghiệp vụ | Cần thiết kế contract, provider và triển khai theo backlog |
| Dependency lock | Có `package-lock.json` ở root, chưa có lockfile riêng trong từng app khi kiểm kê | Không dùng sự tồn tại lock root để suy đã khóa dependency hai app |
| Tiến độ và môi trường chạy | Chưa đối chiếu Project, chưa chạy app/DB/thiết bị trong nhiệm vụ | Không đánh dấu BL/TASK Done hoặc nghiệm thu kỹ thuật |

## 4. Danh mục đầu ra và thứ tự viết

| Thứ tự | File | Hành động | Đầu vào và phụ thuộc | Tiêu chí hoàn thành | Trạng thái |
|---|---|---|---|---|---|
| 0 | [make-doc-plan.md](make-doc-plan.md) | Tạo | Kế hoạch skill, nguồn và kiểm kê | Có ngoại lệ nguồn, ma trận, kiểm tra và giới hạn | Draft |
| 1 | [summary-assigment.md](summary-assigment.md) | Tạo | Scope, decisions, US, traceability | Phân tích đủ R01–R13, chất lượng, rules, milestone và điểm mở | Planned |
| 2 | [explain-detail.md](explain-detail.md) | Tạo rồi bổ sung | Thuật ngữ thực dùng trong cả bộ | Định nghĩa, vị trí, mục đích, ví dụ và cách hiểu sai | Planned |
| 3 | [tech-stack.md](tech-stack.md) | Tạo | Summary, source/config, technical decisions | Phân biệt stack hiện có, đích đã chọn và phần còn mở | Planned |
| 4 | [structure-architecture.md](structure-architecture.md) | Tạo | Stack, solution tree, schema | Cây thực tế, chiều dependency, ownership, workflow và lộ trình | Planned |
| 5 | [user-flow.md](user-flow.md) | Tạo | Summary, US, UF, quyền và trạng thái | Actor, điều kiện, bước, kết quả, lỗi và phục hồi cho mọi nhánh UF | Planned |
| 6 | [schema-database.md](schema-database.md) | Tạo | Schema chuẩn, architecture, flow | Đủ mapping 25 bảng, từ điển được liên kết, kiểu, toàn vẹn và migration | Planned |
| 7 | [work-flow.md](work-flow.md) | Tạo | Cả bộ, backlog và Project Plan | Epic/feature/ticket, dependency, AC/DoD, kiểm thử, nguồn lực và bàn giao | Planned |

Giữ nguyên các file nguồn trong `docs/`, Wiki và mã ứng dụng. Tên `summary-assigment.md` giữ đúng chính tả quy ước trong kế hoạch đầu vào.

## 5. Ma trận yêu cầu → nơi giải thích chính → kiểm tra

R/US/UF/TASK kế thừa Wiki; không tạo bộ mã requirement mới. Các ký hiệu C01–C24 thuộc riêng thiết kế schema. Mã BL thuộc backlog local, không phải số Issue.

| Yêu cầu / nguồn | Nơi giải thích chính | Tài liệu đối chiếu | Cách kiểm tra tài liệu |
|---|---|---|---|
| R01 / US01 — tài khoản; TASK-16 | Summary §4; flow §2, §4, §7 | Architecture; schema nhóm auth | Actor lấy từ phiên; logout/switch không lộ dữ liệu cũ |
| R02 / US02 — bán; TASK-03/04 | Flow §5 | Schema listings/media; summary | Ảnh, tình trạng, giá; thành công sau commit |
| R03 / US03 — tìm mua; TASK-03/04/07 | Flow §5 | Summary; schema | Ngân sách và ảnh tùy chọn; hoàn tất là Đã tìm được |
| R04 / US04 — trao đổi; TASK-03/04/07 | Flow §5 | Summary; schema | Có món đang có/mong muốn; không ghép tự động |
| R05 / US05 — tìm/lọc; TASK-05/15 | Flow §3 | Schema §6; summary | NULL bị loại khi lọc giá, không hiển thị thành 0 |
| R06 / US06 — chi tiết; TASK-06/07 | Flow §3 | Architecture; schema | Public projection không lộ email; trạng thái cập nhật |
| R07 / US07 — chat; TASK-06/21, phối hợp TASK-23 | Flow §4 | Schema §5, §7; architecture | Duy nhất hội thoại, ACK, retry, quyền xem/gửi tách riêng |
| R08 / US08 — vòng đời tin; TASK-04/07 | Flow §6 | Schema; explain | Hoàn tất khác đóng/gỡ; chat cũ sau COMPLETED/CLOSED |
| R09 / US09 — verify; TASK-15/17/18 | Flow §7 | Summary; schema auth | Tùy chọn; version/OTP; ý nghĩa nhãn chính xác |
| R10 / US10 — report/block; TASK-22 | Flow §9 | Schema moderation | Hai thao tác độc lập, không tự phạt/xóa lịch sử |
| R11 / US11 — quản trị; TASK-22 | Flow §10 | Architecture; schema | ADMIN, phạm vi dữ liệu, actor/time/reason và effect nguyên tử |
| R12 / US12 — nháp; TASK-23/04 | Flow §5 | Schema §4; architecture | Local theo account; nháp khác listing; key publish ổn định |
| R13 / US13 — push; TASK-17/19/20/21 | Flow §8 | Tech; architecture; schema | Message trước push; từ chối push vẫn inbox; tap cũ reauth |
| A1–A5, D01–D07 và nghiên cứu | Summary §2, §9 | Explain; workflow | Đúng 13 sàng lọc/11 tiếp tục; không suy thành hành vi pilot |
| Đo lường — TASK-25 | Summary §8; workflow §8 | Schema analytics/journal | Phân biệt message/liên hệ/hoàn tất tự báo cáo/đóng/gỡ |
| Chất lượng và nghiệm thu — TASK-24 | Summary §5; workflow §9 | Flow §12; schema §8 | Đủ nhánh quyền/lỗi/race; không ghi ca dự kiến là pass |
| Hiện trạng khác mô tả scaffold cũ | Tech §2; architecture §2; workflow §2 | Source bootstrap, manifests | Có shell/health; nghiệp vụ và DB chưa được suy là hoàn tất |

## 6. Điểm còn mở và cách xử lý

| Nội dung thiếu | Cách ghi trong bộ tài liệu | Đầu ra tiếp theo |
|---|---|---|
| Phương thức auth, ORM/migration, router/state/form | Cần chốt; không mặc định theo scaffold hoặc ví dụ | BL-001/002 và các ticket nền tảng |
| Provider ảnh/email/push, OS phát hành | Cần lựa chọn và spike trên môi trường mục tiêu | BL-011, TASK-17 |
| Giá 0, giới hạn ảnh/text, TTL/quota OTP, quyền sau WITHDRAWN/REMOVED | Đề xuất schema chưa được coi là rule đã duyệt | BL-002 trước các ticket phụ thuộc |
| Lookup trường/miền/khu vực/danh mục thực | Không seed phỏng đoán | BL-003, TASK-15 |
| Capacity, assignee, deadline, chi phí dịch vụ | Chưa có dữ liệu; không lập lịch ngày hoặc ngân sách giả | Nhóm chốt khi đưa ticket To Do |
| Tiến độ Issue/Project và kết quả pilot | Chưa xác minh online; dùng trạng thái quan sát local | Đối chiếu riêng khi triển khai/pilot |

## 7. Quy trình kiểm chứng và kết quả

Sau khi viết: đọc lại file từ đĩa; kiểm tra UTF-8, 8 tên file, tiêu đề, bảng, hàng rào code và liên kết local/anchor; đối chiếu độ bao phủ R01–R13, US01–US13 và các nhánh UF. Kiểm tra 25 bảng có đúng một module sở hữu, tham chiếu BL hợp lệ, dependency backlog không vòng và không thay số Issue bằng mã BL/TASK.

Các sơ đồ được kiểm tra cấu trúc/nội dung; chỉ ghi đã render nếu thực sự chạy được công cụ render. Không chạy build/test app chỉ cho thay đổi Markdown. Kết quả kiểm tra và trạng thái từng file sẽ được cập nhật sau vòng rà cuối.

**Ý nghĩa trạng thái:** Verified chỉ xác nhận tài liệu đã được đối chiếu nguồn và kiểm tra trong phạm vi nêu trên; không xác nhận tính năng, migration, test nghiệp vụ, tích hợp thiết bị hoặc pilot đã hoàn thành.
