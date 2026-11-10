---
name: frontend-design
description: "Thiết kế và triển khai màn hình, biểu mẫu và tương tác mobile StudentMart bằng React Native + Expo theo các luồng MVP và trạng thái lỗi/quyền."
---

# Thiết kế mobile StudentMart

Skill phục vụ mobile StudentMart. Không tự chuyển nhiệm vụ sang website/SPA hoặc xây dashboard quản trị đầy đủ.

## Trước thiết kế

Đọc AGENTS.md của bộ hướng dẫn, [quy tắc nghiệp vụ](../../../docs/studentmart/business-rules.md) và nguồn R/US/UF tương ứng trong [bản đồ nguồn](../../../docs/studentmart/source-map.md). Kiểm tra `mobile/`, manifest, theme, navigation và components ở repository root; nếu chưa có mã, chỉ tạo thiết kế hoặc khởi tạo theo đúng phạm vi được giao.

React Native + Expo là stack dự kiến. Dùng thư viện và phiên bản thực tế; không mặc định Expo Router, UI kit, state manager hoặc thư viện form đã được chọn.

## Thiết kế cho nhu cầu sinh viên

- Ưu tiên đọc ảnh/thông tin món đồ, giá hoặc ngân sách, khu vực thủ công, trạng thái tin và thao tác liên hệ. Bố cục rõ trên màn hình nhỏ, tiếng Việt có dấu đầy đủ.
- Theo theme/pattern hiện có. Khi thiết kế mới, chọn màu, typography, spacing nhất quán; không áp đặt font lạ, hiệu ứng dày hoặc thay theme từng màn hình. Font hệ thống phù hợp khi đọc tốt tiếng Việt.
- Dùng component React Native và hành vi cảm ứng; không đưa HTML, CSS hover hay cursor vào giao diện native.
- Tôn trọng safe area, bàn phím, screen reader, cỡ chữ lớn, độ tương phản và trạng thái không chỉ dùng màu. Nhãn/nút phải rõ nghĩa.
- Giữ màn hình danh sách hiệu quả với ảnh và dữ liệu dài; chỉ chọn giải pháp tối ưu khi thực tế cần. Không thêm thư viện animation hoặc design system ngoài phạm vi.

## Luồng phải thể hiện đúng

- UF01a: lọc từ khóa/loại/danh mục/khu vực/giá; loading khác rỗng khác lỗi. Filter giá loại tin thiếu giá/ngân sách; không hiển thị thiếu thành 0/miễn phí.
- UF01b: đăng nhập khi liên hệ, không tự chat, lấy lại hội thoại hiện có; trạng thái hiện tại và quyền gửi rõ ràng. Tin đóng/hoàn tất không tự vô hiệu hội thoại cũ còn quyền.
- UF02a: form theo Bán/Tìm mua/Trao đổi; ảnh bắt buộc Bán/Trao đổi, ảnh/ngân sách Tìm mua tùy chọn. Chọn ảnh sẵn khi không dùng camera; không bắt GPS.
- UF02a/US12: bản nháp cục bộ khi rời form/gián đoạn, ảnh tải lỗi có cách tiếp tục; phân biệt nháp và đã đăng.
- UF02b: xác nhận hành động kết thúc, nhãn Đã bán/Đã tìm được/Đã trao đổi; đóng/gỡ không diễn đạt là giao dịch thành công.
- UF03: verify có giải thích và bỏ qua; email không công khai, trường tự khai khác email đã xác thực.
- UF04: quyền nhận push có thể từ chối; hộp thư/unread vẫn hoạt động. Mở thông báo sau kiểm tra phiên/quyền hiện tại, kể cả thông báo cũ/khác tài khoản; không để nội dung riêng thoáng hiện trước kiểm tra.
- UF05: báo cáo và chặn riêng; phản hồi là đã tiếp nhận, chưa kết luận vi phạm.

## Xử lý dữ liệu và phiên

Chỉ hiển thị đăng/gửi thành công sau server xác nhận lưu. Giữ nội dung khi lỗi/chưa xác nhận, dùng lại định danh thao tác theo contract để retry không trùng. Phân biệt đang gửi/đã gửi/lỗi, không suy ra đã đọc.

Không để response tìm kiếm cũ ghi đè truy vấn mới; dùng cơ chế hủy hoặc bỏ response lỗi thời theo thư viện thực tế. Đăng xuất/đổi tài khoản phải dọn dữ liệu riêng, xử lý nháp theo tài khoản và cập nhật liên kết thiết bị push. Backend vẫn là nơi quyết định quyền.

## Kiểm tra và bàn giao

Chọn các ca liên quan trong [flow-acceptance.md](../../../docs/studentmart/flow-acceptance.md). Kiểm tra loading/rỗng/lỗi/permission, bàn phím/cỡ chữ, offline/retry, background/resume và đổi tài khoản. Push cần thiết bị thật; báo rõ chưa kiểm tra nếu chỉ có simulator/mock. Nêu màn hình/flow đã thay đổi và kết quả thực tế.
