# User Service Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use **superpowers:subagent-driven-development** (recommended) or **superpowers:executing-plans** to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Testcontainers-backed tests for legacy `UserService.GetAllAsync` and expand `UserIndexService` GetAll/GetById coverage (search fields, status, sort, paging, team memberships).

**Architecture:** Reuse existing `BaseTestFixture` (MsSql Testcontainer + migrate). New `UserServiceTest.cs`; extend `UserIndexServiceTest.cs`. Seed via `IDbContextFactory<ApplicationDbContext>` with Guid suffixes; assert on suffix-filtered cohorts. No production code changes unless a test exposes a real bug.

**Tech Stack:** xUnit, Testcontainers.MsSql, EF Core, .NET 10, Docker required.

**Spec:** [`docs/superpowers/specs/2026-07-19-user-service-tests-design.md`](../specs/2026-07-19-user-service-tests-design.md)

## Global Constraints

- Do **not** modify `api/Cms.Tests/BaseTestFixture.cs`.
- Do **not** add NuGet packages to `Cms.Tests.csproj`.
- New tests resolve DB via `IDbContextFactory<ApplicationDbContext>`, not long-lived `ApplicationDbContext` from `fix.Get`.
- Isolate with `suffix = Guid.NewGuid().ToString("N")[..8]` on Username/Email/search tokens.
- Assert against suffix-filtered results — never `Assert.Equal(N, result.Total)` against whole DB.
- Existing `UserIndexServiceTest` GetById/Update facts stay unchanged.
- Production services already implemented — write tests then expect PASS; if FAIL, fix test first, then only fix production if bug confirmed.
- Docker must be running for all `dotnet test` steps.
- Use `-v q` for `dotnet test` (quiet).

---

## File structure

| Path | Action | Responsibility |
|------|--------|----------------|
| `api/Cms.Tests/UserServiceTest.cs` | Create | `IUserService.GetAllAsync` tests + private seed helper |
| `api/Cms.Tests/UserIndexServiceTest.cs` | Modify | Add GetAll search/status/sort/paging + GetById team memberships; private seed helpers for new tests |
| `api/Cms.Tests/BaseTestFixture.cs` | Read-only | Shared MsSql fixture |
| `api/Cms.Core/Services/UserService.cs` | Read-only | Search: FullName/Email/Phone; sort keys listed in spec |
| `api/Cms.Core/Modules/UserIndex/UserIndexService.cs` | Read-only | Broader search + Status filter + TeamMembers |

**Read before coding:**

1. Spec above
2. `api/Cms.Tests/LeaveIndexServiceTest.cs` — factory seed pattern
3. `api/Cms.Tests/UserIndexServiceTest.cs` — existing style
4. `api/Cms.Core/Services/UserService.cs`
5. `api/Cms.Core/Modules/UserIndex/UserIndexService.cs`

---

### Task 1: UserServiceTest — scaffold, smoke, search

**Files:**
- Create: `api/Cms.Tests/UserServiceTest.cs`

**Interfaces:**
- Consumes: `BaseTestFixture`, `IUserService`, `IDbContextFactory<ApplicationDbContext>`, `Cms.Core.Common.Query`
- Produces: `UserServiceTest` class with `SeedUserAsync` helper used by Tasks 1–2

- [ ] **Step 1: Create `UserServiceTest.cs`** with fixture wiring, seed helper, smoke + four search tests:

