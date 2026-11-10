# StudentMart — Giải thích thuật ngữ và nghiệp vụ

**Ngày đối chiếu:** 07/11/2026. Giải thích theo Wiki và thiết kế local; ví dụ là dữ liệu minh họa. Tài liệu này không bổ sung yêu cầu hoặc chứng nhận tính năng đã hoạt động.

Nguồn chính: [User Stories](../StudentMart.wiki/User-Stories.md), [User Flows](../StudentMart.wiki/Critical-User-Flows.md), [schema](../docs/schema.md), [solution tree](../docs/solution_tree.md), [technical decisions](../docs/technical-decisions.md). Bắt đầu đọc bộ tài liệu tại [make-doc-plan.md](make-doc-plan.md).

## 1. Bản đồ thuật ngữ

| Nhóm | Thuật ngữ | Đọc để hiểu |
|---|---|---|
| Sản phẩm | C2C, MVP, pilot, ba loại tin, chủ tin | [Phạm vi](summary-assigment.md) |
| Niềm tin và quyền | Verify, trường tự khai, session, ownership, membership, block/restriction | [Luồng và quyền](user-flow.md) |
| Tin và chat | Owner/moderation state, NULL, ACK, retry, idempotency, unread | [Luồng](user-flow.md) và [schema](schema-database.md) |
| Kiến trúc | Three-Layer, MVVM, Controller/Service/Repository, workflow, bootstrap | [Kiến trúc](structure-architecture.md) |
| Dữ liệu và tích hợp | PK/FK/UQ, transaction, version, outbox, binding, lease, presence | [Schema](schema-database.md) và [stack](tech-stack.md) |
| Quản lý | R/US/UF/TASK/BL, AC, DoR/DoD, evidence | [Workflow](work-flow.md) |

## 2. Sản phẩm và phạm vi

| Thuật ngữ | Định nghĩa, vị trí và mục đích | Ví dụ | Cách hiểu cần tránh |
|---|---|---|---|
| C2C | Người dùng giao dịch với nhau; StudentMart hỗ trợ tin và liên hệ | A đăng bàn, B chat rồi tự gặp A | App là bên bán hoặc bảo lãnh giao dịch |
| MVP | Phạm vi tối thiểu để kiểm chứng chuỗi giá trị trong [scope](summary-assigment.md) | Ba loại tin dùng chung editor/search/chat | Có quyền bỏ verify/push vì gọi là “tối thiểu” |
| Pilot | Thử sản phẩm với người có nhu cầu và tin thật trong một cụm nhỏ | Tuyển người đang thanh lý trong một khu KTX được chọn | Dữ liệu seed hoặc demo kỹ thuật là nghiên cứu hành vi thật |
| Tin Bán / SALE | Mô tả món có sẵn, ảnh, tình trạng và giá | A bán bàn, sau đó tự đánh dấu Đã bán | Tạo Order/Payment trong app |
| Tin Tìm mua / WANTED | Công khai nhu cầu; ảnh tham khảo và ngân sách tùy chọn | B cần giáo trình, chưa khai ngân sách | Thiếu ảnh đồ sở hữu làm tin không hợp lệ |
| Tin Trao đổi / EXCHANGE | Có món đang sở hữu và điều kiện/món muốn đổi | A có bàn muốn đổi ghế, khoản bù nói trong chat | Có thuật toán matching hoặc trao đổi nhiều bên |
| Chủ tin | User sở hữu một listing; quyền xác định theo listing.owner_id | A là chủ L1 nhưng là người liên hệ trên L2 | A có role SELLER cố định ở mọi nơi |
| Hoàn tất tự báo cáo | Chủ tin cập nhật nhu cầu đã hoàn tất, nhãn theo loại | SALE + COMPLETED → Đã bán | Nền tảng đã xác minh thanh toán/giao hàng |

## 3. Xác thực, niềm tin và quyền

