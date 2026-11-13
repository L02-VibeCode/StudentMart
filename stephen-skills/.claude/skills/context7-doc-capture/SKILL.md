---
name: context7-doc-capture
description: "Tra tài liệu chính thức theo phiên bản thư viện của StudentMart, dùng Context7 khi có sẵn và lưu ghi chú kỹ thuật sau khi kiểm chứng thực tế."
---

# Tra và lưu tài liệu kỹ thuật StudentMart

## Khi áp dụng

Dùng khi một nhiệm vụ cần biết hành vi API/thư viện của React Native, Expo, Node.js, PostgreSQL hoặc dependency thực sự được chọn. Quy tắc sản phẩm phải lấy từ wiki, không lấy từ tài liệu thư viện.

## Tra cứu

1. Xác định phiên bản trong manifest/lockfile và môi trường chạy. Nếu chưa khởi tạo mã, tách lựa chọn dự kiến khỏi dependency đã cài.
2. Tìm ghi chú phù hợp ở `docs/lib/<library>/` tính từ gốc bộ hướng dẫn hoặc tài liệu kỹ thuật của repository đã cài bộ.
3. Kiểm tra ghi chú có đúng StudentMart, stack, phiên bản và ngữ cảnh không. Ghi chú SQL Server/CMS kế thừa không áp dụng cho PostgreSQL/Node.js.
4. Khi thiếu hoặc có khả năng thay đổi, dùng Context7 nếu tool đã có trong phiên: tìm library id rồi truy vấn nội dung hẹp theo task. Không mặc định CLI `ctx7` tồn tại.
5. Nếu không có Context7, dùng công cụ duyệt web được cung cấp để đọc tài liệu chính thức. Nếu không thể truy cập, nêu giới hạn và phần chưa xác minh; vẫn hoàn tất phần độc lập.
6. Đối với Expo/push, kiểm tra giới hạn theo SDK, thiết bị thật, hệ điều hành và loại bản cài hiện tại. Không suy từ tài liệu web React sang React Native.

## Áp dụng và lưu ghi chú

Áp dụng vào công việc được giao, kiểm tra bằng script/test hoặc thiết bị phù hợp thực tế. Chỉ lưu ghi chú tái sử dụng khi đã xác nhận cách dùng; chưa kiểm chứng thì ghi rõ trạng thái và không gọi là pattern của dự án.

Khi cần lưu, tạo/cập nhật `docs/lib/<library>/<topic>.md` có:
- Ngữ cảnh StudentMart, dependency/phiên bản, nền tảng và ngày đối chiếu.
- URL nguồn chính thức hoặc library id + mục tài liệu đã dùng.
- Đoạn sử dụng tối thiểu và vấn đề cụ thể đã giải quyết.
- Kết quả kiểm chứng, điều kiện/giới hạn, phần chưa thử.

Không sao chép manual dài, lưu secret/token/dữ liệu riêng hoặc biến sở thích ví dụ thành quy tắc chung. Không lưu khẳng định “push hoạt động” chỉ vì ví dụ biên dịch.
