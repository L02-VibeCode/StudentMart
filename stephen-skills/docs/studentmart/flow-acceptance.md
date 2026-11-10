# StudentMart — Ma trận ca nghiệm thu theo luồng

Nguồn: [User Stories](../../../StudentMart.wiki/User-Stories.md), [Critical User Flows](../../../StudentMart.wiki/Critical-User-Flows.md), [MVP readiness](../../../StudentMart.wiki/MVP-Scope-and-Prioritization.md). Đây là danh sách ca cần kiểm tra, không phải báo cáo các ca đã đạt.

Chọn ca phù hợp thay đổi; TASK-24 cần kiểm tra toàn bộ phạm vi. Ghi tiền điều kiện, bước, kết quả mong đợi/thực tế, thiết bị/môi trường, R/US/UF/TASK, bằng chứng và lỗi còn lại. Không thay tiêu chí thành “đã có file test”.

## Ma trận

| Nhánh / truy vết | Ca thành công | Ca lỗi, quyền, gián đoạn |
|---|---|---|
| UF01a; R05–R06/US05–US06; TASK-05/06/07/15 | Tìm từ khóa + kết hợp loại/danh mục/khu vực; xem đúng chi tiết/hồ sơ | Không kết quả khác lỗi tải; retry; xóa/sửa bộ lọc hoặc đăng tìm mua; không hiện tin kết thúc/gỡ trong danh sách mở; tin đổi trạng thái trong lúc xem |
| UF01a lọc giá; R05/US05; TASK-05 | Có filter chỉ nhận giá/ngân sách trong khoảng | Tin thiếu giá bị loại khi lọc; bỏ lọc thì có thể xuất hiện; không gán 0/miễn phí; kiểm tra biên theo contract đã chốt |
| UF01b; R01/R07, US01/US07; TASK-16/06/21 | Đăng nhập rồi tạo/lấy đúng hội thoại và gửi văn bản; người chưa verify vẫn liên hệ được | Sai/hết phiên; tự chat; tài khoản không có quyền; chặn theo cả hai hướng; hai request mở chat đồng thời vẫn một hội thoại |
| UF01b retry; R07/US07; TASK-06/23 | Chỉ chuyển đã gửi sau server lưu; unread/lịch sử đúng tài khoản | Mất xác nhận sau khi đã lưu rồi gửi lại vẫn một tin; gửi lỗi giữ nội dung; đã gửi không đồng nghĩa đã đọc/phản hồi/giao dịch |
| UF02a; R02–R04/R12, US02–US04/US12; TASK-03/04/23 | Tạo cả Bán/Tìm mua/Trao đổi với trường riêng; thành công sau xác nhận server | Thiếu ảnh Bán/Trao đổi; Tìm mua được thiếu ảnh/ngân sách; khu vực ngoài danh sách; từ chối camera vẫn chọn ảnh; tải ảnh lỗi/thử lại |
| UF02a bản nháp; R12/US12; TASK-23/04 | Rời form/gián đoạn rồi khôi phục bản nháp trên thiết bị; cho xóa | Mất mạng/phiên hết hạn giữ nội dung; request đã lưu nhưng timeout rồi retry không trùng; bản nháp khác tin công khai; đổi tài khoản không lộ dữ liệu riêng |
| UF02b; R08/US08; TASK-04/07 | Chủ tin sửa; hoàn tất theo loại hoặc đóng/gỡ sau xác nhận | Người khác không sửa; lỗi cập nhật giữ trạng thái cũ; đóng/gỡ không tăng hoàn tất; admin gỡ không cho chủ tự khôi phục |
| UF02b → UF01b; R07–R08/US07–US08; TASK-06/07 | Hội thoại cũ tiếp tục sau chủ tin hoàn tất/đóng nếu còn quyền | Không tạo chat mới từ tin kết thúc/gỡ; race đóng tin và mở chat mới; chặn/hạn chế khi đang chat phải áp dụng lại quyền; lịch sử không tự xóa |
| UF03; R09/US09; TASK-15/17/18 | OTP hợp lệ/đúng miền cấp nhãn; bỏ qua verify vẫn đăng/chat | Sai/hết hạn, giới hạn thử/gửi lại, miền chưa hỗ trợ; đổi email mất nhãn; không lộ email; thông báo tiếp nhận gửi không hứa đã đến inbox; nội dung nhãn đúng giới hạn |
| UF04 lưu/gửi push; R07/R13, US07/US13; TASK-17/19/20 | Tin lưu trước yêu cầu push; đúng người/thiết bị; nội dung khóa màn hình chung | Nhà cung cấp lỗi không mất tin; token không hợp lệ; chặn/hạn chế trước khi worker gửi; không lộ nội dung chat; không tuyên bố bảo đảm giao push |
| UF04 mở thông báo; R01/R13, US01/US13; TASK-16/21 | Chạm mở đúng hội thoại sau kiểm tra phiên/quyền | App đóng/nền/mở; chưa đăng nhập; thông báo cũ; đổi sang tài khoản khác; bị thu quyền; hội thoại không truy cập được thì báo phù hợp và về hộp thư |
| UF04 không dùng push; R13/US13; TASK-19/21 | Từ chối quyền vẫn thấy unread và trả lời trong hộp thư | Đang mở đúng hội thoại không tạo thông báo trùng; mất push không trình bày mất tin; đăng xuất/đổi tài khoản cập nhật thiết bị, không lộ chat của phiên trước |
| UF05a; R10/US10; TASK-22 | Báo cáo tin/tài khoản; chặn độc lập; có xác nhận lưu | Chưa đăng nhập; gửi lỗi giữ nội dung; report không tự phạt; chặn ngăn tin/push mới, vẫn giữ lịch sử theo quyền |
| UF05b; R11/US11; TASK-22 | Admin xem đúng phạm vi; chưa đủ căn cứ giữ chờ; không vi phạm/gỡ/hạn chế lưu actor/thời điểm/lý do | Người không có quyền bị từ chối; lưu lỗi không báo thành công; quyết định tác động nhất quán tìm/chi tiết/chat/push; không cấp admin quyền đọc mọi chat mặc định |
| Đo lường; TASK-25, TASK-08/09 | Đối chiếu đăng/tìm/xem/liên hệ/kết thúc với nhật ký pilot | Tách sent/phản hồi/hẹn/hoàn tất tự báo cáo/đóng/gỡ; loại thử/spam theo quy ước; không chứa nội dung riêng; không suy thành công từ số tải hoặc số Issue đóng |

