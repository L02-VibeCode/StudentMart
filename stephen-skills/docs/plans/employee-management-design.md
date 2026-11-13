# Employee Management Design

## Status

**Use existing implementation** - no changes needed for this phase. (CSV import v2 implemented 2026-10-27; see progress.md.)

## Current State

### Entity: User

**File**: `api/Cms.Core/Db/Entities/User.cs`

| Field | Type | Description |
|-------|------|-------------|
| Id | int | Primary key |
| FullName | string(250) | Employee full name |
| Username | string(250) | Login username |
| Email | string(250) | Work email; upsert key for import (company email, falling back to personal email — see Import section) |
| Phone | string(20) | Phone number (optional) |
| DateOfBirth | DateOnly? | Date of birth (optional) |
| Status | UserStatus | Active, Inactive, OnLeave — **unchanged**; import derives it from the CSV `Contract` column's `Exit` prefix (see Import section), it does not get its own CSV column |
| Contract | ContractType? | Contract type: `Official`, `Probation`, `Service`, `Intern`, `Outsource` (new — derived from CSV `Contract` column) |
| Location | WorkLocation | Work location/office: `VN`, `AU`, defaults to `VN` (new — derived from CSV `Contract` column's `- AU` suffix) |
| ContractRole | string(250)? | Labor-contract job title (new — from CSV `Role (Chức danh HĐLĐ)`, distinct from `Title`) |
| EmployeeCode | string(50)? | External HR employee code, e.g. `SBOX0001` (new — unique index when present) |
| BankId | int? | FK → `Bank` (new, nullable) |
| BankAccountNumber | string? | Bank account number (new; replaces the old single `BankAccount` scalar, which is dropped) |
| PersonalEmail, Hometown, NationalId(+IssueDate/+IssuePlace), Nation, Religion, PermanentResidence, CurrentAddress, AcademicLevel, Major, SchoolOrUniversity, Certificates, MarriageStatus, NumberOfDependents, PersonalIncomeTaxCode, SocialInsuranceCode | (pre-existing scalars) | Already on `User.cs`; newly wired to CSV import (see Import section) — no schema change |
| ~~EmergencyContactFullName/Relationship/Phone/Address~~ | — | **Dropped** — superseded by `Contact.IsEmergencyContact` (see Entity: Contact below) |
| CreatedUtc | DateTime | Record creation timestamp |
| UpdatedUtc | DateTime | Last update timestamp |

### Entity: Contact (edit)

**File**: `api/Cms.Core/Db/Entities/Contact.cs`

Existing: `Id, UserId, Type (ContactType), Name, Phone, Email, Birthdate` + audit fields. Originally used for
family members (`ContactType`: `Spouse`/`Child`/`Other`). New columns (for the dropped
`EmergencyContact*` scalars on `User`, see Import section):

| Field | Type | Description |
|-------|------|-------------|
| IsEmergencyContact | bool | Marks this `Contact` row as the person's emergency contact (as opposed to a family-member record) |
| Address | string? | New — `Contact` had no address column before |

### Entity: Bank (new)

**File**: `api/Cms.Core/Db/Entities/Bank.cs`

Lookup entity, same shape as `Supplier`/`DeviceType` (`api/Cms.Core/Db/Entities/Supplier.cs`), resolved via
a `FindOrCreateManyAsync` helper mirroring `DeviceTypeService.FindOrCreateManyAsync`.

| Field | Type | Description |
|-------|------|-------------|
| Id | int | Primary key |
| Name | string | Bank name, e.g. `Vietcombank` — unique |
| Alias | string? | Short code/alias, optional |

### Relationships

- `DeviceUser` - Many-to-many relationship with devices (assignment history)
- `BankId` - FK to `Bank` (new)

### Enums

**UserStatus** (`api/Cms.Core/Enums/UserStatus.cs`, **unchanged**):
- Active = 1
- Inactive = 2
- OnLeave = 3

**ContractType** (`api/Cms.Core/Enums/ContractType.cs`, new):
- Official = 1
- Probation = 2
- Service = 3
- Intern = 4
- Outsource = 5

**WorkLocation** (`api/Cms.Core/Enums/WorkLocation.cs`, new):
- VN = 1
- AU = 2

**ContactType** (`api/Cms.Core/Enums/ContactType.cs`, widened — **placeholder, unverified**: the real sample
file `sbox db - copy.csv` is not present in this repo, so the exact distinct `EmergencyContactRelationship`
strings could not be enumerated. Confirm against the real file before backend-dev finalizes this list):
- Spouse = 1
- Child = 2
- Other = 3
- Mother = 4 *(placeholder)*
- Father = 5 *(placeholder)*
- Friend = 6 *(placeholder)*

An unmapped/unrecognized `EmergencyContactRelationship` value falls back to `Other` — not a row error.

## Future Enhancements (Deferred)

The following fields are planned for future implementation:

| Field | Type | Description |
|-------|------|-------------|
| AvatarUrl | string(500) | Profile picture URL |
| Department | string(100) | Department name |
| Position | string(100) | Job title/position |
| HireDate | DateOnly | Employment start date |
| ManagerId | int? | Reporting manager (self-referencing FK) |

(`EmergencyContact`/`Address` removed from this list — now in scope, see Entity: Contact above.)

## API Endpoints (Existing)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/users | List all users with pagination |
| GET | /api/users/{id} | Get user details |
| POST | /api/users | Create new user |
| PUT | /api/users/{id} | Update user |

## UI Pages (Existing)

| Page | Path | Description |
|------|------|-------------|
| User List | /users | DataGrid with search, sort, pagination |
| User Details | /users/:id | View user information |
| User Edit | /users/:id/edit | Edit user form |

## Import Employees from CSV (New)

Mirrors the Device/Furniture CSV import pattern (`api/Cms.Core/Services/DeviceService.Import.cs`,
`api/Cms.Core/Modules/DeviceImport/DeviceImportModel.cs`, `POST /api/devices/import`): CsvHelper +
`*CsvRow`/`*CsvRowMap`, `CsvImportHeaders.EnsureRequired`, multi-pass parse → validate → `BulkUpsertAsync`,
`*ImportResult` response. No new entity — rows map onto the existing `User` entity.

### Scope decision

**v2 — widened per the real-file audit (Open Questions below, all answered 2026-10-27).** Column mapping is
by **position (`.Index(...)`)**, not header text (Q9) — header strings below are shown for documentation
only; backend-dev must confirm exact 0-based column indices against the real file's header row before
coding the `ClassMap`, since the file isn't in this repo for this doc to count columns from.

| Column (CSV header, reference only) | Maps to | Required | Notes |
|---|---|---|---|
| Full Name | `FullName` | Yes | |
| Company's email | `Email` (primary) | No* | Upsert/match key, primary source |
| Personal email | `Email` (fallback) + `PersonalEmail` | Yes (one of the two emails) | Used for `Email`/upsert when `Company's email` is blank; always stored in `PersonalEmail` regardless of which one wins `Email` |
| Username | `Username` | No | Auto-generated from `Email` local-part if blank (see Defaulting) |
| Phone | `Phone` | No | |
| Role | `Title` | No | Plain `Role` column → `Title` (Q3) |
| Role (Chức danh HĐLĐ) | `ContractRole` | No | Labor-contract job title, new field (Q3) — distinct from `Title` |
| Gender | `Gender` | No | Free text, matches entity (`string?`, no enum) |
| Date Of Birth | `DateOfBirth` | No | `CsvImportParsers.ParseFlexibleDate` + new `"dd MM yyyy"` format; unparseable → **silent `null`** (Q4 — same as Device import, not a row error) |
| Contract | `Contract` + `Location` + `Status` | No | 3-way split, see "Finalized parsing rules" below (Q2) |
| ID | `EmployeeCode` | No | e.g. `SBOX0001` (Q7); unique when present |
| Team | `TeamMember` (via `Team` lookup) | No | Auto-create-by-name, same precedent as `DeviceType`/`Supplier` (Q8) |
| Bank name / Bank account number | `BankId` (via `Bank` lookup) + `BankAccountNumber` | No | Bank auto-create-by-name (Q6) |
| Hometown, NationalId\*, Nation, Religion, PermanentResidence, CurrentAddress, AcademicLevel, Major, SchoolOrUniversity, Certificates, MarriageStatus, NumberOfDependents, PersonalIncomeTaxCode, SocialInsuranceCode | matching pre-existing `User` scalar | No | Direct wiring, no schema change (Q6) |
| Emergency contact block (name/relationship/phone/address) | `Contact` row, `IsEmergencyContact = true` | No | `Type` resolved from relationship text via `ContactType` (unmapped → `Other`), see Entity: Contact above (Q6) |

\* At least one of `Company's email`/`Personal email` must resolve to a usable email — see Upsert key below.

A small handful of rows in the real file are office/team *divider* rows (not real employees — see
Defaulting rules below for the skip predicate) and are excluded from `errors`/`Skipped` entirely.

### Upsert key

**`Email`**, resolved as `Company's email` if non-blank, else `Personal email` (Q1) — case-insensitive. The
resolved value is written to `User.Email` (the unique-indexed column); `PersonalEmail` is also always
populated from the CSV's `Personal email` cell regardless of which source won the `Email` slot, so no data
is lost either way. Rationale for keeping `Email` unique-indexed as the key: `UserConfiguration.cs` has
unique indexes on both `Username` and `Email` (`HasIndex(x => x.Username).IsUnique()`,
`HasIndex(x => x.Email).IsUnique()`); `Username` is not reliably present in HR source data, while some
usable email is (company email for most rows, personal email as fallback for the ~14/174 rows missing a
company email). Rows with both emails missing or malformed are hard errors (cannot match or create).

A second, unique `Username` collision on CREATE (e.g. two different emails independently producing the
same auto-generated username) is a row error ("Username already in use"), not a retry/mutate loop —
matches the DeviceService import's "report and skip" philosophy rather than silently appending suffixes.

### Defaulting rules

- **Username** (new rows only, when blank): derive from the `Email` local-part (before `@`), lowercased,
  non-alphanumeric characters stripped (e.g. `jane.doe+hr@acme.com` → `janedoe`). No existing
  username-generation helper was found elsewhere in the codebase (current user-creation paths — tests,
  seed data — pass `Username` explicitly), so this import introduces the first one, scoped to
  `UserIndexService.Import.cs` only. If the derived value collides with an existing `Username`, the row
  errors (see above) rather than the importer inventing a suffix.
- **Status** (derived, not its own column — see Q2): `Exit` prefix present in the `Contract` cell →
  `Inactive`; absent → `Active`; blank `Contract` cell → `Active` (same "defaults to Active if blank" rule
  as before). Existing rows matched by email keep their current `Status` unless the CSV's `Contract` cell
  is non-blank (update = overwrite only on columns present/non-blank in the CSV, same partial-update
  convention as the Device importer).
- **Location** (derived, see Q2): `- AU` suffix present in the `Contract` cell → `AU`, else `VN`. On update,
  only overwritten when the CSV `Contract` cell is non-blank.
- **Contract** (derived, see Q2): the `Contract` cell with `Exit -`/`Exit`/`- AU`/`-AU` stripped maps to
  `ContractType` by name (case-insensitive). A bare `Exit` with nothing left after stripping → `Contract`
  stays `null`/unchanged — not an error.
- **Divider rows** (Q5): a row with `FullName` blank AND both `Company's email`/`Personal email` blank AND
  `Phone` blank is treated as a sheet divider (not a real employee row) — skipped silently, not counted in
  `errors` or `Skipped`. Any row with at least one of those four populated but missing a resolvable email is
  a genuine row error (counted in both `errors` and `Skipped`).
- **Username/Status/Contract/Location on UPDATE**: if a matched row's CSV cell for `Username` or `Contract`
  is blank, leave the existing DB value(s) untouched (no overwrite-with-blank).
- `CreatedBy`/`UpdatedBy`: `"SYSTEM"` placeholder per global convention (`// UNDONE: use current user`).

### Endpoint

`POST /api/users/import` — `multipart/form-data`, same shape as `POST /api/devices/import`.

### Response shape

Reuses the `*ImportResult` shape (new `UserImportResult` in a `Modules/UserImport/UserImportModel.cs`,
mirroring `DeviceImportModel.cs`):

```json
{
  "created": 12,
  "updated": 3,
  "skipped": 0,
  "errors": [
    { "row": 7, "reason": "Email is required" },
    { "row": 15, "reason": "Username already in use" }
  ]
}
```

### New files (for tech-lead/backend-dev sequencing — not implemented by this doc)

| File | Description |
|---|---|
| `api/Cms.Core/Enums/ContractType.cs`, `WorkLocation.cs` (new) | New enums, see "Enums" above |
| `api/Cms.Core/Db/Entities/Bank.cs` (new) + `BankConfiguration.cs` | New lookup entity, see "Entity: Bank" above |
| `api/Cms.Core/Db/Entities/Contact.cs` (edit), `Enums/ContactType.cs` (edit) | `+IsEmergencyContact`, `+Address`; widened `ContactType` |
| `api/Cms.Core/Db/Entities/User.cs` (edit) + `UserConfiguration.cs` (edit) | `+Contract, +Location, +ContractRole, +EmployeeCode (unique index), +BankId, +BankAccountNumber`; `-BankAccount, -4 EmergencyContact* scalars` |
| EF migration (via `ef.ps1`, see `.claude/rules/backend.md`) | Covers all of the above — **previously this doc said no migration needed; that's now wrong given the widened scope** |
| `api/Cms.Core/Common/CsvImportParsers.cs` (edit) | `ParseFlexibleDate` + `"dd MM yyyy"` format |
| `api/Cms.Core/Modules/UserImport/UserImportModel.cs` | `UserImportResult`, `UserImportRowError`, `UserImportCsvRow`, `UserImportCsvRowMap` (CsvHelper ClassMap using `.Index(...)`, not `.Name(...)` — see Q9) |
| `api/Cms.Core/Modules/UserIndex/UserIndexService.Import.cs` | `ImportFromCsvAsync` — parse → validate rows → resolve existing users by email + `Bank`/`Team` lookups (bulk) → build entities → `BulkUpsertAsync` on `Email` |
| `api/Cms.Core/Modules/TeamIndex/*` (edit) | New `FindOrCreateManyAsync(IEnumerable<string> names)` helper, mirroring `DeviceTypeService`'s |
| `api/Cms.Core/Modules/UserIndex/UserIndexService.cs` (edit) | `GetAllAsync`/`GetByIdAsync`/`UpdateAsync` migrated off the dropped `EmergencyContact*`/`BankAccount` fields onto `Contact`/`Bank` |
| `api/Cms.Api/Controllers/UsersController.cs` (edit) | `POST /api/users/import` action, same multipart-read pattern as `DevicesController` |
| `client/src/pages/users.vue` (edit) | Import button + `UModal`/`UFileUpload`, posts to `/api/users/import`, same pattern as `devices.vue`/`furniture.vue` |
| `client/src/pages/user-edit.vue`, `user-details.vue`, `userIndex.model.ts` (edit) | Migrate off dropped fields onto `Contact`(`IsEmergencyContact`)-based emergency-contact UI + `Bank` select + account number field |

### Acceptance criteria

- Given a CSV with valid `Full Name`/email rows and no existing matching users, when imported, then all
  rows are created with `Status = Active` and an auto-generated `Username` (when the column was blank).
- Given a CSV row whose `Email` (company, or personal when company is blank) matches an existing user, when
  imported, then that user is updated (only non-blank CSV columns overwrite existing values) and counted
  under `updated`, not `created`.
- Given a CSV row missing both `Company's email` and `Personal email`, when imported, then that row is
  recorded under `errors` with a clear reason and no user is created or modified; the rest of the file
  still processes.
- Given a CSV row whose auto-generated `Username` collides with an existing user's `Username`, when
  imported, then that row errors with "Username already in use" rather than creating a duplicate or a
  silently-suffixed username.
- Given a CSV row with an unparseable `DateOfBirth`, when imported, then `DateOfBirth` is left `null` for
  that row and the row otherwise imports normally — **not** a row error (Q4).
- Given a CSV row whose `Contract` cell is `"Exit - AU"`, when imported, then `Status = Inactive`,
  `Location = AU`, `Contract` unchanged/null (no type info after stripping `Exit`/`AU`).
- Given a CSV row whose `Contract` cell is `"Probation - AU"`, when imported, then `Status = Active`,
  `Location = AU`, `Contract = Probation`.
- Given a CSV row that is a sheet divider (blank `FullName`, blank both emails, blank `Phone`), when
  imported, then that row is skipped silently — not counted in `errors` or `Skipped`.
- Given a CSV `Team` value that doesn't match an existing team, when imported, then a new `Team` is
  auto-created and the user is attached as a member; re-importing the same file is idempotent (no duplicate
  `TeamMember` rows).
- Given a CSV `Bank` name that doesn't match an existing bank, when imported, then a new `Bank` is
  auto-created and linked via `BankId`.
- Given an emergency-contact block with a `EmergencyContactRelationship` value not recognized by
  `ContactType`, when imported, then the created `Contact` row's `Type = Other` — not a row error.
- Given the uploaded file is missing the required headers (`Full Name` + at least one email column), when
  imported, then the whole import is rejected before any rows are processed (same as
  `CsvImportHeaders.EnsureRequired` behavior for Devices/Furniture).
- The UI import modal shows the same `created`/`updated`/`skipped`/error-list summary pattern as the
  existing Devices/Furniture import modals.

## Open Questions (2026-10-27 — real sample file audit)

A real HR export (`sbox db - copy.csv`) was checked against the v1 import spec above. It doesn't match
as-is (different headers, extra columns, incompatible `Status`/date formats — see audit notes below each
question). Answer inline (edit this file directly, e.g. under each "**Answer:**" line) before backend-dev
widens/adjusts the importer.

1. **Which email column is the real upsert key?** The file has `Company's email` (14/174 rows blank or
   `"-"` — people with no company email yet) and `Personal email` (always present). Is `Company's email`
   still correct as the sole key, with those 14 rows simply erroring/skipping? Or should `Personal email`
   be a fallback match/create key when `Company's email` is blank?
   **Answer:** upsert key is company email, if company email is blank then use personal email.

2. **How should `Contract` map to `Status`?** The file's closest analog to `Status` is `Contract`, whose
   values are `Exit`, `Official`, `Probation`, `Service`, `Intern`, and `-AU`/`-Outsource` suffixed variants
   (e.g. `"Exit - AU"`). None of these match `UserStatus` (`Active | Inactive | OnLeave`). Options: (a) add
   a mapping table (e.g. `Official/Probation/Service/Intern → Active`, `Exit* → Inactive`) and accept the
   loss of nuance, (b) exclude `Status` from this file's import entirely and leave it admin-set, or (c) add
   new `UserStatus` values / a separate `EmploymentType` field to capture `Probation`/`Intern`/`Outsource`
   properly. Which?
   **Answer:** Split into 3 fields, don't collapse into `Status`:
   - New `Contract` field (new enum `ContractType`: `Official`, `Probation`, `Service`, `Intern`,
     `Outsource`) — the `Exit -`/`- AU` prefix/suffix stripped. A bare `Exit` value (no type info) leaves
     `Contract` unchanged/null, not an error.
   - New `Location` field (new enum `WorkLocation`: `VN`, `AU`) — derived from the `- AU` suffix; defaults
     to `VN` when absent. Separate from `Contract` because AU is an office/region, not a contract type
     (`Official - AU` and `Probation - AU` are still `Official`/`Probation` contracts, just based in AU).
   - Existing `Status` (`UserStatus`, untouched) — reused as-is for active/exited: `Exit` prefix present →
     `Inactive`; absent → `Active` (same "defaults to Active if blank" rule). `OnLeave` stays admin-set only;
     this CSV column never produces it. Keeps `AuthUserResolver`'s `UserStatus.Inactive` login-block check
     and all existing `UserStatus` filter/sort/UI code untouched — only additive fields, no renaming.

3. **Which "Role" column is `Title`, if either?** The file has two: `Role (Chức danh HĐLĐ)` (labor-contract
   job title) and plain `Role`. Current spec maps neither. Should one of them feed `Title`, and if so which?
   **Answer:** Role (Chức danh HĐLĐ)=ContractRole, Role=Title

4. **Should `DateOfBirth` parsing be loosened, or should unparseable dates stop being a hard row error?**
   The file's actual DOB values are space-separated (`"05 07 1990"`), which `CsvImportParsers.ParseFlexibleDate`
   does not accept (it only handles `dd/MM/yyyy`, `dd,MM,yyyy`, bare year) — every row would error on DOB as
   currently specced. Options: (a) add a `"dd MM yyyy"` format to the shared parser (also benefits Device
   import, which currently silently nulls unparseable dates instead — confirm that's fine to leave
   unchanged there), or (b) drop User import's "unparseable DOB → row error" rule back to silent-null like
   Device's. Which, or both?
   **Answer:** add `dd MM yyyy`. If not parsable then leave dob null

5. **Should section-divider rows be recognized instead of reported as errors?** 6 rows in the file are
   office/team dividers (`"Saigon"`, `"Saigon - Expats"`, `"Indi - Service"`, …) with every other column
   blank — not real employees. Today's "blank `Full Name` → row error, `Skipped++`" rule would surface these
   as 6 noisy errors. Is that acceptable (importer doesn't need to be smart about the sheet's layout), or
   should a blank-almost-everything row be silently skipped (not counted as an error) instead?
   **Answer:** skip

6. **Widen v1 scope now that a real source file exists?** The v1 column set was deliberately tight pending
   "a confirmed source file layout" (see Scope decision above) — this file is that source. ~24 of its
   columns already have a matching `User` field (`Hometown`, `NationalId` + issue date/place, `Nation`,
   `Religion`, `PermanentResidence`, `CurrentAddress`, `AcademicLevel`/`Major`/`SchoolOrUniversity`,
   `Certificates`, `EmergencyContact*`, `MarriageStatus`, `NumberOfDependents`, `BankAccount`,
   `PersonalIncomeTaxCode`, `SocialInsuranceCode`, `PersonalEmail`). Widen the importer to cover these now,
   or ship v1 as-is and treat this as a v2 follow-up task?
   **Answer:** Widen now — this file is the confirmed source. Most of the ~24 columns already have a
   matching scalar `User` field (`Hometown`, `NationalId` + issue date/place, `Nation`, `Religion`,
   `PermanentResidence`, `CurrentAddress`, `AcademicLevel`/`Major`/`SchoolOrUniversity`, `Certificates`,
   `MarriageStatus`, `NumberOfDependents`, `PersonalIncomeTaxCode`, `SocialInsuranceCode`, `PersonalEmail`)
   — just wire CSV → field, no schema change for those. Two columns need normalization instead of a plain
   scalar field:
   - **Bank**: new `Bank` entity (`Id`, `Name`, `Alias`) — same lookup pattern as `DeviceType`/`Supplier`
     (`FindOrCreateManyAsync`, resolve-by-name-or-create, see `DeviceService.Import.cs:77-80`). `User` gets
     `BankId` (FK, nullable) + `BankAccountNumber` (string, nullable); the old single `BankAccount` scalar
     field is dropped (name vs. account number were conflated in one field — now split).
   - **EmergencyContact**: reuse the existing `Contact` table instead of `User`'s 4 scalar fields
     (`EmergencyContactFullName/Relationship/Phone/Address`), which are **dropped**. `Contact` gets:
     - new `IsEmergencyContact` (bool) column — a CSV emergency-contact row becomes a `Contact` row with
       this flag set, `Name`/`Phone` from the existing columns.
     - new `Address` (string) column — `Contact` didn't have this; needed to not lose
       `EmergencyContactAddress` data on import.
     - `ContactType` enum (currently `Spouse=1, Child=2, Other=3`) widened with new values to cover the
       free-text `EmergencyContactRelationship` values actually seen in the file (e.g. `Mother`, `Father`,
       `Friend`, …) — tech-lead to enumerate the exact new enum members against the real file's distinct
       relationship strings.
   - Consequence for sequencing: this isn't purely additive — `UserIndexModel`/`UserIndexService` (index/get/
     update paths currently reading/writing the 4 `EmergencyContact*` fields and `BankAccount`,
     `UserIndexService.cs:111-114,176-179`) and the frontend (`user-edit.vue`, `user-details.vue`,
     `userIndex.model.ts`) must be updated to go through `Contact`/`Bank` instead — flag this to tech-lead
     as its own migration + cleanup task, not just new importer code.

