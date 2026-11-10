# StudentMart — Backlog và kế hoạch tạo issue

**Ngày lập:** 02/11/2026. **Phạm vi:** kế hoạch để nhóm tự tạo ticket và bắt đầu triển khai. Tài liệu này không tạo issue/label trên GitHub, không gán Assignee và không xác nhận tiến độ thực tế.

Nguồn: [solution tree](solution_tree.md), [schema](schema.md), [hướng dẫn agent](../stephen-skills/AGENTS.md), [User Stories](../StudentMart.wiki/User-Stories.md), [Critical User Flows](../StudentMart.wiki/Critical-User-Flows.md), [MVP Scope](../StudentMart.wiki/MVP-Scope-and-Prioritization.md), [Project Plan](../StudentMart.wiki/Project-Plan.md) và [Traceability](../StudentMart.wiki/Traceability.md).

## 1. Cách dùng backlog này

- Đã có khung mobile/backend theo **Three-Layer**; mobile dùng MVVM nhẹ, backend dùng Controller → Service → Repository. Chưa có app chạy được, manifest hoặc migration thực thi. Vì vậy không đánh dấu ticket bootstrap/feature là Done chỉ vì đã có thư mục.
- Danh mục dưới đây gồm **47 ticket feature triển khai MVP/hỗ trợ pilot** và **2 ý tưởng enhance chưa cam kết**. Bug/fix chỉ tạo khi có lỗi hoặc sai lệch đã ghi nhận, không tạo lỗi giả cho đủ loại.
- `BL-001…BL-049` là mã kế hoạch **trong file này**, không phải GitHub Issue number và không thay mã `TASK-01…TASK-25` của wiki.
- Trước khi tạo, tìm issue hiện có theo TASK/tên/đầu ra. TASK đã có issue thì cập nhật hoặc tạo ticket con có phạm vi riêng; không tạo thêm issue cha cùng nội dung.
- TASK ở mỗi dòng là nguồn liên quan. Chỉ chọn **một cha chính** khi thực sự tách đầu ra từ TASK đó; các TASK khác ghi Related. Công việc nền tảng chưa có cha tương ứng có thể là issue độc lập, không tự gán mã TASK mới ngoài danh mục wiki.
- Khi issue thật được tạo, ghi URL vào bảng đối chiếu ở cuối file hoặc metadata ticket. Dùng URL/số thật trong dependency/PR; không viết `Closes #19` vì thấy BL-019 hoặc TASK-19.
- Tạo ticket theo từng đợt nhỏ. Mỗi ticket có một người chịu trách nhiệm, đầu ra và cách nghiệm thu; tách tiếp nếu nhiều người cần làm/merge độc lập.
- Các quyết định giá 0, giới hạn ảnh, phạm vi restriction, OTP quota/TTL, provider… còn mở phải được chốt ở ticket thiết kế trước khi ticket phụ thuộc được đưa To Do. Không tự biến schema đề xuất thành quy tắc đã duyệt.

## 2. Tag name, tiêu đề và phân loại

### 2.1. Bốn nhãn loại — giữ đúng tên

Mỗi issue có **đúng một** nhãn loại chính trong bốn nhãn sau:

| Tag name | Dùng khi | Ví dụ | Không dùng khi |
|---|---|---|---|
| `feature` | Xây một khả năng mới hoặc đầu ra nền tảng/thiết kế trực tiếp phục vụ việc triển khai | Đăng tin ba loại; bootstrap app; migration; spike OTP/push | Không gọi một chức năng MVP chưa làm là enhance |
| `bug` | Hành vi đã chạy nhưng sai yêu cầu, có expected/actual và cách tái hiện hoặc bằng chứng | Retry một lần gửi tạo hai message | Không dùng cho một tính năng chưa triển khai |
| `enhance` | Cải thiện chức năng **đã có**, có baseline và lợi ích/mục tiêu rõ | Giữ vị trí danh sách khi quay lại; tối ưu ảnh theo số đo | Không giấu tính năng mới ngoài MVP dưới tên cải tiến |
| `fix` | Công việc sửa kỹ thuật đã xác nhận, hoặc phần sửa được tách riêng từ một bug lớn | Sửa cấu hình CI hỏng; một phần sửa độc lập của bug liên module | Không tự tạo thêm fix issue cho mọi bug nhỏ |

**Bug và fix không bắt buộc đi đôi.** Với lỗi nhỏ, giữ issue `bug`, thực hiện sửa và đóng qua PR của chính bug đó. Chỉ tạo issue `fix` riêng khi cần tách owner/PR/phạm vi, hoặc sửa một sai lệch kỹ thuật có bằng chứng; link nguồn và nêu AC riêng. Không gắn đồng thời bug + fix để lẫn việc báo lỗi và tách việc.

`fix` không đồng nghĩa “khẩn cấp”, còn `enhance` không đồng nghĩa “được phép mở rộng MVP”. Độ ưu tiên và tác động được quản lý riêng.

### 2.2. Nhãn phụ tối thiểu

| Nhóm | Tag đề xuất | Quy tắc |
|---|---|---|
| Khu vực | `area:mobile`, `area:backend`, `area:database`, `area:infra`, `area:docs`, `area:qa` | Ít nhất một; được có nhiều area nếu một đầu ra cần phối hợp |
| Ưu tiên | `priority:P0`, `priority:P1`, `priority:P2` | Đúng một |
| Mức ảnh hưởng lỗi, tùy chọn | `severity:critical`, `severity:high`, `severity:medium`, `severity:low` | Dùng cho bug/fix khi đã đánh giá, không thay priority |
| Feature/module, tùy chọn | `module:auth`, `module:listings`, `module:chat`… | Chỉ tạo những label nhóm dùng; body ticket vẫn ghi module |
| Trạng thái | Backlog / To Do / In Progress / Review / Done | Dùng trường Status của Project, không cần tạo thêm một bộ status label |

P0 dành cho lỗi chặn nghiêm trọng hoặc truy cập trái quyền đã xác nhận cần ưu tiên xử lý. P1 là công việc MVP theo phụ thuộc. P2 là cải tiến chưa cam kết, chỉ cân nhắc sau baseline/pilot; không hạ các điều kiện phân quyền hoặc push/verify bắt buộc xuống P2.

Milestone theo dự án: **M1 — nghiên cứu/nền tảng; M2 — thiết kế/triển khai/nghiệm thu; M3 — pilot/điều chỉnh**. Các enhance cuối danh mục ghi M3 như thời điểm xem xét, chưa phải cam kết đưa vào milestone.

### 2.3. Quy tắc title và branch

```text
[feature][backend][BL-019] Publish ba loại tin và retry không trùng
[bug][chat] Retry sau timeout hiển thị hai tin nhắn
[enhance][mobile] Giữ vị trí danh sách khi quay từ chi tiết
[fix][infra] Sửa cấu hình PostgreSQL của CI bị lỗi kết nối
```

Title mô tả đầu ra hoặc hành vi cụ thể. Prefix trong title **không tự gắn label**; cần chọn labels thật khi tạo issue. Với bug/fix phát sinh, dùng mã Issue thật sau khi tạo, không cần ép vào BL-001…BL-049.

