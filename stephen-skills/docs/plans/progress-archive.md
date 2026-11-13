# Work Progress Archive

Older session logs (2026-03-26 → 2026-07-19), moved out of `progress.md` to keep it small. Do not load by default; grep when history is needed.

---

## 2026-03-26

### Session: Agent Team Setup + Feature Roadmap
**Agent:** pm (via orchestrator)
**Status:** Complete

- Created `.claude/agents/pm.md` — Product Manager agent definition
- Updated `CLAUDE.md` — added PM to routing table, updated workflow to 6 steps
- Updated `docs/plans/todo.md` — added Phase 2–4 feature suggestions (11 new features)
  - Phase 2: Holiday Calendar, Overtime, Timesheet
  - Phase 3: Project & Client, WFH, Onboarding
  - Phase 4: Directory, Document Vault, Performance Reviews, Skills Matrix, Reports

---

### Session: Leave Management — Backend
**Agent:** backend-dev
**Status:** Code complete. Migration blocked — must be run manually.

**Files created:**
- `api/Cms.Core/Enums/LeaveDayType.cs`
- `api/Cms.Core/Enums/LeaveStatus.cs`
- `api/Cms.Core/Db/Entities/LeaveRequest.cs`
- `api/Cms.Core/Db/Configurations/LeaveRequestConfiguration.cs`
- `api/Cms.Core/Modules/LeaveIndex/LeaveIndexModel.cs`
- `api/Cms.Core/Modules/LeaveIndex/LeaveIndexService.cs`
- `api/Cms.Api/Controllers/LeavesController.cs`

**Files modified:**
- `api/Cms.Core/Db/Entities/User.cs` — added `ICollection<LeaveRequest> LeaveRequests` nav property
- `api/Cms.Core/Db/ApplicationDbContext.cs` — added `DbSet<LeaveRequest> LeaveRequests`
- `api/Cms.Core/ServiceCollectionExtension.cs` — added `AddLeaveIndexModule()`

**Migration incident:**
- `dotnet ef migrations remove --no-build` ran against stale binary and deleted `20250904150404_DeviceTypeOptional` migration files
- Recovery: restored deleted files via `git checkout HEAD`; deleted the empty `20260326154318_AddLeaveRequest` migration files
- Migrations folder is now clean and matches HEAD

**Pending action (manual):**
Stop the running `Cms.Api` process, then run:
```
dotnet ef migrations add AddLeaveRequest --project api/Cms.Core --startup-project api/Cms.Api
```

**Known placeholder:** All controller actions use hardcoded `userId = 1`. Marked with `// UNDONE: use current user`.

---

### Session: Leave Management — Frontend
**Agent:** frontend-dev
**Status:** Complete

**Files created:**
- `client/src/models/leave-day-type.enum.ts` — enum + `LeaveDayTypeOptions` select array
- `client/src/models/leave-status.enum.ts` — enum + `LeaveStatusOptions` with null "All" entry
- `client/src/modules/leave_index/leave_index.model.ts` — `LeaveRequestDto`, `LeaveBalanceDto`, `CreateLeaveRequest`
- `client/src/pages/leaves.vue` — list + balance card + status/year filters + cancel action
- `client/src/pages/leave-new.vue` — form with date pickers, 5-day guard, paid/unpaid preview

**Files modified:**
- `client/src/main.ts` — added `/leaves` and `/leaves/new` routes

**Notes:**
- Balance card re-fetches alongside the list whenever filters change
- `willBePaid` computed preview compares request's `totalDays` against fetched balance
- Form uses Valibot + `v.toJSONSchema()` pattern (matches `user-edit.vue`)
- Dates use `CalendarDate` → string sync via watcher (matches `client/AGENTS.md` date picker pattern)

---

### Session: Leave Management — Tests
**Agent:** qa-engineer
**Status:** NOT STARTED
**Blocked by:** Migration must be applied before tests can run

**Planned:** 19 integration tests in `api/Cms.Tests/LeaveIndexServiceTest.cs`
Covering: AC1–AC9 (see tech-lead breakdown from this session)

---

## 2026-03-28

### Session: Leave Management — Quota year fix + integration tests
**Agent:** Auto (orchestrator)
**Status:** Complete (run `dotnet test api/Cms.Tests/Cms.Tests.csproj` with Docker running to verify)

**Files created:**
- `api/Cms.Tests/LeaveIndexServiceTest.cs` — five integration tests via `BaseTestFixture` + Testcontainers