| Thuật ngữ | Định nghĩa, vị trí và mục đích | Ví dụ | Cách hiểu cần tránh |
|---|---|---|---|
| Verify email trường | Tín hiệu user đã có quyền truy cập miền được hỗ trợ tại thời điểm xác thực; nằm trong auth/profile | OTP đúng cấp nhãn, email không công khai | Bảo đảm đang là sinh viên, trung thực hoặc món hàng tốt |
| Trường tự khai | Giá trị user chọn ở hồ sơ, độc lập trường suy ra từ email verified | A chọn trường X nhưng chưa verify | Tự khai được hiển thị như đã xác thực |
| OTP / email_version | Mã dùng một lần gắn đúng chu kỳ email; version giúp loại mã của địa chỉ trước | Đổi email tăng version, thu hồi nhãn và mã cũ | OTP đúng số luôn hợp lệ dù hết hạn/đổi email |
| Session | Phiên backend xác nhận danh tính, hạn và thu hồi; tách khỏi nhãn trường | Logout thu hồi phiên, request private cũ bị từ chối | Chỉ xóa màn hình login là đã logout ở server |
| Ownership | Quyền của chủ đối tượng, kiểm tra tại backend | Chỉ owner được sửa listing của mình | Biết listing_id thì được sửa hoặc client tự gửi owner_id |
| Membership | Quan hệ user thuộc hội thoại, chưa đủ nếu quyền đã bị hạn chế | C1 có A/B; C có C2 trên cùng tin vẫn không đọc C1 | Cùng tin thì ai cũng đọc được mọi chat |
| Quyền đọc / quyền gửi | Hai phép kiểm tra riêng theo trạng thái hiện tại | Bị block có thể giữ lịch sử theo quyền nhưng không gửi mới | Đọc được thì luôn được gửi |
| Block | Quan hệ chặn có hướng, tác động tương tác xét hai hướng | A chặn B; B cũng không gửi tiếp cho A | Block tự xóa message hoặc tự tạo report |
| Restriction | Phạm vi hạn chế do quản trị, có nguồn quyết định và thời gian | deny_send ngăn phát sinh tương tác mới theo policy được duyệt | Mọi hạn chế đều xóa tài khoản/lịch sử; schema đã quyết định hình phạt |
| Public projection | Response chỉ gồm trường được phép công khai | Tên, avatar, thông tin trường phù hợp và nhãn | Serialize toàn bộ bảng users/verification cho client |

## 4. Tin đăng, trạng thái và lỗi mạng

| Thuật ngữ | Định nghĩa, vị trí và mục đích | Ví dụ | Cách hiểu cần tránh |
|---|---|---|---|
| owner_state | Đề xuất lưu trạng thái chủ tin: OPEN/COMPLETED/CLOSED/WITHDRAWN | Chủ tin ngừng bán → CLOSED | CLOSED và COMPLETED đều tăng số giao dịch hoàn tất |
| moderation_state | Lớp trạng thái quản trị độc lập: VISIBLE/REMOVED trong thiết kế | Admin gỡ tin đã COMPLETED vẫn giữ kết quả tự báo cáo | Ghi REMOVED đè mất lịch sử chủ tin |
| NULL | Dữ liệu chưa khai báo/không áp dụng theo trường | WANTED chưa có ngân sách; EXCHANGE không dùng amount | Giá 0 hoặc miễn phí |
| Local draft | Nội dung editor chưa công khai, lưu theo account trên thiết bị | App bị đóng, A mở lại tiếp tục nháp | Một hàng listings DRAFT hoặc bản nháp đồng bộ nhiều thiết bị |
| Media READY | Server đã xác nhận asset upload hợp lệ, đúng purpose/owner | Ảnh READY mới được gắn vào listing khi publish | Chọn ảnh hoặc cấp upload URL là đã lưu ảnh thành công |
| ACK | Xác nhận server đã commit thao tác | Gửi chat có message_id/seq mới hiển thị Đã gửi | Người nhận đã đọc hoặc giao dịch xong |
| UNCONFIRMED | Client chưa biết kết quả vì thiếu response; có thể server đã lưu | Mất mạng ngay sau server commit | Chắc chắn chưa lưu, nên tạo request key mới ngay |
| Retry | Thử lại thao tác sau lỗi hoặc thiếu xác nhận | Gửi lại cùng client_message_id | Luôn tạo thao tác mới với cùng nội dung |
| Idempotency | Nhận diện lại cùng thao tác để không lặp tác dụng; cần key, unique và đối chiếu payload | Publish key K trả lại listing L đã lưu | Disable nút bấm đã đủ chống trùng khi concurrent/restart |
| Payload hash | Dấu vết nội dung chuẩn hóa để phát hiện cùng key khác nội dung | K + body khác trả conflict | Hash tự cấp quyền hoặc thay được unique constraint |
| Version / optimistic concurrency | Phát hiện client đang sửa bản cũ bằng expected version | A sửa bản v2 nhưng server v3 → conflict/reload | Ghi đè v3 bằng response/request cũ |