Branch đề xuất: `feat/issue-<số-thật>-listing-publish`, `fix/issue-<số-thật>-message-retry`, `enhance/issue-<số-thật>-list-position`. Số Issue chỉ lấy sau khi tạo; tham chiếu TASK/US/UF trong body và PR.

## 3. Kế hoạch tạo issue và bắt đầu implement

### 3.1. Đợt đầu nên tạo

1. Rà các issue TASK đang có trên Project; tái sử dụng cha liên quan, chưa giả định task nào Done.
2. Tạo/cập nhật label loại và area/priority thực sự cần. Không cần tạo toàn bộ label tùy chọn ngay.
3. Tạo **BL-001 và BL-003** trước: quyết định kỹ thuật còn mở và dữ liệu lookup; đây là hai ticket không có phụ thuộc BL.
4. Sau BL-001, chuẩn bị **BL-002, BL-004, BL-005**. BL-004/005 là tạo app chạy được, không phải tạo lại thư mục.
5. Sau đó tạo **BL-006, BL-010, BL-011** theo dependency; spike OTP/push phải làm sớm, không đợi cuối dự án.
6. Khi BL-002/003/006 có đầu ra, tạo **BL-007 → BL-008 → BL-009** cho migration theo nhóm. Danh sách có 11 ticket nền tảng; không chuyển tất cả sang In Progress cùng lúc.

Nếu issue bootstrap hiện có đã đáp ứng đầu ra nào, đối chiếu và ghi bằng chứng thay vì làm lại. Thời gian/phân công thật do nhóm chốt, không lấy thứ tự mã BL làm lịch.

### 3.2. Đợt tiếp theo theo phụ thuộc

| Đợt | Đầu ra chính | Ticket trọng tâm |
|---|---|---|
| Nền tảng | App chạy được, DB test, quyết định còn mở và spike | BL-001…BL-011 |
| Tài khoản/lookup/media | Đăng nhập thật, hồ sơ, lookup và ảnh | BL-012…BL-018; policy BL-020 |
| Tin đăng | Publish → tìm → chi tiết → quản lý; bản nháp/retry | BL-019, BL-021…BL-028 |
| Chat | Hội thoại duy nhất, message/unread và mobile chat | BL-029…BL-031 |
| Verify và push | OTP tùy chọn, binding, worker, permission và tap an toàn | BL-032…BL-037 |
| Vận hành | Report/block và admin tối thiểu | BL-038…BL-041 |
| Đo lường | Metric/journal và instrument sự kiện | BL-043 trước BL-042 |
| Nghiệm thu/pilot | Tích hợp, bản cài, thiết bị thật, nguồn người/tin và đánh giá | BL-044…BL-047 |
| Cải tiến | Chỉ xem xét khi có baseline/evidence | BL-048…BL-049 |

Đây là nhóm đầu ra, không phải lịch tuần cố định. Dependency của từng ticket mới quyết định khi nào được bắt đầu; số BL không bảo đảm thứ tự topo. Ví dụ BL-020 phải có trước BL-019, BL-025 trước BL-024, BL-043 trước BL-042. Một số việc như verify, chuẩn bị pilot và spike có thể làm khi đã đủ đầu vào, không phải đợi hết nhóm trước.

### 3.3. Điều kiện chuyển trạng thái

| Status | Điều kiện |
|---|---|
| Backlog | Có nhu cầu/đầu ra sơ bộ; có thể còn thiếu quyết định hoặc đầu vào |
| To Do | Có Assignee, phạm vi, AC, dependency đã đáp ứng, estimate và tiêu chí kiểm tra; có ngày mục tiêu do nhóm thống nhất |
| In Progress | Người phụ trách đã bắt đầu, cập nhật bước tiếp theo/blocker; hạn chế WIP theo sức nhóm |
| Review | Có PR/đầu ra, tự kiểm tra và evidence; nêu rõ phần chưa chạy |
| Done | AC đạt, review xong, code/tài liệu liên quan cập nhật và có kết quả kiểm tra thật |

Blocked là thông tin bổ sung kèm lý do/phụ thuộc, không thay một trạng thái của workflow hiện tại. Issue đóng vì hủy/trùng không phải feature đã nghiệm thu.

Estimate trong danh mục là **S/M tạm tính**, không phải số ngày hoặc cam kết deadline: S = đầu ra nhỏ, M = có nhiều trạng thái/tích hợp. Khi phân rã nếu thành nhiều đầu ra/owner/PR độc lập, tách trước To Do; không cố nhét vào một ticket “M”.

## 4. Danh mục ticket theo feature

Mỗi dòng là **gợi ý ticket**, chưa phải trạng thái thật trên GitHub. Title có prefix loại; các nhãn area/priority được ghi đầy đủ để copy. AC ở bảng là bản tóm tắt; khi tạo issue, mở rộng bằng mẫu mục 5 và các nhánh liên quan trong wiki/schema.

Cột TASK là nguồn liên quan, không mặc định tất cả đều là cha. Với BL-001/002, ticket nền tảng có thể độc lập và chỉ Related tới TASK; BL-004/005/006 là đầu ra kỹ thuật mới nếu chưa có issue tương ứng. Các công việc nghiên cứu/nền tảng không cần ép có một US mới.

### Nền tảng và quyết định kỹ thuật

