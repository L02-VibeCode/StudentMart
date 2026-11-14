# TASK-16.06 — Hồ sơ cá nhân (#98/#99/#100)

Nhánh `feat/98-current-profile` bắt đầu từ `origin/main` sau PR #118. Backend-dev phụ trách #99, frontend-dev phụ trách #100; QA kiểm tra contract, danh tính và luồng mobile qua HTTP/PostgreSQL. Quyền truy cập hồ sơ dựa trên phiên server, không dựa vào `accountId` do client khai.

## Ma trận nghiệm thu

| Tiêu chí | Thay đổi/bằng chứng | Giới hạn |
|---|---|---|
| Xem đúng tài khoản hiện tại | GET `/api/v1/accounts/me`, mobile repository dùng phiên qua AuthCoordinator; test A/B và query `accountId` của B vẫn trả A | Không có endpoint private nhận accountId tùy ý |
| Tên và giới thiệu lấy từ database | Account.displayName/bio được projection whitelist, mobile load/retry đọc dữ liệu server | Sửa hồ sơ thuộc TASK-16.07; test cập nhật fixture DB, không giả đã có API edit |
| Thiếu avatar/giới thiệu có fallback | Profile screen có avatar thay thế và lời nhắc giới thiệu khi null | Avatar provider/upload chưa có; avatar khác null chưa nghiệm thu end-to-end |
| Trường tự khai và khu vực | DTO giữ `declaredSchool`/`area` theo contract; UI có trạng thái chưa bổ sung | Catalog/dataset/FK thực chưa triển khai; hiện server trả null, không seed danh mục giả |
| Trạng thái xác thực do BE cung cấp | UNVERIFIED với school/verifiedAt null khi chưa có nguồn TASK-18; UI giải thích tùy chọn và giới hạn tín hiệu | Không suy ra VERIFIED từ email đăng nhập; nguồn xác thực thật còn pending |
| Loading/lỗi/thử lại | Profile ViewModel quản lý trạng thái, hủy/loại response cũ; test mạng lỗi một lần rồi retry tới server thật | Đây là test model/HTTP; chưa xác minh cảm nhận UI trên điện thoại |
| A → B không lẫn dữ liệu | Model gắn với auth identity/epoch; test giữ response A thật trả trễ sau logout/login B | CredentialStore dùng adapter memory trong test; không thay bằng chứng native SecureStore |
| Không lộ mật khẩu/hash/token/nội bộ | Response key whitelist/no-store, assertions không có secret/session/internal fields | Token chỉ dùng trong request test và cleanup phiên; không ghi token vào tài liệu |
| Phiên hết hạn không còn profile riêng | Cập nhật expiry của fixture server rồi gọi qua mobile auth boundary → lỗi SESSION_EXPIRED, local guest/credential cleared | Không dùng fake clock thay kiểm tra server |
| Không thống kê tin đăng giả | Account contract không có listingCount; UI không tạo số liệu mẫu | Listing API/count thật thuộc task sở hữu |
| Điểm vào chỉnh sửa và xác thực | Có entry point với thông báo rõ chức năng chưa sẵn sàng | Không giả flow edit/verify đã hoàn tất; TASK-16.07/TASK-18 triển khai riêng |
| Theo thiết kế được cung cấp | Người dùng xác nhận dùng thư mục `design/`; FE đối chiếu ảnh profile `design/Pasted 2026-11-13 at 12.52.23 PM.png` và design system `design/Pasted 2026-11-13 at 12.42.04 PM.png` | Đây là ảnh tham chiếu local; chưa kết luận pixel parity trên thiết bị |

Không đánh dấu toàn bộ task Done chỉ từ UI/DTO/mocks. Trường/khu vực/avatar khác null, nguồn verify thật và kiểm tra native chưa đủ bằng chứng hiện tại. Ảnh local là nguồn thiết kế đã được người dùng chấp thuận; không gọi đó là đã truy cập Figma trực tiếp. PR chờ người dùng review/approve, không auto-merge.