```csharp
using Cms.Core.Common;
using Cms.Core.Db;
using Cms.Core.Db.Entities;
using Cms.Core.Enums;
using Cms.Core.Services;
using Microsoft.EntityFrameworkCore;

namespace Cms.Tests;

public class UserServiceTest(BaseTestFixture fix) : IClassFixture<BaseTestFixture>
{
    [Fact]
    public async Task GetAll_ReturnsPagedShape()
    {
        var svc = fix.Get<IUserService>();
        var result = await svc.GetAllAsync(new Query { Page = 1 });
        Assert.Equal(1, result.Page);
        Assert.True(result.Total >= 0);
        Assert.Equal(100, result.Take);
    }

    [Fact]
    public async Task GetAll_Search_MatchesFullName()
    {
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var factory = fix.Get<IDbContextFactory<ApplicationDbContext>>();
        await using var db = await factory.CreateDbContextAsync();
        await SeedUserAsync(db, suffix, fullName: $"Name_{suffix}");

        var svc = fix.Get<IUserService>();
        var result = await svc.GetAllAsync(new Query { Search = $"Name_{suffix}", Page = 1 });
        Assert.Contains(result.Items, u => u.FullName == $"Name_{suffix}");
        Assert.True(result.Total >= 1);
    }

    [Fact]
    public async Task GetAll_Search_MatchesEmail()
    {
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var factory = fix.Get<IDbContextFactory<ApplicationDbContext>>();
        await using var db = await factory.CreateDbContextAsync();
        await SeedUserAsync(db, suffix, email: $"mail_{suffix}@test.local");

        var svc = fix.Get<IUserService>();
        var result = await svc.GetAllAsync(new Query { Search = $"mail_{suffix}@test.local", Page = 1 });
        Assert.Contains(result.Items, u => u.Email == $"mail_{suffix}@test.local");
    }

    [Fact]
    public async Task GetAll_Search_MatchesPhone()
    {
        var suffix = Guid.NewGuid().ToString("N")[..8];
        // phone must be unique-ish; use digits from suffix hash
        var phone = $"09{suffix.Substring(0, 8)}";
        var factory = fix.Get<IDbContextFactory<ApplicationDbContext>>();
        await using var db = await factory.CreateDbContextAsync();
        await SeedUserAsync(db, suffix, phone: phone);

        var svc = fix.Get<IUserService>();
        var result = await svc.GetAllAsync(new Query { Search = phone, Page = 1 });
        Assert.Contains(result.Items, u => u.Phone == phone);
    }

    [Fact]
    public async Task GetAll_Search_MissesUnrelated()
    {
        var token = $"nomatch_{Guid.NewGuid():N}";
        var svc = fix.Get<IUserService>();
        var result = await svc.GetAllAsync(new Query { Search = token, Page = 1 });
        Assert.Equal(0, result.Total);
        Assert.Empty(result.Items);
    }

    private static async Task<int> SeedUserAsync(
        ApplicationDbContext db,
        string suffix,
        string? fullName = null,
        string? email = null,
        string? phone = null,
        string? username = null,
        DateOnly? dateOfBirth = null,
        UserStatus status = UserStatus.Active,
        DateTime? createdUtc = null,
        DateTime? updatedUtc = null)
    {
        var now = DateTime.UtcNow;
        var u = new User
        {
            FullName = fullName ?? $"User_{suffix}",
            Username = username ?? $"u_{suffix}",
            Email = email ?? $"u_{suffix}@test.local",
            Phone = phone,
            DateOfBirth = dateOfBirth,
            Status = status,
            CreatedUtc = createdUtc ?? now,
            CreatedBy = "TEST",
            CreatedId = 0,
            UpdatedUtc = updatedUtc ?? now,
            UpdatedBy = "TEST",
        };
        db.Users.Add(u);
        await db.SaveChangesAsync();
        return u.Id;
    }
}
```

- [ ] **Step 2: Run Task 1 tests**

```powershell
dotnet test api/Cms.Tests/Cms.Tests.csproj --filter "FullyQualifiedName~UserServiceTest.GetAll_" -v q
```

Expected: all 5 PASS (Docker required).

- [ ] **Step 3: Commit**

```bash
git -C "d:/src/cms" add api/Cms.Tests/UserServiceTest.cs
git -C "d:/src/cms" commit -m "test: add UserService GetAll search coverage"
```

---

### Task 2: UserServiceTest — sort Theory + paging

**Files:**
- Modify: `api/Cms.Tests/UserServiceTest.cs`

**Interfaces:**
- Consumes: `SeedUserAsync` from Task 1
- Produces: `GetAll_Sort_ByField`, `GetAll_Paging_RespectsPageAndTake`

- [ ] **Step 1: Add sort Theory + paging Fact** to `UserServiceTest.cs`:

