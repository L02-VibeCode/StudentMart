# Furniture index + FurnitureStatus implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a furniture **list page** in the SPA (search, pagination, **UTabs** status filter, **server-side column sort**) and add **`FurnitureStatus`** + **`statuses`** query filtering on **`GET /api/furniture`**, backed by an EF migration.

**Architecture:** Mirror **`DeviceStatus` / `DeviceQuery.Statuses` / `DeviceService`** patterns on the backend; mirror **`devices.vue`** for `useFetch` + debounced search + tabs + `watch` → `execute()`. List **`sort` / `dir`** query params map to existing **`Query.Sort`** / **`Query.Dir`** and `FurnitureService` switch keys. Spec: [`docs/superpowers/specs/2026-03-31-furniture-index-design.md`](../specs/2026-03-31-furniture-index-design.md).

**Tech Stack:** .NET 10, EF Core 10, SQL Server; Vue 3.5, Vue Router 4, Nuxt UI 4, `@vueuse/core` `useFetch`; migrations via repo-root **`ef.ps1`** (see `@.cursor/skills/ef-migrations/SKILL.md`).

---

## File structure

| Path | Action | Responsibility |
|------|--------|----------------|
| `api/Cms.Core/Enums/FurnitureStatus.cs` | Create | Enum: Available=0, InUse=1, Maintenance=2, Disposed=3, Lost=4 |
| `api/Cms.Core/Db/Entities/Furniture.cs` | Modify | `FurnitureStatus Status` property |
| `api/Cms.Core/Db/Configurations/FurnitureConfiguration.cs` | Modify (optional) | Default `Status` = Available if desired |
| `api/Cms.Core/Models/FurnitureModel.cs` | Modify | `Status` on model + Detail; `Statuses` on `FurnitureQuery`; `FurnitureCreate` / `FurnitureUpdate` |
| `api/Cms.Core/Services/FurnitureService.cs` | Modify | Filter, sort, projections, create/update mapping |
| `api/Cms.Core/Migrations/…` | Create | Add non-null `Status` column, default 0 |
| `client/src/models/furniture-status.enum.ts` | Create | Labels + `FurnitureStatusFilterOptions` (All + values) |
| `client/src/modules/furniture_index/furniture_index.model.ts` | Create | `FurnitureIndexRow` (camelCase fields matching API) |
| `client/src/pages/furniture.vue` | Create | Index UI |
| `client/src/main.ts` | Modify | Route `/furniture` |
| `client/src/App.vue` | Modify | Sidebar item after Devices |

**Out of scope:** Furniture **detail** page route (no `/furniture/:id` in `main.ts` today) — use **plain text** name column on index v1. Image thumbnail column on index (v2).

---

### Task 1: FurnitureStatus + entity

**Files:**
- Create: `api/Cms.Core/Enums/FurnitureStatus.cs`
- Modify: `api/Cms.Core/Db/Entities/Furniture.cs`

- [ ] **Step 1:** Add enum file mirroring `DeviceStatus.cs` style (namespace `Cms.Core.Enums`, five values as in spec).

```csharp
namespace Cms.Core.Enums;

public enum FurnitureStatus
{
    Available = 0,
    InUse = 1,
    Maintenance = 2,
    Disposed = 3,
    Lost = 4,
}
```

- [ ] **Step 2:** On `Furniture`, add `public FurnitureStatus Status { get; set; }` and `using Cms.Core.Enums;`.

- [ ] **Step 3 (optional):** In `FurnitureConfiguration`, `builder.Property(x => x.Status).HasDefaultValue(FurnitureStatus.Available);` — only if you want explicit DB default beside migration.

- [ ] **Step 4:** Commit — `git add api/Cms.Core/Enums/FurnitureStatus.cs api/Cms.Core/Db/Entities/Furniture.cs` (+ config if touched) — message: `feat(core): add FurnitureStatus to Furniture entity`

---

### Task 2: DTOs and query

**Files:**
- Modify: `api/Cms.Core/Models/FurnitureModel.cs`

