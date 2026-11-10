# User Edit Submit E2E — Design

**Date:** 2026-07-19  
**Status:** Approved (brainstorm)  
**Prompt:** [`docs/prompts/prompt-user-edit-submit-e2e-20260719.md`](../../prompts/prompt-user-edit-submit-e2e-20260719.md)

## Problem

Playwright smokes only cover users list and a single title edit. Need automated confidence that Save on `/users/:id/edit` works for full, partial, minimal, and no-op updates against the live API—without avatar upload.

## Goals

- Four Playwright scenarios: all fields, seeded subset, minimal (title only), no-op submit.
- Success = redirect to details per `handleSave` **and** `GET /api/users/:id` field checks.
- Exclude avatar / file upload always.
- Restore DB user via full `PUT` in `finally`.

## Non-Goals

- Negative validation tests
- CI e2e job
- API mocks
- Contacts / teams / leave / assets
- Avatar upload

## Decisions (locked)

| Topic | Choice |
|-------|--------|
| Minimal | Title only (optional field) |
| Assert | `GET /api/users/:id` after Save |
| Random | Seeded fixed 5 fields (reproducible) |
| Dates | Include in “all fields”; drive `FormDatePicker` |
| Approach | Fill-helper map + dedicated spec file |

## Client success path (verified)

In [`client/src/pages/user-edit.vue`](../../../client/src/pages/user-edit.vue) `handleSave`:

1. `PUT /api/users/{id}` with full form body
2. On `response.ok && result.isSuccess`: toast `"User updated"`, then `router.push(`/users/${id}`)`
3. Toast is not the primary assert (flake-prone)

## Architecture

```
Playwright → Vite :5173 → proxy /api → Cms.Api :5196 → SQL
```

Prerequisite: API running, ≥1 user in DB (same as existing e2e).

### Components

| Path | Responsibility |
|------|----------------|
| `client/e2e/helpers/user-edit-form.ts` | `fillByPlaceholder`, `fillStatus`, `setDateByFieldLabel`, `fillAllEditable`, `fillSeededSubset` |
| `client/e2e/user-edit-submit.spec.ts` | Four tests + shared restore |
| `client/e2e/helpers/api.ts` | Reuse `getFirstUserId`, `getUserById`, `putUser`, `toUserUpdate` |
| `client/e2e/users.spec.ts` | Unchanged (list + existing title smoke) |

## Scenarios

Shared: resolve first user → snapshot `original` → open edit → wait form ready.  
`finally`: `putUser(id, toUserUpdate(original))`.

### A — Update all fields

Fill every editable non-avatar control:

- Text/textarea via placeholders (Full Name, Title, emails, phones, HR sections, etc.)
- Status via `USelect` (`Select status`)
- Dates: **Date of Birth** → `1990-06-15`; **Issue Date** (national ID) → `2020-01-10`
- Work email: unique `e2e-{timestamp}@example.com` (unique index)

Assert: URL `/users/{id}`; GET matches all filled values (dates as API returns, typically `yyyy-MM-dd`).

### B — Seeded subset (“random”)

Always these five fields (stamped values):

1. `title`
2. `phone`
3. `gender`
4. `nationalId`
5. `bankAccount`

Assert: those five match GET; other HR fields equal `original`.

### C — Minimal

Fill Title only → `e2e-min-{timestamp}`.  
Assert: `title` on GET; redirect OK.

### D — No-op submit

No fills; click **Save Changes**.  
Assert: redirect to `/users/{id}`; GET HR fields equal `original`. Ignore `updatedUtc` / `updatedBy` if backend bumps them on save.

## Fill helpers

- Prefer placeholders / roles; never Nuxt UI internal classes.
- Never interact with avatar `UFileUpload`, username, teams, audit.
- `setDateByFieldLabel(page, label, ymd)`: scope to `UFormField` by label, click `aria-label="Select a date"` inside, select day on calendar (fallback: type into `UInputDate` segments if needed).

## Assert / restore

1. After Save: `waitForURL('**/users/{id}')` (must not remain on `/edit`)
2. `GET /api/users/{id}` via Playwright `request` (through Vite origin so proxy works)
3. Compare expected keys
4. Restore always uses full `UserUpdate` body (partial PUT would wipe columns)

## Out of scope (later)

- CI Playwright job
- Firefox/WebKit
- Negative form validation
- True-random field sets

## Runbook

```text
1. Start API on :5196
2. cd client && pnpm test:e2e
3. Debug: pnpm test:e2e:ui
```
