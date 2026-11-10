# StudentMart — Quy tắc nghiệp vụ cho triển khai

Bản tóm tắt từ [MVP Scope](../../../StudentMart.wiki/MVP-Scope-and-Prioritization.md), [User Stories](../../../StudentMart.wiki/User-Stories.md), [Critical User Flows](../../../StudentMart.wiki/Critical-User-Flows.md) và [Product Decisions](../../../StudentMart.wiki/Product-Decisions.md). Khi thay đổi sản phẩm, đối chiếu nguồn gốc; không coi bản này là một quyết định mới.

## Tài khoản và tín hiệu xác thực — R01, R09; US01, US09; UF03

- Một tài khoản có thể vừa mua, bán, đăng tìm mua và trao đổi; không tách role buyer/seller cố định. Admin là quyền xử lý vận hành.
- Đăng tin, liên hệ, báo cáo và chặn cần đăng nhập; quyền thực tế được backend kiểm tra. Phiên hết hạn cần đăng nhập lại trước thao tác riêng tư.
- Chưa verify email trường vẫn đăng tin và chat nếu có quyền. Tính năng verify phải được triển khai trong MVP, chỉ việc sử dụng là tùy chọn.
- Chỉ miền được hỗ trợ và OTP đúng/còn hạn mới được cấp nhãn. Sai/hết hạn/vượt giới hạn thử hoặc gửi lại cần phản hồi rõ; yêu cầu gửi OTP được tiếp nhận không chứng minh email đã đến.
- Đổi email xác thực thu hồi nhãn đến khi email mới được xác thực.
- Nhãn chỉ xác nhận quyền truy cập email trường được hỗ trợ tại thời điểm xác thực; không bảo đảm danh tính sinh viên hiện tại, trung thực, chất lượng hàng hay giao dịch an toàn.
- Trường tự khai và trạng thái email đã xác thực phải phân biệt. Hồ sơ công khai không lộ email trường hoặc địa chỉ riêng.
- Đăng xuất/đổi tài khoản phải ngăn truy cập dữ liệu riêng của phiên trước và cập nhật liên kết nhận push.

## Tin đăng — R02–R04, R08, R12; US02–US04, US08, US12; UF02

Thông tin chung gồm tiêu đề/nhu cầu, danh mục, mô tả và khu vực trong danh sách hỗ trợ tại Làng Đại học ĐHQG TP.HCM. Khu vực chọn thủ công, không bắt GPS.

| Loại | Dữ liệu riêng | Hoàn tất do chủ tin cập nhật |
|---|---|---|
| Bán | Ảnh món đồ, tình trạng, giá bán; cho mô tả lỗi/khuyết điểm | Đã bán |
| Tìm mua | Món cần tìm, yêu cầu; ngân sách nếu có; ảnh tham khảo không bắt buộc | Đã tìm được |
| Trao đổi | Ảnh, tình trạng/mô tả món đang có, món hoặc điều kiện muốn đổi | Đã trao đổi |

- Dùng chung tin đăng, tìm kiếm và chat. Khoản bù thêm khi trao đổi thỏa thuận trong chat; không có đơn hàng hay ghép cặp tự động.
- Chỉ chủ tin sửa/kết thúc tin của mình theo quyền hiện tại; admin xử lý qua quyền riêng.
- Xác nhận trước khi đóng/gỡ/hoàn tất. Nếu cập nhật lỗi, giữ trạng thái đã được server xác nhận trước đó.
- Phân biệt hoàn tất nhu cầu, đóng do ngừng giao dịch, chủ tin gỡ và quản trị gỡ. Chủ tin không tự khôi phục tin bị quản trị gỡ.
- Tin hoàn tất/đóng/bị gỡ ra khỏi danh sách đang mở và không tạo hội thoại mới.
- Kết quả hoàn tất là tự báo cáo, không được nền tảng xác minh. Đóng/gỡ không tính là giao dịch hoàn tất.
- Lưu bản nháp biểu mẫu tin trên thiết bị, cho tiếp tục hoặc chủ động xóa. Không xây đồng bộ offline nhiều thiết bị.
- Bán/Trao đổi thiếu ảnh cần bổ sung trong bản nháp; chọn ảnh sẵn khi không dùng camera. Ảnh tải lỗi có trạng thái và cách tải/chọn lại.
- Chỉ báo đăng thành công khi server xác nhận lưu. Timeout hoặc lỗi giữ nội dung; retry đối chiếu lần gửi cũ để không tạo tin trùng.

Các enum lưu trữ, quy tắc mở lại tin do chủ tin đóng, thời hạn tin, giới hạn ảnh và trạng thái xóa vật lý chưa được wiki chốt. Không tự thêm hành vi hoặc coi enum ví dụ là hợp đồng đã duyệt.

## Tìm kiếm và chi tiết — R05, R06; US05, US06; UF01a

- Duyệt và tìm từ khóa; kết hợp loại tin, danh mục, khu vực, giá/ngân sách khi áp dụng.
- Khi có lọc giá: chỉ nhận tin có giá bán/ngân sách nằm trong khoảng; loại tin thiếu giá/ngân sách.
- Khi bỏ lọc giá: tin thiếu giá/ngân sách được xuất hiện nếu thỏa điều kiện khác. Không hiển thị thông tin thiếu thành 0 hay “miễn phí”.
- Danh sách đang mở loại tin hoàn tất, đóng, gỡ. Chi tiết và nút liên hệ phản ánh trạng thái hiện tại, kể cả khi tin đổi trạng thái trong lúc người dùng đang xem.
- Phân biệt loading, không có kết quả và tải lỗi; lỗi cho thử lại, rỗng cho sửa/xóa bộ lọc, đăng tìm mua hoặc dừng.
- Chi tiết có dữ liệu theo loại, trạng thái, khu vực, hồ sơ chủ tin và giải thích nhãn verify.

