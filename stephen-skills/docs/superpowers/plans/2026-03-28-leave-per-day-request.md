# Leave Request Per-Day Lines — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single range + uniform `DayType` on `LeaveRequest` with **one row per calendar date** (`LeaveRequestDay`), each row being **Full day**, **Morning half**, or **Afternoon half**, with at most **one line per date** per request (no AM+PM on the same date in one request).

**Architecture:** Add `LeaveRequestDay` entity (FK to `LeaveRequest`, unique `(LeaveRequestId, Date)`). `LeaveRequest` keeps header fields (`UserId`, `Reason`, `IsPaid`, `Status`, audit); **`StartDate`/`EndDate`/`TotalDays`** become **derived from lines** (min date, max date, sum of day weights). `Create` API accepts `days: [{ date, dayType }, ...]`. Balance and overlap logic sum **line weights** and compare **session-level** conflicts against other **approved** requests for the same user. Follow existing [`LeaveIndex`](api/Cms.Core/Modules/LeaveIndex/) module + [`LeavesController`](api/Cms.Api/Controllers/LeavesController.cs) patterns.

**Tech Stack:** .NET 10, EF Core 10, SQL Server, xUnit + Testcontainers; Vue 3, Nuxt UI, Valibot; existing [`docs/plans/leave-management-design.md`](docs/plans/leave-management-design.md) must be updated to match.

**Spec reference:** Brainstorming outcome (2026): per-day lines; approved rule — **one line per calendar date** per request.

## Execution methodology (locked): Subagent-Driven Development

This plan is executed with **superpowers:subagent-driven-development** (not `executing-plans`):

| Step | Action |
|------|--------|
| Controller | Read this plan once; copy **one task block** (full markdown for that task) into each implementer prompt—do not rely on subagent to discover the plan file alone. |
| Implementer | Fresh subagent per task (or per logical slice); include repo root `d:\src\cms`, relevant paths, and `AGENTS.md` / `client/AGENTS.md` conventions. |
| Review | After each task: **spec compliance** (matches task + business rules), then **code quality**; fix loops until both pass. |
| Git | Use **superpowers:using-git-worktrees** for an isolated branch before starting if you need separation from `main` (optional). |
| Finish | After all tasks: **superpowers:finishing-a-development-branch**. |

**Task 1 resolution (locked):** Denormalize `LeaveRequest.StartDate`, `EndDate`, and `TotalDays` on create/update from child `LeaveRequestDay` rows (min date, max date, sum of weights). Document in [`docs/plans/leave-management-design.md`](docs/plans/leave-management-design.md) when that task is done.

---

## File structure

| Path | Responsibility |
|------|----------------|
| [`api/Cms.Core/Db/Entities/LeaveRequest.cs`](api/Cms.Core/Db/Entities/LeaveRequest.cs) | Remove or deprecate header `DayType`; keep `StartDate`/`EndDate`/`TotalDays` as **denormalized** snapshots updated on save, or compute in queries only (pick one strategy in Task 1). |
| **Create** `api/Cms.Core/Db/Entities/LeaveRequestDay.cs` | `Id`, `LeaveRequestId`, `Date` (DateOnly), `DayType` (reuse [`LeaveDayType`](api/Cms.Core/Enums/LeaveDayType.cs)). |
| **Create** `api/Cms.Core/Db/Configurations/LeaveRequestDayConfiguration.cs` | Table name, indexes, FK, unique `(LeaveRequestId, Date)`. |
| [`api/Cms.Core/Db/ApplicationDbContext.cs`](api/Cms.Core/Db/ApplicationDbContext.cs) | `DbSet<LeaveRequestDay>`. |
| [`api/Cms.Core/Modules/LeaveIndex/LeaveIndexModel.cs`](api/Cms.Core/Modules/LeaveIndex/LeaveIndexModel.cs) | `LeaveRequestDayDto`, `CreateLeaveRequestDay`, replace flat `CreateLeaveRequest` with `Days` collection; extend `LeaveRequestDto` with `Days[]` for detail/list as needed. |
| [`api/Cms.Core/Modules/LeaveIndex/LeaveIndexService.cs`](api/Cms.Core/Modules/LeaveIndex/LeaveIndexService.cs) | Create/balance/overlap/map DTOs against lines. |
| [`api/Cms.Api/Controllers/LeavesController.cs`](api/Cms.Api/Controllers/LeavesController.cs) | No route change if body shape only changes JSON. |
| **Migration** `api/Cms.Core/Migrations/*` | Add `LeaveRequestDays` table; migrate existing `LeaveRequests` rows to **N lines** (one per calendar day in old range with old uniform `DayType`). Optionally drop `LeaveRequest.DayType` column after backfill. |
| [`api/Cms.Tests/LeaveIndexServiceTest.cs`](api/Cms.Tests/LeaveIndexServiceTest.cs) | Update/create tests for lines, overlap, balance. |
| [`client/src/modules/leave_index/leave_index.model.ts`](client/src/modules/leave_index/leave_index.model.ts) | TS types for days array. |
| [`client/src/pages/leave-new.vue`](client/src/pages/leave-new.vue) | Per-day editor (add/remove rows: date + day type). |
| [`client/src/pages/leaves.vue`](client/src/pages/leaves.vue) | Display range + total; optional detail modal or expand. |
| [`docs/plans/leave-management-design.md`](docs/plans/leave-management-design.md) | Document new model and rules. |