```csharp
    public static TheoryData<string?, string?> SortCases => new()
    {
        { "fullname", "asc" },
        { "fullname", "desc" },
        { "email", "asc" },
        { "email", "desc" },
        { "dateofbirth", "asc" },
        { "dateofbirth", "desc" },
        { "status", "asc" },
        { "status", "desc" },
        { "createdutc", "asc" },
        { "createdutc", "desc" },
        { "updatedutc", "asc" },
        { "updatedutc", "desc" },
        { null, "asc" },           // default → Id
        { "unknown", "asc" },      // unknown → Id
        { null, "desc" },
    };

    [Theory]
    [MemberData(nameof(SortCases))]
    public async Task GetAll_Sort_ByField(string? sort, string? dir)
    {
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var factory = fix.Get<IDbContextFactory<ApplicationDbContext>>();
        await using var db = await factory.CreateDbContextAsync();

        // Cohort shares suffix in FullName so Search isolates them.
        // Distinct values for each sort dimension.
        var t0 = new DateTime(2020, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var t1 = new DateTime(2021, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var idA = await SeedUserAsync(db, suffix + "a",
            fullName: $"A_{suffix}",
            email: $"a_{suffix}@test.local",
            username: $"ua_{suffix}",
            dateOfBirth: new DateOnly(1990, 1, 1),
            status: UserStatus.Active,
            createdUtc: t0,
            updatedUtc: t0);
        var idB = await SeedUserAsync(db, suffix + "b",
            fullName: $"B_{suffix}",
            email: $"b_{suffix}@test.local",
            username: $"ub_{suffix}",
            dateOfBirth: new DateOnly(1995, 1, 1),
            status: UserStatus.Inactive,
            createdUtc: t1,
            updatedUtc: t1);

        var svc = fix.Get<IUserService>();
        var result = await svc.GetAllAsync(new Query
        {
            Search = suffix,
            Sort = sort,
            Dir = dir,
            Page = 1,
            Take = 100,
        });

        var ids = result.Items.Select(x => x.Id).ToArray();
        Assert.Equal(2, ids.Length);

        var asc = dir?.ToLower() != "desc";
        int[] expected = (sort?.ToLower()) switch
        {
            "fullname" => asc ? [idA, idB] : [idB, idA],
            "email" => asc ? [idA, idB] : [idB, idA],
            "dateofbirth" => asc ? [idA, idB] : [idB, idA],
            "status" => asc ? [idA, idB] : [idB, idA], // Active=1 < Inactive=2
            "createdutc" => asc ? [idA, idB] : [idB, idA],
            "updatedutc" => asc ? [idA, idB] : [idB, idA],
            _ => asc ? [idA, idB] : [idB, idA], // Id order (A seeded first)
        };
        Assert.Equal(expected, ids);
    }

    [Fact]
    public async Task GetAll_Paging_RespectsPageAndTake()
    {
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var factory = fix.Get<IDbContextFactory<ApplicationDbContext>>();
        await using var db = await factory.CreateDbContextAsync();
        await SeedUserAsync(db, suffix + "1", fullName: $"P1_{suffix}", username: $"p1_{suffix}", email: $"p1_{suffix}@t.l");
        await SeedUserAsync(db, suffix + "2", fullName: $"P2_{suffix}", username: $"p2_{suffix}", email: $"p2_{suffix}@t.l");
        await SeedUserAsync(db, suffix + "3", fullName: $"P3_{suffix}", username: $"p3_{suffix}", email: $"p3_{suffix}@t.l");

        var svc = fix.Get<IUserService>();
        var page1 = await svc.GetAllAsync(new Query { Search = suffix, Page = 1, Take = 2, Sort = "fullname", Dir = "asc" });
        Assert.Equal(2, page1.Items.Length);
        Assert.True(page1.Total >= 3);

        var page2 = await svc.GetAllAsync(new Query { Search = suffix, Page = 2, Take = 2, Sort = "fullname", Dir = "asc" });
        Assert.Single(page2.Items);
        Assert.DoesNotContain(page2.Items[0].Id, page1.Items.Select(x => x.Id));
    }
```

Note: `SeedUserAsync` username default uses `u_{suffix}` — when calling with `suffix + "a"` the username becomes unique. Keep username/email unique per row (shown above).

- [ ] **Step 2: Run UserServiceTest**

```powershell
dotnet test api/Cms.Tests/Cms.Tests.csproj --filter "FullyQualifiedName~UserServiceTest" -v q
```

Expected: all PASS.

- [ ] **Step 3: Commit**

```bash
git -C "d:/src/cms" add api/Cms.Tests/UserServiceTest.cs
git -C "d:/src/cms" commit -m "test: add UserService GetAll sort and paging"
```