| Mã và title đề xuất | Labels · milestone · size | Truy vết | Depends on | Đầu ra / AC tóm tắt |
|---|---|---|---|---|
| **BL-001** — [feature][docs] Chốt runtime, framework, ORM, auth, routing và provider | `feature`, `area:docs`, `area:infra`, `priority:P1`; M2; M | `TASK-03`, `TASK-16`, `TASK-17` | Không | Ghi lựa chọn, phiên bản, lý do và cách kiểm chứng; giữ Three-Layer/MVVM đã chọn, không mở lại kiến trúc từ đầu. |
| **BL-002** — [feature][docs] Duyệt schema, contract và chính sách nghiệp vụ còn mở | `feature`, `area:docs`, `area:backend`, `priority:P1`; M2; M | `TASK-03`, `TASK-18`, `TASK-22`, `TASK-25` | BL-001 | Chốt giá 0/giới hạn ảnh, trạng thái sau gỡ, phạm vi restriction, uniqueness email, TTL/quota OTP và event; phần chưa chốt ghi owner/blocker, không tự coi đề xuất đã được duyệt. |
| **BL-003** — [feature][docs] Chốt danh sách trường, miền email, khu vực và danh mục | `feature`, `area:docs`, `area:database`, `priority:P1`; M1; S | `TASK-15`, `US02`, `US03`, `US04`, `US05`, `US09`, `UF01a`, `UF02a`, `UF03` | Không | Có danh sách lookup được review, nguồn/căn cứ rõ; miền gần giống hoặc chưa hỗ trợ không tự được nhận. |
| **BL-004** — [feature][backend] Khởi tạo backend Node.js theo Three-Layer | `feature`, `area:backend`, `area:infra`, `priority:P1`; M2; M | Nền tảng kỹ thuật; không tự thêm mã US/TASK. | BL-001 | Có manifest/lockfile thật, config được validate và server khởi động; controller/service/repository đúng ranh giới, không hardcode user. |
| **BL-005** — [feature][mobile] Khởi tạo mobile Expo và shell điều hướng MVVM | `feature`, `area:mobile`, `priority:P1`; M2; M | Nền tảng kỹ thuật; không tự thêm mã US/TASK. | BL-001 | App chạy trên môi trường mục tiêu, manifest/lockfile riêng; screen gọi ViewModel, không trộn HTTP/storage vào JSX. |
| **BL-006** — [feature][database] Thiết lập PostgreSQL dev/test và migration runner | `feature`, `area:database`, `area:infra`, `priority:P1`; M2; M | Nền tảng kỹ thuật; không tự thêm mã US/TASK. | BL-001, BL-004 | DB test tách dev/pilot; chạy migration trên DB trống, có hướng dẫn lệnh thật; không reset DB dùng chung. |
| **BL-007** — [feature][database] Tạo migration nhóm tài khoản, lookup, media và listing | `feature`, `area:database`, `area:backend`, `priority:P1`; M2; M | `TASK-03`, `TASK-15`, `TASK-16` | BL-002, BL-003, BL-006 | Tạo 14 bảng thuộc users/auth/catalog/media/listings, nullability/unique/check theo schema; chia file migration có thể review, tham chiếu chéo bổ sung đúng bước đủ bảng. |
| **BL-008** — [feature][database] Tạo migration chat, report và hạn chế quyền | `feature`, `area:database`, `area:backend`, `priority:P1`; M2; M | `TASK-03`, `TASK-06`, `TASK-22`, `US07`, `US10`, `US11`, `UF01b`, `UF05a`, `UF05b` | BL-007 | Tạo 7 bảng chat/moderation; FK sender/participant và target XOR đúng; nối FK audit quản trị của listing khi đã có bảng đích, không bỏ constraint để chạy tạm. |
| **BL-009** — [feature][database] Tạo migration push, analytics và kiểm tra toàn vẹn schema | `feature`, `area:database`, `area:backend`, `priority:P1`; M2; M | `TASK-19`, `TASK-20`, `TASK-25`, `US13`, `UF04` | BL-008 | Tạo 4 bảng notifications/analytics, đủ 25 bảng; kiểm tra binding ghép, outbox unique, trigger liên bảng và đường nâng cấp có dữ liệu. |
| **BL-010** — [feature][infra] Thiết lập CI và kiểm tra cơ bản của hai ứng dụng | `feature`, `area:infra`, `area:qa`, `priority:P1`; M2; S | `TASK-24` | BL-004, BL-005, BL-006 | CI gọi script có thật, lint/type-check/test phù hợp và PostgreSQL test; báo đúng chưa chạy, không tạo bước test luôn pass. |
| **BL-011** — [feature][mobile] Spike OTP và push trên thiết bị thật | `feature`, `area:mobile`, `area:backend`, `area:qa`, `priority:P1`; M2; M | `TASK-17`, `US09`, `US13`, `UF03`, `UF04` | BL-001, BL-003, BL-004, BL-005 | Có email/thiết bị thử được phép, provider/OS/build/quyền và kết quả thực tế; ghi lỗi/hạn chế, không thay bằng mock hoặc coi spike đã hoàn thiện auth/push production. |

### Catalog

| Mã và title đề xuất | Labels · milestone · size | Truy vết | Depends on | Đầu ra / AC tóm tắt |
|---|---|---|---|---|
| **BL-012** — [feature][backend] Triển khai lookup API và seed dữ liệu được duyệt | `feature`, `area:backend`, `area:database`, `priority:P1`; M2; S | `TASK-15`, `TASK-05`, `US02`, `US03`, `US04`, `US05`, `US09`, `UF01a`, `UF02a`, `UF03` | BL-003, BL-004, BL-007 | Đọc areas/categories/schools/domains; ngừng cho chọn mới mục inactive nhưng giữ lịch sử; không cần màn hình quản trị lookup đầy đủ. |

### Auth và verify

| Mã và title đề xuất | Labels · milestone · size | Truy vết | Depends on | Đầu ra / AC tóm tắt |
|---|---|---|---|---|
| **BL-013** — [feature][backend] Triển khai đăng ký, đăng nhập, đăng xuất và session | `feature`, `area:backend`, `priority:P1`; M2; M | `TASK-16`, `US01`, `UF01b`, `UF02a`, `UF03`, `UF04`, `UF05` | BL-002, BL-004, BL-009 | Danh tính/role lấy từ phiên thật; sai/hết hạn/logout bị xử lý đúng; session/installation/binding có cập nhật nhất quán, chưa verify vẫn được đăng/chat. |
| **BL-014** — [feature][mobile] Triển khai mobile auth và vùng dữ liệu theo tài khoản | `feature`, `area:mobile`, `priority:P1`; M2; M | `TASK-16`, `US01`, `UF01b`, `UF02a`, `UF03`, `UF04` | BL-005, BL-013 | Đăng ký/login/logout, lưu session phù hợp; đổi tài khoản khóa/dọn namespace cũ, có contract lifecycle để draft/chat/push tích hợp về sau. |
| **BL-032** — [feature][backend] Triển khai OTP và verify email trường ở backend | `feature`, `area:backend`, `priority:P1`; M2; M | `TASK-18`, `US09`, `UF03` | BL-002, BL-011, BL-012, BL-013 | Đúng domain/MAC/version/expiry/quota mới verify; đổi email thu hồi nhãn, OTP không dùng hai lần; provider accepted không hứa mail đã đến; verify không gate luồng chính. |
| **BL-033** — [feature][mobile] Triển khai verify tùy chọn và cập nhật nhãn trên mobile | `feature`, `area:mobile`, `priority:P1`; M2; S | `TASK-18`, `US09`, `UF03` | BL-014, BL-018, BL-032 | Có bỏ qua và giải thích nhãn; lỗi OTP/miền/cooldown rõ; đổi email mất nhãn tới khi xác thực lại; không công khai địa chỉ email. |

### Profile

| Mã và title đề xuất | Labels · milestone · size | Truy vết | Depends on | Đầu ra / AC tóm tắt |
|---|---|---|---|---|
| **BL-015** — [feature][backend] Triển khai hồ sơ riêng và public projection | `feature`, `area:backend`, `priority:P1`; M2; S | `TASK-16`, `TASK-06`, `US01`, `US06`, `US09`, `UF01a`, `UF03` | BL-012, BL-013 | Chỉ sửa hồ sơ của mình; public response không lộ email trường/credential/địa chỉ riêng; trường tự khai khác verified school, avatar chỉ nhận asset READY đúng chủ. |
| **BL-018** — [feature][mobile] Triển khai màn hình hồ sơ, sửa hồ sơ và avatar | `feature`, `area:mobile`, `priority:P1`; M2; M | `TASK-16`, `TASK-06`, `TASK-18`, `US01`, `US06`, `US09`, `UF01a`, `UF03` | BL-014, BL-015, BL-017 | Hiển thị/sửa đúng quyền; phân biệt trường tự khai/nhãn verify, giải thích giới hạn nhãn; ảnh lỗi có thể thử lại, không dùng verify như bảo đảm uy tín. |

