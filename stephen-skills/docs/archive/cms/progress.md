# Work Progress Log

Chronological record of completed work sessions. Updated by agents at the end of each session.
Older sessions (through 2026-07-19): `progress-archive.md`. Keep only the latest ~3 sessions here; move older ones to the archive.
See `todo.md` for current checkbox state per feature.

---

## 2026-10-27

### Session: Spec — Import Employees from CSV
**Agent:** pm
**Status:** Complete (design/scoping only, no code) — ready to hand off to tech-lead/backend-dev

Specced the "Import Employees from CSV" sub-feature under todo.md section 3 (Employee Management,
Deferred), mirroring the shipped Device/Furniture CSV import pattern.

**Files modified:**
- `docs/plans/employee-management-design.md` — added "Import Employees from CSV (New)" section: CSV
  column list (required: Full Name, Email; optional: Username, Phone, Title, Gender, DateOfBirth,
  Status), upsert key, defaulting rules, endpoint, response shape, new-files table, acceptance criteria
- `docs/plans/todo.md` — added checklist entry under section 3 (backend/frontend/validation sub-tasks)

**Decisions:**
- **Scope kept tight on purpose**: only 7 of ~25 `User` fields are importable in v1 (Full Name, Email,
  Username, Phone, Title, Gender, DateOfBirth, Status). No source file exists yet to justify importing
  the rest (NationalId, academic, emergency-contact, bank fields, etc.) — flagged as a later follow-up if
  HR produces a bigger source file.
- **Upsert key = `Email`** (case-insensitive), not `Username`. Checked `UserConfiguration.cs`: both
  `Username` and `Email` have unique indexes, but HR source data reliably has email, not login usernames.
- **Username auto-generation is new** — no existing helper found anywhere in the codebase (current
  creation paths all pass `Username` explicitly, e.g. test fixtures). Derives from the `Email` local-part,
  lowercased/stripped of non-alphanumerics; a collision is a hard row error ("Username already in use"),
  not a silently-suffixed retry — kept consistent with the Device importer's "report and skip" philosophy
  rather than inventing new auto-resolution behavior.
- **Status defaults to `Active`** on create when blank; on update, a blank CSV cell never overwrites an
  existing value (partial-update convention, same as Device import).
- Endpoint: `POST /api/users/import`, `UserImportResult` response shape copied from `DeviceImportResult`.

**Not done (explicitly out of scope — PM role):** no entity/migration/service/controller code, no CSV
parser, no frontend modal. Next: tech-lead to produce the API contract + sequenced task breakdown, then
backend-dev → frontend-dev → qa-engineer per the standard workflow.

---

### Session: Task breakdown — Import Employees from CSV
**Agent:** tech-lead
**Status:** Complete (planning only, no code) — ready to hand off to backend-dev

Read pm's design doc section plus `DeviceService.Import.cs`, `DeviceImportModel.cs`, `CsvImportParsers.cs`,
`DevicesController.Import`, `devices.vue` import modal, `UserIndex` module, `UsersController`, and
`UserConfiguration.cs` to ground the plan in real code shapes. Appended "## Implementation Tasks
(tech-lead, 2026-10-27)" to `docs/plans/employee-management-design.md` with exact file paths/signatures;
updated `docs/plans/todo.md`'s checklist to point at that subsection and reflect the decisions below.