---

### Task 3: UserIndexServiceTest — GetAll search fields (non-team)

**Files:**
- Modify: `api/Cms.Tests/UserIndexServiceTest.cs`

**Interfaces:**
- Consumes: `BaseTestFixture`, `IUserIndexService`, `UserIndexQuery`
- Produces: private `SeedUserForIndexAsync` helper + search Facts for FullName/Email/Phone/Title/PersonalEmail/NationalId

- [ ] **Step 1: Add helpers + search Facts** at end of `UserIndexServiceTest` class (keep existing tests untouched):

```csharp
using Cms.Core.Db;
using Cms.Core.Db.Entities;
using Cms.Core.Enums;
using Cms.Core.Modules.UserIndex;
using Microsoft.EntityFrameworkCore;
// ensure these usings exist at file top
```

Add tests:

```csharp
    [Fact]
    public async Task GetAll_Search_MatchesFullName()
    {
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var factory = fix.Get<IDbContextFactory<ApplicationDbContext>>();
        await using var db = await factory.CreateDbContextAsync();
        await SeedUserForIndexAsync(db, suffix, fullName: $"IdxName_{suffix}");

        var svc = fix.Get<IUserIndexService>();
        var result = await svc.GetAllAsync(new UserIndexQuery { Search = $"IdxName_{suffix}", Page = 1 });
        Assert.Contains(result.Items, u => u.FullName == $"IdxName_{suffix}");
    }

    [Fact]
    public async Task GetAll_Search_MatchesEmail()
    {
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var factory = fix.Get<IDbContextFactory<ApplicationDbContext>>();
        await using var db = await factory.CreateDbContextAsync();
        await SeedUserForIndexAsync(db, suffix, email: $"idx_{suffix}@test.local");

        var svc = fix.Get<IUserIndexService>();
        var result = await svc.GetAllAsync(new UserIndexQuery { Search = $"idx_{suffix}@test.local", Page = 1 });
        Assert.Contains(result.Items, u => u.Email == $"idx_{suffix}@test.local");
    }

    [Fact]
    public async Task GetAll_Search_MatchesPhone()
    {
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var phone = $"08{suffix.Substring(0, 8)}";
        var factory = fix.Get<IDbContextFactory<ApplicationDbContext>>();
        await using var db = await factory.CreateDbContextAsync();
        await SeedUserForIndexAsync(db, suffix, phone: phone);

        var svc = fix.Get<IUserIndexService>();
        var result = await svc.GetAllAsync(new UserIndexQuery { Search = phone, Page = 1 });
        Assert.Contains(result.Items, u => u.Phone == phone);
    }

    [Fact]
    public async Task GetAll_Search_MatchesTitle()
    {
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var title = $"Title_{suffix}";
        var factory = fix.Get<IDbContextFactory<ApplicationDbContext>>();
        await using var db = await factory.CreateDbContextAsync();
        await SeedUserForIndexAsync(db, suffix, title: title);

        var svc = fix.Get<IUserIndexService>();
        var result = await svc.GetAllAsync(new UserIndexQuery { Search = title, Page = 1 });
        Assert.Contains(result.Items, u => u.Username == $"idx_{suffix}");
    }

    [Fact]
    public async Task GetAll_Search_MatchesPersonalEmail()
    {
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var personal = $"p_{suffix}@personal.local";
        var factory = fix.Get<IDbContextFactory<ApplicationDbContext>>();
        await using var db = await factory.CreateDbContextAsync();
        await SeedUserForIndexAsync(db, suffix, personalEmail: personal);

        var svc = fix.Get<IUserIndexService>();
        var result = await svc.GetAllAsync(new UserIndexQuery { Search = personal, Page = 1 });
        Assert.Contains(result.Items, u => u.Username == $"idx_{suffix}");
    }

    [Fact]
    public async Task GetAll_Search_MatchesNationalId()
    {
        var suffix = Guid.NewGuid().ToString("N")[..8];
        // keep length reasonable for NationalId column
        var nationalId = $"NID{suffix}";
        var factory = fix.Get<IDbContextFactory<ApplicationDbContext>>();
        await using var db = await factory.CreateDbContextAsync();
        await SeedUserForIndexAsync(db, suffix, nationalId: nationalId);

        var svc = fix.Get<IUserIndexService>();
        var result = await svc.GetAllAsync(new UserIndexQuery { Search = nationalId, Page = 1 });
        Assert.Contains(result.Items, u => u.Username == $"idx_{suffix}");
    }

    private static async Task<int> SeedUserForIndexAsync(
        ApplicationDbContext db,
        string suffix,
        string? fullName = null,
        string? email = null,
        string? phone = null,
        string? title = null,
        string? personalEmail = null,
        string? nationalId = null,
        DateOnly? dateOfBirth = null,
        UserStatus status = UserStatus.Active,
        DateTime? createdUtc = null,
        DateTime? updatedUtc = null,
        string? username = null)
    {
        var now = DateTime.UtcNow;
        var u = new User
        {
            FullName = fullName ?? $"IdxUser_{suffix}",
            Username = username ?? $"idx_{suffix}",
            Email = email ?? $"idx_{suffix}@test.local",
            Phone = phone,
            Title = title,
            PersonalEmail = personalEmail,
            NationalId = nationalId,
            DateOfBirth = dateOfBirth,
            Status = status,
            CreatedUtc = createdUtc ?? now,
            CreatedBy = "TEST",
            CreatedId = 0,
            UpdatedUtc = updatedUtc ?? now,
            UpdatedBy = "TEST",
        };
        db.Users.Add(u);
        await db.SaveChangesAsync();
        return u.Id;
    }
```