Các enum trên thuộc phương án kỹ thuật trong [schema gốc](../docs/schema.md). Chính sách reopen, đổi loại sau publish và quyền chi tiết sau WITHDRAWN/REMOVED còn cần duyệt; không suy thêm transition từ tên enum.

## 5. Hội thoại và push

| Thuật ngữ | Định nghĩa, vị trí và mục đích | Ví dụ | Cách hiểu cần tránh |
|---|---|---|---|
| Conversation theo tin | Hội thoại hai người trong một listing; owner cố định, initiator khác owner | A/B được có C1 cho L1 và C2 cho L2 | Một chat duy nhất cho mọi tin hoặc được thêm người thứ ba |
| seq / read cursor | Thứ tự message trong conversation và mốc đã xem của từng participant | A xem tới 2; message 3 của B làm unread A tăng 1 | Lấy sequence toàn DB làm số unread hoặc đánh read trước khi hiển thị |
| PendingMessage | Nội dung/key/trạng thái gửi ở mobile để phục hồi và gộp với message server | Sau ACK, pending và history được reconcile thành một bubble | Mỗi lần sync thêm một bubble thứ hai |
| Outbox / notification_job | Công việc push bền vững lưu cùng transaction message trong PostgreSQL | Message và job cùng commit; provider lỗi thì job retry | Commit message rồi gọi provider là không thể mất sự kiện |
| Installation | Một lần cài app, dùng quản lý phiên và push | Cài lại app tạo installation mới | IMEI, vị trí GPS hoặc danh tính user cố định |
| Binding version | Phiên bản liên kết installation/session/user để vô hiệu liên kết cũ | Logout A rồi login B tăng version; job A không chuyển sang B | Đổi user của hàng subscription cũ là đủ |
| Push delivery | Một đích gửi logic theo job và installation; retry cập nhật cùng hàng | Job của A phát tới hai thiết bị hợp lệ của A | Một delivery chứng minh OS đã hiển thị hoặc user đã đọc |
| Lease | Quyền xử lý job có hạn để khôi phục sau worker chết | Hết lease thì worker khác có thể lấy lại | Lease thay được khóa unique hoặc bảo đảm external call đúng một lần |
| Presence | Gợi ý có hạn rằng user đang xem đúng conversation | Heartbeat hợp lệ giúp tránh thông báo trùng | Nguồn phân quyền, bảng bắt buộc hoặc lý do xóa message khỏi inbox |

## 6. Kiến trúc và dữ liệu

