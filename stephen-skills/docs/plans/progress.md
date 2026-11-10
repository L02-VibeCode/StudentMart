# StudentMart — Ghi chú tiến độ cục bộ

Lịch sử CMS trước chuyển đổi: [archive](../archive/cms/progress.md). Tiến độ ứng dụng/Assignee thực tế lấy từ GitHub Project, không từ lịch sử này.

## 2026-11-02 — Điều chỉnh bộ skill và agent

- Đọc toàn bộ 18 trang StudentMart.wiki và README sản phẩm; xác nhận snapshot chưa có mobile/backend.
- Cập nhật AGENTS.md, CLAUDE.md, README bộ, hai rule mobile/backend và cấu hình đăng ký agent Codex.
- Đồng bộ năm vai trò PM, tech lead, backend, mobile frontend, QA giữa Codex và Claude.
- Đồng bộ skill requirements, mobile design, PostgreSQL migration và tra tài liệu; thay ef-migrations bằng database-migrations.
- Thêm docs/studentmart: nguồn/truy vết, quy tắc nghiệp vụ và ma trận ca nghiệm thu.
- Giữ nguyên todo/progress CMS trong docs/archive/cms trước khi khởi tạo ghi chú StudentMart. Các tài liệu CMS khác là lịch sử, không dùng làm yêu cầu/thiết kế hiện hành.
- Không khởi tạo mã ứng dụng, chọn ORM/provider hoặc cập nhật trạng thái GitHub.

Kết quả kiểm tra: 8 SKILL.md qua quick_validate; 4 cặp skill giống nhau; 5 cấu hình agent TOML và YAML frontmatter của Claude đọc được, tên/mô tả/nội dung khớp; đăng ký agent và phạm vi rule hợp lệ; 85 liên kết Markdown nội bộ tồn tại; 57 mã truy vết được đối chiếu với wiki, đủ 13 R/US và 8 nhánh luồng. Không còn đường dẫn/lệnh triển khai CMS cũ trong hướng dẫn hiện hành. Hai bản lưu todo/progress giữ nguyên nội dung gốc, chỉ chuẩn hóa xuống dòng.

Chưa có kiểm thử ứng dụng, migration, OTP hay push trên thiết bị thật trong công việc tài liệu này.