### Media

| Mã và title đề xuất | Labels · milestone · size | Truy vết | Depends on | Đầu ra / AC tóm tắt |
|---|---|---|---|---|
| **BL-016** — [feature][backend] Triển khai upload ảnh và trạng thái media asset | `feature`, `area:backend`, `priority:P1`; M2; M | `TASK-04`, `US02`, `US03`, `US04`, `US12`, `UF02a` | BL-001, BL-007, BL-013 | Xác minh file/ownership/purpose trước READY, xử lý upload lỗi; chưa READY không dùng làm ảnh tin công khai; cấu hình provider không nằm trong Git. |
| **BL-017** — [feature][mobile] Triển khai chọn/chụp ảnh và upload adapter trên mobile | `feature`, `area:mobile`, `priority:P1`; M2; M | `TASK-04`, `TASK-23`, `US02`, `US03`, `US04`, `US12`, `UF02a` | BL-005, BL-014, BL-016 | Từ chối camera vẫn chọn ảnh sẵn khi được OS cho phép; có upload state/retry và giữ ảnh local có thể tiếp tục dùng, dùng chung cho avatar/tin. |

### Listings

| Mã và title đề xuất | Labels · milestone · size | Truy vết | Depends on | Đầu ra / AC tóm tắt |
|---|---|---|---|---|
| **BL-019** — [feature][backend] Triển khai API publish ba loại tin và idempotency | `feature`, `area:backend`, `priority:P1`; M2; M | `TASK-03`, `TASK-04`, `US02`, `US03`, `US04`, `US12`, `UF02a` | BL-002, BL-009, BL-012, BL-013, BL-016, BL-020 | SALE/EXCHANGE cần ảnh READY, WANTED không bắt ảnh/ngân sách; listing+ảnh+history cùng commit; cùng request key sau mất ACK trả listing cũ, payload khác báo conflict. |
| **BL-021** — [feature][backend] Triển khai API duyệt, tìm kiếm và bộ lọc | `feature`, `area:backend`, `priority:P1`; M2; M | `TASK-05`, `US05`, `UF01a` | BL-012, BL-019 | Kết hợp từ khóa/loại/danh mục/khu vực; chỉ OPEN/VISIBLE; khi lọc giá loại NULL, bỏ lọc có thể thấy lại; phân trang/thứ tự ổn định. |
| **BL-022** — [feature][backend] Triển khai chi tiết tin và hồ sơ chủ tin | `feature`, `area:backend`, `priority:P1`; M2; S | `TASK-06`, `TASK-07`, `US06`, `UF01a`, `UF01b` | BL-015, BL-019 | Đúng dữ liệu từng loại/trạng thái, public projection an toàn; tin đổi trạng thái trong lúc xem không được mở chat mới trái điều kiện. |
| **BL-023** — [feature][backend] Triển khai sửa, đóng, gỡ và hoàn tất tin | `feature`, `area:backend`, `priority:P1`; M2; M | `TASK-04`, `TASK-07`, `US08`, `UF02b` | BL-002, BL-019, BL-020 | Owner/version kiểm tra ở server; hoàn tất theo loại khác đóng/gỡ; admin removal không cho chủ tự phục hồi, owner_state không bị xóa bởi moderation_state. |
| **BL-024** — [feature][mobile] Triển khai form đăng và sửa ba loại tin trên mobile | `feature`, `area:mobile`, `priority:P1`; M2; M | `TASK-04`, `TASK-07`, `US02`, `US03`, `US04`, `US08`, `UF02a`, `UF02b` | BL-012, BL-014, BL-017, BL-019, BL-023, BL-025 | Một editor theo loại, lỗi tại trường; chỉ thành công sau ACK, giữ key/nội dung khi chưa rõ kết quả; không gate verify hoặc GPS. |
| **BL-025** — [feature][mobile] Triển khai bản nháp tin và phục hồi khi gián đoạn | `feature`, `area:mobile`, `priority:P1`; M2; M | `TASK-23`, `TASK-04`, `US12`, `UF02a` | BL-014, BL-017, BL-019 | Draft/photo theo account, rời form rồi khôi phục/xóa; thiếu ảnh không thành tin công khai; retry sau server đã lưu không đăng trùng, không đồng bộ đa thiết bị. |
| **BL-026** — [feature][mobile] Triển khai danh sách, tìm kiếm và filter mobile | `feature`, `area:mobile`, `priority:P1`; M2; M | `TASK-05`, `US05`, `UF01a` | BL-005, BL-012, BL-021 | Loading/rỗng/lỗi riêng; response cũ không đè query mới, đổi/xóa filter và thử lại được; thiếu giá không thành 0/miễn phí. |
| **BL-027** — [feature][mobile] Triển khai màn hình chi tiết và liên kết hồ sơ chủ tin | `feature`, `area:mobile`, `priority:P1`; M2; S | `TASK-06`, `TASK-07`, `US06`, `UF01a`, `UF01b` | BL-018, BL-022, BL-026 | Hiển thị theo loại và trạng thái; nhãn verify đúng giới hạn, không lộ email; cập nhật khả năng liên hệ khi tin thay đổi. |
| **BL-028** — [feature][mobile] Triển khai tin của tôi và thao tác kết thúc tin | `feature`, `area:mobile`, `priority:P1`; M2; M | `TASK-04`, `TASK-07`, `US08`, `UF02b` | BL-023, BL-024, BL-027 | Có xác nhận đóng/gỡ/hoàn tất và nhãn đúng loại; lỗi giữ trạng thái server xác nhận trước; danh sách/chi tiết không báo thành công giả. |

### Access và moderation

| Mã và title đề xuất | Labels · milestone · size | Truy vết | Depends on | Đầu ra / AC tóm tắt |
|---|---|---|---|---|
| **BL-020** — [feature][backend] Triển khai policy quyền tương tác, block và restriction | `feature`, `area:backend`, `priority:P1`; M2; M | `TASK-16`, `TASK-22`, `TASK-07`, `US01`, `US07`, `US08`, `US10`, `US11`, `US13`, `UF01b`, `UF02b`, `UF04`, `UF05` | BL-002, BL-009, BL-013 | Policy dùng dữ liệu thật và clock server, tách đọc/gửi; xét block hai hướng và deny scope; các handler/worker dùng chung gate/lock, không cần đợi UI report/admin mới kiểm tra quyền. |
| **BL-038** — [feature][backend] Triển khai API báo cáo và chặn độc lập | `feature`, `area:backend`, `priority:P1`; M2; M | `TASK-22`, `US10`, `UF05a` | BL-013, BL-020, BL-029, BL-030 | Report một target, context/snapshot chỉ trong quyền; report không tự phạt; block ngăn message/push mới qua policy thật, vẫn giữ lịch sử theo quyền. |
| **BL-039** — [feature][backend] Triển khai admin xử lý report và audit quyết định | `feature`, `area:backend`, `priority:P1`; M2; M | `TASK-22`, `US11`, `UF05b` | BL-002, BL-020, BL-023, BL-038 | Chỉ ADMIN, reason/actor/time; chưa đủ căn cứ giữ chờ, final action/effect/report status cùng commit; race hai admin chỉ một kết luận cuối. |
| **BL-040** — [feature][mobile] Triển khai báo cáo và xác nhận chặn trên mobile | `feature`, `area:mobile`, `priority:P1`; M2; S | `TASK-22`, `US10`, `UF05a` | BL-014, BL-031, BL-038 | Report/block là hai hành động riêng; lỗi giữ nội dung, xác nhận đúng sau ACK; block không xóa lịch sử hoặc khẳng định đối tượng vi phạm. |
| **BL-041** — [feature][mobile] Triển khai giao diện quản trị report tối thiểu | `feature`, `area:mobile`, `priority:P1`; M2; M | `TASK-22`, `US11`, `UF05b` | BL-014, BL-039 | Role guard + BE admin enforcement; danh sách/chi tiết/decision form có lý do và trạng thái lưu; không xây dashboard/full web admin. |

