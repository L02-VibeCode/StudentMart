---
name: frontend-design
description: Thiết kế và triển khai màn hình, component, form, điều hướng và luồng mua bán/trao đổi của app mobile StudentMart bằng React Native và Expo; dùng khi xây hoặc review giao diện mobile.
---

# StudentMart mobile design

Đọc `.codex/project-context.md` trước khi thiết kế; mở feature và dependency hiện có. Sản phẩm phục vụ sinh viên mua bán đồ cũ, tìm mua và trao đổi trong Làng Đại học ĐHQG TP.HCM. Frontend là app React Native/Expo, backend là API NestJS.

## Thiết kế theo ngữ cảnh

Ưu tiên thiết kế/reference người dùng cung cấp, ngôn ngữ giao diện hiện có và tính nhất quán giữa màn hình. Nếu chưa có hệ thống thiết kế, chọn bảng màu, typography, khoảng cách và component nhất quán với môi trường sinh viên; không tự thay thương hiệu trên mỗi lần sửa.

- Tin đăng cần phân biệt Bán/Tìm mua/Trao đổi, giá hoặc ngân sách, khu vực, tình trạng và ảnh theo loại. Không hiển thị thiếu giá như 0 đồng.
- Hành động chính hướng đến đăng tin, tìm tin hoặc liên hệ chủ tin.
- Làm rõ trạng thái đã hoàn tất/đã đóng/bị gỡ theo nghiệp vụ.
- Nhãn email trường giải thích đúng giới hạn; chưa xác thực vẫn dùng các chức năng được phép.
- Chỉ bổ sung luồng trong yêu cầu; giao dịch và thanh toán diễn ra ngoài ứng dụng.

## Triển khai native

Dùng React Native primitives như View, Text, Pressable, TextInput, FlatList và StyleSheet. Kiểm tra package trước khi chọn UI kit/router/font/animation; dùng Expo-compatible dependencies qua pnpm. Không giả định CSS, DOM, hover, web dashboard hoặc thư viện web hoạt động trong native.

Giữ entrypoint `mobile/index.ts`. Feature theo presentation/business/data, Screen → ViewModel hook → service → repository. Kiểm tra source để tận dụng component/theme đã có.

- Bố trí theo màn hình nhỏ, safe area, keyboard và kích thước thiết bị.
- Chữ tiếng Việt đủ dấu, giá tiền dễ đọc, hỗ trợ font scaling, contrast và nhãn accessibility.
- Nút/chạm đủ lớn, feedback rõ; trạng thái loading, empty, lỗi, offline và permission đều có hướng xử lý.
- Giữ nội dung đang soạn khi lỗi; chỉ báo thành công sau xác nhận backend.
- Dùng list virtualization và ảnh kích thước phù hợp cho feed dài.
- Animation chỉ hỗ trợ thao tác và tôn trọng reduced motion; không tự thêm hiệu ứng nặng.
- System fonts là lựa chọn hợp lệ; custom font cần hỗ trợ tiếng Việt và tải đúng cách.

## Xác minh

Chạy typecheck và kiểm tra phù hợp với thay đổi. Với dependency/native config, dùng Expo dependency check/Doctor và export Android/iOS. Kiểm thử trên thiết bị hoặc simulator khi có; ghi rõ export bundle chưa xác nhận UI/keyboard/push trên thiết bị thật.

## Nhận công việc từ ticket

Khi được giao #ticketid hoặc sub-ticket, đọc ../ticket-delivery/SKILL.md và root AGENTS.md để khám phá quan hệ, phân công và bàn giao. Agent con chỉ xử lý ownership được giao trên nhánh chung; báo AC/test/giới hạn cho root, không tự tạo PR/merge hoặc đổi trạng thái ngoài phân công. Skill này vẫn chịu trách nhiệm chuyên môn nêu trên.