7. **Is the `ID` column (e.g. `SBOX0001`) meaningful, and if so how?** There's no `User` field for an
   employee code today. Should it (a) be ignored, (b) become a new `EmployeeCode` field, or (c) seed
   `Username` directly instead of deriving one from the email local-part?
   **Answer:** b. add column `EmployeeCode`

8. **Should `Team` be handled by this import at all?** The file has a `Team` column (e.g. `BOD`, `Tally`).
   Team membership is a separate module (`TeamIndex`) today, not a `User` scalar field. Out of scope for
   this importer (teams assigned separately), or should the import also create/attach team membership?
   **Answer:** assign team when import as well, similar to deviceType or furnitureType is handled

9. **Should the importer's expected headers be changed to match this file's real headers**, or is this
   export expected to be re-saved/relabeled (e.g. `Fullname` → `Full Name`, `Company's email` → `Email`)
   before upload each time? If headers should just match the real file, say so and list any other header
   renames needed beyond `Fullname`/`Giới tính/ Gender`/`Phone number`/`Date of birth\n(dd/mm/yyyy)`.
   **Answer:** base on header names, set index in code to match the column. later header label could change but the index remains unchanged

## Implementation Tasks (tech-lead, 2026-10-27 — v1 shipped; this section resynced to the widened v2 scope)

