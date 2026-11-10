# StudentMart — Hướng dẫn chung cho agent

## Phạm vi và cách tìm tài liệu

Bộ này phục vụ StudentMart, ứng dụng mobile C2C cho sinh viên trong Làng Đại học ĐHQG TP.HCM. Một tài khoản có thể đăng Bán, Tìm mua, Trao đổi và liên hệ người khác; quản trị viên là quyền vận hành riêng.

Khi bộ còn nằm trong `stephen-skills/`, các đường dẫn cấu hình và `docs/` dưới đây tính từ thư mục này; `mobile/`, `backend/`, `README.md` sản phẩm và `StudentMart.wiki/` tính từ repository root ở cấp cha. Nếu bộ được cài vào root, hai gốc trùng nhau. Không tạo mã ứng dụng bên trong `stephen-skills/`.

Trước công việc nghiệp vụ, đọc [quy tắc nghiệp vụ](docs/studentmart/business-rules.md), sau đó chỉ đọc các trang wiki và ca nghiệm thu liên quan trong [bản đồ nguồn](docs/studentmart/source-map.md). Đối với sửa cấu hình hoặc tài liệu thuần túy, chỉ tải phần cần thiết.

## Nguồn và trạng thái

- Wiki địa phương `StudentMart.wiki/` là căn cứ sản phẩm: `MVP-Scope-and-Prioritization.md`, `Product-Decisions.md`, `User-Stories.md`, `Critical-User-Flows.md`, `Traceability.md`.
- `README.md` tại repository root mô tả stack và cấu trúc dự kiến. Kiểm tra filesystem, manifest và lockfile trước khi khẳng định mã hoặc lệnh đã tồn tại.
- `docs/studentmart/` là bản tóm tắt phục vụ agent, không thay thế wiki. Nếu nguồn mâu thuẫn, nêu chính xác điểm lệch; không tự sửa chính sách sản phẩm để hợp mã.
- Dự án đã có khung thư mục `mobile/` và `backend/` theo Three-Layer; chưa có manifest, app chạy được hoặc migration thực thi. `.gitkeep` giữ khung theo yêu cầu tạo cấu trúc của người dùng; không phải feature đã triển khai.
- Các design/spec/test/library note CMS cũ trong `docs/` là lịch sử, không phải thiết kế hoặc tiến độ StudentMart. Chỉ dùng tài liệu kỹ thuật đã được xác nhận cho StudentMart.
- GitHub Issues/Projects là nơi theo dõi Assignee và trạng thái thực tế. Không suy ra Done từ một đường link Issue, checklist cũ hoặc việc đóng Issue vì hủy/trùng.

## Công nghệ và tổ chức dự kiến

| Thành phần | Đã lựa chọn | Chưa chốt |
|---|---|---|
| Mobile | React Native + Expo | Phiên bản, thư viện UI/state/form, điều hướng, hệ điều hành phát hành |
| Backend | Node.js; một ứng dụng chia module | Framework, thư viện xác thực, giao thức cập nhật chat |
| Dữ liệu | PostgreSQL | ORM, công cụ migration, schema chi tiết |
| Tích hợp | Ảnh, email OTP, push tin nhắn | Nhà cung cấp, cấu hình và cách triển khai |
| Ngôn ngữ | TypeScript là phương án dự kiến | Xác nhận bằng mã/manifest khi khởi tạo |

Cấu trúc dự kiến: `mobile/src/features/{auth,listings,chat,notifications,profile,moderation}/`, `backend/src/modules/{auth,users,listings,chat,notifications,moderation}/`, `backend/database/{migrations,seeds}/`, `backend/tests/`. Điều hướng có thể dùng `mobile/src/app/` nếu chọn Expo Router. Không coi cấu trúc dự kiến là các file đã tồn tại.

**Kiến trúc đã chọn cho đồ án:** Three-Layer theo feature/module, với ba thư mục `presentation/`, `business/`, `data/`. Mobile dùng MVVM nhẹ: Screen → hook ViewModel → Business Service → Repository; backend dùng Controller → Service/Workflow → Repository. Data không import UI/Controller; business không phụ thuộc request/response của framework. Không bắt tạo interface/use-case/mapper cho mọi thao tác. Xem [cây thư mục và ranh giới tầng](../docs/solution_tree.md).

Khung theo yêu cầu đã được tạo; chỉ bổ sung file/thư mục khi task thực sự cần và bỏ `.gitkeep` khi đã có nội dung thật. Các file .ts/.tsx trong mẫu tài liệu vẫn là dự kiến.

Mỗi phần quản lý dependencies và một lockfile riêng. Dùng package manager, scripts và phiên bản thực tế trong manifest; không áp đặt lệnh build/test hoặc thư viện từ dự án khác. Nếu chưa có mã, hoàn tất phần thiết kế được giao và ghi rõ những gì chưa thể chạy.

## Các bất biến cần giữ

