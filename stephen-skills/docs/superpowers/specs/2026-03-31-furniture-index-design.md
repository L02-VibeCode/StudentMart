# Furniture index page + `FurnitureStatus` — design

## Purpose

Deliver a **paginated furniture admin index** in the SPA with **debounced search**, **server-driven column sorting**, **status quick-filter (UTabs)**, and **sidebar navigation**, consistent with [`client/src/pages/devices.vue`](../../../client/src/pages/devices.vue). Extend the backend so furniture rows carry a **lifecycle status** and `GET /api/furniture` supports **`statuses`** filtering (same query pattern as devices).

## Product decisions (from issue #4 discussion)

| Topic | Decision |
|--------|----------|
| **Status values** | `Available = 0`, `InUse = 1`, `Maintenance = 2`, `Disposed = 3`, `Lost = 4` (furniture-specific; parallel to device lifecycle where it helps). |
| **Quick filter UX** | **UTabs** with “All” + each status (same pattern as devices). |
| **Image column on index** | **Out of scope (v1)** — keep table lean; `ImageUrl` remains on entity/detail for later. |
| **Existing rows after migration** | New non-null `Status` column default **`0` (Available)**. |

## Backend

### `FurnitureStatus` enum

- New file: `api/Cms.Core/Enums/FurnitureStatus.cs` (mirror style of [`DeviceStatus`](../../../api/Cms.Core/Enums/DeviceStatus.cs)).

### Entity and persistence

- Add **`public FurnitureStatus Status { get; set; }`** to [`Furniture`](../../../api/Cms.Core/Db/Entities/Furniture.cs).
- Optional in [`FurnitureConfiguration`](../../../api/Cms.Core/Db/Configurations/FurnitureConfiguration.cs): explicit default for `Status` = `FurnitureStatus.Available` if not relying solely on migration default.
- **EF Core migration**: add `Status` column, **NOT NULL**, default **0**.

### Models and API surface

- [`FurnitureModel`](../../../api/Cms.Core/Models/FurnitureModel.cs) (base / `Index` / `Detail`): add **`Status`** (enum on server; JSON as **number**).
- [`FurnitureUpdate`](../../../api/Cms.Core/Models/FurnitureModel.cs) / [`FurnitureCreate`](../../../api/Cms.Core/Models/FurnitureModel.cs): add **`Status`** (required on create can default to `Available` in service if omitted — prefer explicit property with default `Available` on create model).

### Query and service

- Extend [`FurnitureQuery`](../../../api/Cms.Core/Models/FurnitureModel.cs) with **`FurnitureStatus[] Statuses { get; set; } = []`** (same idea as [`DeviceQuery.Statuses`](../../../api/Cms.Core/Models/DeviceModel.cs)).
- [`FurnitureService.GetAllAsync`](../../../api/Cms.Core/Services/FurnitureService.cs):
  - When `query.Statuses.Length > 0`, filter `src.Where(x => query.Statuses.Contains(x.Status))`.
  - Add **`"status"`** branch in the sort switch.
  - Include **`Status`** in list and detail projections (`Select`).
- **`UpdateAsync` / `CreateAsync`**: map **`Status`** to the entity.

### API contract (list)

- `GET /api/furniture?page=&take=&search=&statuses=&sort=&dir=`
- Repeated **`statuses`** keys acceptable; for the SPA quick-filter, **one** `statuses` value when a tab is selected; **omit** when “All”.

Response shape remains **`PagingResult<T>`**: `{ items, total, page, take }`.

## Frontend

### Module and enums

- New [`client/src/models/furniture-status.enum.ts`](../../../client/src/models/furniture-status.enum.ts) — mirror [`device-status.enum.ts`](../../../client/src/models/device-status.enum.ts): enum, labels, `FurnitureStatusOptions`, `FurnitureStatusFilterOptions` (All + values).
- New [`client/src/modules/furniture_index/furniture_index.model.ts`](../../../client/src/modules/furniture_index/furniture_index.model.ts) — **`FurnitureIndexRow`** aligned to API `Index` JSON (include **`status`**: `number`).

### Page

- New [`client/src/pages/furniture.vue`](../../../client/src/pages/furniture.vue):
  - **`useFetch`** + computed **`url`**: `page`, `take`, `search`, optional **`statuses`**, optional **`sort`** / **`dir`** (match [`Query`](../../../api/Cms.Core/Common/Query.cs) / existing furniture service sort names).
  - Debounced search; **`watch`** + **`execute()`** pattern per [`client/AGENTS.md`](../../../client/AGENTS.md).
  - **UTabs** for status (clone devices pattern).
  - **UTable** + **UPagination**; status column with **UBadge** and colors: Available → success, InUse → neutral, Maintenance → warning, Disposed/Lost → error.
  - **Column sorting**: toggle sort via headers and sync **`sort`** / **`dir`** query params to the API (devices index today does not sort; this page **does**, per acceptance criteria).

### Navigation

- [`client/src/main.ts`](../../../client/src/main.ts): route **`/furniture`** → lazy `furniture.vue`.
- [`client/src/App.vue`](../../../client/src/App.vue): sidebar link (e.g. **Furniture**, icon e.g. `i-lucide-sofa`).

## Testing / verification

- Manual: list loads, tabs filter results, search + pagination + sort combine correctly.
- After migration: existing furniture rows show **Available** unless updated.

## Out of scope

- Furniture create/edit UI changes beyond what’s required to persist **Status** on API models (if only index is built in a first slice, backend still should accept **Status** on create/update for consistency).
- Thumbnail column on index (v2).

## Success criteria

Maps to GitHub issue #4 acceptance criteria: enum + migration + query filter + `furniture.vue` + sidebar + patterns aligned with devices where stated, with **server-side sort** on the furniture list.
