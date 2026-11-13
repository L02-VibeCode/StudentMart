# StudentMart — Hướng dẫn Claude

@AGENTS.md

Các đường dẫn tương đối dưới đây dùng cùng gốc bộ hướng dẫn như AGENTS.md.

## Vai trò chuyên môn

| Agent | Dùng khi |
|---|---|
| `pm` | Phân tích evidence, phạm vi, R/US/UF, tiêu chí nghiệm thu và pilot |
| `tech-lead` | Thiết kế dữ liệu/API, ma trận quyền, quyết định kỹ thuật và phụ thuộc |
| `backend-dev` | Node.js/PostgreSQL, phân quyền, tin đăng, chat, OTP, push và moderation |
| `frontend-dev` | React Native + Expo, biểu mẫu, tìm kiếm, chat, bản nháp và thông báo |
| `qa-engineer` | Kiểm tra US01–US13, các nhánh UF, tích hợp và thiết bị thật |

Chọn vai trò theo công việc được giao; không tự khởi chạy một đội agent hoặc bắt buộc đi qua cả năm vai trò. Công việc nhỏ có thể thực hiện trực tiếp.

## Skill hiện có

- `studentmart-requirements`: đối chiếu và truy vết yêu cầu/quy tắc/luồng trước thay đổi nghiệp vụ.
- `frontend-design`: thiết kế và triển khai giao diện mobile StudentMart.
- `database-migrations`: thay đổi schema PostgreSQL với công cụ thực tế của backend.
- `context7-doc-capture`: tra tài liệu kỹ thuật theo phiên bản rồi lưu ghi chú đã kiểm chứng.

Các skill ở `.claude/skills/` được đồng bộ với `.agents/skills/`. Không yêu cầu skill hoặc CLI chưa có trong môi trường.

## Tài liệu công việc

Đọc [bản đồ nguồn](docs/studentmart/source-map.md) để chọn trang wiki đúng chủ đề và [ca nghiệm thu](docs/studentmart/flow-acceptance.md) khi kiểm thử luồng.

`docs/plans/todo.md` và `docs/plans/progress.md` chỉ ghi công việc StudentMart cục bộ; lịch sử CMS giữ tại `docs/archive/cms/`. Không dùng design cũ để suy ra tính năng đã triển khai.
