# User service tests (Testcontainers)

## Purpose

Add integration-style unit tests for both user list services against real SQL Server via Testcontainers:

1. Legacy `Cms.Core.Services.UserService` (`IUserService`) — currently untested.
2. Expand coverage of `Cms.Core.Modules.UserIndex.UserIndexService` (`IUserIndexService`) beyond existing GetById/Update tests.

Both share the same fixture pattern already used by `LeaveIndexServiceTest` and `UserIndexServiceTest`.

## Context

| Piece | Status |
|-------|--------|
| `BaseTestFixture` | Exists: MsSql 2022 container → `AddCoreServices` → `MigrateAsync` |
| `UserIndexServiceTest` | Exists: GetAll smoke, GetById (contacts/HR), Update (not found + HR persist) |
| `UserService` | Registered in DI; no controller callers; only `GetAllAsync(Query)` |
| `UserIndexService` | Used by `UsersController`; `GetAllAsync` / `GetByIdAsync` / `UpdateAsync` |

## Approach (chosen)

**Keep `BaseTestFixture` as-is.** No new fixture, no DB wipe, no InMemory hybrid.

- Resolve services with `fix.Get<T>()`.
- Seed with `IDbContextFactory<ApplicationDbContext>` + short-lived contexts (Leave pattern).
- Isolate rows with per-test Guid suffix on Username/Email/search tokens.
- Assert against suffix-filtered results, not global `Total == N`.

Rejected alternatives: collection fixture + truncate (YAGNI); mock/InMemory unit split (diverges from EF SQL Server behavior and existing suite).

## Architecture

```
Cms.Tests
├── BaseTestFixture.cs          # unchanged
├── UserServiceTest.cs          # new — IUserService.GetAllAsync
└── UserIndexServiceTest.cs     # expand — GetAll + GetById team memberships
```

No new NuGet packages. No production code changes unless a test uncovers a real bug (then fix separately or as tiny follow-up in the same PR if blocking).

## Seed helpers

Private static helpers on each test class (duplicate OK if small):

- `SeedUserAsync(db, suffix, overrides?)` — required audit (`CreatedBy`, `CreatedId`, `Status`, timestamps); optional FullName, Email, Phone, Title, PersonalEmail, NationalId, DateOfBirth, Status, CreatedUtc, UpdatedUtc for sort cohorts.
- `SeedTeamWithMemberAsync(db, userId, teamName)` — UserIndex only (team-name search + GetById memberships).

Existing UserIndex tests that use `fix.Get<ApplicationDbContext>()` stay as-is; **new** tests prefer the factory.

## Test inventory

### `UserServiceTest` (new)

| Test | Behavior |
|------|----------|
| `GetAll_ReturnsPagedShape` | Page/Take/Total ≥ 0 smoke |
| `GetAll_Search_MatchesFullName` | unique FullName hit |
| `GetAll_Search_MatchesEmail` | Email hit |
| `GetAll_Search_MatchesPhone` | Phone hit |
| `GetAll_Search_MissesUnrelated` | nonsense token → Total 0 for that search |
| `GetAll_Sort_ByField` `[Theory]` | sort keys: `fullname`, `email`, `dateofbirth`, `status`, `createdutc`, `updatedutc`, default (null/unknown → Id); both asc and desc via `Dir` |
| `GetAll_Paging_RespectsPageAndTake` | ≥3 matching seeds, `Take=2` → 2 items, Total ≥ 3; page 2 returns next slice |

Search fields for `UserService` match its implementation: FullName, Email, Phone only (no Title/PersonalEmail/NationalId/team).

### `UserIndexServiceTest` (add; keep existing)

| Test | Behavior |
|------|----------|
| `GetAll_Search_MatchesFullName` | |
| `GetAll_Search_MatchesEmail` | |
| `GetAll_Search_MatchesPhone` | |
| `GetAll_Search_MatchesTitle` | |
| `GetAll_Search_MatchesPersonalEmail` | |
| `GetAll_Search_MatchesNationalId` | |
| `GetAll_Search_MatchesTeamName` | seed Team + TeamMember; search by team name returns that user |
| `GetAll_Filter_ByStatus` | `UserIndexQuery.Status` Active vs Inactive |
| `GetAll_Sort_ByField` `[Theory]` | same sort keys as UserService |
| `GetAll_Paging_RespectsPageAndTake` | same paging idea as UserService |
| `GetById_Should_ReturnTeamMemberships_WhenUserOnTeam` | TeamMemberships: Id, TeamId, TeamName, Role |

Existing GetById/Update facts remain unchanged.

## Sort Theory convention

1. Seed a small cohort (2–3 users) sharing one suffix, with distinct values on the sort field under test.
2. Call GetAll with `Search = suffix` so only the cohort returns.
3. Assert order of returned Ids (or FullNames) for asc and desc.

Default sort (`Sort` null or unknown): assert ascending Id order among the cohort.

## Edges in scope

- No matches for a unique search token → Total 0.
- Default sort when `Sort` is null/unknown → Id.
- `Dir=desc` vs ascending.
- Paging: page 2 with `Take=2` when ≥3 matching seeds.

## Out of scope

- Controller / HTTP tests
- Auth / current-user
- Contacts CRUD, user create/delete
- Changing `BaseTestFixture` (password, image, DI layout)
- Fixture-level truncate or transaction rollback
- Exhaustive null/invalid `Page`/`Take` matrix

## Verification

Requires Docker (Testcontainers).

```powershell
dotnet test api/Cms.Tests/Cms.Tests.csproj --filter "FullyQualifiedName~UserServiceTest|FullyQualifiedName~UserIndexServiceTest" -v q
```

## Success criteria

- All inventory tests above pass locally with Docker running.
- `BaseTestFixture` unchanged.
- No new package references in `Cms.Tests.csproj`.
- Legacy `UserService` and `UserIndexService` GetAll paths both have broad search/sort/paging coverage as listed.