### Chat

| Mã và title đề xuất | Labels · milestone · size | Truy vết | Depends on | Đầu ra / AC tóm tắt |
|---|---|---|---|---|
| **BL-029** — [feature][backend] Triển khai tạo hoặc lấy hội thoại duy nhất theo tin | `feature`, `area:backend`, `priority:P1`; M2; M | `TASK-06`, `TASK-21`, `US07`, `UF01b`, `UF02b` | BL-019, BL-020 | Không tự chat; mới chỉ từ tin mở và có quyền; cùng cặp/tin kể cả concurrent vẫn một conversation với đúng hai participant; chat cũ sau chủ hoàn tất/đóng được xét riêng. |
| **BL-030** — [feature][backend] Triển khai message, lịch sử, unread và outbox nguyên tử | `feature`, `area:backend`, `priority:P1`; M2; M | `TASK-06`, `TASK-20`, `TASK-21`, `TASK-23`, `US07`, `US13`, `UF01b`, `UF04` | BL-009, BL-020, BL-029 | Sender là participant, quyền gửi hiện tại; retry cùng key không nhân bản, seq/read cursor nhất quán; message+notification_job cùng commit, không chờ provider mới ACK. |
| **BL-031** — [feature][mobile] Triển khai inbox, conversation và pending message mobile | `feature`, `area:mobile`, `priority:P1`; M2; M | `TASK-06`, `TASK-21`, `TASK-23`, `US07`, `US13`, `UF01b`, `UF02b`, `UF04` | BL-014, BL-029, BL-030 | Văn bản, history/unread/context; gửi/không rõ/lỗi/ACK riêng, giữ nội dung và reconcile một bubble; không tự khóa chat cũ vì tin đã hoàn tất/đóng. |

### Notifications

| Mã và title đề xuất | Labels · milestone · size | Truy vết | Depends on | Đầu ra / AC tóm tắt |
|---|---|---|---|---|
| **BL-034** — [feature][backend] Triển khai đăng ký thiết bị và thu hồi push binding | `feature`, `area:backend`, `priority:P1`; M2; M | `TASK-19`, `US01`, `US13`, `UF04` | BL-009, BL-011, BL-013, BL-020 | Subscription khớp session/user/installation, active unique; logout/switch/đổi token cập nhật generation và thu hồi hàng cũ atomically, không chuyển job A sang B. |
| **BL-035** — [feature][backend] Triển khai push worker, eligibility, lease và retry | `feature`, `area:backend`, `priority:P1`; M2; M | `TASK-20`, `US07`, `US13`, `UF04` | BL-011, BL-020, BL-030, BL-034 | Claim outbox đã commit, fan-out duy nhất/installation; recheck quyền/block/binding trước dispatch, nội dung chung, retry hữu hạn; provider lỗi không mất message. |
| **BL-036** — [feature][mobile] Triển khai quyền thông báo và registration mobile | `feature`, `area:mobile`, `priority:P1`; M2; M | `TASK-19`, `US13`, `UF04` | BL-011, BL-014, BL-034 | Grant/deny được đồng bộ; deny vẫn inbox/chat; token/binding đổi đúng session, không lưu secret/token trong log. |
| **BL-037** — [feature][mobile] Triển khai mở thông báo và tiếp tục chat an toàn | `feature`, `area:mobile`, `area:backend`, `priority:P1`; M2; M | `TASK-21`, `TASK-07`, `US01`, `US07`, `US13`, `UF04` | BL-031, BL-035, BL-036 | Tap cũ/app nền/đóng/hết phiên/đổi account đều kiểm tra quyền trước hiển thị; đang xem đúng chat tránh push trùng theo presence có hạn; context mất quyền về inbox. |

### Analytics và pilot

| Mã và title đề xuất | Labels · milestone · size | Truy vết | Depends on | Đầu ra / AC tóm tắt |
|---|---|---|---|---|
| **BL-042** — [feature][backend] Triển khai sự kiện tối thiểu và đối chiếu dữ liệu | `feature`, `area:backend`, `area:mobile`, `priority:P1`; M2; M | `TASK-25` | BL-009, BL-019, BL-021, BL-023, BL-029, BL-030, BL-043 | Event whitelist/source/actor tin cậy; publish/contact/state không trùng vì retry; completed tự báo cáo khác closed/withdrawn, không ghi chat/OTP/email/token. |
| **BL-043** — [feature][docs] Chốt metric, quy tắc dữ liệu thử và mẫu nhật ký pilot | `feature`, `area:docs`, `area:qa`, `priority:P1`; M2; S | `TASK-25` | BL-002 | Có định nghĩa tìm phù hợp/liên hệ hữu ích/hoàn tất tự báo cáo, loại test/spam và mẫu ẩn danh; consent/retention rõ, không ép thành US mới. |
| **BL-046** — [feature][docs] Chuẩn bị nguồn người, tin thật và kế hoạch pilot | `feature`, `area:docs`, `priority:P1`; M3; M | `TASK-08` | BL-043 | Một cụm có nhu cầu thật, nguồn tin có đồng ý, nhật ký tuyển/lý do từ chối ẩn danh; chuẩn bị được từ M2 nhưng milestone công việc là M3. |
| **BL-047** — [feature][docs] Chạy pilot và cập nhật evidence, quyết định, backlog | `feature`, `area:docs`, `area:qa`, `priority:P1`; M3; M | `TASK-09` | BL-045, BL-046 | Quan sát/lời kể phân biệt, ghi cả bỏ dở; tổng hợp giới hạn và cập nhật quyết định, không suy thành công chỉ từ lượt cài/tin đóng. |

### Nghiệm thu và bản cài

