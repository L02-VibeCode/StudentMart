---
name: studentmart-requirements
description: "Đối chiếu yêu cầu, quy tắc nghiệp vụ, luồng xử lý và truy vết StudentMart khi viết spec, thay đổi chức năng hoặc review phạm vi MVP."
---

# Yêu cầu StudentMart

## Đọc đúng nguồn

Xác định repository root chứa README sản phẩm và `StudentMart.wiki/`. Bộ hướng dẫn có thể đang nằm trong `stephen-skills/` hoặc đã cài vào root; mã ứng dụng luôn tính từ repository root.

Đọc [bản đồ nguồn](../../../docs/studentmart/source-map.md) và các mục liên quan trong [quy tắc nghiệp vụ](../../../docs/studentmart/business-rules.md), rồi đối chiếu đúng trang wiki:
- Scope/quyết định: `MVP-Scope-and-Prioritization.md`, `Product-Decisions.md`.
- Tiêu chí: `User-Stories.md`; nhánh xử lý: `Critical-User-Flows.md`.
- Mã/liên kết công việc: `Traceability.md`; phụ thuộc: `Project-Plan.md`.
- Căn cứ nghiên cứu: `Evidence-Evaluation.md` cùng nguồn khảo sát nếu nhiệm vụ cần bằng chứng.

Không nạp mọi trang cho một sửa nhỏ. Nếu bản local thiếu, dùng nguồn wiki chính thức được cung cấp khi môi trường cho phép; ghi rõ phần chưa đọc thay vì bịa nội dung.

## Phân tích thay đổi

1. Xác định mục tiêu người dùng, R/US hiện có, nhánh UF và TASK liên quan. Với nghiên cứu/hạ tầng, dùng mã giả định/quyết định/task phù hợp, không ép thành User Story.
2. Tách yêu cầu đã chốt, bằng chứng, giả định và đề xuất kỹ thuật. Framework/ORM/provider/API/schema chưa chốt không được viết thành sự thật đã triển khai.
3. Mô tả happy path cùng các nhánh lỗi, trạng thái tin, quyền xem/gửi, chặn/hạn chế, mất xác nhận và retry liên quan.
4. Đối chiếu tiêu chí wiki với [ca nghiệm thu](../../../docs/studentmart/flow-acceptance.md). Chỉ tạo/sửa thiết kế hoặc mã trong phạm vi người dùng yêu cầu.
5. Khi thay đổi scope, nêu tài liệu/quyết định/issue bị ảnh hưởng. Chỉ cập nhật hệ thống bên ngoài khi được giao; bản nháp đề xuất không tự thay tiến độ GitHub.

## Các điểm dễ sai

- Verify tùy chọn cho người dùng nhưng chức năng vẫn trong MVP; chưa verify vẫn đăng/chat sau đăng nhập.
- Push phải có ở MVP đầu; từ chối quyền vẫn có hộp thư.
- Hoàn tất/đóng tin không khóa hội thoại cũ hợp lệ; chỉ tin mở cho tạo chat mới.
- Thiếu giá/ngân sách không phải miễn phí; lọc giá phải loại dữ liệu thiếu.
- “Đã gửi” chỉ xác nhận server lưu; đóng/gỡ không phải hoàn tất giao dịch.
- Báo cáo không tự phạt; chặn không tự xóa lịch sử; thông báo cũ không chứng minh còn quyền xem.
- Giao dịch ngoài app; không thêm đơn hàng, thanh toán, giao vận, GPS, rating hay AI để “hoàn thiện marketplace”.

## Đầu ra

Cung cấp phần đã sửa/đề xuất cùng nguồn R/US/UF/TASK, tiêu chí có thể kiểm tra, phần chưa chốt và kết quả kiểm tra thực tế. Không khẳng định đã triển khai hoặc nghiệm thu chỉ vì có tài liệu.