## Hội thoại và tin nhắn — R07; US07; UF01b, UF02b, UF04

- Hội thoại riêng giữa hai người, gắn với một tin; chỉ văn bản, lịch sử và trạng thái chưa đọc.
- Không tự chat. Cùng cặp người dùng và cùng tin phải lấy lại hội thoại hiện có; request đồng thời không tạo hội thoại trùng.
- Tạo mới chỉ khi tin đang mở, các tài khoản còn quyền tương tác và không có quan hệ chặn.
- Quyền xem và quyền gửi phải kiểm tra riêng; kiểm tra lại quyền gửi tại thời điểm gửi.
- Chủ tin hoàn tất/đóng không tự kết thúc hội thoại cũ: tiếp tục nếu còn quyền và không bị chặn.
- Với tin quản trị gỡ/tài khoản hạn chế, kiểm tra theo quyền và quyết định hiện tại; không mặc định được gửi hay được xem mọi lịch sử.
- Có quan hệ chặn thì không phát sinh tin nhắn/push mới trái quyền; lịch sử được giữ theo quyền truy cập.
- Thể hiện đang gửi/đã gửi/gửi lỗi hoặc chưa xác nhận. “Đã gửi” chỉ là server đã lưu, không suy ra đã đọc, đã phản hồi hay giao dịch.
- Giữ nội dung khi chưa nhận xác nhận; retry cùng tin nhắn không nhân bản. Cần thiết kế cơ chế duy nhất/idempotency bền vững để đạt yêu cầu này.

## Push và tiếp tục hội thoại — R13; US13; UF04

- Push tin nhắn thuộc bản MVP đầu tiên; từ chối quyền/không nhận được push vẫn có hộp thư, unread và khả năng trả lời.
- Server lưu tin nhắn trước khi phát sinh yêu cầu gửi push. Lỗi push không làm mất tin nhắn.
- Chỉ gửi cho người nhận hiện có quyền, thiết bị đúng liên kết và điều kiện hệ điều hành/kết nối cho phép.
- Nội dung màn hình khóa dùng câu chung như “Bạn có tin nhắn mới”; không chứa nội dung trao đổi hoặc thông tin nhạy cảm.
- Chạm thông báo: kiểm tra phiên, đăng nhập nếu cần, rồi kiểm tra quyền của tài khoản hiện tại trước khi tải/hiển thị nội dung riêng. Áp dụng cả thông báo cũ.
- Không có quyền thì không mở nội dung; hội thoại không còn truy cập được có thông báo và lối về hộp thư.
- Đang xem đúng hội thoại thì cập nhật tin mới trực tiếp, tránh thêm thông báo trùng gây nhiễu.
- Đăng xuất/đổi tài khoản cập nhật liên kết thiết bị; không gửi push mới của tài khoản trước sang phiên hiện tại.
- Chặn/hạn chế ngăn tin nhắn và push mới trái quyền. Khi gửi lại push phải xét quyền hiện tại.
- Kiểm thử push trên thiết bị thật trong TASK-17/TASK-24; không hứa bảo đảm giao mọi push.

## Báo cáo, chặn và quản trị — R10, R11; US10, US11; UF05

- Người dùng đăng nhập được báo cáo tin/tài khoản với lý do, mô tả bổ sung; lỗi giữ nội dung để thử lại.
- Báo cáo thành công chỉ xác nhận tiếp nhận. Không tự kết luận vi phạm hoặc tự phạt vì có báo cáo.
- Báo cáo và chặn là hai hành động độc lập; không bắt buộc báo cáo để chặn.
- Chặn ngăn liên hệ/tin nhắn/push mới; không tự xóa lịch sử. Chỉ báo đã chặn khi cập nhật được xác nhận.
- Admin có quyền mới xem báo cáo và nội dung liên quan trong phạm vi được phép.
- Chưa đủ căn cứ thì ghi nhận và giữ chờ; đủ căn cứ thì không vi phạm/gỡ tin/hạn chế tài khoản theo quyết định.
- Lưu người xử lý, thời điểm, lý do và kết quả; áp dụng nhất quán ở danh sách, chi tiết, chat, push. Không tự trao admin quyền xem toàn bộ hội thoại.

## Đo lường và pilot — TASK-25, TASK-08, TASK-09

Theo [Business Canvas](../../../StudentMart.wiki/Business-Canvas.md), đo tối thiểu đăng tin, tìm/xem, bắt đầu liên hệ, đóng tin, kết hợp nhật ký pilot. Tách tin nhắn đã lưu, phản hồi, cuộc hẹn, hoàn tất tự báo cáo và đóng/gỡ.

Loại tin thử/spam theo quy tắc ghi nhận; không ghi nội dung chat, OTP, token hoặc email cá nhân vào telemetry. Các tên event/schema cụ thể là phần cần thiết kế, chưa tồn tại trong wiki.

Pilot một cụm trường/KTX/khu trọ; dùng người và tin thật có sự đồng ý. Ưu tiên công nghệ/phụ kiện và gia dụng, vẫn giữ sách/giáo trình. Đánh giá hoàn thành nhu cầu và quay lại khi có nhu cầu mới; không mặc định mở app hằng ngày là thành công.

## Giới hạn chưa được phép tự mở rộng

Không xây đơn hàng/thanh toán/escrow/logistics, theo dõi GPS, ghép trao đổi tự động/nhiều bên, chat nhóm/gọi/tệp, hẹn giờ hoặc giữ hàng, Rating/Review/điểm uy tín, AI, yêu thích/chia sẻ, quảng cáo/đẩy tin/gói phí, dashboard nâng cao hoặc mở ngoài địa bàn.