**v1 status**: the narrow-scope importer from the original Scope decision (8 columns, no Bank/Team/Contact
normalization) is **already implemented and shipped** — `api/Cms.Core/Modules/UserImport/UserImportModel.cs`,
`UserIndexService.Import.cs`'s `ImportFromCsvAsync`, the controller action, the frontend import modal, and
tests are all done and checked off in `docs/plans/todo.md`. Everything below is the **v2 widening** per the
real-file audit (all 9 Open Questions above, answered 2026-10-27) — it rewrites the v1 importer's internals
(new CSV row shape, new parsing rules, new entities) rather than adding a second importer.

Grounded against `api/Cms.Core/Services/DeviceService.Import.cs` (reference 4/5-pass pattern: Pass 1
required-field filter → Pass 2 bulk lookup-resolve via `FindOrCreateManyAsync` + bulk user-by-email resolve
→ Pass 3 build entities → Pass 4 `BulkUpsertAsync` → Pass 5 secondary-relationship writes keyed by
re-queried ids), `api/Cms.Core/Services/DeviceTypeService.cs` (`FindOrCreateManyAsync` shape: trim+distinct
`OrdinalIgnoreCase` → `BulkUpsertAsync(matchOn: Name, config: new BulkConfig { IdentityOutput = true })` →
`Dictionary<string,int>` name→id — mirror this exactly for `Bank` and `Team`), `api/Cms.Core/Db/Entities/
Supplier.cs` (reference shape for `Bank`), `api/Cms.Core/Common/CsvImportParsers.cs`, and
`api/Cms.Core/Modules/TeamIndex/*` + `TeamMember.cs` (`TeamId, MemberId, Role: MemberRole` join entity —
no existing find-or-create-by-name helper for `Team`, needs adding).

