# Devices Admin (Asset Management) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an **admin UI for company devices**: paginated index with **current owner**, **detail** with **assignment history**, a placeholder **Assignment** action when there is **no current owner**, and **create / update** flows wired to existing APIs. **Furniture is out of scope** (separate feature).

**Architecture:** Pure **Vue 3 client** work: new pages under `client/src/pages/`, shared types under `client/src/modules/device_index/`, routes in `client/src/main.ts`, sidebar link in `client/src/App.vue`. Reuse **`useFetch` + `watch` + `execute()`** for reactive list/detail ([`client/AGENTS.md`](client/AGENTS.md)). **No backend changes** required for MVP (controllers and services already expose list, detail with `history`, multipart create, JSON update). Reference APIs: [`DevicesController`](api/Cms.Api/Controllers/DevicesController.cs), [`DeviceService`](api/Cms.Core/Services/DeviceService.cs), [`GET /api/DeviceTypes`](api/Cms.Api/Controllers/DeviceTypesController.cs), [`GET /api/Suppliers`](api/Cms.Api/Controllers/SuppliersController.cs).

**Tech Stack:** Vue 3.5, Vue Router 4, Nuxt UI 4, Valibot, `@vueuse/core` `useFetch`; API returns `PagingResult<T>` as `{ items, total, page, take }` and mutations as [`Result<T>`](client/src/models/result.ts) with `{ data, code, isSuccess }`.

**Spec reference:** Brainstorming (2026-03-29): devices-only; Assignment stub = `console.log('wip')`; [`docs/plans/asset-management-design.md`](docs/plans/asset-management-design.md) (note: design doc status names may differ from code — use [`DeviceStatus`](api/Cms.Core/Enums/DeviceStatus.cs) in repo).

---

## Scope check

Single subsystem (**Devices admin UI**). One plan.

---

## File structure

| Path | Responsibility |
|------|----------------|
| **Create** [`client/src/models/device-status.enum.ts`](client/src/models/device-status.enum.ts) | Mirror backend enum: `Available=0`, `Assigned=1`, `Maintenance=2`, `Retired=3`, `Lost=4`; export label array for selects/filters. |
| **Create** [`client/src/modules/device_index/device_index.model.ts`](client/src/modules/device_index/device_index.model.ts) | TS types: `DeviceUserRef`, `DeviceIndexRow`, `DeviceDetail`, `DeviceHistoryRow` (maps `DeviceUserModel`), create/update payloads aligned with API. |
| **Create** [`client/src/pages/devices.vue`](client/src/pages/devices.vue) | Index: table, search, pagination, link to detail. |
| **Create** [`client/src/pages/device-detail.vue`](client/src/pages/device-detail.vue) | Detail + history table; **Assignment** button when `owner == null`; stub handler. |
| **Create** [`client/src/pages/device-new.vue`](client/src/pages/device-new.vue) | Create device: Valibot + `UForm`; `POST /api/devices` as `multipart/form-data`. |
| **Create** [`client/src/pages/device-edit.vue`](client/src/pages/device-edit.vue) | Edit device: load `GET /api/devices/:id`, `PUT /api/devices/:id` JSON body. |
| **Modify** [`client/src/main.ts`](client/src/main.ts) | Register routes: `/devices`, `/devices/new`, `/devices/:id`, `/devices/:id/edit`. |
| **Modify** [`client/src/App.vue`](client/src/App.vue) | Add sidebar entry (e.g. **Devices**, icon `i-lucide-laptop`). |

**Out of scope for this plan:** Furniture pages, real assignment API, auth (follow existing app placeholders).

---

## API contract (implementer must match)

| Action | Method | URL | Notes |
|--------|--------|-----|--------|
| List | GET | `/api/devices?page=&take=&search=&sort=&dir=` | Optional filters later: `statuses`, `deviceTypes`, `suppliers` (repeat query keys). |
| Detail | GET | `/api/devices/:id` | Returns `DeviceModel.Detail`: `deviceType`/`supplier` as **numeric ids** on detail; `history` ordered newest handover first. |
| Create | POST | `/api/devices` | **`multipart/form-data`** (`[FromForm]`). Optional `File` image. |
| Update | PUT | `/api/devices/:id` | **JSON** body matching `DeviceUpdate` (camelCase). |
| Lookup | GET | `/api/DeviceTypes`, `/api/Suppliers` | Populate dropdowns on forms. |

**Mutation responses:** `Create` / `Update` return `Result<int>` (`isSuccess`, `code`, `data` = device id). On success, navigate to `/devices/:id` or `/devices`.

**Assignment button visibility:** Show when **`owner` is null** on detail (no active `DeviceUser`). Per product, optional extra guard: `status === DeviceStatus.Available` — only if you need to hide the button for Maintenance/Lost; MVP can rely on `!owner` only.

**Assignment stub:** `console.log('wip')` (exact string per stakeholder request).

---

## Plan review

After the plan is saved, optionally run **plan-document-reviewer** (superpowers) with: this file path + spec/brainstorm context. Fix issues if any. (Human review is sufficient if subagent unavailable.)

