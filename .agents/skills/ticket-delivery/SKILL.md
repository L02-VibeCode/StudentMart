---
name: ticket-delivery
description: Triển khai task GitHub StudentMart từ ticket ID; đọc sub-issues, phân công agent theo scope, kiểm thử AC, cập nhật Project và tạo PR chờ người dùng review. Không dùng cho câu hỏi chỉ tra cứu issue.
---

# StudentMart ticket delivery

Đọc root AGENTS.md và .codex/project-context.md. Khi người dùng giao #ticketid để implement, chỉ dẫn thường trực của dự án cho phép tự phân công theo quy trình này; yêu cầu hiện tại của người dùng luôn ưu tiên.

## Khám phá và phân công

- Đọc issue, parent nếu có, và quan hệ sub-issues thật qua `gh api repos/L02-VibeCode/StudentMart/issues/ID/sub_issues` (paginate khi cần). Đối chiếu hợp đồng/phụ thuộc/source. Nếu API không đọc được, báo giới hạn; không kết luận không có sub-issue từ lỗi quyền.
- Kiểm tra working tree và origin/main; tạo một nhánh theo task gốc. Child agents dùng chung nhánh, không tự switch/rebase/stage file người khác. Giữ ownership file rõ ràng, phối hợp khi source giao nhau.
- BE/API/TypeORM/PostgreSQL: backend-dev với typeorm-migrations. FE React Native/Expo: frontend-dev với frontend-design. QA: qa-engineer đối chiếu AC và test tích hợp. pm chỉ khi cần làm rõ phạm vi/AC; tech-lead chỉ khi cần quyết định kiến trúc/API xuyên module. Không gọi mọi vai trò chỉ vì có sẵn, không tự đổi model.
- Skills là hướng dẫn cho agent, không phải agent type. Nếu vai trò/skill không có, root làm phần tương ứng và ghi rõ giới hạn thay vì giả đã ủy nhiệm.

## Triển khai và bàn giao

- Root sở hữu nhánh, Project và PR; child chỉ sở hữu source/test được giao. Chỉ tạo thêm sub-ticket khi user yêu cầu hoặc đã cho phép rõ phạm vi đó.
- Đối chiếu từng AC/quy tắc hoàn thành, phân biệt mock/HTTP+DB/native thực. Không làm giả domain hoặc báo Done khi thiếu nguồn thật.
- Chạy kiểm tra phù hợp, sửa lỗi, commit có scope. Root tổng hợp bằng chứng và xác nhận kết quả cho người dùng, tạo PR main kèm AC matrix/setup/giới hạn, theo dõi CI đến kết quả cuối.
- Project In Progress khi bắt đầu, Review khi có PR; tra field theo tên, giữ metadata khác. Cập nhật task và sub-ticket liên quan. Không tự đóng issue/Done khi AC chưa đủ.
- Chờ người dùng review/approve đối với PR hiện tại; không auto-merge. Không deploy production chỉ từ việc giao ticket source.