## Kiểm thử tích hợp QA

`backend/tests/integration/mobile-profile.test.ts` dùng NestJS/Fastify nghe trên loopback với cổng ngẫu nhiên, PostgreSQL `student-mart`, production mobile AuthApi/AuthCoordinator/ProfileRepository/ProfileModel. Dữ liệu thử: hai Account email UUID `@example.invalid`, bio có giá trị cho A, bio null cho B. Mỗi test chỉ xóa AuthSession và Account fixture đã tạo; không reset/truncate database, không tự migrate.

- Hồ sơ A/B qua HTTP thật; cố khai accountId B/role ADMIN không đổi danh tính; JSON chỉ có field hợp đồng và `Cache-Control: no-store`.
- Mất mạng một lần khi đọc hồ sơ → error; thử lại → đúng dữ liệu DB.
- Giữ response A thật trong adapter transport rồi logout/login/load B; trả A trễ không thay profile B.
- Phiên hết hạn tại database → client nhận SESSION_EXPIRED, không giữ danh tính riêng hoặc credential.

Adapter network lỗi/độ trễ và credential memory chỉ mô phỏng boundary. Không gọi đây là kiểm thử thiết bị, avatar/media hoặc nhà cung cấp xác thực thật.

## Lệnh và kết quả

Chạy từ root sau khi migration của #99 đã được review/apply theo skill:

```powershell
pnpm --filter studentmart-backend exec vitest run tests/integration/mobile-profile.test.ts
pnpm typecheck
pnpm test
pnpm --filter studentmart-backend test:integration
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/check.ps1
pnpm --filter studentmart-mobile exec expo export --platform all --output-dir dist
```

Đã chạy focused QA integration ngày 2026-11-14: **3/3 PASS** qua PostgreSQL thật và production mobile model/repository. PowerShell hiện tại chặn `pnpm.ps1`, nên lệnh thực thi dùng `pnpm.cmd --filter studentmart-backend exec vitest run tests/integration/mobile-profile.test.ts`. Lần sandbox đầu bị EACCES kết nối DB; chạy lại có quyền mạng đã pass. Các lệnh tổng còn lại do root/BE/FE ghi bằng chứng riêng sau khi ghép source, không mặc định coi là pass.

Migration #99: `AddAccountBio1794646099502` thêm `Account.bio` nullable varchar(500). QA đã đọc SQL: up chỉ ADD bio, down DROP bio sẽ mất dữ liệu cột này nếu được cho phép revert. Backend agent xác nhận đã apply và check schema khớp, 4 migration đã apply/không pending; QA không tự apply/revert hay thay đổi migration đã chạy.

Theo yêu cầu người dùng, `.agents/` và `.github/` bị loại khỏi Git trên nhánh này. GitHub Actions không phải bằng chứng CI cho PR này; dùng kết quả chạy cục bộ được ghi rõ, không mô tả workflow cũ như đang kiểm tra commit mới.

## Checklist người dùng trên thiết bị

- [ ] Login A → Cá nhân thấy đúng tên/email/bio; không còn tên/ảnh/thống kê mẫu.
- [ ] Avatar/bio/trường/khu vực thiếu có trạng thái thay thế dễ hiểu; chưa verify không bị gắn nhãn vi phạm.
- [ ] Mất mạng khi mở hồ sơ → lỗi và nút thử lại; có mạng trở lại → tải được dữ liệu.
- [ ] Logout A → login B; Back/gesture không mở hồ sơ A; app foreground kiểm tra lại phiên.
- [ ] Kiểm tra chữ tiếng Việt, font scaling, safe area, vùng chạm và screen reader trên Android/iOS.
- [ ] Đối chiếu ảnh thiết kế đã duyệt với màn hình chạy thật; kiểm tra các provider/domain thực khi dependency sẵn sàng.