- StudentMart kết nối hai bên; việc hẹn gặp, kiểm tra hàng, giao nhận, thanh toán hoặc đổi đồ diễn ra ngoài app.
- Cả ba loại tin dùng chung đăng/tìm/chat. Bán và Trao đổi cần ảnh; Tìm mua không bắt buộc ảnh hay ngân sách.
- Đăng tin/liên hệ cần đăng nhập và có quyền; verify email trường là tùy chọn của người dùng nhưng chức năng verify vẫn phải có trong MVP.
- Nhãn verify chỉ xác nhận quyền truy cập email trường được hỗ trợ tại thời điểm xác thực; không chứng nhận sinh viên hiện tại, uy tín hoặc chất lượng hàng.
- Push tin nhắn thuộc MVP đầu tiên; người dùng được từ chối quyền và vẫn dùng hộp thư/chat.
- Khu vực chọn thủ công từ danh sách hỗ trợ; không bắt buộc GPS, không công khai email trường hoặc địa chỉ riêng.
- Tin hoàn tất, đóng, gỡ phải phân biệt. Hoàn tất hiển thị Đã bán/Đã tìm được/Đã trao đổi theo loại; đóng/gỡ không tính là giao dịch hoàn tất.
- Chỉ tạo hội thoại mới từ tin đang mở; không tự chat; dùng lại hội thoại duy nhất cho cặp người và tin. Hội thoại cũ có thể tiếp tục sau khi chủ tin hoàn tất/đóng nếu còn quyền và không bị chặn.
- Backend kiểm tra quyền sở hữu/thành viên/quản trị và quan hệ chặn tại thao tác thực tế. Tin bị quản trị gỡ không cho chủ tin tự khôi phục.
- Chỉ báo đăng tin/gửi tin nhắn thành công sau xác nhận lưu từ server. Giữ nội dung khi chưa rõ kết quả và thử lại an toàn, không tạo bản sao ngoài ý muốn.
- Lọc giá loại tin thiếu giá/ngân sách; bỏ lọc giá có thể thấy lại tin đó. Thiếu giá không phải 0 hay miễn phí.
- Push phát sinh sau khi lưu tin nhắn, dùng nội dung chung; mở cả thông báo cũ cũng phải kiểm tra phiên/quyền hiện tại. Đăng xuất/đổi tài khoản cập nhật liên kết thiết bị và dọn dữ liệu riêng của phiên trước.
- Báo cáo và chặn độc lập. Báo cáo không tự kết luận vi phạm; xử lý quản trị lưu người xử lý, thời điểm và lý do.

Chi tiết quyền, ngoại lệ và các nhánh lỗi nằm trong [business-rules.md](docs/studentmart/business-rules.md) và [flow-acceptance.md](docs/studentmart/flow-acceptance.md).

## Giới hạn MVP

Không tự thêm giỏ hàng, đơn hàng, thanh toán/giữ tiền, shipper, GPS thời gian thực, ghép trao đổi tự động/nhiều bên, gọi/video/tệp/chat nhóm, hệ thống đặt lịch/giữ hàng, Rating/Review/điểm uy tín, AI recommendation, yêu thích/chia sẻ, quảng cáo/đẩy tin trả phí, dashboard phân tích nâng cao hoặc mở rộng địa bàn.

Bản nháp chỉ dành cho biểu mẫu tin trên thiết bị; không mở rộng thành đồng bộ offline nhiều thiết bị. Admin chỉ đủ xem và xử lý báo cáo. Thay đổi phạm vi theo yêu cầu mới cần nêu ảnh hưởng và đồng bộ tài liệu liên quan.

## Cách làm việc và bàn giao

- Giữ mã truy vết hiện có: `A1–A5`, `D01–D07`, `UN01–UN13`, `R01–R13`, `US01–US13`, `UF01–UF05` cùng các nhánh, `TASK-01–TASK-25`. US là User Story, không tạo bộ Use Case thay thế.
- Với thay đổi chức năng, nêu R/US, nhánh UF, TASK, tiêu chí chấp nhận, phần đã làm và bằng chứng kiểm tra; không bắt mọi việc nghiên cứu/hạ tầng thành User Story.
- M1: nghiên cứu/nền tảng; M2: thiết kế/triển khai/nghiệm thu; M3: pilot/điều chỉnh. TASK-17 cần thử OTP/push sớm trên thiết bị thật; TASK-25 đo lường thuộc M2; TASK-08 có thể chuẩn bị từ M2.
- Định nghĩa vai trò agent hỗ trợ chọn chuyên môn, không bắt buộc gọi đủ agent hay tự động chạy song song. Chỉ ủy nhiệm khi người dùng hoặc chính sách phiên hiện tại cho phép.
- Workflow cộng tác: Issue → Branch → PR → Review → Merge; trạng thái Backlog → To Do → In Progress → Review → Done. Không tự gửi thông điệp, sửa Issue/Project, merge hoặc phát hành nếu ngoài phạm vi được giao.
- Chạy kiểm tra phù hợp với thay đổi và công cụ hiện có. Phân biệt đã chạy/đạt/lỗi/chưa chạy; không dùng mock hay simulator để tuyên bố push đã đạt trên thiết bị thật.
- Không hardcode danh tính hoặc dùng bypass đăng nhập như cách hoàn thiện phân quyền. Không commit secret, OTP, push token, email cá nhân hay dữ liệu nghiên cứu nhận dạng; log/đo lường không chứa nội dung chat.
- Chỉ cập nhật kế hoạch/progress khi có tiến độ hoặc quyết định cần lưu; đây là ghi chú cục bộ, không thay thế trạng thái GitHub. Không tạo thủ tục PM/tech lead cho mọi sửa nhỏ.
