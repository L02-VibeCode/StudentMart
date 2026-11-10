# Devices index server-side sort — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use **superpowers:subagent-driven-development** (recommended) or **superpowers:executing-plans** to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add **server-side column sorting** to the devices admin index (`/devices`) by sending **`sort`** and **`dir`** on `GET /api/devices`, matching the pattern in `furniture.vue`. **Frontend-only** — no API or database changes.

**Architecture:** Reuse the same reactive pattern as [`client/src/pages/furniture.vue`](../../client/src/pages/furniture.vue): `sortField` / `sortDir` refs, a `sortHeader(apiKey, label)` factory that renders Nuxt UI `UButton` headers with sort icons, append query params in a computed `url` for `useFetch`, and extend the existing `watch` so `execute()` runs when sort changes. Convert static `columns` to a **`computed`** so header render functions close over reactive sort state. Backend keys must match [`DeviceService`](../../api/Cms.Core/Services/DeviceService.cs) (`name`, `devicetype`, `serial`, `status`).

**Tech Stack:** Vue 3 (Composition API), Vue Router 4, `@vueuse/core` (`useFetch`, `useDebounceFn`), Nuxt UI 4 (`UTable`, `UButton`, …). Data-fetching rules: [`client/AGENTS.md`](../../client/AGENTS.md) (`useFetch` + `watch` + `execute`, not automatic URL refetch).

**Spec:** [`docs/superpowers/specs/2026-03-31-devices-index-sort-design.md`](../specs/2026-03-31-devices-index-sort-design.md)

