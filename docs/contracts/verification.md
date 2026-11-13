# TASK-16.01 — Bằng chứng kiểm chứng contract

Ngày kiểm tra: 2026-11-13 (Asia/Saigon). Phạm vi #83, BE #84 và FE #85; baseline bắt đầu từ `origin/main` commit `e9d79261`. Thực hiện trên Node 22.23.4, pnpm 10.34.3, Windows PowerShell. Sub-agent `frontend-dev` soạn và đối chiếu phần contract mobile với OpenAPI/model; đây là review kỹ thuật giữa các agent, chưa thay review của người phụ trách sản phẩm.

## Kết quả đã chạy

| Kiểm tra | Kết quả và giới hạn |
|---|---|
| Redocly CLI 2.78.0, lint OpenAPI 3.0.3 (minimal) | Hợp lệ, không có error. Một warning `no-server-example.com` do server local `http://localhost:3000/api/v1` được khai báo có chủ đích cho development; chưa có production URL để khai báo |
| Schema payload bằng yaml 2.9.1, Ajv 8.20.0 + ajv-formats 3.0.1 có sẵn trong node_modules | 40 ca đạt; chỉ validate object/schema cục bộ, không gọi backend/database |
| Operation và security boundary | 10 operationId duy nhất; register/login/public profile/catalog cho guest, me/avatar/logout kế thừa Bearer security |
| Đối chiếu contract mobile ↔ OpenAPI ↔ model | Đồng bộ field, envelope, UTC, null/omit, Unicode code-point length, rate-limit hai bucket, logout idempotent, restore offline và projection |
| `pnpm typecheck` | Cả backend và mobile đạt |
| `pnpm test` | 8 unit test hiện có đạt; đây là regression baseline, không chứng minh auth/profile API đã tồn tại |
| `git diff --check` | Đạt với các file thuộc ticket |

Lệnh lint tái chạy từ root:

```powershell
pnpm --package=@redocly/cli@2.78.0 dlx redocly lint docs/contracts/accounts.openapi.yaml --extends minimal
pnpm typecheck
pnpm test
git diff --check
```

## Ca payload đã đối chiếu

- Đăng ký: payload hợp lệ; reject role/verify/accountId/confirmPassword ngoài whitelist, email sai, password ngắn và displayName toàn khoảng trắng.
- PATCH: null hợp lệ cho lookup/bio; reject object rỗng, role/email/verify/accountId/avatarUrl ngoài whitelist, displayName null, bio quá dài và lookup ID sai định dạng UUID.
- Projection: private/public payload hợp lệ; public reject email, role, area, createdAt, passwordHash, token và private verification timestamp.
- Session/response: login token đúng shape hợp lệ, token quá ngắn bị reject; register response không nhận session.
- Error: envelope có field errors và requestId hợp lệ; reject stack trace ngoài schema.
- Verification: UNVERIFIED phải có school/verifiedAt null; VERIFIED phải có school và verifiedAt, không cho các tổ hợp mâu thuẫn; public không chứa verifiedAt.

Các giá trị fixture là dữ liệu tổng hợp phục vụ schema validation; không phải seed TASK-15 hay account trên server. Unicode normalization/trim được quy định ở model và phải kiểm thử runtime ở ticket triển khai; payload checks không chứng minh middleware/guard/rate-limit đã hoạt động.

## Chưa thực hiện trong #83

- Chưa tạo/apply migration hoặc sửa entity/database. Mô hình Account/AuthSession/profile và thứ tự migration mới là đặc tả cho ticket sau; migration nền hiện có được giữ nguyên.
- Chưa thêm auth/profile controller, SecureStore, UI, provider lưu ảnh hoặc dữ liệu lookup.
- Chưa chạy thiết bị/emulator, kiểm thử API end-to-end, database integration cho session mới hoặc merge PR #81.
- Dataset trường/khu vực TASK-15 và provider avatar vẫn cần đầu vào được xác nhận; đã chốt shape/hợp đồng tích hợp, chưa giả định có dataset/provider thật.
- Chưa tự đóng issue hoặc chuyển Done. Cần review baseline và dùng các ticket 16.02–16.10 để triển khai/kiểm chứng runtime.

## Bổ sung cho sub-ticket #84 / #85

Bộ schema checks trước đây chạy bằng lệnh tạm đã được lưu thành `tests/contracts/account-contract.test.cjs`, bổ sung thành **54 test** có thể tái chạy bằng `pnpm test:contracts`. Các package kiểm chứng được pin ở devDependencies root. `pnpm test` hiện chạy 54 contract tests và 8 unit test backend; cả 62 test cùng `pnpm typecheck` đã đạt khi hoàn thiện sub-ticket.

Đối chiếu từng tiêu chí, đầu vào còn chờ và trạng thái review xem [acceptance.md](acceptance.md). Kết quả review thiết kế và các chênh lệch cần xử lý ở ticket UI nằm trong [account-design-review.md](account-design-review.md). Không có migration/database/runtime UI được thay đổi trong đợt bổ sung này.
