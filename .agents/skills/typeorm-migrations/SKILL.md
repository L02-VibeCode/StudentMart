---
name: typeorm-migrations
description: Sinh, review, apply và kiểm tra migration TypeORM cho backend API NestJS/PostgreSQL của StudentMart bằng scripts/add.ps1, up.ps1 và check.ps1.
---

# StudentMart TypeORM migrations

Đọc `.codex/project-context.md` từ repository root và kiểm tra entity/DataSource thực tế. Database là `student-mart`, cấu hình qua `backend/.env` và `DATABASE_URL`; không in hoặc ghi lại credentials.

## Nguồn schema

- Entity hiện có: `backend/src/modules/accounts/business/account.entity.ts`.
- DataSource: `backend/src/shared/database/data-source.ts`.
- Options: `backend/src/shared/database/database-options.ts`.
- Migration TypeScript: `backend/src/shared/database/migrations/`.
- CLI build trước rồi dùng DataSource/migrations JavaScript trong dist.
- Giữ `synchronize: false` và `migrationsRun: false`.

## Quy trình

1. Đối chiếu entity với yêu cầu nghiệp vụ; nếu người dùng yêu cầu duyệt entity trước, trình bày entity trước khi sửa/apply.
2. Sửa entity, sinh migration bằng lệnh dưới. Tên dùng chữ cái đầu, tiếp theo chữ/số/underscore.
3. Đọc cả up/down, kiểm tra mất dữ liệu, constraints, indexes, enum và SQL không liên quan. Không sửa lại migration đã apply; tạo migration tiếp theo.
4. Apply khi task đã cho phép thay đổi database, rồi check schema và test phù hợp.

Chạy từ root bằng PowerShell:

```powershell
.\scripts\add.ps1 AddAccountProfile
.\scripts\up.ps1
.\scripts\check.ps1
pnpm --filter studentmart-backend run migration:show
pnpm --filter studentmart-backend test:integration
```

- `add.ps1`: so sánh entity với database và sinh file; không apply. Nếu không có schema change, TypeORM trả code 1 và không cần migration rỗng.
- `up.ps1`: tạo student-mart nếu thiếu, sau đó apply migration pending.
- `check.ps1`: chỉ đọc kết nối, bảng, migration history, pending và schema drift; code 1 báo lỗi hoặc chưa đồng bộ.
- `migration:show`: hiển thị trạng thái migration, không xuất SQL.
- Revert chỉ khi yêu cầu cho phép; down của migration tạo bảng sẽ xóa bảng/dữ liệu.

Nếu execution policy chặn, gọi `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/check.ps1` hoặc thay bằng script cần chạy. Không có cờ no-build/connection override ở các wrapper hiện tại. Lỗi mạng/quyền không phải lý do để bật synchronize hay reset database.

## Xác minh

Chạy typecheck/build và test theo ảnh hưởng. Integration test phải giới hạn dữ liệu thử bằng transaction/cleanup; không tự chạy migration trong test. Báo tên migration, thay đổi schema, database đích và các check đã thực hiện; không khẳng định đã apply nếu chỉ sinh file.

## Nhận công việc từ ticket

Khi được giao #ticketid hoặc sub-ticket, đọc ../ticket-delivery/SKILL.md và root AGENTS.md để khám phá quan hệ, phân công và bàn giao. Agent con chỉ xử lý ownership được giao trên nhánh chung; báo AC/test/giới hạn cho root, không tự tạo PR/merge hoặc đổi trạng thái ngoài phân công. Skill này vẫn chịu trách nhiệm chuyên môn nêu trên.