## Chọn mức kiểm tra

- Unit: validation theo loại tin, lọc giá thiếu dữ liệu, quy tắc trạng thái/quyền và ánh xạ nhãn.
- Tích hợp API với PostgreSQL thật: ownership/membership/admin, ràng buộc duy nhất và request đồng thời, transaction, retry/idempotency, cập nhật trạng thái, unread, audit quản trị. Dùng DB kiểm thử tách biệt và công cụ đã chọn; không mặc định SQL Server hoặc framework test cũ.
- Mobile: biểu mẫu và lỗi, bàn phím/safe area/cỡ chữ, điều hướng, khôi phục nội dung, đổi tài khoản, quyền ảnh/camera/thông báo.
- OTP/push: fake nhà cung cấp để kiểm tra lỗi lặp lại được; xác nhận tích hợp và push trên thiết bị thật trong TASK-17/TASK-24. Ghi hệ điều hành, bản cài, trạng thái app và quyền. Mock/simulator không thay bằng chứng thiết bị thật.
- Không vô hiệu hóa vĩnh viễn test vì thiếu Docker/thiết bị. Báo chưa chạy và phụ thuộc cụ thể; không đánh dấu nghiệm thu đã đạt.

## Điều kiện pilot

MVP có bản cài đặt thử, hoàn thành chuỗi đăng → tìm → chi tiết → chat → cập nhật trạng thái; cả ba loại tin, verify tùy chọn, push bản đầu, báo cáo/chặn/admin, bản nháp/phục hồi và đo lường đều trong phạm vi nghiệm thu.

Người chưa verify và người từ chối push vẫn thực hiện luồng chính. Không có lỗi chặn luồng hoặc truy cập trái quyền còn chưa xử lý. Có bằng chứng OTP sai/hết hạn không cấp nhãn, retry không nhân bản, đổi tài khoản không lộ dữ liệu và push đúng điều kiện trên thiết bị thật. Sẵn sàng kỹ thuật không đồng nghĩa đã kiểm chứng giá trị sản phẩm.