### Module placement (unchanged from v1)

Already in place: `UserIndexService` is `partial`, split across `UserIndexService.cs` (CRUD) and
`UserIndexService.Import.cs` (import), with DTOs in `api/Cms.Core/Modules/UserImport/UserImportModel.cs`.
v2 work extends these same files, not new ones.

### Schema changes (new — v1 needed none, v2 does)

1. `api/Cms.Core/Enums/ContractType.cs`, `WorkLocation.cs` (new) — see "Enums" in Current State above.
2. `api/Cms.Core/Enums/ContactType.cs` (edit) — widen with the placeholder members listed above; replace
   with the real file's distinct `EmergencyContactRelationship` values once available (**blocker**: file not
   in repo for this session to enumerate from).
3. `api/Cms.Core/Db/Entities/Bank.cs` (new) + `Db/Configurations/BankConfiguration.cs` (new) + `DbSet<Bank>`
   on `ApplicationDbContext` + `IBankService`/`BankService` with `FindOrCreateManyAsync`
   (`ServiceCollectionExtension.cs` registration needed).
4. `api/Cms.Core/Db/Entities/Contact.cs` (edit): `+IsEmergencyContact (bool)`, `+Address (string?)`.
   `Db/Configurations/ContactConfiguration.cs` (edit, if exists) for any new column constraints.