**Files modified:**
- `api/Cms.Core/Modules/LeaveIndex/LeaveIndexService.cs` — paid/unpaid uses `request.StartDate.Year` for balance (aligned with design)
- `docs/plans/leave-management-design.md` — correct module file paths; paid logic references `YEAR(StartDate)`
- `docs/plans/todo.md` — migration + tests checkboxes
- `docs/superpowers/plans/2026-03-28-leave-request-adjustments.md` — plan already on disk from prior session

**Pending actions:**
- Start Docker locally, then run `dotnet test api/Cms.Tests/Cms.Tests.csproj` to execute integration tests.

**Notes:**
- `GET /api/leaves/all` remains unauthenticated; defer `[Authorize]` / admin policy until auth is implemented.
- Supersedes progress note “Leave Management — Tests NOT STARTED” from 2026-03-26 for `LeaveIndexServiceTest`.

---

### Session: Leave per-day — Task 2 (entity + migration + backfill)
**Agent:** backend-dev
**Status:** Complete (apply migration to DB when ready: stop API if it locks the database)

**Files created:**
- `api/Cms.Core/Db/Entities/LeaveRequestDay.cs` — `Id`, `LeaveRequestId`, `Date`, `DayType`; nav to `LeaveRequest`
- `api/Cms.Core/Db/Configurations/LeaveRequestDayConfiguration.cs` — table `LeaveRequestDays`, cascade delete FK, unique `(LeaveRequestId, Date)`
- `api/Cms.Core/Migrations/20260328070010_AddLeaveRequestDays.cs` — creates table; SQL backfill via recursive CTE (one row per day in `[StartDate, EndDate]` using parent `DayType`)

**Files modified:**
- `api/Cms.Core/Db/Entities/LeaveRequest.cs` — `ICollection<LeaveRequestDay> LeaveRequestDays`
- `api/Cms.Core/Db/ApplicationDbContext.cs` — `DbSet<LeaveRequestDay>`
- `api/Cms.Core/Migrations/ApplicationDbContextModelSnapshot.cs` — model snapshot (from `dotnet ef migrations add`)

**Pending actions:**
- Stop `Cms.Api` if running, then `dotnet ef database update --project api/Cms.Core --startup-project api/Cms.Api` (or let deploy pipeline apply migration).

**Notes:**
- `LeaveRequests.DayType` is **not** dropped; migration comments note follow-up for API/service. `MAXRECURSION 32767` guards long spans; product cap is 5 days.

---

### Session: Leave per-day — Task 8 (design doc + todo alignment)
**Agent:** Auto (orchestrator)
**Status:** Complete

**Files modified:**
- `docs/plans/leave-management-design.md` — per-day data model (`LeaveRequest` + `LeaveRequestDay`), balance from line weights, validation/overlap, API `days[]` examples, UI bullets, file table
- `docs/plans/todo.md` — Leave Management marked complete; bullets aligned with per-day implementation

**Notes:**
- Supersedes older “range-only” wording; header `StartDate`/`EndDate`/`TotalDays` documented as denormalized from lines.

---

### Session: Leave list on user profile (remove dedicated “my leaves” page)
**Agent:** Auto
**Status:** Complete

**Files removed:**
- `client/src/pages/my-leaves.vue`

**Files modified:**
- `client/src/pages/user-details.vue` — API leave table (`/api/leaves/all?userId=`), balance + New request + Cancel when profile id is `1` (placeholder)
- `client/src/main.ts`, `client/src/App.vue`, `client/src/pages/leaves.vue`, `client/src/pages/leave-new.vue` — no `/my-leaves`; sidebar **Leaves**; redirects to `/users/1`
- `docs/plans/leave-management-design.md`, `docs/plans/todo.md`

---

### Session: GitHub Actions — dotnet test on PRs
**Agent:** Auto
**Status:** Complete

**Files created:**
- `.github/workflows/dotnet-test.yml` — `pull_request` on `ubuntu-latest`, .NET 10 SDK, `dotnet test Cms.slnx -c Release` (NuGet cache omitted: no `packages.lock.json`; see `setup-dotnet` cache requirements)

**Notes:**
- Aligns with `docs/superpowers/specs/2026-03-28-github-actions-dotnet-test-design.md`. Testcontainers use the runner’s Docker.

---

## 2026-03-29

### Session: Devices admin UI (Asset Management)
**Agent:** Cursor (subagent-driven plan execution)
**Status:** Complete