**Tracking:** [oclockvn/work#5](https://github.com/oclockvn/work/issues/5)

---

## File structure

| Path | Action | Responsibility |
|------|--------|----------------|
| [`client/src/pages/devices.vue`](../../client/src/pages/devices.vue) | **Modify** | Sort state, `sortHeader`, computed `columns`, `url` + `watch` updates |
| [`client/src/pages/furniture.vue`](../../client/src/pages/furniture.vue) | **Read-only reference** | Copy `sortHeader` + URL param pattern; do not edit unless extracting shared helper (out of scope for v1) |

No new files. No backend files.

---

## Docs to read before coding

1. [`docs/superpowers/specs/2026-03-31-devices-index-sort-design.md`](../specs/2026-03-31-devices-index-sort-design.md) — which columns are sortable and why Owner/Supplier are not.
2. [`client/AGENTS.md`](../../client/AGENTS.md) — `useFetch` + `watch` + `execute()` pattern.
3. [`client/src/pages/furniture.vue`](../../client/src/pages/furniture.vue) lines ~20–112 — reference implementation for sort.

---

### Task 1: Sort state and `sortHeader` helper

**Files:**
- Modify: [`client/src/pages/devices.vue`](../../client/src/pages/devices.vue)

- [ ] **Step 1:** After `const UBadge = resolveComponent('UBadge')`, add:

```ts
const UButton = resolveComponent('UButton')
```

- [ ] **Step 2:** After `pagination` ref, add:

```ts
const sortField = ref<string | null>(null)
const sortDir = ref<'asc' | 'desc'>('asc')
```

- [ ] **Step 3:** After `handlePageChange`, add **`sortHeader`** — copy from [`furniture.vue`](../../client/src/pages/furniture.vue) (same signature: `(apiKey: string, label: string) => () => h(UButton, { ... })`). Behavior:
  - `onClick`: if `sortField === apiKey`, flip `sortDir`; else set `sortField = apiKey`, `sortDir = 'asc'`.
  - Always set `pagination.value.pageIndex = 0` on click.
  - Icons: `i-lucide-arrow-up-down` when inactive column; `i-lucide-arrow-up-narrow-wide` / `i-lucide-arrow-down-wide-narrow` when active matching `sortDir`.

- [ ] **Step 4:** Commit (optional checkpoint):

```bash
git add client/src/pages/devices.vue
git commit -m "feat(client): add sort state and sortHeader helper on devices index"
```

---

### Task 2: Append `sort` and `dir` to the request URL

**Files:**
- Modify: [`client/src/pages/devices.vue`](../../client/src/pages/devices.vue)

- [ ] **Step 5:** Inside the `url` computed (before `return`), after the `statuses` block, append:

```ts
  if (sortField.value) {
    params.append('sort', sortField.value)
    params.append('dir', sortDir.value)
  }
```

- [ ] **Step 6:** Commit:

```bash
git add client/src/pages/devices.vue
git commit -m "feat(client): pass sort and dir to GET /api/devices"
```

---

### Task 3: Reactive columns with sortable headers

**Files:**
- Modify: [`client/src/pages/devices.vue`](../../client/src/pages/devices.vue)

- [ ] **Step 7:** Replace `const columns: TableColumn<DeviceIndexRow>[] = [` with:

```ts
const columns = computed<TableColumn<DeviceIndexRow>[]>(() => [
```

- [ ] **Step 8:** Close the array with `])` instead of `]` (add closing paren for `computed`).

- [ ] **Step 9:** Update headers:
  - **name:** `header: sortHeader('name', 'Name')` — **cell** unchanged (link to detail).
  - **deviceType:** `header: sortHeader('devicetype', 'Type')`
  - **serial:** `header: sortHeader('serial', 'Serial')`
  - **status:** `header: sortHeader('status', 'Status')`
  - **owner:** `header: 'Current owner'` (string)
  - **supplier:** `header: 'Supplier'` (string)

- [ ] **Step 10:** In `<template>`, bind `:columns="columns"` — **no change** if already `columns`; `computed` ref unwraps in template automatically.

- [ ] **Step 11:** Commit:

```bash
git add client/src/pages/devices.vue
git commit -m "feat(client): sortable column headers on devices table"
```

---

### Task 4: Refetch when sort changes

**Files:**
- Modify: [`client/src/pages/devices.vue`](../../client/src/pages/devices.vue)

- [ ] **Step 12:** Replace the `watch` that calls `execute()` with:

```ts
watch([pagination, debouncedSearch, statusFilter, sortField, sortDir], () => {
  execute()
}, { immediate: true, deep: true })
```

- [ ] **Step 13:** Commit:

```bash
git add client/src/pages/devices.vue
git commit -m "feat(client): refetch devices when sort changes"
```

---

### Task 5: Verification (manual)

**No automated test required for this slice** (YAGNI — thin UI wiring; project pattern is manual QA for list pages).

- [ ] **Step 14:** Start API + client (however you usually run the CMS). Open `/devices`.

- [ ] **Step 15:** DevTools → **Network** → select a `devices?` request.

  - **Expected (initial load):** Query string has `page`, `take`; may have `search`, `statuses`. **No** `sort`/`dir` until a column header is clicked.

- [ ] **Step 16:** Click **Name** header.

  - **Expected:** Request includes `sort=name&dir=asc`. Click again → `dir=desc`.

- [ ] **Step 17:** Go to page 2 (if enough rows), then click **Serial** to sort.

  - **Expected:** `page` returns to **1** (`page=1` in query).

- [ ] **Step 18:** Combine with search text and status tab; confirm list updates and `sort`/`dir` still present when set.

- [ ] **Step 19:** Confirm **Current owner** and **Supplier** headers are plain text (no sort buttons).

---

### Task 6: PR and issue closure

- [ ] **Step 20:** PR description — paste:

```markdown
## Sortable columns (API keys)
- Name → `name`
- Type → `devicetype`
- Serial → `serial`
- Status → `status`

**Not sortable (v1):** Owner, Supplier — no matching sort branch in `DeviceService`.

Spec: `docs/superpowers/specs/2026-03-31-devices-index-sort-design.md`
```

- [ ] **Step 21:** Merge per team process; close [oclockvn/work#5](https://github.com/oclockvn/work/issues/5) (or `/close #5` with summary per [`.cursor/skills/close/SKILL.md`](../../.cursor/skills/close/SKILL.md)).

---

## Plan review checklist (before execution)

Use this instead of a separate reviewer agent when working solo:

- [ ] Every sort key matches `DeviceService` switch lowercase strings (`devicetype` not `deviceType`).
- [ ] `dir` is only sent when `sort` is sent (guarded by `if (sortField.value)`).
- [ ] `columns` is `computed` so `sortHeader` re-renders when `sortField`/`sortDir` change.

---

## Execution handoff

**Plan complete and saved to `docs/superpowers/plans/2026-03-31-devices-index-sort.md`. Two execution options:**

1. **Subagent-driven (recommended)** — One focused subagent per task group (Tasks 1–2, 3, 4, 5–6), review between groups; use **superpowers:subagent-driven-development**.

2. **Inline execution** — Implement Tasks 1–4 in one session with checkpoints; use **superpowers:executing-plans**.

**Which approach do you want?**