---

### Task 1: Device status enum + module types

**Files:**
- Create: `client/src/models/device-status.enum.ts`
- Create: `client/src/modules/device_index/device_index.model.ts`

- [ ] **Step 1:** Add `device-status.enum.ts` with numeric enum matching [`DeviceStatus`](api/Cms.Core/Enums/DeviceStatus.cs) and a `DeviceStatusOptions` array `{ label, value }[]` for `<USelect>` (include all values; no “All” on form unless needed).

- [ ] **Step 2:** Add `device_index.model.ts` with types aligned to JSON shapes:

```ts
// Example shapes — align field names to actual API JSON (camelCase)
export type DeviceUserRef = {
  id: number
  name: string
  email: string
  handoverAgreement: boolean
}

export type DeviceIndexRow = {
  id: number
  deviceType: string | null
  name: string
  serial: string | null
  owner: DeviceUserRef | null
  purchasingDate: string | null
  supplier: string | null
  price: number | null
  warrantyDate: string | null
  notes: string | null
  status: number // DeviceStatus
}

export type DeviceHistoryRow = {
  id: number
  userName: string
  userEmail: string
  handoverDateUtc: string
  returnDateUtc: string | null
  isActive: boolean
  handoverAgreement: boolean
  workingType: string | null
  notes: string | null
}

export type DeviceDetail = {
  id: number
  deviceType: number | null
  name: string
  serial: string | null
  owner: DeviceUserRef | null
  purchasingDate: string | null
  supplier: number | null
  price: number | null
  warrantyDate: string | null
  notes: string | null
  status: number
  history: DeviceHistoryRow[]
}
```

- [ ] **Step 3:** Run typecheck.

```bash
cd client && pnpm exec vue-tsc -p ./tsconfig.app.json --noEmit
```

Expected: no new errors.

- [ ] **Step 4:** Commit.

```bash
git add client/src/models/device-status.enum.ts client/src/modules/device_index/device_index.model.ts
git commit -m "feat(client): add device admin types and status enum"
```

---

### Task 2: Routes and sidebar

**Files:**
- Modify: `client/src/main.ts`
- Modify: `client/src/App.vue`

- [ ] **Step 1:** In `main.ts`, add lazy routes:

```ts
{ path: '/devices', component: () => import('./pages/devices.vue') },
{ path: '/devices/new', component: () => import('./pages/device-new.vue') },
{ path: '/devices/:id', component: () => import('./pages/device-detail.vue') },
{ path: '/devices/:id/edit', component: () => import('./pages/device-edit.vue') },
```

- [ ] **Step 2:** In `App.vue` `links` array (top-level, near Users/Leaves), add **Devices** → `/devices` with `i-lucide-laptop` (or `i-lucide-monitor-smartphone`).

- [ ] **Step 3:** Commit.

```bash
git add client/src/main.ts client/src/App.vue
git commit -m "feat(client): register devices admin routes and sidebar"
```

---

### Task 3: Devices index page

**Files:**
- Create: `client/src/pages/devices.vue`
- Uses: `PagedResult<T>` from [`client/src/models/result.ts`](client/src/models/result.ts), `DeviceIndexRow` from module model

- [ ] **Step 1:** Build `computed` URL for `GET /api/devices` with `page`, `take`, `search` (same pattern as [`users.vue`](client/src/pages/users.vue) lines 252–267: `page = pageIndex + 1`).

- [ ] **Step 2:** Use `useFetch` with `immediate: false` and `watch([pagination, debouncedSearch], () => execute(), { immediate: true, deep: true })`.

- [ ] **Step 3:** `UTable` columns: **Name** (link to `/devices/:id`), **Type**, **Serial**, **Status** (badge via `DeviceStatus` labels), **Owner** (show `owner?.name` or `—`), optional **Supplier** if space.

- [ ] **Step 4:** Navbar: title **Devices**, primary button **Add device** → `/devices/new`.

- [ ] **Step 5:** Run `pnpm exec vue-tsc -p ./tsconfig.app.json --noEmit` in `client`.

- [ ] **Step 6:** Commit.

```bash
git add client/src/pages/devices.vue
git commit -m "feat(client): devices index with owner column"
```

---

### Task 4: Device detail + history + Assignment stub

**Files:**
- Create: `client/src/pages/device-detail.vue`

- [ ] **Step 1:** Read `id` from `useRoute().params.id`. Fetch `GET /api/devices/${id}` with `useFetch` (can use `immediate: true` single URL, or `watch` on id).

- [ ] **Step 2:** Show read-only fields: name, serial, status, type/supplier (resolve names via parallel fetches to device types/suppliers lists if needed, or show raw ids until Task 5/6 patterns exist — prefer loading lookups once in a composable or `useFetch` for `/api/DeviceTypes` cached).

- [ ] **Step 3:** Render **History** as `UTable` or list: columns User, Handover (format UTC), Return, Active, Working type, Notes.

- [ ] **Step 4:** If `data.owner == null`, show **Assignment** button; `@click` → `console.log('wip')` (exact).