| Mã và title đề xuất | Labels · milestone · size | Truy vết | Depends on | Đầu ra / AC tóm tắt |
|---|---|---|---|---|
| **BL-044** — [feature][qa] Kiểm thử tích hợp toàn chuỗi US và các nhánh UF | `feature`, `area:qa`, `priority:P1`; M2; M | `TASK-24`, `US01`, `US02`, `US03`, `US04`, `US05`, `US06`, `US07`, `US08`, `US09`, `US10`, `US11`, `US12`, `US13`, `UF01a`, `UF01b`, `UF02a`, `UF02b`, `UF03`, `UF04`, `UF05a`, `UF05b` | BL-010, BL-028, BL-031, BL-033, BL-037, BL-040, BL-041, BL-042, BL-043 | Ma trận pass/fail/chưa chạy theo R/US/UF, gồm permission/race/timeout/account switch; các ticket đã có kiểm tra riêng, ticket này kiểm tích hợp xuyên feature. |
| **BL-045** — [feature][mobile] Tạo bản cài thử và nghiệm thu trên thiết bị thật | `feature`, `area:mobile`, `area:infra`, `area:qa`, `priority:P1`; M2; M | `TASK-24`, `TASK-17`, `UF03`, `UF04` | BL-011, BL-044 | Artifact cài được, ghi OS/build/permission/lifecycle và OTP/push thực tế; có lỗi chặn/trái quyền thì chưa sẵn sàng pilot, không tự phát hành store. |

### Cải tiến sau baseline

| Mã và title đề xuất | Labels · milestone · size | Truy vết | Depends on | Đầu ra / AC tóm tắt |
|---|---|---|---|---|
| **BL-048** — [enhance][mobile] Giữ bộ lọc và vị trí danh sách khi quay từ chi tiết | `enhance`, `area:mobile`, `priority:P2`; M3, tùy chọn sau pilot; S | `TASK-05`, `TASK-07`, `US05`, `US06`, `UF01a` | BL-026, BL-027, BL-047 | Chỉ xem xét sau baseline chạy được; quay lại giữ ngữ cảnh đã chọn, không hiển thị dữ liệu sai trạng thái; không thêm favorite/sharing. |
| **BL-049** — [enhance][mobile] Tối ưu tải ảnh danh sách theo số đo trên thiết bị | `enhance`, `area:mobile`, `priority:P2`; M3, tùy chọn sau pilot; M | `TASK-05`, `US05`, `UF01a` | BL-026, BL-047 | Chỉ chuyển To Do khi có số đo/vấn đề thực tế và mục tiêu được chốt; so sánh trước/sau, không tự đặt app dưới 30 MB hoặc thêm cache làm lộ dữ liệu khác account. |

Các ticket feature đã bao gồm tự kiểm tra và cập nhật tài liệu cần thiết. BL-044/045 dành cho tích hợp/nghiệm thu xuyên phần, không có nghĩa dồn mọi test đến cuối. Hai enhance chỉ là ý tưởng sau pilot; chưa đưa vào cam kết MVP hoặc tạo chức năng ngoài scope.


## 5. Format đầy đủ cho một issue/ticket

### 5.1. Title

```text
[loại][area hoặc module][BL-xxx nếu có] Đầu ra hoặc hành vi cụ thể
```

Không ghi title chung như “Làm backend”, “Fix bug”, “Làm UI”. Với bug, nêu trigger + lỗi quan sát; với enhance, nêu hành vi cải thiện và phần đã có.

### 5.2. Body chung — copy rồi điền

Các phần không áp dụng ghi **N/A — lý do**; bỏ checklist implementation không thuộc phạm vi. Không dùng placeholder như đã hoàn thành. Với bug/fix/enhance, thêm phần tương ứng ở mục 6.

```md
## 1. Tóm tắt và mục tiêu

- Vấn đề hoặc nhu cầu:
- Người dùng/bên hưởng lợi:
- Đầu ra có thể review:
- Trạng thái hiện tại: chưa có / đã có nhưng sai / cần cải tiến (chọn đúng).

## 2. Thông tin quản lý

| Trường | Giá trị |
|---|---|
| Mã kế hoạch | BL-xxx hoặc N/A nếu ticket phát sinh |
| Loại chính | feature / bug / enhance / fix — chọn một |
| Labels | Loại + area:* + priority:*; severity/module nếu cần |
| Feature/module | |
| Work category | Research / Documentation / Development / Testing |
| Milestone | M1 / M2 / M3 hoặc chưa cam kết |
| Status | Backlog khi chưa đủ Ready |
| Assignee | Một người; chưa gán thì ghi rõ |
| Reviewer/người phối hợp | |
| Priority | P0 / P1 / P2 |
| Severity nếu là lỗi | Critical / High / Medium / Low / N/A |
| Estimate | S/M hoặc ước lượng nhóm đã thống nhất |
| Start date / Target date | Chưa chốt hoặc ngày nhóm thực sự thống nhất |

## 3. Căn cứ và truy vết

- TASK cha chính: URL issue thật hoặc N/A nếu chưa có cha tương ứng.
- Related TASK/issue: URL thật; không suy số Issue từ mã TASK/BL.
- Requirement / User Story: Rxx / USxx hoặc N/A — giải thích cho hạ tầng/nghiên cứu.
- User Flow và nhánh: UFxx, nhánh lỗi/trạng thái liên quan.
- Evidence / giả định / quyết định: nguồn hoặc mã A/D khi thực sự liên quan.
- Docs: link wiki, schema, solution tree, contract/ADR được duyệt.

## 4. Hiện tại và hành vi mong đợi

- Hiện tại:
- Sau khi hoàn thành:
- Điều kiện đầu vào/đăng nhập/quyền:
- Các trạng thái và ngoại lệ cần xử lý:

## 5. Phạm vi

Trong phạm vi:
- ...

Ngoài phạm vi:
- ...

## 6. Thiết kế và vị trí triển khai

- Mobile: feature và presentation/business/data cần thay.
- Backend: module và presentation/business/data hoặc workflow cần thay.
- Entity/bảng/constraint/index/transaction: ghi phần thực sự liên quan.
- API/event/local storage/permission/provider: hợp đồng được duyệt hoặc quyết định cần chốt.
- Data migration/backfill/compatibility: có / không; tác động dữ liệu nếu có.
- File/đường dẫn dự kiến: không ghi như thể file đã tồn tại.

## 7. Acceptance Criteria

- [ ] AC-01 — Given ..., When ..., Then ...; kết quả quan sát được.
- [ ] AC-02 — Dữ liệu thiếu/sai hoặc lỗi mạng có phản hồi đúng.
- [ ] AC-03 — Quyền/trạng thái/ngoại lệ của flow liên quan được xử lý.
- [ ] AC-04 — Retry/concurrent/logout/switch nếu thuộc phạm vi không tạo sai lệch.

Chỉ giữ các AC áp dụng; không thay AC thành “đã tạo controller/service”.

## 8. Checklist thực hiện

- [ ] Chốt contract/quyết định còn thiếu liên quan.
- [ ] Thực hiện phần BE/DB thuộc phạm vi.
- [ ] Thực hiện phần mobile thuộc phạm vi.
- [ ] Kiểm tra tích hợp/nhánh lỗi/quyền có ý nghĩa cho thay đổi.
- [ ] Cập nhật tài liệu và liên kết truy vết cần thiết.

Không bắt một ticket chỉ sửa tài liệu phải có BE và mobile.

## 9. Kế hoạch kiểm chứng

| AC | Kịch bản / dữ liệu | Mức kiểm tra | Kết quả mong đợi | Môi trường cần |
|---|---|---|---|---|
| AC-01 | | Unit / API integration / mobile / device / review docs | | |
| AC-02 | | | | |

- Cách chạy hoặc thao tác thủ công: dùng lệnh thật khi đã có.
- Fixture/tài khoản/quyền/thiết bị cần:
- Test chưa chạy hoặc giới hạn dự kiến: ghi rõ.
- Bug/fix: thêm ca hồi quy phù hợp để kiểm tra lỗi ban đầu và hành vi lân cận.

## 10. Dependency, rủi ro và triển khai

- Depends on: URL issue thật; trong bản nháp có thể ghi BL-xxx.
- Blocks:
- Quyết định/dữ liệu/provider/thiết bị chưa có:
- Rủi ro/tác động API hoặc dữ liệu:
- Cách rollout/khôi phục nếu có thay đổi dữ liệu/môi trường:
- Điều kiện khiến ticket cần tách thêm:

## 11. Definition of Done và evidence

- [ ] AC đã đáp ứng, có expected/actual hoặc kết quả review.
- [ ] Đầu ra/PR được review; code merge theo quy trình repository nếu có code.
- [ ] Các kiểm tra liên quan đã chạy, kết quả ghi đúng pass/fail/chưa chạy.
- [ ] Docs/contract/schema/trace được cập nhật nếu thay đổi có ảnh hưởng.
- [ ] Không ghi secret, OTP, token, email riêng hoặc nội dung chat thật vào log/artifact công khai.
- [ ] Parent/Project cập nhật đúng phạm vi; không đóng cha nếu mới xong một ticket con.

Kết quả khi bàn giao:
- PR / commit / tài liệu:
- Bản cài hoặc artifact nếu có:
- Môi trường, phiên bản, thiết bị:
- Kết quả kiểm tra theo AC:
- Lỗi còn lại / phần chưa chạy:
- Người review và ngày review thực tế:
```