- [ ] **Step 2: Run new search tests**

```powershell
dotnet test api/Cms.Tests/Cms.Tests.csproj --filter "FullyQualifiedName~UserIndexServiceTest.GetAll_Search_" -v q
```

Expected: all 6 PASS.

- [ ] **Step 3: Commit**

```bash
git -C "d:/src/cms" add api/Cms.Tests/UserIndexServiceTest.cs
git -C "d:/src/cms" commit -m "test: expand UserIndex GetAll search field coverage"
```

---

### Task 4: UserIndexServiceTest — team search, status, sort, paging

**Files:**
- Modify: `api/Cms.Tests/UserIndexServiceTest.cs`

**Interfaces:**
- Consumes: `SeedUserForIndexAsync` from Task 3
- Produces: `SeedTeamWithMemberAsync`, team/status/sort/paging tests

- [ ] **Step 1: Add team seed + remaining GetAll tests**

```csharp
    [Fact]
    public async Task GetAll_Search_MatchesTeamName()
    {
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var teamName = $"Team_{suffix}";
        var factory = fix.Get<IDbContextFactory<ApplicationDbContext>>();
        await using var db = await factory.CreateDbContextAsync();
        var userId = await SeedUserForIndexAsync(db, suffix);
        await SeedTeamWithMemberAsync(db, userId, teamName);

        var svc = fix.Get<IUserIndexService>();
        var result = await svc.GetAllAsync(new UserIndexQuery { Search = teamName, Page = 1 });
        Assert.Contains(result.Items, u => u.Id == userId);
    }

    [Fact]
    public async Task GetAll_Filter_ByStatus()
    {
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var factory = fix.Get<IDbContextFactory<ApplicationDbContext>>();
        await using var db = await factory.CreateDbContextAsync();
        var activeId = await SeedUserForIndexAsync(db, suffix + "a",
            fullName: $"Act_{suffix}", username: $"act_{suffix}", email: $"act_{suffix}@t.l",
            status: UserStatus.Active);
        var inactiveId = await SeedUserForIndexAsync(db, suffix + "i",
            fullName: $"Ina_{suffix}", username: $"ina_{suffix}", email: $"ina_{suffix}@t.l",
            status: UserStatus.Inactive);

        var svc = fix.Get<IUserIndexService>();
        var active = await svc.GetAllAsync(new UserIndexQuery { Search = suffix, Status = UserStatus.Active, Page = 1 });
        Assert.Contains(active.Items, u => u.Id == activeId);
        Assert.DoesNotContain(active.Items, u => u.Id == inactiveId);

        var inactive = await svc.GetAllAsync(new UserIndexQuery { Search = suffix, Status = UserStatus.Inactive, Page = 1 });
        Assert.Contains(inactive.Items, u => u.Id == inactiveId);
        Assert.DoesNotContain(inactive.Items, u => u.Id == activeId);
    }

    public static TheoryData<string?, string?> IndexSortCases => new()
    {
        { "fullname", "asc" },
        { "fullname", "desc" },
        { "email", "asc" },
        { "email", "desc" },
        { "dateofbirth", "asc" },
        { "dateofbirth", "desc" },
        { "status", "asc" },
        { "status", "desc" },
        { "createdutc", "asc" },
        { "createdutc", "desc" },
        { "updatedutc", "asc" },
        { "updatedutc", "desc" },
        { null, "asc" },
        { "unknown", "asc" },
        { null, "desc" },
    };

    [Theory]
    [MemberData(nameof(IndexSortCases))]
    public async Task GetAll_Sort_ByField(string? sort, string? dir)
    {
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var factory = fix.Get<IDbContextFactory<ApplicationDbContext>>();
        await using var db = await factory.CreateDbContextAsync();
        var t0 = new DateTime(2020, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var t1 = new DateTime(2021, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var idA = await SeedUserForIndexAsync(db, suffix + "a",
            fullName: $"A_{suffix}", email: $"a_{suffix}@test.local", username: $"ia_{suffix}",
            dateOfBirth: new DateOnly(1990, 1, 1), status: UserStatus.Active,
            createdUtc: t0, updatedUtc: t0);
        var idB = await SeedUserForIndexAsync(db, suffix + "b",
            fullName: $"B_{suffix}", email: $"b_{suffix}@test.local", username: $"ib_{suffix}",
            dateOfBirth: new DateOnly(1995, 1, 1), status: UserStatus.Inactive,
            createdUtc: t1, updatedUtc: t1);

        var svc = fix.Get<IUserIndexService>();
        var result = await svc.GetAllAsync(new UserIndexQuery
        {
            Search = suffix,
            Sort = sort,
            Dir = dir,
            Page = 1,
            Take = 100,
        });

        var ids = result.Items.Select(x => x.Id).ToArray();
        Assert.Equal(2, ids.Length);
        var asc = dir?.ToLower() != "desc";
        int[] expected = (sort?.ToLower()) switch
        {
            "fullname" => asc ? [idA, idB] : [idB, idA],
            "email" => asc ? [idA, idB] : [idB, idA],
            "dateofbirth" => asc ? [idA, idB] : [idB, idA],
            "status" => asc ? [idA, idB] : [idB, idA],
            "createdutc" => asc ? [idA, idB] : [idB, idA],
            "updatedutc" => asc ? [idA, idB] : [idB, idA],
            _ => asc ? [idA, idB] : [idB, idA],
        };
        Assert.Equal(expected, ids);
    }

    [Fact]
    public async Task GetAll_Paging_RespectsPageAndTake()
    {
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var factory = fix.Get<IDbContextFactory<ApplicationDbContext>>();
        await using var db = await factory.CreateDbContextAsync();
        await SeedUserForIndexAsync(db, suffix + "1", fullName: $"P1_{suffix}", username: $"ip1_{suffix}", email: $"ip1_{suffix}@t.l");
        await SeedUserForIndexAsync(db, suffix + "2", fullName: $"P2_{suffix}", username: $"ip2_{suffix}", email: $"ip2_{suffix}@t.l");
        await SeedUserForIndexAsync(db, suffix + "3", fullName: $"P3_{suffix}", username: $"ip3_{suffix}", email: $"ip3_{suffix}@t.l");

        var svc = fix.Get<IUserIndexService>();
        var page1 = await svc.GetAllAsync(new UserIndexQuery { Search = suffix, Page = 1, Take = 2, Sort = "fullname", Dir = "asc" });
        Assert.Equal(2, page1.Items.Length);
        Assert.True(page1.Total >= 3);

        var page2 = await svc.GetAllAsync(new UserIndexQuery { Search = suffix, Page = 2, Take = 2, Sort = "fullname", Dir = "asc" });
        Assert.Single(page2.Items);
        Assert.DoesNotContain(page2.Items[0].Id, page1.Items.Select(x => x.Id));
    }

    private static async Task<(int TeamId, int MembershipId)> SeedTeamWithMemberAsync(
        ApplicationDbContext db,
        int userId,
        string teamName,
        MemberRole role = MemberRole.Member)
    {
        var team = new Team { Name = teamName };
        db.Teams.Add(team);
        await db.SaveChangesAsync();

        var member = new TeamMember
        {
            TeamId = team.Id,
            MemberId = userId,
            Role = role,
        };
        db.TeamMembers.Add(member);
        await db.SaveChangesAsync();
        return (team.Id, member.Id);
    }
```