5. `api/Cms.Core/Db/Entities/User.cs` (edit): `+Contract (ContractType?)`, `+Location (WorkLocation, default
   VN)`, `+ContractRole (string? MaxLength(250))`, `+EmployeeCode (string? MaxLength(50))`, `+BankId (int?,
   FK)`, `+BankAccountNumber (string?)`; `-BankAccount`, `-EmergencyContactFullName/Relationship/Phone/
   Address` (4 scalars dropped). `Db/Configurations/UserConfiguration.cs` (edit):
   `builder.HasIndex(x => x.EmployeeCode).IsUnique()` (SQL Server unique index allows multiple `NULL`s by
   default, so existing rows without a code aren't blocked — matches `Username`/`Email` precedent).
6. One new EF migration via `ef.ps1` (see `.claude/rules/backend.md`/skill `ef-migrations`) covering 1–5.
   Stop `Cms.Api` before running.
7. `api/Cms.Core/Common/CsvImportParsers.cs` (edit): add `"dd MM yyyy"` format to `ParseFlexibleDate` — this
   is additive and also benefits Device import, which already treats unparseable dates as silent `null`, so
   no behavior change there.
8. `api/Cms.Core/Modules/TeamIndex/*` (edit): add `FindOrCreateManyAsync(IEnumerable<string> names)` to
   `ITeamIndexService` (or a sibling), mirroring `DeviceTypeService`'s implementation exactly, returning
   `Dictionary<string,int>` team name → id.

### Finalized CSV mapping strategy (Q9)

**Switch from `.Name(...)` to `.Index(...)`** in `UserImportCsvRowMap` — the answer ("index remains
unchanged" even if "header label could change") is explicit about position-based matching surviving label
drift, which this real file needs (two differently-worded "Role" columns, `Company's email` vs `Personal
email`, Vietnamese/English mixed labels). Tradeoff: this trades robustness-to-label-text for
fragility-to-column-reordering — if HR reorders columns in a future export, the importer silently mis-maps
instead of erroring. Non-blocking follow-up recommendation (not required for this round): log/validate the
header row's *text* against an expected list as a warning in the import result, even though mapping itself
stays index-based, so a reorder is at least visible, not silent. `CsvHelper` still needs
`HeaderValidated = null` (already set) since header text is no longer being matched for mapping.
`RequiredHeaders` becomes index-position checks (`Full Name` position + at least one email-column position
present) rather than name lookups.

**Exact 0-based column indices**: TBD — confirm against the real file's header row before coding the
`ClassMap`; the file (`sbox db - copy.csv`) is not present in this repo for this doc to count columns from.

### Finalized parsing rules

- **Email (Q1)**: resolve `Company's email` if non-blank, else `Personal email`, into `User.Email`; always
  also store `Personal email`'s raw value into `User.PersonalEmail` regardless of which one won `Email`.
  Both blank/malformed → row error.
- **Contract/Location/Status (Q2)**: from the raw `Contract` cell — strip a leading `Exit -`/`Exit` token
  (case-insensitive, optional trailing `-`/whitespace) to determine `Status` (`Inactive` if stripped,
  `Active` if not, same "blank → Active" default as before); strip a trailing `- AU`/`-AU` token to
  determine `Location` (`AU` if present, else `VN`); whatever remains after both strips maps to
  `ContractType` by name (case-insensitive) — empty remainder (e.g. bare `Exit`) → `Contract = null`, not an
  error; non-empty but unrecognized remainder → row error (`"Contract is invalid: '<raw>'"`).
- **Title/ContractRole (Q3)**: plain `Role` column → `Title`; `Role (Chức danh HĐLĐ)` column → new
  `ContractRole`. Both optional, no parsing beyond trim.
- **DateOfBirth (Q4)**: reuse `CsvImportParsers.ParseFlexibleDate` (now including `"dd MM yyyy"`).
  Unparseable/blank → **silent `null`** — this REVERSES the v1 "row error" rule; User import now matches
  Device import's behavior exactly.
- **Divider rows (Q5)**: before the required-field check, test: `FullName` blank AND `Company's email`
  blank AND `Personal email` blank AND `Phone` blank → skip the row entirely (don't add to `errors` or
  `Skipped`, don't add to `pending`). Otherwise proceed to the normal required-field/email-resolution error
  checks.
- **EmployeeCode (Q7)**: trim only, no format validation; blank → `null`.
- **Team (Q8)**: resolve via `teamIndexService.FindOrCreateManyAsync` (new helper, see Schema changes #8);
  blank `Team` cell → no membership change; non-blank → upsert a `TeamMember` row for (resolved team id,
  resolved user id) if one doesn't already exist (default `MemberRole` — pick the enum's plain-member value,
  not lead/manager), making re-import idempotent.
- **Bank (Q6)**: resolve bank name via `bankService.FindOrCreateManyAsync` (new, mirrors
  `DeviceTypeService`); `BankAccountNumber` stored as-is (trim only).
- **EmergencyContact (Q6)**: when the CSV's emergency-contact block has any non-blank cell, create/update one
  `Contact` row per user with `IsEmergencyContact = true`, `Name`/`Phone`/`Address` from the CSV, `Type`
  resolved from `EmergencyContactRelationship` text via `Enum.TryParse<ContactType>` (case-insensitive) —
  no match → `ContactType.Other` (not a row error).
- **Username auto-generation** (unchanged from v1): `GenerateUsernameFromEmail(string email)` in
  `UserIndexService.Import.cs` — local-part before `@`, lowercased, `Regex.Replace(..., "[^a-z0-9]", "")`;
  empty result → row error (`"Could not derive a username from Email"`).

### Backend Tasks (for backend-dev)

1. Apply Schema changes #1–#7 above, then run the migration (#6).
2. `api/Cms.Core/Modules/UserImport/UserImportModel.cs` (rewrite): widen `UserImportCsvRow` to cover all
   mapped columns (company/personal email, both role columns, `Contract`, `ID`, `Team`, bank columns, the
   ~13 directly-wired scalar columns, emergency-contact block columns); rewrite `UserImportCsvRowMap` to use
   `.Index(...)` per the finalized indices (confirm against the real file first).
3. `api/Cms.Core/Modules/UserIndex/UserIndexService.Import.cs` (rewrite `ImportFromCsvAsync`):
   - **Pass 1**: divider-row skip predicate first (Q5), then required-field + email-resolution checks.
   - **Pass 2**: bulk-resolve existing users by resolved email (same as v1, but widen the projection to
     include every updatable column so partial-update-keeps-existing-on-blank still works, same caveat v1
     already handles for its 6 fields — now covering the full widened field set) + `bankService
     .FindOrCreateManyAsync` + `teamIndexService.FindOrCreateManyAsync` for the file's distinct bank/team
     names.
   - **Pass 3**: build `User` entities/diffs per row — parse Contract/Location/Status/DateOfBirth/Title/
     ContractRole/EmployeeCode/Bank per the rules above; build/merge `Contact` (emergency) rows separately.
   - **Pass 4**: `BulkUpsertAsync` for `User` rows (matching on `Email`, update columns = the full widened
     set); separate upsert/insert pass for `Contact` rows (match on `UserId` + `IsEmergencyContact`) and
     `TeamMember` rows (match on `TeamId` + `MemberId`, insert-if-missing only).
   - `result.Created`/`Updated`/`Skipped` bookkeeping: unchanged shape from v1, just sourced from the wider
     row set.
4. `api/Cms.Core/Modules/UserIndex/UserIndexService.cs` (edit) — migrate `GetAllAsync`/`GetByIdAsync`
   projections and `UpdateAsync` off the dropped `EmergencyContactFullName/Relationship/Phone/Address` and
   `BankAccount` fields onto `Contact` (`IsEmergencyContact`) and `Bank`/`BankAccountNumber`. This is its own
   migration task, not just importer plumbing — `UserGetModel`/`UserUpdateModel` (in `UserIndexModel.cs`)
   need the same field swap.
5. `api/Cms.Api/Controllers/UsersController.cs`: no change needed beyond v1 (already shipped `Import`
   action) unless the `GetById`/`Update` actions' DTOs changed shape per #4.
6. `ServiceCollectionExtension.cs`: register new `IBankService`/`BankService`.

### Frontend Tasks (for frontend-dev)

1. `client/src/modules/user_index/userIndex.model.ts` (edit) — drop the 4 `EmergencyContact*` scalar fields
   and `BankAccount` from `UserGet`/`UserUpdate` types; add `Contract`, `Location`, `ContractRole`,
   `EmployeeCode`, `BankId`, `BankAccountNumber`; `Contact` type gains `isEmergencyContact`/`address`.
2. `client/src/pages/user-edit.vue`, `user-details.vue` (edit) — replace the 4 emergency-contact text inputs
   with a `Contact`-based emergency-contact section (reusing however the page already renders family-member
   `Contact` rows, if it does); replace the single `BankAccount` text input with a `Bank` select (searchable,
   create-on-the-fly if the UI supports it) + account-number text input; add inputs for `Contract`,
   `Location`, `ContractRole`, `EmployeeCode`.
3. `client/src/pages/users.vue` — import modal itself (`isImportModalOpen`/`onImport`/`UFileUpload`) is
   already shipped from v1 and structurally unaffected (same `created`/`updated`/`skipped`/`errors`
   response shape) — no change needed here beyond what v1 already has.

### Test Tasks (for qa-engineer, after backend-dev)

v1 tests (missing-headers, basic create/update, malformed email, username collision — intra-file and
DB) are already shipped; add for v2:

1. DateOfBirth unparseable → row imports successfully with `DateOfBirth = null` (flips the old
   "row error" test to a "silent null" test).
2. `Contract` cell `"Exit - AU"` → `Status = Inactive`, `Location = AU`, `Contract = null`.
3. `Contract` cell `"Probation - AU"` → `Status = Active`, `Location = AU`, `Contract = Probation`.
4. `Contract` cell blank → `Status = Active` (new row) / unchanged (update row), `Location = VN`.
5. Divider row (blank `FullName` + both emails + `Phone`) → not counted in `errors` or `Skipped`.
6. `Company's email` blank, `Personal email` present → that value used for both match/create key and
   `Email`; `PersonalEmail` field also populated.
7. Unrecognized `Team` name → new `Team` auto-created, `TeamMember` row created; re-importing the same file
   → no duplicate `TeamMember` row (idempotent).
8. Unrecognized `Bank` name → new `Bank` auto-created, `User.BankId` points to it.
9. Emergency-contact block with an unrecognized relationship string → `Contact.Type = Other`, not a row
   error; `Contact.IsEmergencyContact = true`.
