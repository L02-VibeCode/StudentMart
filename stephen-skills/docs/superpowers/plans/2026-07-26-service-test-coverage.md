# Service Unit-Test Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use **superpowers:subagent-driven-development** (recommended) or **superpowers:executing-plans** to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cover every uncovered module/legacy service that can run against MsSql Testcontainers without real S3.

**Architecture:** Reuse `BaseTestFixture` (MsSql Testcontainer + migrate + DI). Seed via `IDbContextFactory<ApplicationDbContext>` with Guid suffixes. Integration-style service tests, not mocked unit tests.

**Tech Stack:** xUnit, Testcontainers.MsSql, EF Core, .NET 10. Docker required. Quiet: `rtk dotnet test api/Cms.Tests/Cms.Tests.csproj -v q --filter ...`

## Global Constraints

- Do **not** change production service logic unless a test proves a real bug.
- Do **not** add NuGet packages.
- Do **not** hit real S3: never pass `FileBytes`/`OriginalFileName`; never call `UploadImageAsync` / `IFileService` against real storage.
- Seed with `suffix = Guid.NewGuid().ToString("N")[..8]`; assert on suffix-filtered cohorts.
- Lookup services: `IMemoryCache.Remove(AppConst.CACHE_KEY_*)` before assert.
- Prefer `IDbContextFactory` for seed.
- `DeviceService` / `FurnitureService`: DI via `fix.Get` fails (S3/logging). Construct manually with NoOp file/storage stubs (see existing test files).

## Status (2026-07-26)

- [x] Phase 1 — `TeamIndexServiceTest.cs`
- [x] Phase 2 — `LookupServicesTest.cs`
- [x] Phase 3 — `DeviceAssignmentServiceTest.cs`
- [x] Phase 4 — `DeviceServiceTest.cs` (no upload)
- [x] Phase 5 — `FurnitureServiceTest.cs` (no UploadImage)
- [x] Full suite green — 95 passed

## Out of scope

- `FileService`, Device create with `FileBytes`, `FurnitureService.UploadImageAsync` (need InMemoryStorage + fixture DI)
- Dedicated `CacheControlService` tests
- Deepening UserIndex/LeaveIndex gaps
