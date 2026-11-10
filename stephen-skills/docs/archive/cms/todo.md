# CMS Implementation Progress

## Current Focus

Active tasks (keep to 3–5; update at end of each session). Full checklist below.

1. Leave auth & identity — replace hardcoded `userId`, protect `GET /api/leaves/all` with admin policy (section 2, code review follow-up)
2. Leave decisions + tests — AM/PM overlap rule, cross-year `quotaYear`, duplicate/half-day/cross-year tests
3. Dashboard — `Announcement` backend then widgets (`dashboard-design.md` ready)

## Maintenance

- [x] Add root README with verified local development, testing, and release instructions (2026-11-01)

---

## Priority Order

**Phase 1 — Core HR (current)**
1. Asset Management - Enhancements to existing
2. Leave Management - Core employee feature
3. Employee Management - Enhancements deferred
4. Dashboard - Central hub

**Phase 2 — Outsourcing Essentials**
5. Holiday Calendar - Feeds leave balance and OT eligibility
6. Overtime (OT) Management - OT requests, approval, compensation
7. Timesheet - Daily work log, billable vs non-billable hours

**Phase 3 — People & Projects**
8. Project & Client Management - Projects, client assignments, employee allocation
9. WFH / Remote Work Tracking - Request and log work-from-home days
10. Onboarding Checklist - New hire task tracking

**Phase 4 — Self-Service & Reporting**
11. Company Directory & Org Chart - Searchable phonebook, manager hierarchy
12. Document Vault - Employment contracts, NDAs, salary letters (upload/view)
13. Performance Reviews - Periodic review cycles with ratings
14. Skills & Certification Matrix - Skills per employee, expiry tracking
15. Reports & Analytics - Leave utilization, headcount, project allocation

---

## Features

### 0. Admin — Lookup List Management *(2026-10-25 — complete, pending manual browser click-test)*
- [x] Backend CRUD (Create/Update/Delete, Name only) for `DeviceType`, `Supplier`, `Place`, `AssetType` — `Result<T>`/`ResultCode.BusinessRuleViolation` on duplicate name or FK-in-use delete, `EntityNotFound` on missing id
- [x] New `PlacesController` (previously GET-only via other services, no dedicated controller)
- [x] `/admin` section: sidebar group + tab-shell layout (`admin.vue`, mirrors `/settings`), one page per entity via generic `LookupManager.vue` (search, add/edit modal, delete-confirm modal)
- [ ] Manual browser click-test (add/edit/delete, search, error toasts) — not done this session, no browser tool available