- [ ] **Step 5:** Add `public FurnitureStatus Status { get; set; }` to `FurnitureModel` (covers `Index` record too).

- [ ] **Step 6:** Add `FurnitureStatus Status { get; set; }` to `FurnitureUpdate` and `FurnitureCreate` (default `FurnitureStatus.Available` on create record initializer if you want API default without client sending it).

- [ ] **Step 7:** Extend `FurnitureQuery`:

```csharp
public FurnitureStatus[] Statuses { get; set; } = [];
```

- [ ] **Step 8:** Commit — `feat(core): add Status to furniture models and Statuses to FurnitureQuery`

---

### Task 3: FurnitureService

**Files:**
- Modify: `api/Cms.Core/Services/FurnitureService.cs`

- [ ] **Step 9:** In `GetAllAsync`, after supplier filter block, add:

```csharp
if (query.Statuses.Length > 0)
{
    src = src.Where(x => query.Statuses.Contains(x.Status));
}
```

- [ ] **Step 10:** In sort `switch`, add branch `"status" => src.Sort(x => x.Status, isDescending),`

- [ ] **Step 11:** In list `Select`, set `Status = x.Status`.

- [ ] **Step 12:** In `GetByIdAsync` projection, set `Status = x.Status`.

- [ ] **Step 13:** In `UpdateAsync`, after other field assignments: `furniture.Status = model.Status;`

- [ ] **Step 14:** In `CreateAsync`, on `new Furniture { ... }`, set `Status = model.Status` (or leave default entity value if create model omits — prefer explicit).

- [ ] **Step 15:** Commit — `feat(core): filter and sort furniture by Status`

---

### Task 4: EF Core migration

**Files:**
- Create: new migration under `api/Cms.Core/Migrations/`

- [ ] **Step 16:** From repo root run the project’s migration wrapper (not raw `dotnet ef` ad hoc), e.g. per `@.cursor/skills/ef-migrations/SKILL.md` — add migration name like `AddFurnitureStatus`.

- [ ] **Step 17:** Verify generated migration adds column **`Status`** (int, **not null**, **default 0**) on **`Furnitures`** table.

- [ ] **Step 18:** Commit migration + model snapshot — `feat(db): add Furnitures.Status column`

---

### Task 5: Frontend enum + index type

**Files:**
- Create: `client/src/models/furniture-status.enum.ts`
- Create: `client/src/modules/furniture_index/furniture_index.model.ts`

- [ ] **Step 19:** Copy structure from `client/src/models/device-status.enum.ts`: numeric `enum FurnitureStatus`, `labels` map, `FurnitureStatusOptions`, `FurnitureStatusFilterOptions` (first entry `{ label: 'All', value: null }`), export `furnitureStatusLabel(status: number)`.

- [ ] **Step 20:** Define `FurnitureIndexRow` with fields matching **`FurnitureModel.Index`** JSON (**camelCase**): e.g. `id`, `assetType`, `name`, `quantity`, `place`, `purchasingDate`, `supplier`, `price`, `warrantyDate`, `notes`, `imageUrl`, **`status`** (`FurnitureStatus` or `number`). Omit fields you do not render if the API still sends them — prefer full shape for fewer surprises.

- [ ] **Step 21:** Commit — `feat(client): add furniture status enum and index row type`

---

### Task 6: furniture.vue

**Files:**
- Create: `client/src/pages/furniture.vue`

- [ ] **Step 22:** Scaffold `UDashboardPanel` + `UDashboardNavbar` title **Furniture** (leading collapse slot like `devices.vue`).

- [ ] **Step 23:** Add `search`, `debouncedSearch`, `useDebounceFn` (300ms), `pagination` `{ pageIndex, pageSize: 20 }`, **`statusFilter`** `ref<FurnitureStatus | null>(null)`, **`furnitureStatusOptions`** from `FurnitureStatusFilterOptions`, **`furnitureStatusTabItems`** + **`statusFilterTab`** computed (copy pattern from `devices.vue` lines ~24–53).

