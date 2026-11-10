---
name: database-migrations
description: "Thiết kế, tạo và kiểm tra thay đổi schema PostgreSQL cho backend Node.js của StudentMart bằng công cụ migration thực tế của dự án."
---

# Migration PostgreSQL cho StudentMart

## Xác định công cụ và mục tiêu

Đọc AGENTS.md, thiết kế của tính năng và [quy tắc nghiệp vụ](../../../docs/studentmart/business-rules.md). Tìm `backend/` ở repository root, kiểm tra manifest/lockfile, cấu hình ORM/migration và lịch sử migration hiện có.

StudentMart chọn PostgreSQL nhưng chưa chốt ORM/công cụ migration. Nếu chưa có mã hoặc công cụ, hoàn tất đề xuất schema/SQL cần thiết theo nhiệm vụ, ghi rõ lựa chọn cần chốt; không giả lập lệnh Prisma/Drizzle/Knex hoặc wrapper không tồn tại.

Phân biệt tạo file migration với áp dụng vào DB. Xác định môi trường đích mà không in connection string/secret. Việc được giao sửa schema không tự cấp quyền thay dữ liệu DB dùng chung hoặc production.

## Thiết kế theo nghiệp vụ liên quan

- Listings: chung ba loại Bán/Tìm mua/Trao đổi, dữ liệu đặc thù theo loại; ngân sách Tìm mua có thể thiếu. Không thay NULL bằng 0.
- Vòng đời tin phân biệt hoàn tất/đóng/gỡ, kết quả theo loại và nguồn quản trị; chủ tin không tự phục hồi tin admin gỡ.
- Chat: tham chiếu tin, hai người tham gia khác nhau; cơ chế duy nhất cho cặp người và cùng tin, kể cả request đồng thời.
- Retry tin đăng/tin nhắn cần định danh thao tác và bảo đảm không nhân bản; chọn unique constraint/transaction phù hợp với contract thực tế.
- Quyền sở hữu/thành viên/chặn/hạn chế phải có dữ liệu hỗ trợ backend kiểm tra; không mặc định DB constraint thay toàn bộ phân quyền.
- OTP/verify, thiết bị push gắn tài khoản và audit quyết định quản trị chỉ thêm khi tính năng cần. Thiết kế tránh lưu OTP/token nhạy cảm ở log/seed công khai.
- Tin nhắn lưu bền trước yêu cầu push; cơ chế queue/outbox là lựa chọn thiết kế, không phải công nghệ đã được wiki chốt.

Các tên bảng/cột/enum/index cụ thể là đề xuất cho đến khi có schema được duyệt.

## Tạo và xác minh

1. Đánh giá dữ liệu hiện có, nullability/default, FK/index/unique, backfill và ảnh hưởng API/mobile.
2. Dùng script/công cụ đã có để tạo migration. Kiểm tra SQL sinh ra, đặc biệt drop/rename/cast hoặc thay đổi làm mất dữ liệu.
3. Không sửa lịch sử migration đã áp dụng; tạo bước tiếp theo theo convention thực tế.
4. Với thay đổi có rủi ro mất dữ liệu, chuẩn bị phương án backfill/khôi phục trước khi áp dụng; chỉ yêu cầu quyết định cho phần còn thiếu authorization.
5. Chạy trên PostgreSQL kiểm thử tách biệt: kiểm tra từ DB trống và đường nâng cấp có dữ liệu đại diện nếu liên quan. Thử ràng buộc concurrent/idempotency khi thay đổi chat/retry.
6. Báo rõ file, lệnh thực tế, DB/môi trường, dữ liệu có thể bị ảnh hưởng, phần đã chạy và phần chưa áp dụng. Không báo migration đã áp dụng nếu mới tạo file.

Không chạy reset/drop/reseed để “sửa nhanh” DB hiện hữu; không dùng công cụ/schema từ bộ CMS cũ.