**Điều kiện Ready khác Done:** mẫu có đủ mục không có nghĩa đã Ready; dependency, Assignee, quyết định và tiêu chí phải có đầu vào thật. Review/Done chỉ cập nhật khi đã có evidence.

## 6. Phần bổ sung theo loại ticket

### 6.1. Với `feature`

Bổ sung user goal, nội dung chưa tồn tại, scope tối thiểu, R/US/UF và các ngoại lệ. Feature nền tảng như bootstrap/migration có thể ghi US=N/A và nêu ticket nghiệp vụ nào nó mở khóa. Không bịa một user story “Là developer” để lấp mã US.

### 6.2. Với `bug` — bắt buộc đủ dữ liệu tái hiện

Dùng body chung và thêm:

```md
## Bug report

- Môi trường: dev / test / pilot; phiên bản app/API hoặc commit; OS/thiết bị.
- Điều kiện trước: tài khoản A/B, quyền, trạng thái tin, block/session/permission liên quan.
- Tần suất: luôn xảy ra / x trên y lần / chưa rõ; ghi đúng quan sát.

Các bước tái hiện:
1. ...
2. ...
3. ...

Expected:
- ...

Actual:
- ...

Ảnh hưởng:
- Ai bị ảnh hưởng, có cách tránh tạm không?
- Có truy cập trái quyền, mất/trùng dữ liệu hay chặn luồng không?

Evidence:
- Log/request id/video/screenshot đã lọc dữ liệu riêng.
- Nếu chưa tái hiện được: bằng chứng hiện có và câu hỏi cần điều tra.

Ghi chú:
- Chưa biết root cause thì ghi chưa biết; không giả kết luận.
- AC phải chứng minh lỗi gốc không còn và các nhánh liên quan vẫn đúng.
```

Ví dụ title minh họa, **không phải lỗi đã xác nhận trong repository hiện tại**: `[bug][chat] Retry sau timeout tạo hai message cho cùng client_message_id`. Chỉ tạo bug này khi có actual/evidence.

### 6.3. Với `enhance` — cần baseline và mục tiêu

```md
## Enhancement proposal

- Chức năng hiện có và issue/PR/bản chạy chứng minh:
- Bất tiện hoặc số đo hiện tại:
- Lợi ích cho người dùng và căn cứ:
- Hành vi trước → sau:
- Mục tiêu/cách so sánh trước–sau được nhóm thống nhất:
- Phạm vi vẫn thuộc MVP hay là đề xuất sau pilot:
- Phần phải giữ đúng: quyền, dữ liệu riêng, null price, retry và trạng thái liên quan.
- Chi phí/dependency và lý do ưu tiên so với lỗi/feature bắt buộc:
```

Nếu baseline chưa tồn tại, đổi về feature hoặc để ở mức ý tưởng; chưa đưa To Do như một enhancement đã đủ đầu vào. BL-048/049 hiện thuộc trường hợp ý tưởng sau baseline/pilot.

### 6.4. Với `fix` — tránh trùng issue bug

```md
## Fix task

- Nguồn cần sửa: URL bug đã xác nhận hoặc bằng chứng lỗi kỹ thuật.
- Vì sao cần ticket fix riêng: nhiều owner/PR hoặc đầu ra kỹ thuật độc lập.
- Nếu bug nhỏ có thể sửa trong issue bug: không tạo ticket này.
- Root cause: đã xác minh / giả thuyết còn cần kiểm tra.
- Phần sửa cụ thể và phần không động tới:
- Ảnh hưởng dữ liệu/API/compatibility nếu có:
- Cách kiểm chứng lỗi gốc và hồi quy phù hợp:
- Phụ thuộc/PR liên quan:
- Điều kiện hoàn thành phần fix này:
- Điều kiện đóng bug cha: chỉ đóng khi đủ các phần sửa và nghiệm thu chung.
```

Ví dụ minh họa: `[fix][infra] Sửa cấu hình CI không kết nối được PostgreSQL test`. Cần có log/commit bị lỗi thật; chưa biết nguyên nhân thì điều tra, không tự kết luận DB hoặc CI đang hỏng.

## 7. Một issue feature đầy đủ — ví dụ BL-019

**Title:** `[feature][backend][BL-019] Publish ba loại tin và retry không tạo tin trùng`

Body dưới đây là bản nháp có AC cụ thể để copy; Assignee, URL dependency và ngày cần điền sau khi tạo issue thật. Trạng thái vẫn là Backlog.