- [ ] **Step 24:** Add **`sortField`** `ref<string | null>(null)` and **`sortDir`** `ref<'asc' | 'desc'>('asc')`** (or single ref object). When user toggles a column: set `sortField` to API key (`name`, `assettype`, `quantity`, … — match `FurnitureService` switch strings), toggle `sortDir` if same column else `asc`. Append to URL: `if (sortField.value) { params.append('sort', sortField.value); params.append('dir', sortDir.value) }`.

- [ ] **Step 25:** **`url` computed:** `page`, `take`, optional `search`, optional single **`statuses`** (when filter not All), optional `sort`/`dir`. Base path **`/api/furniture`**.

- [ ] **Step 26:** `useFetch(url, { immediate: false, initialData: { items: [], total: 0, page: 1, take: 20 } }).json<PagedResult<FurnitureIndexRow>>()`

- [ ] **Step 27:** `watch([pagination, debouncedSearch, statusFilter, sortField, sortDir], () => execute(), { immediate: true, deep: true })` plus `watch(statusFilter, () => { pagination.value.pageIndex = 0 })` and reset page when sort changes if desired (match product; optional).

- [ ] **Step 28:** `UTable` columns: **Name** (plain text — no `/furniture/:id` route yet), **Type** (`assetType`), **Quantity**, **Place**, **Status** (`UBadge` + `furnitureStatusLabel`; colors: Available `success`, InUse `neutral`, Maintenance `warning`, Disposed/Lost `error`), **Supplier**, **Price** (format as needed). Sortable headers: use **`UButton` ghost** pattern from `users.vue` email column (`toggleSorting` equivalent: call a function that updates `sortField`/`sortDir`).

- [ ] **Step 29:** Toolbar row: `flex flex-wrap items-center justify-between gap-1.5` with `UInput` + `UTabs` (`:content="false"`, `size="sm"`, `class="min-w-fit"`).

- [ ] **Step 30:** `UPagination` + total count line like `devices.vue`.

- [ ] **Step 31:** Commit — `feat(client): add furniture index page`

---

### Task 7: Router + sidebar

**Files:**
- Modify: `client/src/main.ts`
- Modify: `client/src/App.vue`

- [ ] **Step 32:** In `main.ts`, after `/devices` routes, add:

```ts
{ path: '/furniture', component: () => import('./pages/furniture.vue') },
```

- [ ] **Step 33:** In `App.vue` `links[0]` array, after **Devices** entry, add **Furniture** with `icon: 'i-lucide-sofa'`, `to: '/furniture'`, same `onSelect` pattern as other items.

- [ ] **Step 34:** Commit — `feat(client): register furniture route and sidebar link`

---

## Verification

**Backend (after migration applied to dev DB):**

- [ ] **Step 35:** Call `GET /api/furniture?page=1&take=20` — items include numeric **`status`** (0–4).
- [ ] **Step 36:** Call `GET /api/furniture?statuses=1` — only `InUse` rows (or empty if none).
- [ ] **Step 37:** Call `GET /api/furniture?sort=name&dir=asc` — ordering matches service.

Run from browser/Swagger or `curl` against local API — no mandatory `dotnet test` in this plan unless you add tests.

**Frontend:**

- [ ] **Step 38:** `pnpm dev` in `client`; open `/furniture` — table loads, tabs filter, search debounces, pagination works, at least one column sort updates network request (`sort`/`dir` visible in devtools).

**Note:** Workspace rule: do not run `dotnet build` unless the user asks; still **apply migration** to the database you use for manual API checks.

---

## Plan review

Optional: run **plan-document-reviewer** with this file path + [`docs/superpowers/specs/2026-03-31-furniture-index-design.md`](../specs/2026-03-31-furniture-index-design.md).

---

## Execution handoff

**Plan complete and saved to `docs/superpowers/plans/2026-03-31-furniture-index.md`. Two execution options:**

1. **Subagent-Driven (recommended)** — Fresh subagent per task, review between tasks (`superpowers:subagent-driven-development`).
2. **Inline execution** — Same session, batch tasks with checkpoints (`superpowers:executing-plans`).

**Which approach do you want?**