### 1. Asset Management (Enhancements)
- [x] **Devices**
  - [x] Admin SPA: index (`/devices`), detail + assignment history, create/edit, sidebar; Assignment button stub (`console.log('wip')`) when no owner *(2026-03-29)*
  - [x] Add filter by status (Available, InUse, etc.) on device list *(2026-03-31 — UTabs + `statuses` query; matches `DeviceStatus`)* 
  - [x] Server-side column sort on index (`sort` / `dir` query params; SPA wiring) — [oclockvn/work#5](https://github.com/oclockvn/work/issues/5) *(2026-03-31)*
  - [x] Add filter by device type *(2026-10-25 — `USelectMenu` multi-select from `GET /api/DeviceTypes`; backend `DeviceQuery.DeviceTypes` already existed)*
  - [x] Add filter by assigned/unassigned *(2026-10-25 — tri-state `UTabs`; new `DeviceQuery.Assigned` bool, filters via `Device.Users.Any(du => du.IsActive)`)*
  - [x] Import devices from CSV — backend *(2026-10-25 — `POST /api/devices/import`, `DeviceService.ImportFromCsvAsync`, shared `CsvImportParsers`, `IDeviceTypeService.FindOrCreateManyAsync`; tests in `DeviceImportTest`, not yet run)*
  - [x] Import devices from CSV — frontend *(already implemented — `devices.vue` import modal, `UFileUpload`, posts to `POST /api/devices/import`)*
  - [x] Show real assigned devices on user profile *(2026-10-25 — new `GET /api/DeviceAssignments/user/{userId}` + `IDeviceAssignmentService.GetActiveDevicesByUserAsync`; `user-details.vue` "Assigned Devices" card now lists real active `DeviceUser` rows instead of the always-empty mocked `userDetail.assets`)*
  - [x] Remove dead Furniture-to-user mock column *(2026-10-25 — furniture has no user-assignment concept in backend; simplified card to single-column device list with polished empty state, per `/ui-ux-pro-max` review)*
  - [x] Cross-link devices ↔ users *(2026-10-25 — device row on `user-details.vue` is a `RouterLink` to `/devices/{id}`; device-detail "Current owner" links to `/users/{userId}` — required adding `UserId` to `DeviceUserRef` record, which was previously only `DeviceUser.Id`)*
- [x] **Furniture**
  - [x] Index page (`/furniture`): search, server sort, pagination, `UTabs` status filter; backend `FurnitureStatus`, `FurnitureQuery.Statuses`, EF migration `AddFurnitureStatus` *(2026-03-31)*
  - [x] Add filter by location *(2026-10-25 — `USelectMenu` multi-select from new `GET /api/furniture/locations` lookup; new `FurnitureQuery.Locations string[]`, filters on free-text `Furniture.Place`)*
  - [x] Add filter by asset type *(2026-10-25 — `USelectMenu` multi-select from `GET /api/asset-types`; backend `FurnitureQuery.AssetTypes` already existed)*
  - [x] Import furniture from CSV *(2026-10-25 — frontend: `UModal` + `UFileUpload` on `furniture.vue` posting to `POST /api/furniture/import`; backend already complete)*

### 2. Leave Management
- [x] **Backend** *(per-day lines — complete)*
  - [x] Create `LeaveDayType` enum
  - [x] Create `LeaveStatus` enum
  - [x] Create `LeaveRequest` entity
  - [x] Add nav collection to `User` entity
  - [x] Create `LeaveRequestConfiguration`
  - [x] Register `DbSet<LeaveRequest>` in `ApplicationDbContext`
  - [x] Create `LeaveIndexModel.cs` DTOs (`CreateLeaveRequest.Days`, `LeaveRequestDayDto`, etc.)
  - [x] Create `LeaveIndexService` — balance from lines, session overlap, create with `Days`
  - [x] Register `AddLeaveIndexModule()` in DI
  - [x] Create `LeavesController`
  - [x] Add EF migration (`20260326155833_AddLeaveRequest`)
  - [x] `LeaveRequestDay` entity + `LeaveRequestDays` nav + `LeaveRequestDayConfiguration` + `DbSet<LeaveRequestDay>`
  - [x] EF migration `AddLeaveRequestDays` — table + backfill; header `DayType` retained for legacy/display
- [x] **Frontend** *(per-day UI — complete)*
  - [x] Create `leave-day-type.enum.ts`
  - [x] Create `leave-status.enum.ts`
  - [x] Create `leave_index` module (model)
  - [x] `user-details.vue` — leave list for profile user (`GET /api/leaves/all?userId=`), balance + cancel when viewing current user (placeholder id `1`)
  - [x] Create `leaves.vue` — admin all employees (`GET /api/leaves/all`)
  - [x] Create `leave-new.vue` — add/remove day rows (max 5), paid/unpaid preview
  - [x] Register `/leaves`, `/leaves/new` routes; `/users/:id` for per-user leaves
  - [x] Sidebar: `Leaves` → `/leaves` in `client/src/App.vue`
- [x] **Tests**
  - [x] `LeaveIndexServiceTest.cs` — integration tests; requires Docker for Testcontainers
- [x] **Validation** *(in service)*
  - [x] Max 5 **lines** per request
  - [x] Unique dates; session overlap vs approved lines
  - [x] Future dates (UTC)
  - [x] Auto paid/unpaid from quota year (min line date)
- [x] **Design doc** — `docs/plans/leave-management-design.md` updated for `LeaveRequest` + `LeaveRequestDay` (2026-03-28)
- [ ] **Code review follow-up** *(2026-03-28 — production readiness)*
  - [ ] **Critical — Auth & identity:** Add authentication; resolve current user id (replace hardcoded `userId` / `// UNDONE: use current user` in `LeavesController` and services). *(blocked: backend auth infra — Firebase JwtBearer, `AuthService`, `HttpContextUserResolver` now reads real claims — landed 2026-10-25; frontend Firebase wiring (login page, auth store, router guard, `UserMenu`) also landed 2026-10-25 — see `docs/plans/progress.md`; still pending: real Firebase project config in `client/src/firebase.ts`/`appsettings.json`, `[Authorize]` retrofit onto `LeavesController`/others; `AuthServiceTest.cs` (qa-engineer, plan step 4) landed 2026-10-25, 8/8 tests passing — see `docs/plans/progress.md`; 2026-10-27: every endpoint now requires auth (fallback policy); per-request user lookup cached 15 min in `AuthUserResolver`; `GET /api/auth/me` returns profile + roles/permissions (empty until role model exists); client sends Firebase token on all `/api/*` calls — see `docs/plans/progress.md`)*
  - [x] Add an opt-in Development-only authentication bypass for local frontend development (2026-11-01)
  - [ ] **Critical — Admin endpoint:** Protect `GET /api/leaves/all` with admin (or policy) authorization; do not expose all employees’ leave without auth.
  - [ ] **Important — AM vs PM overlap:** Decide product rule (superpowers plan: conflict; current code: AM+PM same date allowed across requests). Update plan or `SessionsConflict` + test.
  - [ ] **Important — Cross-year UX vs server:** Align `leave-new.vue` balance year with server `quotaYear` (e.g. `min` line year), or reject multi-year requests until paid-by-year logic exists; document in design doc.
  - [ ] **Important — `user-details.vue` cancel:** Uses `fetch` for cancel; keep pattern if moving logic to a composable.
  - [ ] **Important — Tests:** Duplicate dates in create payload; half-day overlap (e.g. approved PM vs new AM); cross-year create/balance if supported.
  - [ ] **Important — Concurrency:** Overlap is read-then-write — consider serializable transaction, DB constraint, or documented acceptable race for v1.
  - [ ] **Optional — HTTP:** Map `Result` failure codes to 4xx where API-wide convention allows.
  - [ ] **Minor — UX:** Surface `result.code` / server message on create failure in `leave-new.vue`.
  - [ ] **Minor — Performance:** Narrow overlap query to date range of new request instead of all approved lines for user.

### 3. Employee Management (Deferred)
- [x] User details page loads from `GET /api/users/{id}` (mock removed) *(2026-07-19)*
- [x] User edit form HR sections + PUT /api/users/{id} *(2026-07-19)*
- [x] Playwright local e2e (users list/details/edit smokes vs real API) *(2026-07-19)*
- [x] Playwright user-edit submit scenarios A–D (all / subset / minimal / no-op) *(2026-07-19)*
- [x] Integration-test seeding via ContextBulkExtension (`BulkUpsertAsync` / `BulkInsertAsync` + `IdentityOutput`) *(2026-07-26)*
- [ ] Avatar upload
- [ ] Department field
- [ ] Position/Job title field
- [ ] Hire date field
- [ ] Manager hierarchy
- [ ] Emergency contact
- [ ] Address
- [x] **Import Employees from CSV** *(2026-10-27 — specced in `employee-management-design.md`, "Import Employees from CSV" section; task breakdown added by tech-lead in "Implementation Tasks" subsection same day — read that subsection directly, it has exact file paths/signatures)*
  - [x] **Backend** *(2026-10-27 — module placement: `Modules/UserIndex/`, not `Services/` — User already uses the module pattern)*
    - [x] `Modules/UserImport/UserImportModel.cs` — `UserImportResult`, `UserImportRowError`, `UserImportCsvRow`/`UserImportCsvRowMap` (CsvHelper), `RequiredHeaders` = `["Full Name", "Email"]`
    - [x] `Modules/UserIndex/UserIndexService.cs` (edit) — marked class `partial`, added `ImportFromCsvAsync` to `IUserIndexService`
    - [x] `Modules/UserIndex/UserIndexService.Import.cs` (new, `partial class UserIndexService`) — `ImportFromCsvAsync`: parse → bulk-resolve existing users by `Email` (case-insensitive, projection includes all updatable fields for partial-update merge) → build/validate entities → `BulkUpsertAsync` matching on `Email`
    - [x] `UsersController` — `POST /api/users/import`, multipart, same read pattern as `DevicesController.Import`
    - [x] No `ServiceCollectionExtension` change needed — rides on existing `AddUserIndexModule()` registration
  - [x] **Frontend** *(2026-10-27 — frontend-dev)*
    - [x] `modules/user_index/userIndex.model.ts` (edit) — add `UserImportResult`/`UserImportRowError` types (no new `user_import` module, follow Device's precedent of keeping import types in the index module)
    - [x] `users.vue` — Import button + `UModal`/`UFileUpload`, posts to `/api/users/import`, same pattern as `devices.vue`/`furniture.vue`; shows created/updated/skipped/error-list summary
  - [x] **Validation** *(2026-10-27 — implemented in `UserIndexService.Import.cs`)*
    - [x] `Email` required and well-formed — missing/invalid → row error, no create/update
    - [x] `Username` auto-generated from `Email` local-part when blank on create; collision with existing `Username` **or** another row's auto-generated username earlier in the same file → row error ("Username already in use"), no suffix-retry
    - [x] `Status` defaults to `Active` on create when blank; blank on update leaves existing value untouched
    - [x] `DateOfBirth`/`Status` unparseable values → row error naming the column, rest of file still processes
    - [x] Missing required headers (`Full Name`, `Email`) → whole import rejected upfront via `CsvImportHeaders.EnsureRequired`
    - [x] Test Tasks (qa-engineer) *(2026-10-27 — `api/Cms.Tests/UserIndexServiceImportTest.cs`, 8 tests, all passing)*
  - [x] **Import Employees from CSV — v2 widening** *(2026-10-27 — re-scoped from real sample-file audit, all 9 Open Questions in `employee-management-design.md` answered; see that doc's resynced "Implementation Tasks" section for exact file paths/signatures — this does not reopen any `[x]` item above, it rewrites the shipped importer's internals)*
    - [x] **Schema** — `ContractType`/`WorkLocation` enums (new); widen `ContactType` (verified against `samples/sbox db - copy.csv`: added Mother/Father/Sibling/Friend/Partner); `Bank` entity + config + service (new); `Contact` +`IsEmergencyContact`/+`Address`; `User` +`Contract`/+`Location`/+`ContractRole`/+`EmployeeCode`(unique)/+`BankId`/+`BankAccountNumber`, -`BankAccount`, -4 `EmergencyContact*` scalars; one EF migration *(hand-written + snapshot edited by hand — no .NET SDK in the authoring session; regenerate/verify with `ef.ps1` before merging)*
    - [x] `CsvImportParsers.ParseFlexibleDate` — add `"dd MM yyyy"` format
    - [x] `TeamIndexService` (or sibling) — new `FindOrCreateManyAsync(names)` helper, mirrors `DeviceTypeService`
    - [x] **Backend** — rewrite `UserImportModel.cs` (`.Index(...)` mapping, not `.Name(...)`; confirm exact column indices against real file first); rewrite `UserIndexService.Import.cs` (email company/personal fallback, Contract/Location/Status 3-way derive, divider-row silent skip, Bank/Team resolve, Contact emergency-contact rows); migrate `UserIndexService.GetAllAsync`/`GetByIdAsync`/`UpdateAsync` off dropped fields onto `Contact`/`Bank`; register `IBankService` in `ServiceCollectionExtension`
    - [x] **Frontend** — `userIndex.model.ts` type changes; `user-edit.vue`/`user-details.vue` migrate off dropped fields onto Contact-based emergency-contact UI + Bank select + account number
    - [x] **Tests** *(written, not run: no .NET SDK in the authoring session)* — DOB silent-null (flips old row-error test), Contract/Location/Status derivation (bare `Exit`, `-AU` combos), divider-row skip, email fallback, Team auto-create + idempotent reimport, Bank auto-create, unmapped-relationship → `Other`

### 4. Dashboard
- [ ] **Backend**
  - [ ] Create `Announcement` entity
  - [ ] Create `AnnouncementConfiguration`
  - [ ] Create `AnnouncementType` enum
  - [ ] Create `AnnouncementModel` DTOs
  - [ ] Create `AnnouncementService`
  - [ ] Create `AnnouncementsController`
  - [ ] Add EF migration
- [ ] **Frontend**
  - [ ] Create announcement module (models, api)
  - [ ] Update `index.vue` with dashboard widgets
  - [ ] Create News widget component
  - [ ] Create Notices widget component
  - [ ] Create Events widget component
  - [ ] Create `announcements.vue` admin page
  - [ ] Create `announcement-edit.vue` form
- [ ] **Seed Data**
  - [ ] Add sample announcements

---

## Phase 2 Features (Needs Design Docs)

### 5. Holiday Calendar
- [ ] **Design doc** — `holiday-calendar-design.md`
- [ ] **Backend**
  - [ ] Create `PublicHoliday` entity
  - [ ] Create `HolidayCalendarService`
  - [ ] Create `HolidaysController`
  - [ ] Add EF migration
- [ ] **Frontend**
  - [ ] Create `holidays.vue` — admin calendar view
  - [ ] Integrate with leave balance (exclude holidays from working days)

### 6. Overtime (OT) Management
- [ ] **Design doc** — `overtime-design.md`
- [ ] **Backend**
  - [ ] Create `OvertimeRequest` entity
  - [ ] Create `OvertimeStatus` enum
  - [ ] Create `OvertimeService`
  - [ ] Create `OvertimeController`
  - [ ] Add EF migration
- [ ] **Frontend**
  - [ ] Create `overtime.vue` — my OT requests
  - [ ] Create `overtime-request.vue` — new OT request form
  - [ ] Admin view: all OT requests with approval action

### 7. Timesheet
- [ ] **Design doc** — `timesheet-design.md`
- [ ] **Backend**
  - [ ] Create `TimesheetEntry` entity (date, hours, project, billable flag)
  - [ ] Create `TimesheetService`
  - [ ] Create `TimesheetController`
  - [ ] Add EF migration
- [ ] **Frontend**
  - [ ] Create `timesheet.vue` — weekly grid view
  - [ ] Admin view: timesheet by employee and project

---

## Phase 3 Features (Needs Design Docs)

### 8. Project & Client Management
- [ ] **Design doc** — `project-management-design.md`
- [ ] **Backend**
  - [ ] Create `Client` entity
  - [ ] Create `Project` entity (linked to Client)
  - [ ] Create `ProjectMember` join entity (User ↔ Project with role)
  - [ ] Create services + controllers
  - [ ] Add EF migration
- [ ] **Frontend**
  - [ ] Create `projects.vue` — project list
  - [ ] Create `project-detail.vue` — members, timeline
  - [ ] Create `clients.vue` — client list

### 9. WFH / Remote Work Tracking
- [ ] **Design doc** — `wfh-design.md`
- [ ] **Backend**
  - [ ] Create `WfhRequest` entity
  - [ ] Create `WfhService`
  - [ ] Create `WfhController`
  - [ ] Add EF migration
- [ ] **Frontend**
  - [ ] Create `wfh.vue` — my WFH log
  - [ ] Create `wfh-request.vue` — request form
  - [ ] Admin view: team WFH calendar

### 10. Onboarding Checklist
- [ ] **Design doc** — `onboarding-design.md`
- [ ] **Backend**
  - [ ] Create `OnboardingTemplate` and `OnboardingTask` entities
  - [ ] Create `OnboardingService`
  - [ ] Add EF migration
- [ ] **Frontend**
  - [ ] Create `onboarding.vue` — checklist view for HR/manager
  - [ ] Create checklist progress component

---

## Phase 4 Features (Backlog)

### 11. Company Directory & Org Chart
- [ ] **Design doc** — `directory-design.md`
- [ ] Searchable employee phonebook with photo, role, department
- [ ] Visual org chart using manager hierarchy (requires Employee Management enhancements)

### 12. Document Vault
- [ ] **Design doc** — `document-vault-design.md`
- [ ] Upload and categorize employee documents (contracts, NDAs, salary letters)
- [ ] Per-employee access control
- [ ] Integrates with S3 (AWSSDK already in project)

### 13. Performance Reviews
- [ ] **Design doc** — `performance-review-design.md`
- [ ] Review cycles (quarterly/annual)
- [ ] Self-assessment + manager assessment
- [ ] Rating scale and goals tracking

### 14. Skills & Certification Matrix
- [ ] **Design doc** — `skills-design.md`
- [ ] Skills per employee with proficiency level
- [ ] Certifications with expiry date + alerts
- [ ] Skills search (for staffing proposals)

### 15. Reports & Analytics
- [ ] **Design doc** — `reports-design.md`
- [ ] Leave utilization by department / year
- [ ] Headcount trend
- [ ] Project allocation (who is on what)
- [ ] OT hours by employee / month

---

## Service test coverage *(2026-07-26 — complete)*

- [x] `TeamIndexServiceTest.cs` — 11 tests for `ITeamIndexService`
- [x] `LookupServicesTest.cs` — AssetType / DeviceType / Supplier GetAll + cache clear
- [x] `DeviceAssignmentServiceTest.cs` — assign / return / history / availability
- [x] `DeviceServiceTest.cs` — CRUD + status counts (no file upload; manual service + NoOp FileService)
- [x] `FurnitureServiceTest.cs` — CRUD (no UploadImage; manual service + NoOp IStorage)
- [ ] Follow-up: `FileService` / upload paths — need InMemoryStorage + fixture DI

---

## Design Documents

- [x] `employee-management-design.md`
- [x] `asset-management-design.md`
- [x] `leave-management-design.md`
- [x] `dashboard-design.md`
- [ ] `holiday-calendar-design.md`
- [ ] `overtime-design.md`
- [ ] `timesheet-design.md`
- [ ] `project-management-design.md`
- [ ] `wfh-design.md`
- [ ] `onboarding-design.md`
- [ ] `directory-design.md`
- [ ] `document-vault-design.md`
- [ ] `performance-review-design.md`
- [ ] `skills-design.md`
- [ ] `reports-design.md`
