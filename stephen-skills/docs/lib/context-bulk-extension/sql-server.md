# ContextBulkExtension - SQL Server

## Minimal usage

```cs
using ContextBulkExtension.Core;

// Insert-only (no Id sync unless IdentityOutput)
await db.BulkInsertAsync(entities);
await db.BulkInsertAsync(entities, new BulkConfig { IdentityOutput = true });

// Upsert by unique natural key; sync generated Ids
await db.BulkUpsertAsync(
    users,
    matchOn: x => x.Username,
    updateColumns: null,
    config: new BulkConfig { IdentityOutput = true });
```

## Preferred props/values

- Package: `ContextBulkExtension.SqlServer` (version prefix matches EF Core major; Core embeds in provider)
- Namespace: `ContextBulkExtension.Core`
- `BulkConfig.IdentityOutput = true` — required when entity `Id` must be used after seed (FK / asserts)
- Prefer `BulkUpsertAsync` when DB has unique match columns (`Username`, `Team.Name`, `(TeamId, MemberId)`)
- Prefer `BulkInsertAsync` for append-only rows (`Contact`, `LeaveRequest` / days)

## Lessons learned

- Default `IdentityOutput` is **false** — plain `BulkInsertAsync` leaves `Id = 0` on entities
- Bulk APIs do **not** insert EF navigation graphs — insert parent with identity output, then children with FK set
- Bulk bypasses change tracking — reload with `AsNoTracking()` / re-query after seed if you assert DB state via the same entity instance
- Do **not** use `BulkUpsertWithDeleteScopeAsync` in shared Testcontainers DB — delete scope can wipe other tests' rows
- Shared helpers live in `api/Cms.Tests/BaseTestFixture.cs`
