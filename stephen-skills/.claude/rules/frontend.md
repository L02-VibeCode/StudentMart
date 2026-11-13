---
paths:
  - "mobile/**"
---

# StudentMart mobile

Đọc AGENTS.md và docs/studentmart/business-rules.md của bộ hướng dẫn; mã mobile ở repository root.

- React Native + Expo. Theo điều hướng và thư viện đang có; Expo Router là lựa chọn chưa chốt.
- Form Bán/Trao đổi cần ảnh; Tìm mua không bắt buộc ảnh/ngân sách. Cho chọn ảnh có sẵn khi không dùng camera.
- Giữ bản nháp tin trên thiết bị và nội dung gửi lỗi; phân biệt đang gửi/đã xác nhận/lỗi. Retry cùng thao tác không tạo bản sao.
- Chọn khu vực thủ công; không bắt GPS hoặc verify để dùng luồng chính sau đăng nhập.
- Tách loading, rỗng, lỗi và không còn quyền; khi đổi filter không để response cũ thay kết quả mới.
- Tách quyền xem lịch sử và gửi chat. Tin đóng/hoàn tất không tự khóa hội thoại cũ.
- Push là tính năng MVP, quyền nhận là lựa chọn. Nội dung thông báo chung; kiểm tra phiên và quyền khi mở, kể cả thông báo cũ.
- Đăng xuất/đổi tài khoản: dọn dữ liệu riêng, xử lý bản nháp theo tài khoản và cập nhật liên kết thiết bị push.
- Kiểm thử bàn phím, safe area, cỡ chữ, screen reader, từ chối quyền ảnh/camera/thông báo và khôi phục khi gián đoạn.
- Kiểm tra quyền cuối cùng ở backend; ẩn nút không đủ bảo vệ dữ liệu.