---

## Business rules (implementation must encode)

| Rule | Detail |
|------|--------|
| Lines | At least **1** date; **unique dates** within the request. |
| Max lines | **5 dates per request** (matches prior “max 5 consecutive days” cap; confirm with PM if non-consecutive multi-day should allow more). |
| Future dates | Every line `Date >= UTC today`. |
| Weights | FullDay = 1.0; half types = 0.5 each. `TotalDays` = sum of weights. |
| Quota / paid | Same annual 15 paid days; `IsPaid` on header from comparing `TotalDays` to **remaining balance for the calendar year of the “quota anchor”** — preserve current behavior: use **minimum line date’s year** or **sum by year** if lines span two years (see Task 2 decision). |
| Overlap | For **approved** requests, two lines **conflict** if same `UserId`, same `Date`, and: both Full; one Full and any half; same half twice; or **both halves** on same date from **different requests** (treat as conflict). **Recommended:** model “slots” as `Full`, `AM`, `PM` per user per date; a line consumes its slot(s). |
| Cancel | Cancelling a request invalidates all its lines (existing cancel by header id). |

---

### Task 1: Design choice — denormalized header dates

**Files:** Entity + service

- [x] **Step 1:** **Decided:** denormalize `StartDate`/`EndDate`/`TotalDays` on write from lines (see Execution methodology above).

- [ ] **Step 2:** Document the decision in [`leave-management-design.md`](docs/plans/leave-management-design.md) (can be combined with Task 8 doc pass).

---

### Task 2: EF entity + migration + data backfill

**Files:** New entity, configuration, `ApplicationDbContext`, new migration

- [ ] **Step 1:** Add `LeaveRequestDay` entity + configuration (unique index `LeaveRequestId` + `Date`, FK `LeaveRequest` with cascade delete on parent).

- [ ] **Step 2:** Migration: create `LeaveRequestDays`. Backfill: for each existing `LeaveRequest`, insert one row per calendar day from `StartDate..EndDate` with the **legacy** `LeaveRequest.DayType` copied to each line (matches old behavior).

- [ ] **Step 3:** After backfill, drop column `DayType` from `LeaveRequests` if no longer needed (or keep nullable deprecated until frontends ship — prefer clean drop + compile fix in same PR).

- [ ] **Step 4:** Run locally: `dotnet ef migrations add <Name> --project api/Cms.Core --startup-project api/Cms.Api` (user may require stopping API first per [`todo.md`](docs/plans/todo.md) notes).

---

### Task 3: DTOs and API contract

**Files:** [`LeaveIndexModel.cs`](api/Cms.Core/Modules/LeaveIndex/LeaveIndexModel.cs)

- [ ] **Step 1:** Define:

```csharp
public record CreateLeaveRequestDay(DateOnly Date, LeaveDayType DayType);
public record CreateLeaveRequest
{
    public required IReadOnlyList<CreateLeaveRequestDay> Days { get; init; }
    public string? Reason { get; init; }
}
```

- [ ] **Step 2:** Extend `LeaveRequestDto` with `LeaveRequestDayDto[] Days` (or load lines only in `GetById` — list view may omit lines for payload size; **recommend** include summarized range + `totalDays` in list, full `days` in detail if you add detail endpoint later).

---

### Task 4: `LeaveIndexService` — create path

**Files:** [`LeaveIndexService.cs`](api/Cms.Core/Modules/LeaveIndex/LeaveIndexService.cs)

- [ ] **Step 1:** Validate `Days`: non-empty, unique dates, max count 5, each date `>= today`, sorted optional.

