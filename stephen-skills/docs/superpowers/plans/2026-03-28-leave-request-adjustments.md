# Leave Request Adjustments — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align `CreateAsync` paid-quota logic with `docs/plans/leave-management-design.md` (calendar year of leave `StartDate`), add integration coverage for `LeaveIndexService`, and sync design/todo docs.

**Architecture:** Single behavioral change in `LeaveIndexService.CreateAsync`: evaluate remaining paid balance using **`request.StartDate.Year`** instead of **`DateTime.UtcNow.Year`**. No new services. Tests seed `User` + `LeaveRequest` rows via `IDbContextFactory<ApplicationDbContext>` (same pattern as production code). Optional follow-up: document or defer `GET /api/leaves/all` until auth exists.

**Tech Stack:** .NET 10, EF Core 10, SQL Server (Testcontainers), xUnit 2.9, existing `api/Cms.Tests/BaseTestFixture.cs`.

**Spec reference:** `docs/plans/leave-management-design.md` (Balance + Paid vs Unpaid sections).

---

## File structure

| Path | Role |
|------|------|
| `api/Cms.Core/Modules/LeaveIndex/LeaveIndexService.cs` | Fix quota year in `CreateAsync` (~lines 121–124). |
| `api/Cms.Tests/LeaveIndexServiceTest.cs` | **Create** — integration tests (`IClassFixture<BaseTestFixture>`). |
| `docs/plans/leave-management-design.md` | Update file paths (`LeaveIndex`, `leave-new.vue`) and explicit quota-year rule under Paid vs Unpaid. |
| `docs/plans/todo.md` | Check off migration if DB already migrated; update tests row when done. |
| `docs/plans/progress.md` | Append session note per `CLAUDE.md`. |

---

### Task 1: Failing test — quota uses `StartDate` year

**Files:**
- Create: `api/Cms.Tests/LeaveIndexServiceTest.cs`
- Reference: `api/Cms.Tests/UserIndexServiceTest.cs`, `api/Cms.Tests/BaseTestFixture.cs`

**Idea:** Seed one `User` and one **approved paid** `LeaveRequest` for **2026** that consumes the full **15** `TotalDays` (e.g. one FullDay block or multiple rows summing to 15). Then call `ILeaveIndexService.CreateAsync` with `StartDate`/`EndDate` in **2027** (future relative to test run—use dates like `2027-02-01`–`2027-02-01`, FullDay). **Expected:** `IsPaid == true` (2027 quota untouched). **Current bug:** if implementation uses `today.Year` for balance while `today` is still 2026, `GetBalanceAsync` for 2026 sees no remaining paid days → `IsPaid == false` → test fails before fix.

- [ ] **Step 1:** Add helper in test class (private static or local) to insert a minimal valid `User` (`FullName`, `Username`, `Email`, `Status`, `CreatedUtc`, `CreatedBy`, `UpdatedUtc`, `UpdatedBy`, etc.—mirror required columns from `User` + `UserConfiguration`).
- [ ] **Step 2:** Add helper to insert `LeaveRequest` rows with `Status = Approved`, `IsPaid = true`, `StartDate`/`EndDate`/`TotalDays`/`DayType` consistent with design.
- [ ] **Step 3:** Write `CreateAsync_UsesStartDateYear_ForPaidQuota` (name as you prefer) asserting `result.IsSuccess` and `result.Value!.IsPaid == true`.
- [ ] **Step 4:** Run: `dotnet test api/Cms.Tests/Cms.Tests.csproj --filter "FullyQualifiedName~LeaveIndexServiceTest" --no-build`  
  If you have not built: `dotnet test api/Cms.Tests/Cms.Tests.csproj --filter "FullyQualifiedName~LeaveIndexServiceTest"`  
  **Expected:** FAIL with `IsPaid == false` (proves bug) or compile errors until helpers are correct.

---

### Task 2: Implement quota year fix

**Files:**
- Modify: `api/Cms.Core/Modules/LeaveIndex/LeaveIndexService.cs`

- [ ] **Step 1:** In `CreateAsync`, replace `var currentYear = today.Year` and `GetBalanceAsync(userId, currentYear, ct)` with `var quotaYear = request.StartDate.Year` and `GetBalanceAsync(userId, quotaYear, ct)` for the **paid vs unpaid** decision only. Keep `today` for **future-date** validation (`StartDate >= today`).
- [ ] **Step 2:** Re-run the same `dotnet test` filter. **Expected:** PASS.

---

### Task 3: Regression tests (service rules)

**Files:**
- Modify: `api/Cms.Tests/LeaveIndexServiceTest.cs`

Add focused tests (seed minimal data per test):

- [ ] **Overlap:** Existing approved leave overlapping new range → `ResultCode.BusinessRuleViolation` (or assert `IsSuccess == false` however `Result` exposes failure).
- [ ] **Max span:** `EndDate - StartDate` spanning **> 5** calendar days → failure.
- [ ] **Past start:** `StartDate` before UTC today → failure.
- [ ] **Cancel:** Create approved leave, `CancelAsync` → status cancelled; optional second `CancelAsync` → failure.

Use `fix.Get<ILeaveIndexService>()` and `fix.Get<IDbContextFactory<ApplicationDbContext>>()` from `BaseTestFixture`.

- [ ] **Step:** Run full test project: `dotnet test api/Cms.Tests/Cms.Tests.csproj` — **Expected:** all green.

---

### Task 4: Documentation

**Files:**
- Modify: `docs/plans/leave-management-design.md`
- Modify: `docs/plans/todo.md`

- [ ] **Step 1:** Replace outdated “New Files” table entries (`LeaveService.cs`, `leave-request.vue`, `leave/leave.model.ts`) with actual paths: `LeaveIndexService.cs`, `LeaveIndexModel.cs`, `leave-new.vue`, `modules/leave_index/leave_index.model.ts`.
- [ ] **Step 2:** Under “Paid vs Unpaid Logic”, state explicitly: remaining balance for the create operation uses **`YEAR(StartDate)`** (same as `GET /api/leaves/balance?year=`).
- [ ] **Step 3:** In `todo.md`, mark Leave migration checkbox consistent with repo reality; mark **Tests** complete when `LeaveIndexServiceTest.cs` exists and passes.

---

### Task 5: Progress log

**Files:**
- Modify: `docs/plans/progress.md`

- [ ] Append a session block: date, agent, files touched, any manual DB steps, decision on **`GET /api/leaves/all`** (open vs deferred auth).

---

## Out of scope (explicit)

- Replacing hard-coded user id `1` in `LeavesController` (keep `// UNDONE: use current user`).
- Adding `[Authorize]` to `/api/leaves/all` unless you extend scope—only document in progress if skipped.

---

## Verification

```bash
dotnet test api/Cms.Tests/Cms.Tests.csproj
```

**Expected:** All tests pass, including new `LeaveIndexService` tests.

---

## Execution handoff

**Plan saved to:** `docs/superpowers/plans/2026-03-28-leave-request-adjustments.md`

**Two execution options:**

1. **Subagent-driven (recommended)** — Fresh subagent per task, review between tasks (`superpowers:subagent-driven-development`).
2. **Inline execution** — Run tasks in one session with checkpoints (`superpowers:executing-plans`).

**Note:** The Cursor `/write-plan` command is deprecated; use this skill + saved path for future plans.
