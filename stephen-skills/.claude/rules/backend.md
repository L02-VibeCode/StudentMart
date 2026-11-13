---
paths:
  - "backend/**"
---

# StudentMart backend

Đọc AGENTS.md và docs/studentmart/business-rules.md của bộ hướng dẫn; mã backend ở repository root.

- Node.js + PostgreSQL, một ứng dụng chia module. Framework/ORM/công cụ migration chưa chốt; kiểm tra manifest và thiết kế trước.
- Lấy danh tính từ phiên đã xác thực. Kiểm tra chủ tin, thành viên hội thoại, quản trị, tài khoản hạn chế và quan hệ chặn ở backend.
- Ba loại tin chung cơ chế; validation theo loại; khu vực/miền email theo danh sách hỗ trợ được chốt trong TASK-15.
- Chỉ tin mở được tạo hội thoại mới; không tự chat; bảo đảm duy nhất theo cặp người và tin kể cả request đồng thời.
- Sau chủ tin hoàn tất/đóng: cho hội thoại cũ tiếp tục nếu còn quyền. Tin admin gỡ không tự khôi phục; tách quyền xem/gửi theo quyết định hiện tại.
- Bảo vệ retry đăng tin/gửi tin nhắn trước timeout và request đồng thời bằng cơ chế idempotency có lưu trữ; ràng buộc/transaction là quyết định thiết kế, không schema đã có.
- Lưu tin nhắn trước khi yêu cầu push; lỗi nhà cung cấp không làm mất tin nhắn. Kiểm tra người nhận, chặn, quyền và liên kết thiết bị trước gửi.
- OTP hợp lệ, còn hạn và đúng miền mới cấp verify; giới hạn thử/gửi lại, đổi email thu hồi nhãn. Không tự bịa thời hạn OTP hoặc danh sách miền.
- Filter giá loại NULL/thiếu giá; không coalesce thành 0. Không trả tin kết thúc/bị gỡ trong danh sách đang mở.
- Báo cáo không tự phạt. Quyết định admin ghi actor/thời điểm/lý do và áp dụng nhất quán lên tìm kiếm, chi tiết, chat/push.
- Migration dùng skill database-migrations theo công cụ thực tế; không áp dụng vào DB dùng chung/production ngoài phạm vi được giao.
- Không trả email trường, địa chỉ riêng hoặc ghi nội dung chat, OTP, token trong response công khai/log.