**Files created:**
- `client/src/models/device-status.enum.ts` — mirrors backend `DeviceStatus`; options for selects/filters
- `client/src/modules/device_index/device_index.model.ts` — DTO types for list/detail/update
- `client/src/pages/devices.vue` — paged list with current owner
- `client/src/pages/device-detail.vue` — detail, history table, Assignment stub
- `client/src/pages/device-new.vue` — multipart create
- `client/src/pages/device-edit.vue` — JSON update
- `docs/superpowers/plans/2026-03-29-devices-admin.md` — implementation plan (already present)

**Files modified:**
- `client/src/main.ts` — routes `/devices`, `/devices/new`, `/devices/:id`, `/devices/:id/edit`
- `client/src/App.vue` — sidebar **Devices**
- `docs/plans/todo.md` — devices admin checklist update

**Pending actions:**
- Run API + `pnpm dev` in `client` and smoke-test list/detail/create/edit
- List filters (status, type, assigned/unassigned) still open per `todo.md`

**Notes:**
- Furniture admin remains separate; assignment flow intentionally `console.log('wip')` per spec
- `PUT /api/devices/{id}` returns `Result<int>`; client navigates to detail on success

---

## 2026-03-31

### Session: Furniture index — implementation
**Agent:** Cursor
**Status:** Complete

**Files created:**
- `client/src/models/furniture-status.enum.ts`
- `client/src/modules/furniture_index/furniture_index.model.ts`
- `client/src/pages/furniture.vue`
- `api/Cms.Core/Migrations/…` — `AddFurnitureStatus` (via `pwsh ef.ps1 add AddFurnitureStatus`)

**Files modified:**
- `api/Cms.Core/Models/FurnitureModel.cs` — `Status`, `Statuses[]`, create/update
- `api/Cms.Core/Services/FurnitureService.cs` — filter, sort `status`, projections, create/update map
- `client/src/main.ts` — route `/furniture`
- `client/src/App.vue` — sidebar **Furniture**

**Pending actions:**
- Apply DB if needed: `pwsh ef.ps1 up` from repo root
- Smoke-test `/furniture` against API

**Notes:**
- `Furniture` entity + `FurnitureStatus.cs` were already present; completed models, service, migration, and SPA.

---

## 2026-03-31 (writing-plans)

### Session: Furniture index — plan rewrite
**Agent:** Cursor
**Status:** Complete

**Files modified:**
- `docs/superpowers/plans/2026-03-31-furniture-index.md` — full writing-plans template: file map, granular steps, code snippets, verification, execution handoff

**Notes:**
- Same dated filename; replaces earlier short checklist version.

---

## 2026-03-31 (issue #4 /fix)

### Session: Furniture index — spec + implementation plan
**Agent:** Cursor
**Status:** Complete (docs only)

**Files created:**
- `docs/superpowers/specs/2026-03-31-furniture-index-design.md` — design from issue #4 + comment thread
- `docs/superpowers/plans/2026-03-31-furniture-index.md` — sequenced backend/frontend tasks

**Pending actions:**
- Implement plan; post `/close #4` when done

**Notes:**
- Traceability comment posted on GitHub issue #4.

---

## 2026-03-31

### Session: Devices list — status filter (UTabs)
**Agent:** Cursor
**Status:** Complete

**Files modified:**
- `client/src/pages/devices.vue` — `DeviceStatusFilterOptions`, `UTabs` beside search, `statuses` query param, watch refetch + pagination reset on status change

**Pending actions:**
- Smoke-test `/devices` with tab + search + pagination in browser

**Notes:**
- Backend `DeviceQuery.Statuses` bound via repeated/single `statuses` query key; “All” omits the param.

---

## 2026-03-31

### Session: Furniture index — Task 1 (enum + entity)
**Agent:** backend-dev (subagent)
**Status:** Complete

**Files created:**
- `api/Cms.Core/Enums/FurnitureStatus.cs` — `Available`, `InUse`, `Maintenance`, `Disposed`, `Lost` (mirrors `DeviceStatus` style)

**Files modified:**
- `api/Cms.Core/Db/Entities/Furniture.cs` — `FurnitureStatus Status` + `using Cms.Core.Enums`

**Pending actions:**
- EF migration (Task 2+ per `docs/superpowers/plans/2026-03-31-furniture-index.md`) to add `Status` column to `Furnitures`

**Notes:**
- No fluent default on `Status` in `FurnitureConfiguration` — no project precedent (`DeviceConfiguration` does not default `DeviceStatus`)

---