Confirm `ApplicationDbContext` exposes `Teams` / `TeamMembers` (same names as entities). If DbSet names differ, match the context property names.

- [ ] **Step 2: Run Task 4 tests**

```powershell
dotnet test api/Cms.Tests/Cms.Tests.csproj --filter "FullyQualifiedName~UserIndexServiceTest.GetAll_" -v q
```

Expected: all GetAll_* PASS (including Task 3 search Facts).

- [ ] **Step 3: Commit**

```bash
git -C "d:/src/cms" add api/Cms.Tests/UserIndexServiceTest.cs
git -C "d:/src/cms" commit -m "test: add UserIndex GetAll team, status, sort, paging"
```

---

### Task 5: UserIndexServiceTest — GetById team memberships + full verify

**Files:**
- Modify: `api/Cms.Tests/UserIndexServiceTest.cs`

**Interfaces:**
- Consumes: `SeedUserForIndexAsync`, `SeedTeamWithMemberAsync` from Tasks 3–4
- Produces: `GetById_Should_ReturnTeamMemberships_WhenUserOnTeam`

- [ ] **Step 1: Add GetById team memberships Fact**

```csharp
    [Fact]
    public async Task GetById_Should_ReturnTeamMemberships_WhenUserOnTeam()
    {
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var teamName = $"TeamGet_{suffix}";
        var factory = fix.Get<IDbContextFactory<ApplicationDbContext>>();
        await using var db = await factory.CreateDbContextAsync();
        var userId = await SeedUserForIndexAsync(db, suffix);
        var (teamId, membershipId) = await SeedTeamWithMemberAsync(db, userId, teamName, MemberRole.Lead);

        var svc = fix.Get<IUserIndexService>();
        var result = await svc.GetByIdAsync(userId);

        Assert.NotNull(result);
        Assert.Single(result.TeamMemberships);
        Assert.Equal(membershipId, result.TeamMemberships[0].Id);
        Assert.Equal(teamId, result.TeamMemberships[0].TeamId);
        Assert.Equal(teamName, result.TeamMemberships[0].TeamName);
        Assert.Equal(MemberRole.Lead, result.TeamMemberships[0].Role);
    }
```