- [ ] **Step 2:** Compute `totalDays` = sum of weights; set `quotaYear` from **first date** or **min date** consistently with prior `quotaYear = request.StartDate.Year` — use **`Days.Min(d => d.Date).Year`** for parity.

- [ ] **Step 3:** **Overlap query:** load approved **lines** for user (join `LeaveRequest` where `Approved`) and test conflict algorithm vs proposed lines.

- [ ] **Step 4:** Insert `LeaveRequest` + child rows in one transaction; set `StartDate`/`EndDate`/`TotalDays` on header.

- [ ] **Step 5:** `GetBalanceAsync`: replace sum of `LeaveRequest.TotalDays` with sum of **line weights** for approved requests whose **line date** falls in `year` — update SQL to `Sum` over `LeaveRequestDays` joined to `LeaveRequests` filtered by `StartDate.Year` **or** line `Date.Year` (must align with product: **recommend** sum by **`Date.Year`** of each line).

---

### Task 5: Reads, cancel, map

**Files:** [`LeaveIndexService.cs`](api/Cms.Core/Modules/LeaveIndex/LeaveIndexService.cs)

- [ ] **Step 1:** `GetMyLeavesAsync` / `GetAllLeavesAsync`: `Include` lines when mapping; year filter: any line’s `Date.Year` matches query year **or** header range overlaps year (pick one; **recommend** line year).

- [ ] **Step 2:** `GetByIdAsync`: include lines.

- [ ] **Step 3:** `CancelAsync`: unchanged id-level cancel (cascade removes semantics — rows stay with cancelled parent; or soft-delete lines — **recommend** leave rows as-is, status on header only).

---

### Task 6: Integration tests

**Files:** [`LeaveIndexServiceTest.cs`](api/Cms.Tests/LeaveIndexServiceTest.cs)

- [ ] **Step 1:** Replace/adjust tests that used `StartDate`/`EndDate`/`DayType` create body with `Days` collection.

- [ ] **Step 2:** Add test: two lines different day types same week → success; duplicate date in payload → failure.

- [ ] **Step 3:** Add overlap test at **half-day granularity** (e.g. existing approved PM, new AM same date → failure if product disallows; or success if only duplicate **slot** fails — match Task 4 rules).

- [ ] **Step 4:** Run: `dotnet test api/Cms.Tests/Cms.Tests.csproj` (Docker required for Testcontainers).

---

### Task 7: Frontend

**Files:** [`leave_index.model.ts`](client/src/modules/leave_index/leave_index.model.ts), [`leave-new.vue`](client/src/pages/leave-new.vue), [`leaves.vue`](client/src/pages/leaves.vue)

- [ ] **Step 1:** Update TS types for `CreateLeaveRequest` and `LeaveRequestDto`.

- [ ] **Step 2:** `leave-new.vue`: UI to add/remove rows; each row: date picker + select (`LeaveDayTypeOptions`). Valibot schema: array min length 1, max 5, unique dates. Submit JSON `days: [{ date, dayType }, ...]`.

- [ ] **Step 3:** `POST /api/leaves` body must match server property names (camelCase JSON).

- [ ] **Step 4:** `leaves.vue`: show `startDate`/`endDate`/`totalDays` from API (still valid if header denormalized).

---

### Task 8: Docs and progress

**Files:** [`docs/plans/leave-management-design.md`](docs/plans/leave-management-design.md), [`docs/plans/todo.md`](docs/plans/todo.md), [`docs/plans/progress.md`](docs/plans/progress.md)

- [x] **Step 1:** Rewrite data model section for `LeaveRequest` + `LeaveRequestDay`.

- [x] **Step 2:** Update [`todo.md`](docs/plans/todo.md) Leave Management bullets.

- [x] **Step 3:** Append session to [`progress.md`](docs/plans/progress.md).

---

## Verification

```bash
dotnet test api/Cms.Tests/Cms.Tests.csproj
cd client && pnpm typecheck
```

Manual: create mixed full/half days, verify balance and list.

---

## Plan review (optional)

Dispatch **plan-document-reviewer** with this plan path + updated design doc path; fix loops per superpowers `writing-plans` skill.

---

## Execution handoff

**Plan saved to:** [`docs/superpowers/plans/2026-03-28-leave-per-day-request.md`](docs/superpowers/plans/2026-03-28-leave-per-day-request.md)

**Chosen workflow:** **Subagent-Driven Development** — follow the table in [Execution methodology](#execution-methodology-locked-subagent-driven-development) (implementer → spec review → code quality review per task).

**Note:** The Cursor `/write-plan` command is deprecated; prefer the **writing-plans** skill for future plans.