| Thuật ngữ | Định nghĩa, vị trí và mục đích | Ví dụ | Cách hiểu cần tránh |
|---|---|---|---|
| Three-Layer | Ba trách nhiệm Presentation → Business → Data trong từng app/feature | Controller → Service → Repository | Mobile, backend, PostgreSQL chính là ba thư mục tầng duy nhất |
| MVVM nhẹ | Screen render state, hook ViewModel quản lý state/action, service/repository cung cấp model | useListingEditorViewModel điều khiển editor | Hook tự giữ nháp khi app bị kill hoặc cần class ViewModel bắt buộc |
| Controller / Service / Repository | Biên HTTP / nghiệp vụ / đọc ghi dữ liệu ở backend | Controller lấy actor, service kiểm policy, repository dùng tx | Controller viết SQL hoặc repository trả HTTP response |
| Workflow | Điều phối use case cần nhiều module hoặc transaction chung | send-message phối hợp chat và notifications | Workflow luôn là một agent hoặc một process riêng |
| Bootstrap / composition root | Nơi ghép app, dependency và lifecycle | buildApp tạo Fastify; server.ts listen | Có `/health` nghĩa là auth/listing/chat đã hoạt động |
| PK / FK / UQ | Định danh hàng / liên kết hàng / duy nhất dữ liệu trong PostgreSQL | UQ(listing_id, initiator_id) chống conversation trùng | FK user tồn tại đã đủ xác nhận user được gửi trong conversation |
| Cardinality | Số bản ghi được phép liên hệ giữa hai entity | Một conversation đúng hai participant | PK ghép tự bảo đảm phải có đúng hai người |
| Transaction | Nhóm thay đổi cùng commit hoặc rollback để giữ bất biến | Insert listing + photos + state history | Transaction riêng từng module vẫn là một commit nguyên tử chung |
| Constraint / policy | DB giữ hình dạng/quan hệ ổn định; business xét danh tính/quyền/thời gian | FK sender vào participant; backend xét block hiện tại | CHECK đơn giản có thể truy vấn mọi bảng khác để quyết định quyền |
| Migration / seed | Thay cấu trúc DB có phiên bản / nạp dữ liệu đã chọn | Migration tạo bảng, seed lookup được review | `schema.md` đã là migration hoặc fixture test là dữ liệu pilot thật |

## 7. Mã truy vết và quản lý công việc

| Ký hiệu | Ý nghĩa và nơi dùng | Ví dụ / giới hạn |
|---|---|---|
| A1–A5 / D01–D07 | Giả định / quyết định sản phẩm trong Wiki | Keep để thử tiếp không có nghĩa đã xác nhận giá trị |
| UN / R / US | Nhu cầu / requirement / user story trong [Traceability](../StudentMart.wiki/Traceability.md) | R07 và US07 liên quan, không phải hai tên thay thế cho một loại mã |
| UF | Flow và nhánh xử lý người dùng | UF01b mở/gửi chat, UF04 tiếp tục từ notification |
| TASK | Công việc cấp dự án có Issue được Wiki dẫn | TASK-01 dẫn Issue #2; không tính số Issue bằng mã TASK |
| BL | Ticket kế hoạch local trong [backlog](../docs/back-log.md) | BL-019 publish; chưa phải Issue #19 |
| AC | Tiêu chí chấp nhận quan sát được | Retry sau mất ACK vẫn một message; không chỉ “đã có service” |
| DoR / DoD | Điều kiện đủ đầu vào / điều kiện hoàn tất theo [workflow](work-flow.md) | Có dependency/owner trước To Do; AC/review/evidence trước Done |
| Evidence | Bằng chứng đúng loại kết luận: source, test result, device log, quan sát pilot | File test tồn tại không chứng minh test đã pass; số lượt tải không chứng minh tác vụ hữu ích |

## 8. Ba ví dụ đọc xuyên tài liệu

**Publish mất response:** A gửi tin Bán với key K và ảnh READY. Server commit listing L cùng ảnh/history, response bị mất. Mobile giữ nháp UNCONFIRMED và K. Retry cùng payload lấy lại L theo quyền hiện tại; đổi payload dưới K phải đối chiếu/conflict. Xem [UF02a](user-flow.md) và C06/C08 trong [schema](../docs/schema.md).

**Chủ tin đã bán nhưng chat vẫn còn:** A đánh dấu L COMPLETED. Người chưa từng liên hệ không mở chat mới từ L; B đã có C1 với A vẫn đọc/gửi nếu còn quyền và không bị block. Đóng tin cũng không tự khóa C1. Xem [UF01b/UF02b](user-flow.md).

**Thông báo cũ sau đổi account:** Thiết bị nhận push của A rồi login B. Binding A đã thu hồi; worker không gửi job A qua binding B. Tap push cũ phải xác nhận session B và quyền C1 trước khi tải nội dung; không có quyền thì về inbox. Payload cũ vốn phải chung vì OS có thể đã nhận từ trước khi logout. Xem [UF04](user-flow.md) và [kiến trúc runtime](structure-architecture.md).