- [ ] **Step 2: Full verification (spec success criteria)**

```powershell
dotnet test api/Cms.Tests/Cms.Tests.csproj --filter "FullyQualifiedName~UserServiceTest|FullyQualifiedName~UserIndexServiceTest" -v q
```

Expected: all PASS. Confirm `BaseTestFixture.cs` and `Cms.Tests.csproj` unchanged (`git diff` clean for those paths).

- [ ] **Step 3: Commit**

```bash
git -C "d:/src/cms" add api/Cms.Tests/UserIndexServiceTest.cs
git -C "d:/src/cms" commit -m "test: assert UserIndex GetById returns team memberships"
```

- [ ] **Step 4: Progress docs** (project convention)

Append a short session block to `docs/plans/progress.md` noting UserService + UserIndex GetAll/GetById team tests added. If `docs/plans/todo.md` has a matching unchecked item, mark it `[x]`; otherwise skip inventing a new epic.

---

## Spec coverage checklist (self-review)

| Spec item | Task |
|-----------|------|
| Reuse BaseTestFixture, no new packages | Global + all tasks |
| UserService smoke/search FullName/Email/Phone/miss | Task 1 |
| UserService sort Theory + paging | Task 2 |
| UserIndex search FullName/Email/Phone/Title/PersonalEmail/NationalId | Task 3 |
| UserIndex team name search | Task 4 |
| UserIndex status filter | Task 4 |
| UserIndex sort + paging | Task 4 |
| UserIndex GetById team memberships | Task 5 |
| Full filter verify command | Task 5 |
| Existing GetById/Update untouched | Tasks 3–5 only append |

No placeholders. Types match: `Query`, `UserIndexQuery`, `IUserService`, `IUserIndexService`, `MemberRole`, `UserStatus`.
