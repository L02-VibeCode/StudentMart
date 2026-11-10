# Stephen Skills cho StudentMart

Bộ skill, agent và quy tắc đã điều chỉnh theo [StudentMart.wiki](../StudentMart.wiki/Home.md) và [README sản phẩm](../README.md).

## Nội dung sử dụng

| Thành phần | Nội dung |
|---|---|
| [AGENTS.md](AGENTS.md), [CLAUDE.md](CLAUDE.md) | Bối cảnh, stack, giới hạn MVP, nguyên tắc thực hiện và bàn giao |
| `.agents/skills/`, `.claude/skills/` | Bốn skill đồng bộ: studentmart-requirements, frontend-design, database-migrations, context7-doc-capture |
| `.codex/agents/`, `.claude/agents/` | Năm vai trò đồng bộ: pm, tech-lead, backend-dev, frontend-dev, qa-engineer |
| `.codex/config.toml` | Đăng ký vai trò; không chỉ định model hoặc bật chạy đội tự động |
| `.claude/rules/` | Quy tắc cho `mobile/**` và `backend/**` |
| [Bản đồ nguồn](docs/studentmart/source-map.md) | Nguồn wiki, R/US/UF/TASK và các quyết định chưa chốt |
| [Quy tắc nghiệp vụ](docs/studentmart/business-rules.md) | Các bất biến chung cho mobile, backend và QA |
| [Ca nghiệm thu](docs/studentmart/flow-acceptance.md) | Các nhánh xử lý thành công, lỗi và quyền cần kiểm chứng |

Skill `ef-migrations` cũ được thay bằng `database-migrations` cho PostgreSQL. Không giữ alias EF vì StudentMart không sử dụng EF Core.

## Trạng thái và cách dùng

Bộ hiện nằm trong `stephen-skills/`; nó chưa được cài làm cấu hình ở repository root. Khi sử dụng trực tiếp, đọc AGENTS.md trong thư mục này; mã ứng dụng và wiki được tìm từ root StudentMart ở cấp cha.

Nếu cài bộ vào root, gộp có chọn lọc `AGENTS.md`, `CLAUDE.md`, `.agents/`, `.claude/`, `.codex/` và `docs/studentmart/` với cấu hình sẵn có. Giữ cấu hình riêng của người dùng và xử lý các skill EF cũ nếu đã cài. Không sao chép toàn bộ `docs/` làm tài liệu hiện hành.

Dự án đã có khung thư mục mobile/backend theo Three-Layer; mobile dùng MVVM nhẹ và backend dùng Controller–Service–Repository. Xem [solution tree](../docs/solution_tree.md). Chưa có manifest hoặc ứng dụng chạy được. React Native + Expo, Node.js và PostgreSQL là lựa chọn của dự án; framework backend, ORM, dịch vụ ảnh/email/push và phiên bản còn chờ thiết kế. Skill không giả lập các lệnh cài/chạy/test khi chưa có manifest.

## Tài liệu lịch sử

Các file CMS kế thừa trong `docs/plans/`, `docs/superpowers/`, `docs/lib/` và các ghi chú cũ ở `docs/` được giữ để bảo toàn lịch sử, không áp dụng cho StudentMart. Bản todo/progress CMS trước khi chuyển đổi được lưu nguyên văn ở `docs/archive/cms/`; todo/progress hiện hành chỉ ghi việc của StudentMart.

Khi quy tắc sản phẩm thay đổi, cập nhật wiki liên quan trước hoặc cùng thay đổi, rồi đồng bộ bản tóm tắt và hai bản skill/agent. Các ca nghiệm thu hỗ trợ rà soát; chỉ được tuyên bố đã đạt sau khi có kết quả chạy thực tế.