- [ ] **Step 5:** Toolbar: **Edit** → `/devices/:id/edit`, **Back** to `/devices`.

- [ ] **Step 6:** `pnpm exec vue-tsc` in `client`; commit.

```bash
git add client/src/pages/device-detail.vue
git commit -m "feat(client): device detail with history and assignment placeholder"
```

---

### Task 5: Create device (multipart)

**Files:**
- Create: `client/src/pages/device-new.vue`

- [ ] **Step 1:** `useFetch` or `useFetch` once for `/api/DeviceTypes` and `/api/Suppliers` to fill selects.

- [ ] **Step 2:** Valibot schema: required `name`; optional serial, notes; numbers for `deviceType`, `supplier`, `status`; dates as strings `yyyy-MM-dd` for purchasing/warranty; optional `File` for image — match [`DeviceCreate`](api/Cms.Core/Models/DeviceModel.cs) / server validation.

- [ ] **Step 3:** On submit, build `FormData`:

```ts
const fd = new FormData()
fd.append('Name', name)
if (deviceType != null && deviceType > 0) fd.append('DeviceType', String(deviceType))
// ... Serial, PurchasingDate, Supplier, Price, WarrantyDate, Notes, Status
if (file) fd.append('File', file)
const res = await fetch('/api/devices', { method: 'POST', body: fd })
const json = await res.json() as Result<number>
if (json.isSuccess && json.data) router.push(`/devices/${json.data}`)
```

Use [`Result<T>`](client/src/models/result.ts) shape; handle `!json.isSuccess` with toast.

- [ ] **Step 4:** Layout: `UDashboardPanel`, `max-w-3xl`, `UCard variant="subtle"` sections per [`client/AGENTS.md`](client/AGENTS.md).

- [ ] **Step 5:** Typecheck + commit.

```bash
git add client/src/pages/device-new.vue
git commit -m "feat(client): create device with multipart POST"
```

---

### Task 6: Edit device (JSON PUT)

**Files:**
- Create: `client/src/pages/device-edit.vue`

- [ ] **Step 1:** Load `GET /api/devices/:id` to populate form state (same fields as update DTO).

- [ ] **Step 2:** Valibot schema mirrors `DeviceUpdate` (name required, max lengths per server).

- [ ] **Step 3:** `PUT /api/devices/:id` with `fetch(..., { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ... }) })`. Map `deviceType`/`supplier` as nullable numbers; use camelCase property names matching ASP.NET JSON (`deviceType`, `supplier`, etc.).

- [ ] **Step 4:** On `isSuccess`, toast + `router.push(`/devices/${id}`)`.

- [ ] **Step 5:** Breadcrumbs: Devices → Detail → Edit (mirror [`user-edit.vue`](client/src/pages/user-edit.vue)).

- [ ] **Step 6:** Typecheck + commit.

```bash
git add client/src/pages/device-edit.vue
git commit -m "feat(client): edit device via PUT JSON"
```

---

### Task 7: Verification and documentation hygiene

- [ ] **Step 1:** Manual smoke (API running, Vite dev): list loads, open detail, history visible, Assignment logs `wip` in devtools console, create device, edit device.

- [ ] **Step 2:** Run lint (optional): `cd client && pnpm run lint`.

- [ ] **Step 3:** Update [`docs/plans/todo.md`](docs/plans/todo.md) — check off device-related items that are done (assignment history UI, filters if implemented; if filters deferred, leave unchecked).

- [ ] **Step 4:** Append session note to [`docs/plans/progress.md`](docs/plans/progress.md) per [`CLAUDE.md`](CLAUDE.md).

- [ ] **Step 5:** Commit doc updates.

```bash
git add docs/plans/todo.md docs/plans/progress.md
git commit -m "docs: record devices admin UI progress"
```

---

## Testing notes

- **No Vitest** in repo; verification is **vue-tsc** + **manual QA**.
- Optional follow-up: add Playwright or API integration tests later — not part of this plan.

---

## Execution handoff

**Plan complete and saved to** [`docs/superpowers/plans/2026-03-29-devices-admin.md`](docs/superpowers/plans/2026-03-29-devices-admin.md).

**Two execution options:**

1. **Subagent-Driven (recommended)** — Dispatch a fresh subagent per task; review after each task. **REQUIRED SUB-SKILL:** `superpowers:subagent-driven-development`.

2. **Inline execution** — Run tasks in one session with checkpoints. **REQUIRED SUB-SKILL:** `superpowers:executing-plans`.

**Which approach do you want?**

---

## Fixme discovered during planning

- [`DevicesController.Update`](api/Cms.Api/Controllers/DevicesController.cs) declares `ActionResult<DeviceModel.Detail>` but returns `Result<int>` from the service — the frontend plan treats the response as **`Result<number>`**; if you later fix the API to return updated detail, adjust Task 6 only.

- Enum file path typo risk: verify file is `DeviceStatus.cs` at `api/Cms.Core/Enums/DeviceStatus.cs` (not `DeviceDeviceStatus`).