```md
## 1. Mục tiêu

Cho người đã đăng nhập và có quyền đăng Bán/Tìm mua/Trao đổi bằng cùng cơ chế.
Tin chỉ được xem là đăng thành công khi server đã lưu; retry sau mất response không sinh tin thứ hai.

Hiện tại: đã có khung module ba tầng và tài liệu schema, chưa có API publish chạy được.

## 2. Quản lý

- Mã: BL-019.
- Loại/labels: feature, area:backend, priority:P1.
- Feature/module: listings; phối hợp media/catalog/moderation.
- Work category: Development.
- Milestone: M2.
- Status: Backlog.
- Assignee/reviewer: chưa phân công.
- Estimate: M tạm tính; rà lại khi chốt contract.
- Start/Target date: chưa chốt.

## 3. Truy vết

- Cha chính đề xuất: TASK-04 — Triển khai đăng và quản lý tin.
  Link trong wiki: https://github.com/L02-VibeCode/StudentMart/issues/5
- Related: TASK-03 — thiết kế dữ liệu/tương tác.
- R02/US02, R03/US03, R04/US04; liên quan R12/US12 ở retry publish.
- Flow: UF02a.
- Docs: docs/schema.md; docs/solution_tree.md;
  StudentMart.wiki/User-Stories.md; StudentMart.wiki/Critical-User-Flows.md.
- Dependency bản nháp: BL-002, BL-009, BL-012, BL-013, BL-016, BL-020.
  Thay bằng URL issue thật sau khi tạo.

## 4. Phạm vi

Trong phạm vi:
- Validate dữ liệu theo loại tin và lookup hợp lệ.
- Kiểm tra actor/session/quyền đăng hiện tại.
- Chỉ nhận asset READY đúng chủ/purpose cho ảnh tin.
- Tạo listing OPEN/VISIBLE, mapping ảnh và state history trong một transaction.
- Dùng owner_id + client_request_id và payload hash để đối chiếu retry.
- Response thành công theo contract được duyệt, sau commit.

Ngoài phạm vi:
- UI editor/bản nháp trên mobile, tìm kiếm, sửa/kết thúc tin.
- Tạo lại migration đã thuộc ticket DB, trừ phát hiện thay đổi cần review.
- Đơn hàng/thanh toán/giao vận/GPS/matching.
- Tự chốt giá tối thiểu/giới hạn ảnh hoặc thay chính sách chưa duyệt.

## 5. Vị trí mã dự kiến

- backend/src/modules/listings/presentation/: route/controller/validation.
- backend/src/modules/listings/business/: model/service/policy.
- backend/src/modules/listings/data/: repository.
- backend/src/business/workflows/publish-listing.workflow.ts.
- backend/tests/integration/: ca API/DB publish/retry và rollback.

Tên file cụ thể theo công cụ đã chọn; các đường dẫn trên là nơi sẽ đặt code.

## 6. Acceptance Criteria

- [ ] AC-01: Người đã login, chưa verify trường và có quyền vẫn publish được;
      không có session hoặc bị hạn chế đăng thì request bị từ chối, không tạo listing.
- [ ] AC-02: SALE/EXCHANGE thiếu ảnh READY đúng chủ bị từ chối;
      WANTED không có ảnh hoặc ngân sách vẫn hợp lệ theo contract.
- [ ] AC-03: Dữ liệu bắt buộc theo từng loại đúng; lookup không hợp lệ bị từ chối;
      không đổi ngân sách thiếu thành 0.
- [ ] AC-04: Request hợp lệ commit listing + ảnh + state history cùng lúc.
      Nếu một phần lỗi, không có tin công khai dở dang.
- [ ] AC-05: Cùng user và client_request_id với cùng payload sau timeout
      trả lại listing đã lưu; hai request đồng thời cũng chỉ tạo một listing.
- [ ] AC-06: Cùng key nhưng payload khác trả conflict; không sửa hoặc tạo thêm tin.
- [ ] AC-07: owner lấy từ session, không chấp nhận giả owner từ client;
      thành công chỉ trả sau commit và không lộ dữ liệu riêng.

## 7. Kiểm chứng

| AC | Ca | Mức kiểm tra |
|---|---|---|
| 01/07 | Login chưa verify; hết phiên; giả owner; restriction | API + PostgreSQL thật |
| 02/03 | Ba loại, thiếu ảnh, ảnh người khác, lookup sai, ngân sách NULL | Validation + API integration |
| 04 | Gây lỗi ở bước insert mapping/history, kiểm tra rollback | PostgreSQL integration |
| 05/06 | Commit rồi client mất response; retry và request đồng thời | API/DB concurrency |

Dùng DB test và dữ liệu giả; ghi lệnh chạy thực tế sau khi có manifest.
Không dùng fixture userId cố định làm phương án phân quyền production.

## 8. Dependency và rủi ro

- Chỉ To Do sau khi contract/quy tắc ở BL-002 và các dependency đã đáp ứng.
- FK/UQ/trigger đã có ở migration liên quan; nếu thiếu, ghi thay đổi rõ để review.
- Asset có thể thay trạng thái hoặc bị gỡ trong lúc publish: dùng khóa/transaction theo schema.
- Không reset DB hoặc tự apply migration vào môi trường dùng chung.

## 9. Done và evidence

- [ ] AC-01…AC-07 đạt, kết quả test ghi rõ.
- [ ] PR được review và merge theo quy trình repository.
- [ ] Contract/schema/wiki cập nhật nếu phát sinh thay đổi được duyệt.
- [ ] Ghi PR, commit, test command/environment/result và giới hạn còn lại.
- [ ] Cập nhật ticket con/Project đúng phạm vi; TASK-04 còn các phần sửa/kết thúc tin,
      không đóng cha chỉ vì publish đã xong.
```

## 8. Quản lý bug/fix trong quá trình implement

1. Nhận lỗi → kiểm tra trùng issue → ghi expected/actual, môi trường và evidence.
2. Triage với tiêu chí ảnh hưởng. Lỗi quyền riêng tư/chặn luồng cần ưu tiên phù hợp; không gán P0 cho mọi lỗi.
3. Với bug nhỏ, một owner xử lý ngay trong issue bug và có PR sửa; không mở thêm fix ticket.
4. Với bug lớn, giữ bug làm đầu mối, tách fix theo phần có owner/AC rõ. Link cha/con và dependency; một fix Done không tự đóng toàn bug.
5. Kiểm tra lỗi gốc và nhánh lân cận có ý nghĩa; nếu không tái hiện được, ghi giới hạn thay vì đánh dấu pass.
6. Review PR/evidence rồi cập nhật Project. Hủy/trùng ghi lý do; không tính thành số feature hoàn tất.
7. Không phát hành pilot khi còn lỗi chặn chuỗi chính hoặc truy cập sai quyền theo điều kiện wiki.

## 9. Theo dõi issue đã tạo

Dùng bảng này để đối chiếu mã kế hoạch và Issue thật; thêm dòng khi tạo, không cần lập sẵn 49 dòng trống.

| Mã BL | URL issue thật | TASK cha chính / Related | Assignee | Status xác nhận trên Project | Ghi chú dependency |
|---|---|---|---|---|---|
| Chưa ghi nhận | Chưa đối chiếu/tạo trong công việc này | — | — | Chưa xác nhận | Nhóm điền sau khi thao tác GitHub |

Trước mỗi buổi làm việc, rà To Do/dependency và lỗi ưu tiên. Sau mỗi đầu ra, cập nhật PR/test evidence. Không dùng số ticket đã tạo/đóng làm phần trăm hoàn thành sản phẩm.