### Session: GitHub issue close — furniture index (oclockvn/work#4)
**Agent:** orchestrator
**Status:** Complete

**What was done:**
- Verified CMS codebase against issue acceptance criteria (enum, entity + migration, `FurnitureQuery.Statuses`, `furniture.vue`, sidebar, device-aligned UI).
- Posted closing comment on https://github.com/oclockvn/work/issues/4 ; labels `in-progress` → `done`; issue closed.

**Pending actions:** None for this issue.

---

### Session: Devices index — GitHub issue for column sort
**Agent:** orchestrator
**Status:** Complete

**What was done:**
- Opened [oclockvn/work#5](https://github.com/oclockvn/work/issues/5) — server-side sort on `/devices` (API already supports `Query.Sort` / `Dir`; `devices.vue` does not send them yet). Labels: `brainstorming`, `project:cms`.
- Updated `docs/plans/todo.md` — new unchecked line under Devices with link to #5.

**Pending actions:** Implement sort in `client/src/pages/devices.vue` (mirror `furniture.vue`), then close #5.

---

### Session: /fix #5 — devices index sort (design + plan)
**Agent:** orchestrator
**Status:** Complete

**What was done:**
- `gh issue edit` — added **`in-progress`** on [oclockvn/work#5](https://github.com/oclockvn/work/issues/5).
- **Spec:** `docs/superpowers/specs/2026-03-31-devices-index-sort-design.md` (sortable keys, default order, owner/supplier out of scope v1).
- **Plan:** `docs/superpowers/plans/2026-03-31-devices-index-sort.md` (single-file `devices.vue` tasks).
- Traceability comment posted on #5 linking spec + plan.

**Pending actions:** Implement plan in `devices.vue`; then `/close #5`.

---

### Session: writing-plans — devices index sort plan refresh
**Agent:** orchestrator
**Status:** Complete

**What was done:**
- Rewrote `docs/superpowers/plans/2026-03-31-devices-index-sort.md` to match **writing-plans** template: agentic header, file map, preread list, step-by-step tasks with code snippets, manual verification, PR blurb, review checklist, execution handoff (subagent vs inline).

---

### Session: Devices index — implement server-side sort (subagent-driven batch)
**Agent:** orchestrator
**Status:** Complete

**Files modified:**
- `client/src/pages/devices.vue` — `sortField` / `sortDir`, `sortHeader` (match `furniture.vue`), `sort`+`dir` on `/api/devices`, `columns` as `computed`, `watch` includes sort refs.

**Pending manual actions:** Network-tab smoke test; PR blurb from plan Task 6; close [oclockvn/work#5](https://github.com/oclockvn/work/issues/5) when merged.

---

### Session: Dashboard navbar — remove breadcrumbs, contextual titles
**Agent:** orchestrator
**Status:** Complete

**Files modified:**
- `client/src/pages/device-detail.vue` — `navbarTitle` from device name / fallback; no `UBreadcrumb`
- `client/src/pages/device-edit.vue` — title `Details`; no breadcrumb (already applied)
- `client/src/pages/device-new.vue` — breadcrumb removed (already applied)
- `client/src/pages/user-details.vue` — `navbarTitle` from full name / fallback; no breadcrumb
- `client/src/pages/user-edit.vue` — title `Details`; no breadcrumb
- `client/src/pages/leave-new.vue` — breadcrumb removed; title unchanged

**Notes:** List pages (`devices`, `users`, `leaves`, `furniture`) unchanged per plan.

---

## 2026-04-08

### Session: User edit — load user from API (GET by id)
**Agent:** orchestrator
**Status:** Complete

**Files created:** (none)

**Files modified:**
- `api/Cms.Core/Modules/UserIndex/UserIndexModel.cs` — `UserGetModel` (audit + edit fields)
- `api/Cms.Core/Modules/UserIndex/UserIndexService.cs` — `GetByIdAsync`
- `api/Cms.Api/Controllers/UsersController.cs` — `GET api/users/{id}`
- `client/src/modules/user_index/userIndex.model.ts` — `UserGet` type
- `client/src/pages/user-edit.vue` — `useFetch` + map to `formData` / `userData` / `dateOfBirthValue`; loading skeleton; 404/error handling; single `onBeforeUnmount`

**Pending manual actions:** Smoke-test edit page against running API and DB.

**Notes:** No migration (read-only). Plan file not edited.

---

## 2026-07-19

### Session: User details — wire GET /api/users/:id (mock removed)
**Agent:** orchestrator (subagent-driven)
**Status:** Complete

**Files created:**
- `docs/superpowers/plans/2026-07-19-user-details-api-wire.md` — implementation plan

**Files modified:**
- `client/src/modules/user_index/userIndex.model.ts` — `UserGet` aligned with `UserGetModel`
- `client/src/models/user-detail.model.ts` — `mapUserGetToDetail`; removed `getMockUserDetail`
- `client/src/pages/user-details.vue` — fetch + loading/404/error; `UserStatus` badge
- `api/Cms.Tests/UserIndexServiceTest.cs` — `GetById_Should_ReturnExtendedHrFields_WhenUserExists`
- `docs/plans/todo.md` — checked details API wire item

**Pending actions:**
- Smoke-test `/users/:id` against running API/DB
- Next plans: `PUT /api/users/{id}` + edit save; per-user assets; contract/department fields

**Notes:**
- Contract / department / assets left empty (no API yet)
- Stale-id flash mitigated with `userLoadGen` + clear `userGet` on id change

---

### Session: User edit — HR fields + PUT
**Agent:** orchestrator (subagent-driven)
**Status:** Complete

**Files created/modified:**
- `UserUpdateModel`, `UpdateAsync`, `UsersController` PUT, `UserUpdate` type, `user-edit.vue`, tests

**Pending actions:**
- Avatar upload; contract/department; contacts CRUD; smoke-test

---

## 2026-07-19

### Session: Body breadcrumbs on all pages
**Agent:** orchestrator
**Status:** Complete

**Files modified:**
- `client/src/pages/users.vue`, `devices.vue`, `leaves.vue`, `teams.vue`, `furniture.vue` — Home→section `UBreadcrumb` in `#body`
- `client/src/pages/user-details.vue`, `user-edit.vue`, `device-detail.vue`, `device-edit.vue`, `device-new.vue`, `leave-new.vue`, `team-edit.vue` — parent→entity (± Edit/New) crumbs
- `client/src/pages/settings.vue` — Settings→tab crumb from route

**Pending actions:**
- Visual smoke-test in browser

**Notes:**
- Skipped `index.vue` (root) and `inbox.vue` (no `#body`)
- Navbar titles unchanged; crumbs live in `#body` only

---

### Session: Playwright local e2e (real API)
**Agent:** orchestrator
**Status:** Complete

**Files created:**
- `client/playwright.config.ts` — Chromium, Vite webServer, baseURL :5173
- `client/e2e/helpers/api.ts` — getFirstUserId / getUserById / putUser
- `client/e2e/users.spec.ts` — list, details, edit title roundtrip

**Files modified:**
- `client/package.json` — `test:e2e`, `test:e2e:ui`; `@playwright/test`
- `.gitignore` — Playwright report/output dirs
- `docs/plans/todo.md` — checked Playwright item

**Pending actions:**
- Start API on :5196, then `cd client && pnpm test:e2e`
- Debug: `pnpm test:e2e:ui`
- CI e2e job later

**Notes:**
- No API mocks; Vite proxies `/api` → :5196
- Needs ≥1 user in DB

---

### Session: Playwright user-edit submit scenarios A–D
**Agent:** orchestrator (subagent-driven)
**Status:** Complete

**Files created:**
- `client/e2e/helpers/user-edit-form.ts` — fillAll / seeded / dates / status
- `client/e2e/user-edit-submit.spec.ts` — A all, B subset, C title, D no-op
- `docs/superpowers/specs/2026-07-19-user-edit-submit-e2e-design.md`
- `docs/superpowers/plans/2026-07-19-user-edit-submit-e2e.md`

**Files modified:**
- `client/e2e/helpers/api.ts` — `dateOnly`, HR field compare helpers

**Pending actions:**
- `cd client && pnpm test:e2e e2e/user-edit-submit.spec.ts` (API on :5196)

**Notes:**
- Assert via redirect + GET; restore original in `finally`
- Avatar excluded; 4/4 passed in implement session

---

## 2026-07-19

### Session: UserService + UserIndex team membership tests
**Agent:** qa-engineer (Task 5)
**Status:** Complete

**Files modified:**
- `api/Cms.Tests/UserIndexServiceTest.cs` — `GetById_Should_ReturnTeamMemberships_WhenUserOnTeam`

**Pending actions:**
- None

**Notes:**
- UserService + UserIndex GetAll/GetById team membership tests complete (Tasks 3–5)
- Full filter `UserServiceTest|UserIndexServiceTest`: 52 passed

---