**Decisions (resolving pm's open items):**
- **Module placement**: `Modules/UserIndex/UserIndexService.Import.cs` (new partial-class file), not
  `Services/UserService.Import.cs` — `User` already follows the module pattern, unlike `Device`.
- **CSV headers** (exact strings): `Full Name | Email | Username | Phone | Title | Gender | Date Of Birth |
  Status`. `RequiredHeaders = ["Full Name", "Email"]`.
- **DateOfBirth parsing**: reuse `CsvImportParsers.ParseFlexibleDate`, but — unlike Device import, which
  treats an unparseable date as silent `null` — a non-blank unparseable value here is a row error (per
  design doc's acceptance criteria). Do not change the shared helper; add the stricter check at the
  call site.
- **Status parsing**: `Enum.TryParse<UserStatus>` (name, case-insensitive) or numeric string; non-blank +
  unparseable → row error.
- **Partial-update merge caveat found while planning**: `BulkUpsertAsync`'s `updateColumns` always
  overwrites every listed column — it has no per-row "skip this column" concept. To honor "blank CSV cell
  never overwrites an existing value" for updates, Pass 2's existing-user lookup must fetch full current
  field values (not just `{Id, Email, Username}`), so Pass 3 can merge blank-keeps-existing into the entity
  *before* it reaches `BulkUpsertAsync`, rather than attempting a true column-level partial update through
  the bulk extension.
- **Username collision check must also cover intra-file duplicates** (two blank-Username rows deriving the
  same value from different emails in the same CSV) — not just DB collisions. Added as an explicit qa task.
- Frontend: no new `user_import` module — `UserImportResult`/`UserImportRowError` types go in the existing
  `modules/user_index/userIndex.model.ts`, following the precedent that `DeviceImportResult` lives in
  `device_index.model.ts`, not a separate `device_import` module.

**Open questions for backend-dev:** none blocking — one judgment call left open in the doc (whether to
declare `ImportFromCsvAsync` in `UserIndexService.cs`'s existing interface block or in the new partial
file; either is acceptable, just be consistent).

**Handed to:** backend-dev next (read `docs/plans/employee-management-design.md`'s "Implementation Tasks"
subsection, section "Backend Tasks"), then frontend-dev, then qa-engineer, per standard workflow.

---

### Session: Backend — Import Employees from CSV
**Agent:** backend-dev
**Status:** Complete (backend only, per tech-lead's "Backend Tasks" list) — ready to hand off to frontend-dev, then qa-engineer

Implemented `POST /api/users/import` following the Device CSV import pattern
(`DeviceService.Import.cs`, `DeviceImportModel.cs`, `DevicesController.Import`) as directed by the
"Implementation Tasks (tech-lead, 2026-10-27)" subsection of `docs/plans/employee-management-design.md`.

**Files created:**
- `api/Cms.Core/Modules/UserImport/UserImportModel.cs` — `UserImportResult`, `UserImportRowError`
  (same shape as `DeviceImportResult`/`DeviceImportRowError`); `internal sealed UserImportCsvRow`
  (`FullName, Email, Username, Phone, Title, Gender, DateOfBirth, Status`, all `string?`); `internal
  sealed UserImportCsvRowMap : ClassMap<UserImportCsvRow>` mapping the 8 exact CSV headers (`Full Name |
  Email | Username | Phone | Title | Gender | Date Of Birth | Status`); `RequiredHeaders = ["Full Name",
  "Email"]`.
- `api/Cms.Core/Modules/UserIndex/UserIndexService.Import.cs` — `partial class UserIndexService`,
  `ImportFromCsvAsync(Stream, CancellationToken)`. 4-pass structure: (1) read rows, required-field +
  email-format validation (`System.Net.Mail.MailAddress`); (2) bulk-resolve existing users by `Email`
  (case-insensitive dictionary, full field snapshot for merge) plus a separate `HashSet` of **all**
  existing `Username`s (for collision-checking brand-new rows, not just matched ones); (3) per row,
  parse `DateOfBirth`/`Status` with strict "non-blank+unparseable = row error" checks, merge
  blank-CSV-cell-keeps-existing-value for update rows (`FullName`/`Email` always overwrite since
  required; `Username`/`Phone`/`Title`/`Gender`/`DateOfBirth`/`Status` conditionally), auto-generate
  `Username` from the email local-part for blank-Username create rows, track used usernames in a
  per-file `HashSet` to catch intra-file collisions in addition to DB collisions; (4)
  `BulkUpsertAsync(matchOn: x => x.Email, updateColumns: ...)` — since blank-keeps-existing was already
  merged into each entity in pass 3, the bulk extension's unconditional column overwrite is safe.
  `Created`/`Updated` counts are derived from whether each row's email was present in the pass-2 map
  (same style as `DeviceService.Import.cs`'s existing-serials check).

**Files modified:**
- `api/Cms.Core/Modules/UserIndex/UserIndexService.cs` — added `partial` to the class declaration; added
  `Task<UserImportResult> ImportFromCsvAsync(Stream, CancellationToken)` to `IUserIndexService`; added
  `using Cms.Core.Modules.UserImport;`.
- `api/Cms.Api/Controllers/UsersController.cs` — added `[HttpPost("import")] Import(IFormFile file, ...)`,
  same body as `DevicesController.Import` (null/empty check, 5MB max, `.csv` extension check,
  `CsvFormatException` → `BadRequest`). No new DI dependency — reuses the already-injected
  `IUserIndexService`.
- `docs/plans/todo.md` — checked off all completed "Backend" and "Validation" items under section 3 ›
  "Import Employees from CSV"; left "Frontend" and qa-engineer "Test Tasks" unchecked (not this session's
  scope).

**Contract implemented as specified — no deviations.** Confirmed against the design doc:
- Upsert key `Email`, case-insensitive, via `BulkUpsertAsync(matchOn: x => x.Email, ...)`.
- New-row `Username` auto-generation from email local-part (lowercase, `[^a-z0-9]` stripped); empty
  result after stripping → row error "Could not derive a username from Email"; collision (DB-wide or
  intra-file) → row error "Username already in use", no suffix retry.
- `Status` blank on create → `Active`; blank on update → keeps existing value; non-blank+unparseable →
  row error naming the column (`Enum.TryParse<UserStatus>` with `Enum.IsDefined` guard, so a numeric
  string like `"99"` outside the enum range is also rejected, not silently accepted).
- `DateOfBirth` reuses `CsvImportParsers.ParseFlexibleDate`; strict check added at the call site only
  (non-blank+unparseable → row error) — the shared helper itself is untouched, so Device import's
  silent-null behavior does not regress.
- Update rows: blank CSV cell never overwrites existing value — merged in pass 3 before entities reach
  `BulkUpsertAsync`, per tech-lead's caveat that the bulk extension always overwrites every listed column
  unconditionally.
- `CreatedBy`/`UpdatedBy` = `"SYSTEM"` placeholder with `// UNDONE: use current user`, per global
  convention (no current-user resolver wired into this import path, matching the rest of `UserIndexService`
  except the one spot that already has `authUserResolver` for cache eviction, which import doesn't need).
- No migration — no schema change. No `ServiceCollectionExtension.cs` change — rides on the existing
  `AddUserIndexModule()` registration.

**Not run:** `dotnet build` (repo convention — not run after every edit); `dotnet test` (no test file
exists yet, that's qa-engineer's task).

---

### Session: Frontend — Import Employees from CSV
**Agent:** frontend-dev
**Status:** Complete (frontend only, per tech-lead's "Frontend Tasks" list) — ready to hand off to qa-engineer

Implemented the import UI for `POST /api/users/import`, mirroring `client/src/pages/devices.vue`'s
existing CSV import modal exactly (markup shape, `FormData`/`fetch` upload, toast pattern).

**Files modified:**
- `client/src/modules/user_index/userIndex.model.ts` — added `UserImportRowError` (`{ row, reason }`)
  and `UserImportResult` (`{ created, updated, skipped, errors }`), same shape as `DeviceImportResult` in
  `device_index.model.ts`. No new `user_import` module, per tech-lead's precedent decision.
- `client/src/pages/users.vue` — added `isImportModalOpen`/`importFile`/`isImporting`/`importResult` refs
  and `onImport()` (identical structure to `devices.vue`'s `onImport`: builds `FormData`, posts to
  `/api/users/import`, toasts created/updated/skipped counts, re-`execute()`s the list on success); added
  an "Import from CSV" `UButton` next to "Add User" in the navbar `#right` slot; added a `UModal` with
  `UFileUpload` (`.csv` accept, dropzone) plus a result summary line (created/updated/skipped counts) and
  a scrollable row-error list, same as `devices.vue`'s modal.
- `docs/plans/todo.md` — checked off the "Frontend" sub-checklist under section 3 › "Import Employees from
  CSV".

**Deviation from the device pattern:** added an explicit "N created, N updated, N skipped" summary line
inside the modal body (devices.vue only shows this via the toast, not in the modal itself). Kept the rest
of the markup — file upload, error list, Cancel/Import buttons — identical to devices.vue. Also added a
one-line CSV header hint in the modal body (`Full Name, Email, Username, Phone, Title, Gender, Date Of
Birth, Status`; Full Name/Email required) since devices.vue's modal has no equivalent help text and users
has no separate CSV-column convention documented elsewhere in the UI.

**Verification:** ran `npm run typecheck` in `client/`. No new type errors introduced by these changes;
all reported errors are pre-existing and unrelated (leave-new.vue/HomeDateRangePicker `CalendarDate`
version-mismatch errors, team-edit.vue, user-edit.vue, user-details.vue — none touched this session). Did
not run `dotnet build` or start the dev server, per repo convention / task instructions.

**Handed to:** qa-engineer next, per standard workflow (backend test tasks only — no new frontend test
convention exists in this repo to extend).

**Pending for next agents:**
- frontend-dev: `client/src/modules/user_index/userIndex.model.ts` (add `UserImportResult`/
  `UserImportRowError` types) + `client/src/pages/users.vue` (import modal), per the design doc's
  "Frontend Tasks" list.
- qa-engineer: `api/Cms.Tests/UserIndexServiceImportTest.cs` (or extend an existing `UserIndexServiceTest.cs`
  if one exists), per the design doc's "Test Tasks" list — 8 scenarios listed there, including the
  intra-file username-collision case and both `DateOfBirth`/`Status` parse-failure cases.

---

## 2026-10-25

### Session: Auth integration tests (step 4 of plan)
**Agent:** qa-engineer
**Status:** Complete — `AuthServiceTest.cs` written and passing (8/8), per plan `implement-authentication-authorization-w-wondrous-dongarra.md`, "Testing (qa-engineer)" section + Sequencing step 4.

Wrote integration tests for `IAuthService`/`AuthService` (`api/Cms.Core/Modules/Auth/AuthService.cs`): pure-logic tests only, no live Firebase token verification or HTTP layer.

**Files added:**
- `api/Cms.Tests/AuthServiceTest.cs` — `IClassFixture<BaseTestFixture>`, 8 tests:
  - `IsAllowedDomain_MatchingDomain_ReturnsTrue`
  - `IsAllowedDomain_NonMatchingDomain_ReturnsFalse`
  - `IsAllowedDomain_CaseInsensitiveDomain_ReturnsTrue`
  - `IsAllowedDomain_EmptyAllowedDomains_FailsClosed`
  - `IsAllowedDomain_NullAllowedDomains_FailsClosed` (extra case beyond plan wording, since `AllowedDomains` is nullable-checked in the service)
  - `FindUserByEmail_SeededUser_ReturnsThatUser`
  - `FindUserByEmail_NonExistentEmail_ReturnsNull`
  - `FindUserByEmail_MixedCaseSeeded_LowercaseLookup_Matches` (SQL Server default collation case-insensitivity, simulating Firebase/Google's lowercase email claim)

**Result:** `dotnet test api/Cms.Tests/Cms.Tests.csproj -v q --filter FullyQualifiedName~AuthServiceTest` → `Passed! - Failed: 0, Passed: 8, Skipped: 0, Total: 8`.

**Decisions / deviations from plan:**
- `AuthService` is registered via `IOptions<AuthConfig>`, and the test fixture's in-memory config (`BaseTestFixture`) only sets the connection string — no `Authentication:AllowedDomains` section. So `fix.Get<IAuthService>()` always resolves with an empty allow-list. To test matching/non-matching/case-insensitive domains with specific `AllowedDomains` values, `AuthService` is constructed manually per test (`BuildService` helper) using `fix.Get<IDbContextFactory<ApplicationDbContext>>()` for the DB dependency and `Options.Create(new AuthConfig { AllowedDomains = [...] })` for the config — same manual-construction pattern already used for `DeviceService`/`FurnitureService` in this suite (per `.claude/rules/backend.md`), just for a config-injection gap rather than an S3/logger DI gap.
- Added a 5th `IsAllowedDomain` case (`null` array, not just empty) since the service explicitly checks `allowedDomains is null`.
- User seeding reuses the `BaseTestFixture.UpsertUserAsync` + `ContextBulkExtension` pattern from `UserServiceTest.cs` (unique `Guid` suffix per test for isolation, `IdentityOutput = true` to get the generated `Id` back).

**Not done / out of scope this session:** no changes to `BaseTestFixture.cs`; did not touch Firebase token verification, `AuthController`, or `HttpContextUserResolver` (those are HTTP/middleware layer, excluded by the plan from this test scope).

### Session: Frontend auth wiring — Firebase Google login (step 3 of plan)
**Agent:** frontend-dev
**Status:** Complete (frontend step 3 of `implement-authentication-authorization-w-wondrous-dongarra.md` only — `AuthServiceTest.cs`, step 4, not started; backend steps 1-2 already landed earlier today, see session below)

Implemented the frontend half of Google-only login via Firebase Authentication: `firebase` SDK (`signInWithPopup` + `GoogleAuthProvider`) + `pinia` auth store, a global router guard that redirects unauthenticated users to `/login`, and a real `UserMenu.vue` identity instead of the hardcoded "Benjamin Canac" mock.

**Files added:**
- `client/src/firebase.ts` — `initializeApp` with a placeholder config object (`apiKey`/`authDomain`/`projectId`/etc. all `'TODO_FIREBASE_*'` strings, commented) + `export const auth = getAuth(app)`
- `client/src/stores/auth.ts` — Pinia `useAuthStore` (options-store syntax, matching nothing else in the codebase yet since this is the first store — chose options-store form for readability): state `user: User | null`, `isReady: boolean`; actions `init()` (subscribes `onAuthStateChanged`, resolves a promise on the first callback so callers can await session restore), `signInWithGoogle()` (`signInWithPopup` + `GoogleAuthProvider`), `signOut()` (`firebaseSignOut`), `getIdToken()` (`auth.currentUser?.getIdToken()`, SDK auto-refreshes)
- `client/src/composables/useApiFetch.ts` — `createFetch` wrapper from `@vueuse/core` with an async `beforeFetch` that calls `authStore.getIdToken()` and sets `Authorization: Bearer <token>`. Not yet adopted by any existing page (none of the current endpoints are `[Authorize]`-protected yet) — ready for new/updated pages that need it.
- `client/src/pages/login.vue` — centered `UCard`, "Sign in with Google" `UButton` (`i-simple-icons-google` icon, loading state, inline error message on failure), redirects to `route.query.returnUrl` or `/` on success via `router.push`

**Files modified:**
- `client/package.json` / `pnpm-lock.yaml` — added `firebase` (13.1.0) and `pinia` (4.1.0) via `pnpm add`
- `client/src/main.ts` — `app.use(createPinia())`; added `{ path: '/login', component: () => import('./pages/login.vue') }` to the routes array (deliberately NOT added to `App.vue`'s sidebar `links`, per plan); `router.beforeEach` guard: calls `authStore.init()` once (lazily, via `isReady` check) before any navigation decision, lets `/login` through unconditionally, redirects to `/login?returnUrl=<fullPath>` when `authStore.user` is null, otherwise proceeds; `authStore.init()` is also awaited once more before `app.mount('#app')` so the very first render already reflects restored session state
- `client/src/components/UserMenu.vue` — removed the hardcoded `user` ref; `user` is now a `computed` reading `authStore.user?.displayName`/`photoURL`/`email` (falls back to email, then `'Unknown user'`, if Google didn't supply a display name); "Log out" item's `onSelect` now calls `authStore.signOut()` then does `window.location.href = '/login'` (full page nav, not router push, to guarantee all in-memory state — Pinia stores, component state — resets cleanly, per plan instruction)

**Pending manual actions (user):**
- Fill in the real Firebase Web app config (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`) in `client/src/firebase.ts` — currently all placeholder `'TODO_FIREBASE_*'` strings — once the Firebase project exists and Google sign-in is enabled (backend session already notes `appsettings.json`'s `Authentication:Firebase:ProjectId` needs the same project id)
- Manual browser test end-to-end once config is filled in: sign in with an allowed-domain Google account that matches a `Users.Email` row → lands on `/`, `UserMenu` shows real name/avatar, log out → back to `/login`; an unauthenticated direct hit on any other route → redirected to `/login?returnUrl=...`
- No `pnpm dev` / manual click-test run this session (no browser tool available, and plan explicitly deferred manual testing to the user)

**Not done (explicitly out of scope per instructions):**
- Did not convert any existing page from `useFetch` to `useApiFetch` — plan explicitly scoped this to leaving old pages alone since current endpoints aren't `[Authorize]`-protected yet
- Did not touch `App.vue`'s sidebar `links` array
- No `AuthServiceTest.cs` (plan step 4 — qa-engineer, separate agent)

**Notes / decisions:**
- Used Pinia's **options-store** syntax (`defineStore('auth', { state, actions })`) rather than the setup-store/composition form — this is the first Pinia store in the codebase so there's no existing convention to match; flagging for `tech-lead`/`AGENTS.md` if a different style is preferred for future stores
- `useAuthStore` is called twice in `main.ts` — once as `useAuthStore(pinia)` right after `app.use(pinia)` to get a module-scope reference for the router guard (Pinia requires either an active app/pinia instance or an explicit `pinia` argument when called outside a component setup function), and implicitly again inside `UserMenu.vue`/`login.vue` via the normal in-component call — both resolve to the same singleton store instance
- Router guard calls `authStore.init()` lazily inside `beforeEach` (guarded by `isReady`) in addition to the explicit `authStore.init()` before `app.mount` — belt-and-suspenders so a direct deep-link navigation before mount still works even if mount's `init()` call were ever removed; `init()` itself is idempotent (returns a resolved promise immediately if `isReady` is already true) so the double-call has no side effect
- Verified no new TypeScript errors via `pnpm typecheck` (`vue-tsc`): confirmed by `git stash`-ing this session's changes and re-running — the exact same pre-existing errors (`FormDatePicker.vue`, `HomeDateRangePicker.vue`, `leave-new.vue`, `team-edit.vue`, `user-edit.vue`, `users.vue` — all `@internationalized/date` / unrelated type issues) appear with or without this session's diff; none of the new/modified auth files (`firebase.ts`, `stores/auth.ts`, `useApiFetch.ts`, `login.vue`, `main.ts`, `UserMenu.vue`) introduced any new error
- Did not run `pnpm build` or `pnpm dev` beyond the typecheck, per "don't run dev/build unless asked" preference plus the explicit plan instruction to skip manual testing this session

### Session: Backend auth infra — Firebase Google login (steps 1-2 of plan, backend-only)
**Agent:** backend-dev
**Status:** Complete (backend steps 1-2 of `implement-authentication-authorization-w-wondrous-dongarra.md` only — frontend + tests are separate later steps, not started)

Implemented Google-only login via Firebase Authentication on the backend: `Microsoft.AspNetCore.Authentication.JwtBearer` verifies Firebase ID tokens against `https://securetoken.google.com/{projectId}` (JWKS), no FirebaseAdmin SDK, no custom cookie/refresh logic (Firebase client SDK owns refresh — frontend work, not in this session).

**Files added:**
- `api/Cms.Core/Modules/Auth/AuthConfig.cs` — `AllowedDomains: string[]`, bound from `Authentication` config section (`SECTION_NAME`)
- `api/Cms.Core/Modules/Auth/AuthService.cs` — `IAuthService`/`AuthService`: `IsAllowedDomain(email)` (fail-closed — empty/null `AllowedDomains` returns `false`, never allow-all) and `FindUserByEmailAsync(email, ct)` via `IDbContextFactory<ApplicationDbContext>` (same pattern as `TeamIndexService`)
- `api/Cms.Api/Controllers/AuthController.cs` — `GET api/auth/me`, `[Authorize]`, returns `{ id, email, fullName }` from claims set during `OnTokenValidated`

**Files modified:**
- `api/Directory.Packages.props`, `api/Cms.Api/Cms.Api.csproj` — added `Microsoft.AspNetCore.Authentication.JwtBearer` 10.0.1 (matches other `10.0.1` pins)
- `api/Cms.Core/ServiceCollectionExtension.cs` — `.AddAuthModule(configuration)` (new private extension; registers `IAuthService` + binds `AuthConfig` via `IOptions`)
- `api/Cms.Api/ServiceCollectionExtension.cs` — new `AddFirebaseAuthentication(configuration)`: `AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(...)` with `Authority`/`ValidIssuer` = `https://securetoken.google.com/{projectId}`, `ValidAudience` = `{projectId}`; `OnTokenValidated` checks `IAuthService.IsAllowedDomain` then `FindUserByEmailAsync`, fails the auth (`ctx.Fail(...)`) on either miss, otherwise rebuilds `ClaimsPrincipal` with `NameIdentifier`=`user.Id`, `Email`=`user.Email`, `Name`=`user.FullName`; `AddAuthorization()`
- `api/Cms.Api/Program.cs` — added `app.UseAuthentication();` immediately before the existing `app.UseAuthorization();` (was missing entirely)
- `api/Cms.Api/Providers/HttpContextUserResolver.cs` — reads `ClaimTypes.NameIdentifier`/`ClaimTypes.Email` from `HttpContext.User`; falls back to sentinel `Id=0, Username="anonymous"` (not a throw) when claims are absent, since `[Authorize]` is not yet on every controller — `Username` now carries the user's email (no separate username claim exists)
- `api/Cms.Api/appsettings.json` — added `Authentication: { AllowedDomains: ["oclockvn.com"], Firebase: { ProjectId: "" } }` — `ProjectId` deliberately left blank, not a secret (JWKS endpoint is public), user fills in after creating the Firebase project

**Pending manual actions (user):**
- Create the Firebase project (Console → Authentication → Sign-in method → enable Google provider), then set `Authentication:Firebase:ProjectId` in `api/Cms.Api/appsettings.json` (or `appsettings.Development.json`) to the real project id
- Everything downstream of that (actual login flow, frontend Firebase SDK, `/me` returning real data end-to-end) needs a real ID token and is untestable until the project exists

**Not done (explicitly out of scope per instructions):**
- No EF migration (not needed — `User.Email` already exists)
- No frontend work (plan step 3 — `firebase`/`pinia` deps, `stores/auth.ts`, `useApiFetch.ts`, `login.vue`, router guard, `UserMenu.vue`)
- No `AuthServiceTest.cs` (plan step 4 — qa-engineer)
- No `[Authorize]` retrofit onto existing controllers (`LeavesController`, `UsersController`, etc.) — only the seam (`ICurrentUserResolver`, JwtBearer pipeline, `/me`) was prepared, per explicit instruction

**Notes / decisions:**
- `AuthController.Me()` parses the `NameIdentifier` claim to `int` for the `id` field (plan showed only the shape `{ id, email, fullName }`, not the exact type) — defaults to `0` if parsing fails, which should never happen downstream of `OnTokenValidated` succeeding
- Verified compile via `dotnet build api/Cms.Api/Cms.Api.csproj -v q`: no C# errors; build only failed at the final DLL-copy step because a `Cms.Api` process was already running and holding the file lock (pid reported in output) — did not kill that process since it may be the user's own dev session
- Confirmed via `Directory.Packages.props` that `Microsoft.AspNetCore.Authentication.JwtBearer` wasn't already present; pinned to `10.0.1` to match the rest of the ASP.NET Core 10 package set

### Session: Assigned devices on user profile + device↔user cross-links
**Agent:** main (+ backend-dev, frontend-dev subagents)
**Status:** Complete

`user-details.vue`'s "Assigned Assets" card rendered `userDetail.assets`, which was hardcoded to `[]` in `mapUserGetToDetail()` — the Computing Devices/Furniture columns never showed real data. Wired Computing Devices to the real `DeviceUser` assignment table; dropped the Furniture column entirely (no user-assignment concept exists for furniture — only tied to `Place`).

**Files added:**
- `client/src/modules/user_assigned_devices/user_assigned_devices.model.ts` — `UserAssignedDeviceDto`

**Files modified:**
- `api/Cms.Core/Models/DeviceModel.cs` — new `UserAssignedDeviceModel` record; `DeviceUserRef` gained a `UserId` field (previously only exposed `DeviceUser.Id`, which isn't the actual user id — needed for the owner→user link below)
- `api/Cms.Core/Services/DeviceAssignmentService.cs` — new `GetActiveDevicesByUserAsync(userId)`, queries active `DeviceUser` rows joined to `Device`
- `api/Cms.Core/Services/DeviceService.cs` — both `DeviceUserRef(...)` projections (Index + Detail) now pass `du.UserId`
- `api/Cms.Api/Controllers/DeviceAssignmentsController.cs` — new `GET api/DeviceAssignments/user/{userId}`
- `client/src/modules/device_index/device_index.model.ts` — `DeviceUserRef` type gained `userId`
- `client/src/pages/user-details.vue` — removed the `userDetail.assets`-based `computingDevices`/`furniture` computeds; added `useFetch` for the new endpoint (same idiom as the existing leave-list fetch); "Assigned Assets" card simplified to single-column "Assigned Devices" list (Furniture column removed, per `/ui-ux-pro-max` review — empty state centered with icon+message); each device row is now a `RouterLink` to `/devices/{deviceId}` (chevron affordance, hover border, focus-visible ring)
- `client/src/pages/device-detail.vue` — "Current owner" name links to `/users/{userId}`

**Pending actions:**
- No live smoke test (no running dev stack this session) — verified via `pnpm run typecheck` only, clean for all touched files; pre-existing unrelated errors remain in `team-edit.vue`/`user-edit.vue`/`users.vue`

**Notes:**
- No EF migration needed — reused the existing `DeviceUser` table
- Scope decision (asked anh): devices only, not furniture; a dedicated `GET /api/DeviceAssignments/user/{userId}` endpoint rather than overloading `GET /api/devices?users=`

### Session: Admin lookup CRUD (Device Types, Suppliers, Places, Asset Types)
**Agent:** main (+ 3 parallel general-purpose subagents for Suppliers/Places/Asset Types)
**Status:** Complete

New `/admin` section (sidebar group + tab-shell layout mirroring `/settings`) for managing the 4 name-only lookup lists that previously only supported read + implicit find-or-create (via CSV import). Each page: search, add/edit via modal, delete with confirm. No pagination (small lists).

**Files added:**
- `api/Cms.Core/Models/NameRequest.cs` — shared `record NameRequest(string Name)` reused by all 4 controllers
- `api/Cms.Api/Controllers/PlacesController.cs` — new (Place previously had no controller at all)
- `client/src/components/admin/LookupManager.vue` — generic list+search+add/edit-modal+delete-confirm-modal component, driven entirely by `title`/`apiPath` props
- `client/src/pages/admin.vue` — tab shell (copies `settings.vue` structure: `UDashboardNavbar` + `UNavigationMenu` tabs + `RouterView`)
- `client/src/pages/admin/{device-types,suppliers,places,asset-types}.vue` — one-line wrappers around `LookupManager`

**Files modified:**
- `api/Cms.Core/Services/{DeviceTypeService,SupplierService,PlaceService,AssetTypeService}.cs` — added `CreateAsync`/`UpdateAsync`/`DeleteAsync` to each (trim + case-insensitive duplicate check → `ResultCode.BusinessRuleViolation`; missing id → `EntityNotFound`; delete catches `DbUpdateException` from FK-in-use → `BusinessRuleViolation`); each invalidates its `AppConst.CACHE_KEY_*` on mutation
- `api/Cms.Api/Controllers/{DeviceTypesController,SuppliersController,AssetTypesController}.cs` — added POST/PUT/DELETE actions (`AssetTypesController` kept its existing non-conventional route `api/asset-types` and `Index` GET action name)
- `client/src/main.ts` — nested `/admin` route (children: `''`, `suppliers`, `places`, `asset-types`), mirrors `/settings` nesting
- `client/src/App.vue` — new sidebar `Admin` entry with `children` (same shape as existing `Settings` entry)

**Decisions:**
- `Supplier` entity also has `Phone`/`Address`/`Notes` — this CRUD only manages `Name` per product requirement; those fields are left untouched/null on create.
- One generic `LookupManager.vue` component instead of 4 duplicated pages, since all 4 entities are identical `{id, name}` shape.
- Built Device Types first as pilot (verified end-to-end via curl + `vue-tsc`), then parallelized the remaining 3 entities across subagents since the pattern was proven and the per-entity files don't overlap.

**Verified:** curl against all 4 live endpoints (create/duplicate-409/update/update-missing-404/delete/delete-missing-404/delete-in-use-409 — all passed; Places skipped the live in-use-409 check to avoid touching real FK data, same code path as the verified DeviceType case), `pnpm run typecheck` clean (only pre-existing unrelated errors in `team-edit.vue`/`user-edit.vue`/`users.vue`), all 4 `/admin/*` frontend routes return 200. **Not** verified by clicking through the browser UI — no browser tool was available this session; anh was asked to click-test manually after the Device Types pilot.

**Pending manual actions:**
- Anh should click-test the `/admin` pages in a browser (add/edit/delete flow, search filter, error toasts) — dev servers were left running at `http://localhost:5174` (frontend) and `http://localhost:5196` (backend) at end of session.

### Session: MinIO local dev storage + 2 storage bugs found
**Agent:** main (+ backend-dev subagent)
**Status:** Complete (one known issue logged, not fixed)

**Files modified:**
- `docker-compose.yml` (new) — `minio` + `minio-init` services, bucket `cms-local`
- `api/Cms.Core/Storages/AwsConfig.cs` — added `ForcePathStyle`, `DisablePayloadSigning` (both default to prod/R2-safe values)
- `api/Cms.Core/ServiceCollectionExtension.cs` — wires both into `AmazonS3Config`
- `api/Cms.Api/appsettings.Development.json` — points at local MinIO (`http://localhost:9000`, bucket `cms-local`, `ForcePathStyle: true`, `DisablePayloadSigning: false`)
- `api/Cms.Core/Services/FurnitureService.cs:259` — fixed swapped args bug: `uploadedPath.CombineUrl(baseUrl)` → `baseUrl.CombineUrl(uploadedPath)` (was producing `furniture/<guid>.jpg/http://...` instead of `http://.../furniture/<guid>.jpg`; affected prod/R2 image URLs too, not just MinIO)
- `AGENTS.md` — added "Local Development Setup" section (`docker compose up -d` before running the API)

**Verified live (not just built):** started MinIO via `docker compose up -d`, ran API in Development, created a furniture row via `POST /api/furniture`, uploaded a real PNG via `POST /api/furniture/{id}/image`, confirmed returned URL loads (HTTP 200) directly from MinIO.

**Known issue found, not fixed (user decision: log only):**
- `S3Storage.DeleteAsync` (`api/Cms.Core/Storages/IStorage.cs:164-168`) always appends `/` to the given prefix before `ListObjectsV2`. For a single-file key like `furniture/<guid>.jpg`, this becomes prefix `furniture/<guid>.jpg/`, which never matches the actual key — confirmed via log (`No objects found for prefix: ...`) that re-uploading a furniture image does **not** delete the old one. This affects prod/R2 too, not just the new MinIO setup — old images silently accumulate. Comment in the code suggests this was intentional for "directory buckets," but as used by `FurnitureService.UploadImageAsync`'s single-file delete call, it's a no-op bug. Needs its own session to fix safely (check if any other caller relies on true prefix/bulk-delete semantics first).

**Pending manual actions:**
- None — fully verified end-to-end this session.

### Session: Import Furniture from CSV — frontend
**Agent:** frontend-dev
**Status:** Complete

**Files modified:**
- `client/src/modules/furniture_index/furniture_index.model.ts` — new `FurnitureImportRowError`, `FurnitureImportResult` types
- `client/src/pages/furniture.vue` — "Import from CSV" `UButton` in the filter row; `UModal v-model:open` with `UFileUpload` (`.csv`, dropzone) + Import/Cancel actions; scrollable per-row error list when `importResult.errors.length > 0`; `onImport()` posts `multipart/form-data` (field `file`) to `POST /api/furniture/import`, refetches the table via existing `execute()`, closes the modal only on a fully clean import (`skipped === 0`)

**Pending actions:**
- Manual smoke test against a running API (not done this session — no full stack running); verified via `npx vue-tsc --noEmit` only (no errors)

**Notes:**
- Confirmed `UModal`'s v-model prop is `v-model:open` and body goes in `#body` slot by grepping `client/src/components/customers/CustomersAddModal.vue` (existing usage in this repo)
- Confirmed `UFileUpload` slot API (`v-slot="{ open, removeFile }"`, `:dropzone="true"`) by matching `client/src/pages/device-new.vue:270-291` exactly
- Backend endpoint (`POST /api/furniture/import`, `FurnitureImportResult { created, skipped, errors }`) was already implemented prior to this session; no backend changes made

---

### Session: Asset filters — device type/assigned, furniture location/asset type
**Agent:** main (delegated to backend-dev, frontend-dev)
**Status:** Complete

**Files modified:**
- `api/Cms.Core/Models/DeviceModel.cs` — `DeviceQuery.Assigned bool?`
- `api/Cms.Core/Services/DeviceService.cs` — `Assigned` filter via `Device.Users.Any(du => du.IsActive)`
- `api/Cms.Core/Models/FurnitureModel.cs` — `FurnitureQuery.Locations string[]`
- `api/Cms.Core/Services/FurnitureService.cs` — `Locations` filter on `Furniture.Place`; new `GetDistinctLocationsAsync`
- `api/Cms.Api/Controllers/FurnitureController.cs` — new `GET api/furniture/locations`
- `client/src/pages/devices.vue` — device type `USelectMenu` multi-select, assigned/unassigned tri-state `UTabs`
- `client/src/pages/furniture.vue` — asset type + location `USelectMenu` multi-selects
- `client/src/modules/furniture_index/furniture_index.model.ts` — new `AssetTypeOption` type
- `docs/plans/asset-management-design.md` — added Usecases + Design Notes sections (preceded this implementation session)

**Pending actions:**
- Manual smoke test of `/devices` and `/furniture` filter dropdowns in a running app (not done this session — no full stack, i.e. SQL Server + API + Vite, was started; verified via `vue-tsc --noEmit` only, no type errors)

**Notes:**
- `DeviceQuery.DeviceTypes` and `FurnitureQuery.AssetTypes` filters already existed server-side (unused by frontend) — only `Assigned` and `Locations` were new backend work
- `Furniture.Place` is a free-text string column (no Location entity), so location filter is a distinct-values lookup (`GET /api/furniture/locations`), not an FK dropdown
- `USelectMenu multiple` + `value-key="value"` is a new pattern in this repo (no prior usage) — followed Nuxt UI 4.x documented API, unverified against a rendered instance
- Reverted an unrelated `.vscode/settings.json` change (`dotnet.defaultSolution`) that a subagent made outside task scope

---

## 2026-07-26

### Session: E2E failures — API OpenApi pin
**Agent:** main
**Status:** Complete

**Files modified:**
- `api/Directory.Packages.props` — pin `Microsoft.OpenApi` `3.9.0` → `2.3.9` (ASP.NET Core 10 OpenApi source gen incompatible with 3.x)

**Pending actions:**
- None (API left running via `run_api.ps1` if still needed)

**Notes:**
- All 6 Playwright e2e failed with `GET /api/users` 500 because API could not build/start
- Root cause: `Microsoft.OpenApi` 3.x makes `IOpenApiMediaType.Example` read-only → CS0200 in generated OpenApi XML comment support
- After pin + `run_api.ps1` + `playwright install chromium`: 6/6 e2e passed headless (`pnpm --prefix client run test:e2e`)
- No e2e test code changes required

---

## 2026-07-26

### Session: TeamIndexService — Phase 1 integration tests
**Agent:** qa-engineer
**Status:** Complete

**Files created:**
- `api/Cms.Tests/TeamIndexServiceTest.cs` — 11 tests: GetAll paged/search, GetById, Create, Update, AddMember, RemoveMember

**Pending actions:**
- None

**Notes:**
- Filter `--filter TeamIndexServiceTest`: 11 passed (~17s)
- Seed via `IDbContextFactory<ApplicationDbContext>` + 8-char suffix isolation
- ACs: empty/missing paths, search by name, member CRUD booleans, rename persistence

---

## 2026-07-26

### Session: Bulk test seeding via ContextBulkExtension
**Agent:** orchestrator (inline)
**Status:** Complete

**Files created:**
- `docs/lib/context-bulk-extension/sql-server.md` — usage + IdentityOutput gotchas

**Files modified:**
- `api/Cms.Tests/BaseTestFixture.cs` — shared UpsertUsers / UpsertTeamWithMember / InsertContacts / InsertApprovedFullDayRange
- `api/Cms.Tests/UserServiceTest.cs` — bulk seed; batch sort/paging cohorts
- `api/Cms.Tests/UserIndexServiceTest.cs` — bulk seed; reload after update (no tracking)
- `api/Cms.Tests/LeaveIndexServiceTest.cs` — shared user + approved-leave bulk seed
- `docs/plans/todo.md` — checked bulk-seeding item

**Pending actions:**
- None

**Notes:**
- Upsert only where unique keys exist; insert for Contact / LeaveRequest(+days)
- Always set `BulkConfig.IdentityOutput = true` when generated Id needed
- Suite: `rtk dotnet test api/Cms.Tests/Cms.Tests.csproj -v q` → 68 passed

---

## 2026-07-26

### Session: Service unit-test coverage (Phases 1–5)
**Agent:** orchestrator + qa-engineer subagents
**Status:** Complete

**Files created:**
- `api/Cms.Tests/TeamIndexServiceTest.cs`
- `api/Cms.Tests/LookupServicesTest.cs`
- `api/Cms.Tests/DeviceAssignmentServiceTest.cs`
- `api/Cms.Tests/DeviceServiceTest.cs`
- `api/Cms.Tests/FurnitureServiceTest.cs`
- `docs/superpowers/plans/2026-07-26-service-test-coverage.md`

**Files modified:**
- `docs/plans/todo.md` — checked all service-test coverage phases

**Pending actions:**
- Optional: InMemoryStorage + BaseTestFixture logging/AWS stub for FileService / upload tests

**Notes:**
- Full suite: `rtk dotnet test api/Cms.Tests/Cms.Tests.csproj -v q` → 95 passed
- Device/Furniture cannot `fix.Get` (S3/ILogger DI gap) — construct with NoOp stubs
- Furniture GetById/Update missing id throws `EntityNotFoundException` (not null/Result) — tests match actual behavior
- No production service changes; no commit

## 2026-10-25

### Session: Device CSV import — Backend
**Agent:** backend-dev
**Status:** Complete (code written; build and tests NOT run per user preference)

**Files created:**
- api/Cms.Core/Modules/DeviceImport/DeviceImportModel.cs — result/row-error DTOs, internal CSV row + ClassMap
- api/Cms.Core/Services/DeviceService.Import.cs — `ImportFromCsvAsync` (partial class of `DeviceService`)
- api/Cms.Tests/DeviceImportTest.cs — Testcontainers integration tests

**Files modified:**
- api/Cms.Core/Common/CsvImportParsers.cs (moved from Modules/FurnitureImport/FurnitureImportParsers.cs; `ParsePrice` strips trailing đ/₫)
- api/Cms.Tests/CsvImportParsersTest.cs (renamed from FurnitureImportParsersTest.cs; added đ/dotted/comma-date cases)
- api/Cms.Core/Services/FurnitureService.cs — uses `CsvImportParsers`
- api/Cms.Core/Services/DeviceTypeService.cs — `FindOrCreateManyAsync`
- api/Cms.Core/Services/DeviceService.cs — now `partial`, ctor adds `IDeviceTypeService`, `ISupplierService`, `ICurrentUserResolver`; interface adds `ImportFromCsvAsync`
- api/Cms.Api/Controllers/DevicesController.cs — `POST api/devices/import`
- api/Cms.Tests/DeviceServiceTest.cs — manual construction updated for new ctor
- docs/import_csv.md — open questions answered

**Pending actions:**
- Run `rtk dotnet test api/Cms.Tests/Cms.Tests.csproj -v q` (skill dotnet-test-quiet) when OK'd
- Frontend import modal (`client/`) — handled separately
- Suggest AGENTS.md note: shared `CsvImportParsers` in `Cms.Core/Common`

**Notes:**
- API contract: multipart field `file` -> `{ created, updated, skipped, errors:[{row, reason}] }`
- Blank/`N/A`/`NA`/`-` serials get a deterministic `NOSN-<8 hex>` (SHA-256 of name|type|purchasing date|email) rather than random, so re-import matches the same rows; identical rows then get `-2`, `-3` suffixes
- Duplicate serials in file: first keeps serial, later get `-N` suffix (row order); upsert matches on Serial
- Notes: credential-like lines (password/pass/pwd/mật khẩu/gmail) become `[redacted]`; unparsed price and unmatched user appended as tags; capped at 1000 chars
- Assignment: only when `User email` matches a user and `User name` doesn't start with "Free"; skips if already active for same user, row error if active for another user
- Device Ids re-queried by Serial after upsert (no reliance on IdentityOutput)
- Re-import overwrites Status from CSV (per plan) even if device was assigned in DB to someone not in CSV

---

## 2026-10-26

### Session: Replace MinIO with RustFS for local dev storage — Infra
**Agent:** main
**Status:** Complete (not yet verified live)

**Files modified:**
- `docker-compose.yml` — `minio`/`minio-init` → `rustfs` (ports 9000/9001) + `rustfs-init` (`amazon/aws-cli`, creates `cms-local` + public-read bucket policy)
- `api/Cms.Api/appsettings.Development.json` — dev credentials → `rustfsadmin` / `rustfsadmin123`
- `AGENTS.md` — Local Development Setup section updated

**Pending actions:**
- `docker compose down` old MinIO stack, `docker compose up -d`, verify image upload + anonymous GET; optionally `docker volume rm cms_minio-data`
- Pin `rustfs/rustfs` image tag once verified

**Notes:**
- MinIO community edition is in maintenance mode (no new images); app uses only plain S3 API (Put/Get/ListV2/Delete/multipart) so no C# changes
- Init uses aws-cli polling loop instead of a healthcheck (RustFS image may lack curl/mc)

---

## 2026-10-27

### Session: Auth — domain lockdown + cached user lookup + /api/auth/me profile
**Agent:** main (Claude Code)
**Status:** Complete. `AuthUserResolverTest` 6/6 passed; `AuthServiceTest` not re-run (needs Docker).

Direction: keep Firebase ID tokens end to end. An app access/refresh-token design was built and then dropped in this session; its `AddRefreshTokens` migration was never applied and has been removed. Plan: `C:\Users\ocloc\.claude\plans\we-ll-add-roles-and-splendid-wombat.md`.

**Files created:**
- `api/Cms.Core/Modules/Auth/AuthModel.cs` — `AuthClaims` (`sub` / `email` / `name` / `role`), `AuthUser` slim projection, `AuthMeModel`
- `api/Cms.Core/Modules/Auth/AuthUserResolver.cs`:
  - domain check → cached lookup → inactive check → `Result<AuthUser>`
  - `IMemoryCache`: 15 min for a found user, 1 min for not found; key is the lowercased email
  - `Evict(email)` drops the cached entry
- `api/Cms.Tests/AuthUserResolverTest.cs` — 6 unit tests, no Docker
- `client/src/auth-fetch.ts` — patches `window.fetch` to attach the Firebase ID token to same-origin `/api/*` calls; on a 401, signs out and redirects to `/login`
- `client/src/models/auth-profile.model.ts` — `AuthProfile`

**Files modified:**
- `api/Cms.Api/ServiceCollectionExtension.cs`:
  - Firebase JwtBearer with `MapInboundClaims = false`
  - `OnTokenValidated` resolves the user through the cache and rebuilds the principal with `sub` / `email` / `name`
  - global fallback policy requires an authenticated user
- `api/Cms.Api/Controllers/AuthController.cs` — `GET me` returns `AuthMeModel` (`roles` / `permissions` are `[]` for now) from claims, no DB call
- `api/Cms.Api/Program.cs`, `Controllers/PingController.cs` — static assets, SPA fallback, OpenAPI and ping are `AllowAnonymous`
- `api/Cms.Api/Providers/HttpContextUserResolver.cs` — reads `AuthClaims.UserId` / `Email`
- `api/Cms.Core/Modules/Auth/AuthService.cs` — `FindUserByEmailAsync` projects to `AuthUser` instead of loading the full `User`
- `api/Cms.Core/Modules/UserIndex/UserIndexService.cs` — `UpdateAsync` evicts the cached auth entry for the old and new email
- `api/Cms.Core/ServiceCollectionExtension.cs` — `AddMemoryCache()` and `IAuthUserResolver` in `AddAuthModule`
- `api/Cms.Core/Result.cs` — `DomainNotAllowed`, `UnmatchedEmail`, `UserInactive`
- `client/src/stores/auth.ts`:
  - Google `hd` hint
  - `verify()` calls `/api/auth/me` on sign-in and session restore, and stores `profile`
  - `can(permission)` / `hasRole(role)` getters
  - throws `AccountNotAllowedError` when the backend rejects the account
- `client/src/main.ts` — installs `auth-fetch`
- `client/src/pages/login.vue` — "account not allowed" message
- `client/src/composables/useApiFetch.ts` — comment only

**Pending actions:**
- Start Docker, then run `dotnet test api/Cms.Tests -v q --filter "FullyQualifiedName~Cms.Tests.Auth"`
- Restart `Cms.Api`; the dev process was stopped earlier in this session for the now-removed migration

**Notes (deferred, TODO comments in code):**
- No `email_verified` / `sign_in_provider` check (`OnTokenValidated`)
- Roles and permissions are not modelled yet (`UNDONE` in `OnTokenValidated` and `AuthController.Me`)
- The cache is per process; multiple API instances would each keep their own copy, and a user update evicts only the local one
- `HttpContextUserResolver`'s "anonymous" fallback can no longer be reached (every endpoint requires auth); safe to remove later

---

## 2026-10-27

### Session: Import Employees from CSV — Tests
**Agent:** qa-engineer
**Status:** Complete

**Files created:**
- `api/Cms.Tests/UserIndexServiceImportTest.cs` — 8 xUnit + Testcontainers integration tests for
  `UserIndexService.ImportFromCsvAsync` (`api/Cms.Core/Modules/UserIndex/UserIndexService.Import.cs`)

**Scenarios covered (per "Test Tasks" in `employee-management-design.md`):**
- Missing required header (`Email`) → `CsvFormatException`
- Valid new row, blank Username → created, auto-generated username from email local-part, `Status = Active`
- Row matching existing user by Email → updated; blank cells (Username/Phone/Gender/DateOfBirth/Status)
  preserve existing values, non-blank cells (FullName/Title) overwrite
- Missing/malformed Email → row error, other valid rows in the same file still import
- Auto-generated username collides with an existing DB username → row error "Username already in use", no suffix retry
- Two blank-Username rows in the same file deriving the same username → second row errors (intra-file collision)
- Unparseable `DateOfBirth` → row error naming the column, other rows still process
- Unparseable/out-of-range `Status` (e.g. `"99"`) → row error naming the column, other rows still process

**Run results:** `dotnet test api/Cms.Tests/Cms.Tests.csproj -v q --filter "FullyQualifiedName~UserIndexServiceImportTest"`
— 8/8 passed (Docker was available; MsSql Testcontainers ran normally).

**Notes:**
- No tests skipped — Docker was running in this environment.
- Confirmed `IUserIndexService` resolves cleanly via `fix.Get<T>()` (unlike Device/Furniture services,
  which need manual NoOp-stub construction per `.claude/rules/backend.md`).
- One self-inflicted test bug found during the run: `CsvImportParsers.ParseFlexibleDate`'s `"dd,MM,yyyy"`
  format requires zero-padded day/month (`"01,01,1992"`, not `"1,1,1992"`) — fixed in the valid-DOB row of
  the invalid-DateOfBirth test; no production code changed.

---

### Session: Resync design doc — Import Employees from CSV (v2 widening)
**Agent:** tech-lead (plan drafted by a sub-agent that got stuck in plan-mode; applied by the coordinator)
**Status:** Complete (design-doc-only, no code changed) — ready to hand off to backend-dev

The v1 importer (narrow 8-column scope) shipped and is fully checked off in `todo.md`. A real HR export
(`sbox db - copy.csv`) was audited against it earlier the same day and didn't match (different headers,
extra columns, incompatible `Status`/date formats) — 9 "Open Questions" were added to
`employee-management-design.md` and all answered through conversation with the user. This session resynced
the rest of the doc (which was still the stale pre-audit version) against those 9 answers.

**Files modified:**
- `docs/plans/employee-management-design.md` — rewrote "Current State" (Entity table + new "Entity: Contact
  (edit)"/"Entity: Bank (new)" subsections + Enums), "Scope decision"/"Upsert key"/"Defaulting rules"/"New
  files"/"Acceptance criteria" under "Import Employees from CSV", and the entire "Implementation Tasks"
  section (Schema changes, CSV mapping strategy, parsing rules, Backend/Frontend/Test tasks). Left the "Open
  Questions" section itself untouched.
- `docs/plans/todo.md` — added an unchecked "Import Employees from CSV — v2 widening" sub-checklist under
  section 3, without touching any existing `[x]` (v1 stays shipped/checked).
- `docs/plans/progress.md` — this entry.

**Key decisions baked into the resync:**
- Email upsert key: `Company's email` else `Personal email` fallback; written to `User.Email`, with
  `PersonalEmail` always populated too regardless of which source won.
- `Contract` CSV column fans out to 3 app fields: new `Contract`(`ContractType?`)/`Location`(`WorkLocation`)
  fields plus the **existing, untouched** `Status` (`UserStatus`) — derived from `Exit`/`-AU` prefix/suffix
  stripping. No change to `AuthUserResolver`'s login-block check or any existing `Status` filter/sort/UI.
- `DateOfBirth` unparseable → **silent `null`** (reversed from v1's "row error" rule), matching Device import,
  after adding a `"dd MM yyyy"` format to the shared `CsvImportParsers.ParseFlexibleDate`.
- Divider/section rows (blank `FullName` + both emails + `Phone`) → skipped silently, not counted as errors.
- Two columns get normalized instead of staying scalar: `Bank` (new entity + `FindOrCreateManyAsync`, same
  pattern as `DeviceType`/`Supplier`) and emergency contact (reuses the existing `Contact` entity via new
  `IsEmergencyContact`/`Address` columns instead of `User`'s 4 scalar `EmergencyContact*` fields, which are
  dropped). `ContactType` enum widened to cover free-text relationship values.
- `EmployeeCode` (new, unique-indexed) and `Team` auto-assignment (via a new `FindOrCreateManyAsync` on the
  team side) added per the user's answers.
- CSV column mapping switches from CsvHelper `.Name(...)` to `.Index(...)` per the user's answer to Q9 —
  documented tradeoff: robust to header-label drift, fragile to column reordering.

**Blockers flagged for backend-dev (not resolved by this session):**
- The real sample file `sbox db - copy.csv` is not present anywhere in this repo — confirmed by search.
  `ContactType`'s widened members (`Mother, Father, Friend`) are **placeholders**; must be verified against
  the real file's distinct `EmergencyContactRelationship` values before finalizing. The exact 0-based CSV
  column indices needed for `.Index(...)` mapping are also TBD against that same file.
- This reintroduces a schema migration — the doc previously said "no migration needed" for the v1 importer;
  that line is now obsolete, v2 needs one covering `Bank` (new), `Contact` (+2 cols), `User` (+6/-5 cols).

**Not done (explicitly out of scope per the doc-only brief):** no C#/TypeScript code, no migration run.

**Handed to:** backend-dev next (read `employee-management-design.md`'s resynced "Implementation Tasks"
section — "Schema changes" and "Backend Tasks" subsections), then frontend-dev, then qa-engineer.

---

## 2026-10-27

### Session: Import Employees from CSV v2 — Backend + Frontend + Tests
**Agent:** Claude (single session, no sub-agents)
**Status:** Complete (unverified build — see Pending actions)

**Files created:**
- `api/Cms.Core/Enums/ContractType.cs`, `WorkLocation.cs`; `Db/Entities/Bank.cs`; `Db/Configurations/BankConfiguration.cs`
- `api/Cms.Core/Modules/BankIndex/BankService.cs` — `IBankService` (`GetAllAsync`, `FindOrCreateManyAsync`)
- `api/Cms.Api/Controllers/BanksController.cs` — `GET /api/banks` (feeds the Bank select)
- `api/Cms.Core/Migrations/20261027100000_AddBankAndEmployeeImportFields.cs` — **hand-written**

**Files modified:**
- `User`/`Contact` entities + `UserConfiguration`, `ApplicationDbContext`, model snapshot (hand-edited), `ContactType` (+Mother/Father/Sibling/Friend/Partner)
- `CsvImportParsers` (`dd MM yyyy`), `TeamIndexService.FindOrCreateManyAsync`, `ServiceCollectionExtension`
- `UserImportModel.cs` (index-based map), `UserIndexService.Import.cs` (rewritten), `UserIndexService.cs`/`UserIndexModel.cs` (emergency contact now a nested `EmergencyContact` `ContactModel`; Bank/Contract/Location/ContractRole/EmployeeCode), `UsersController` (409 on duplicate EmployeeCode)
- Tests: `UserIndexServiceImportTest.cs` rewritten for the new layout, `UserIndexServiceTest.cs` migrated off dropped fields
- Client: `userIndex.model.ts`, `user-edit.vue`, `user-detail.model.ts`

**Pending actions:**
- No .NET SDK was available (download blocked), so **nothing was compiled or run**. Run `dotnet build`, the tests, and regenerate/verify the migration with `ef.ps1` (stop `Cms.Api` first); diff against the hand-written one.
- `vue-tsc --noEmit` passed.

**Notes:**
- Column indices confirmed against `samples/sbox db - copy.csv` (0-based): ID 1, Team 2, Fullname 3, ContractRole 4, Role 5, Gender 7, Phone 8, Company email 9, Personal email 10, DOB 11 … Contract 46. Header check is only "at least 47 columns".
- National ID: CCCD columns win over CMND when CCCD number is present.
- Bank name = first non-empty line of the cell (branch text on later lines dropped); variants like "TP Bank"/"TPBank" still become separate banks.
- Invalid company email falls back to personal email; duplicate emails / EmployeeCodes in one file → row error on the later row.
- Migration copies `BankAccount` → `BankAccountNumber` and existing emergency-contact scalars → a `Contact` row before dropping the columns.
- Spec said SQL Server unique indexes allow multiple NULLs — they don't; `EmployeeCode` uses a filtered unique index (`IS NOT NULL`).
- Existing-user update: emergency contact fields merge non-blank values; team membership is insert-only.

---

## 2026-11-01

### Session: Started backend and frontend with .NET 10
**Agent:** main
**Status:** Running with database configuration pending

**Files modified:**
- `README.md` — documented NAS SQL Server connection via environment variable and verified local URLs

**Validation:**
- .NET SDK `10.0.403` is installed and active.
- Backend built successfully and is running at `http://localhost:5196`; OpenAPI returned HTTP 200.
- Frontend is running at `http://localhost:5173` and returned HTTP 200.
- NAS SQL Server port `192.168.1.200:1433` is reachable.

**Pending actions:**
- Set `ConnectionStrings__ApplicationDbConnection` with the NAS SQL password before using database-backed API endpoints. The current running API still logs the default `.\sqlexpress` connection string.

### Session: Verified local startup and documented development setup
**Agent:** main
**Status:** Complete with environment blockers

**Files created:**
- `README.md` — root setup, development, verification, release, and troubleshooting instructions

**Files modified:**
- `docs/plans/todo.md` — marked the setup documentation task complete

**Validation:**
- Frontend dependencies installed with `pnpm --dir client install --frozen-lockfile`.
- Frontend dev server started successfully and returned HTTP 200 at `http://localhost:5173`.
- Frontend typecheck completed but currently fails on pre-existing errors in `leave-new.vue`, `user-details.vue`, `user-edit.vue`, and `users.vue`.
- API could not start because Docker is unavailable and the installed SDK is .NET 9.0.318 while the solution targets .NET 10.

**Pending actions:**
- Install Docker Desktop and .NET 10 SDK, start SQL Server/SQL Express, then rerun the API startup command.

## 2026-11-01

### Session: Development authentication bypass — Backend
**Agent:** backend-dev
**Status:** Complete

**Files created:**
- `api/Cms.Api/Providers/DevelopmentAuthenticationHandler.cs` — opt-in handler that authenticates every request with the development user claims.

**Files modified:**
- `api/Cms.Api/ServiceCollectionExtension.cs` — selects the bypass scheme only when the host is Development and `Authentication:DevelopmentBypass` is true; otherwise retains Firebase JWT authentication.
- `api/Cms.Api/appsettings.Development.json` — adds the safe default `DevelopmentBypass: false`.
- `docs/plans/todo.md` — marked the bypass task complete.

**Pending actions:**
- Set `Authentication:DevelopmentBypass` to `true` only in a local Development configuration when bypassing Firebase is desired.
- Build/test not run per request.

**Notes:**
- The bypass uses the existing `AuthClaims` names (`sub`, `email`, `name`) with user ID `1`, email `dev@spiderbox.design`, and name `Development User`.

## Template for future sessions

```
## YYYY-MM-DD

### Session: {Feature} — {Backend | Frontend | Tests | Bugfix}
**Agent:** {agent name}
**Status:** Complete | In Progress | Blocked

**Files created:**
- path/to/file.cs — description

**Files modified:**
- path/to/file.cs — what changed

**Pending actions:**
- Description of any manual step needed

**Notes:**
- Any non-obvious decisions or deviations from the design doc
```
