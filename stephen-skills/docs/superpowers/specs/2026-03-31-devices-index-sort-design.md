# Devices index — server-side column sort

## Purpose

Align **`/devices`** with **`/furniture`**: send **`sort`** and **`dir`** query parameters to **`GET /api/devices`** so ordering is **server-driven** and consistent with pagination, search, and status tabs. No backend changes required — [`DeviceService.GetAllAsync`](../../../api/Cms.Core/Services/DeviceService.cs) already maps `DeviceQuery.Sort` / `Query.Dir` (`IsDesc`).

## Product decisions

| Topic | Decision |
|--------|----------|
| **Default order** | Omit **`sort`** / **`dir`** until the user clicks a column header — API keeps **default** (`Id` descending per `DeviceService` switch `default`). |
| **Sortable columns (v1)** | Only columns with a matching **`DeviceService` sort key** (lowercase): **Name** → `name`, **Type** → `devicetype`, **Serial** → `serial`, **Status** → `status`. |
| **Owner column** | **Not sortable in v1** — no `owner` / assignee branch in the service switch; sorting would require backend (e.g. join on active assignment user name). |
| **Supplier column** | **Not sortable in v1** — no `supplier` branch in the switch; optional follow-up issue to add `supplier` sort in `DeviceService`. |
| **UX** | Match [`furniture.vue`](../../../client/src/pages/furniture.vue): `UButton` ghost headers, icons for unsorted / asc / desc; first click on a column sets **asc**; same column toggles direction; changing sort resets **page** to **1**. |

## API contract (unchanged)

- `GET /api/devices?page=&take=&search=&statuses=&sort=&dir=`
- **`dir`:** `asc` or `desc` (see [`Query.IsDesc`](../../../api/Cms.Core/Common/Query.cs)).
- **`sort`:** backend expects lowercase keys matching the switch: `name`, `devicetype`, `serial`, `status`, plus `purchasingdate`, `warrantydate`, `createdutc`, `updatedutc` (not exposed as index columns in v1).

## Frontend

### `client/src/pages/devices.vue`

- Add **`sortField`**: `ref<string | null>(null)`, **`sortDir`**: `ref<'asc' | 'desc'>('asc')`.
- **`resolveComponent('UButton')`** for header buttons (same as furniture).
- **`sortHeader(apiKey, label)`** helper — copy behavior from furniture (toggle + reset `pagination.pageIndex` to `0`).
- **`columns`:** convert to **`computed`** so headers can use `sortHeader` with reactive `sortField` / `sortDir`.
- **Name** column: **`header`:** `sortHeader('name', 'Name')`; **`cell`** unchanged (link to detail).
- **Type** → `sortHeader('devicetype', 'Type')`.
- **Serial** → `sortHeader('serial', 'Serial')`.
- **Status** → `sortHeader('status', 'Status')`.
- **Owner** / **Supplier:** plain string headers (no sort button).
- **`url` computed:** when `sortField` is set, append **`sort`** and **`dir`** (same pattern as furniture).
- **`watch`:** include **`sortField`** and **`sortDir`** alongside pagination, debounced search, status (with **`immediate: true`**, **`deep: true`** as needed).

## Testing / verification

- Manual: without sort, list order matches previous behavior (API default).
- Click **Name** → request includes `sort=name&dir=asc`; toggle → `dir=desc`.
- Change page then change sort → page resets to **1**.
- Combine with search + status tab + pagination.

## Out of scope

- Backend: `supplier` / owner sort keys.
- New table columns (purchase date, etc.) unless a separate issue adds them.

## Success criteria

Matches GitHub issue **#5** acceptance criteria: query params, furniture-style headers, refetch + page reset, PR notes list sortable API keys.
