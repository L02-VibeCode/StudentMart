# User Edit Submit E2E Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use **superpowers:subagent-driven-development** (recommended) or **superpowers:executing-plans** to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four Playwright scenarios that submit the user edit form (all / seeded subset / title-only / no-op) against the live API and assert via redirect + `GET /api/users/:id`.

**Architecture:** New fill helpers in `client/e2e/helpers/user-edit-form.ts`; scenarios in `client/e2e/user-edit-submit.spec.ts`. Reuse `api.ts` for GET/PUT/restore. Success path mirrors `handleSave`: wait for `/users/{id}` then GET-assert. Never touch avatar.

**Tech Stack:** `@playwright/test`, Chromium, Vite proxy to API `:5196`.

**Spec:** [`docs/superpowers/specs/2026-07-19-user-edit-submit-e2e-design.md`](../specs/2026-07-19-user-edit-submit-e2e-design.md)

## Global Constraints

- Real API only — no `page.route` mocks.
- Exclude avatar / file upload in every scenario.
- Restore with full `putUser(toUserUpdate(original))` in `finally`.
- Prefer placeholders / labels / roles — no Nuxt UI class selectors.
- Work email in “all fields” must be unique (`e2e-{ts}@example.com`).
- Minimal = Title only; seeded subset = title, phone, gender, nationalId, bankAccount.
- Dates in all-fields: DOB `1990-06-15`, national ID issue `2020-01-10`.
- Do not modify `users.spec.ts` behavior except if shared helpers need export tweaks.
- Prerequisite: API on `:5196`, ≥1 user in DB.

---

## File structure

| Path | Action | Responsibility |
|------|--------|----------------|
| [`client/e2e/helpers/user-edit-form.ts`](../../../client/e2e/helpers/user-edit-form.ts) | Create | Fill helpers + expected-value builders |
| [`client/e2e/user-edit-submit.spec.ts`](../../../client/e2e/user-edit-submit.spec.ts) | Create | Four scenarios |
| [`client/e2e/helpers/api.ts`](../../../client/e2e/helpers/api.ts) | Modify if needed | Optional: `assertUserFields` / date normalize |
| [`docs/plans/todo.md`](../../plans/todo.md) / [`docs/plans/progress.md`](../../plans/progress.md) | Modify | Progress |

**Read-only:** [`user-edit.vue`](../../../client/src/pages/user-edit.vue), [`FormDatePicker.vue`](../../../client/src/components/FormDatePicker.vue), design spec.

---

## Docs to read before coding

1. Design spec (above)
2. [`client/e2e/users.spec.ts`](../../../client/e2e/users.spec.ts) — restore pattern
3. [`client/e2e/helpers/api.ts`](../../../client/e2e/helpers/api.ts)

---

### Task 1: Fill helpers

**Files:**
- Create: `client/e2e/helpers/user-edit-form.ts`

**Interfaces:**
- Consumes: Playwright `Page`
- Produces: `waitForEditFormReady`, `fillByPlaceholder`, `fillStatus`, `setDateByFieldLabel`, `fillAllEditable`, `fillSeededSubset`, `clickSave`

- [ ] **Step 1: Create helper file** with:

```ts
import { expect, type Page } from '@playwright/test'

export async function waitForEditFormReady(page: Page): Promise<void> {
  await expect(page.getByPlaceholder('Job title')).toBeVisible({ timeout: 15_000 })
}

export async function fillByPlaceholder(page: Page, placeholder: string, value: string): Promise<void> {
  const input = page.getByPlaceholder(placeholder, { exact: true })
  await input.fill(value)
}

export async function fillStatus(page: Page, optionLabel: string): Promise<void> {
  await page.getByPlaceholder('Select status').click()
  await page.getByRole('option', { name: optionLabel, exact: true }).click()
}

/** Scope calendar button to the UFormField labeled `fieldLabel`. */
export async function setDateByFieldLabel(
  page: Page,
  fieldLabel: string,
  isoDate: string // yyyy-MM-dd
): Promise<void> {
  const [y, m, d] = isoDate.split('-').map(Number)
  const field = page.locator('div, section, form').filter({ has: page.getByText(fieldLabel, { exact: true }) }).first()
  // Prefer: locate form field by label text then calendar inside
  const group = page.getByText(fieldLabel, { exact: true }).locator('..').locator('..')
  await group.getByRole('button', { name: 'Select a date' }).click()
  // UCalendar: click day cell — use gridcell or button with day number
  await page.getByRole('gridcell', { name: String(d), exact: true }).click()
  // If month/year wrong, use calendar prev/next until year/month match, then day.
  // Implement robust navigation: while visible month/year != target, click next/prev.
}

export async function clickSave(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Save Changes' }).click()
}

export type AllFieldsPayload = {
  fullName: string
  title: string
  email: string
  personalEmail: string
  phone: string
  gender: string
  placeOfBirth: string
  nation: string
  religion: string
  marriageStatus: string
  numberOfDependents: string
  nationalId: string
  nationalIdIssuePlace: string
  academicLevel: string
  schoolOrUniversity: string
  major: string
  certificates: string
  bankAccount: string
  personalIncomeTaxCode: string
  socialInsuranceCode: string
  idNotarizedDocument: string
  ndaDocument: string
  currentAddress: string
  permanentResidence: string
  hometown: string
  emergencyContactFullName: string
  emergencyContactRelationship: string
  emergencyContactPhone: string
  emergencyContactAddress: string
  dateOfBirth: string
  nationalIdIssueDate: string
  statusLabel: string // e.g. 'Active'
  statusValue: number // 1
}

export function buildAllFieldsPayload(ts: number): AllFieldsPayload {
  return {
    fullName: `E2E Full ${ts}`,
    title: `E2E Title ${ts}`,
    email: `e2e-${ts}@example.com`,
    personalEmail: `e2e-p-${ts}@example.com`,
    phone: '0900000001',
    gender: 'Male',
    placeOfBirth: 'HCMC',
    nation: 'VN',
    religion: 'None',
    marriageStatus: 'Single',
    numberOfDependents: '0',
    nationalId: `ID${ts}`.slice(0, 50),
    nationalIdIssuePlace: 'CA HCMC',
    academicLevel: 'Bachelor',
    schoolOrUniversity: 'Test Uni',
    major: 'CS',
    certificates: 'None',
    bankAccount: `BA${ts}`,
    personalIncomeTaxCode: `TAX${ts}`.slice(0, 50),
    socialInsuranceCode: `SI${ts}`.slice(0, 50),
    idNotarizedDocument: `id-${ts}.pdf`,
    ndaDocument: `nda-${ts}.pdf`,
    currentAddress: 'Current Addr',
    permanentResidence: 'Permanent Addr',
    hometown: 'Hometown',
    emergencyContactFullName: 'Emergency Name',
    emergencyContactRelationship: 'Spouse',
    emergencyContactPhone: '0911111111',
    emergencyContactAddress: 'Emergency Addr',
    dateOfBirth: '1990-06-15',
    nationalIdIssueDate: '2020-01-10',
    statusLabel: 'Active',
    statusValue: 1,
  }
}

export async function fillAllEditable(page: Page, p: AllFieldsPayload): Promise<void> {
  await fillByPlaceholder(page, 'Enter full name', p.fullName)
  await fillByPlaceholder(page, 'Job title', p.title)
  await fillByPlaceholder(page, 'Enter work email', p.email)
  await fillByPlaceholder(page, 'Personal email', p.personalEmail)
  await fillByPlaceholder(page, 'Enter phone number', p.phone)
  await fillStatus(page, p.statusLabel)
  await setDateByFieldLabel(page, 'Date of Birth', p.dateOfBirth)
  await fillByPlaceholder(page, 'Gender', p.gender)
  await fillByPlaceholder(page, 'Place of birth', p.placeOfBirth)
  await fillByPlaceholder(page, 'Nation', p.nation)
  await fillByPlaceholder(page, 'Religion', p.religion)
  await fillByPlaceholder(page, 'Marriage status', p.marriageStatus)
  await fillByPlaceholder(page, '0', p.numberOfDependents)
  await fillByPlaceholder(page, 'National ID', p.nationalId)
  await setDateByFieldLabel(page, 'Issue Date', p.nationalIdIssueDate)
  await fillByPlaceholder(page, 'Issue place', p.nationalIdIssuePlace)
  await fillByPlaceholder(page, 'Academic level', p.academicLevel)
  await fillByPlaceholder(page, 'School or university', p.schoolOrUniversity)
  await fillByPlaceholder(page, 'Major', p.major)
  await fillByPlaceholder(page, 'Certificates', p.certificates)
  await fillByPlaceholder(page, 'Bank account', p.bankAccount)
  await fillByPlaceholder(page, 'Personal income tax code', p.personalIncomeTaxCode)
  await fillByPlaceholder(page, 'Social insurance code', p.socialInsuranceCode)
  // Duplicate placeholder "path or URL" — use getByLabel
  await page.getByLabel('ID Notarized Document').fill(p.idNotarizedDocument)
  await page.getByLabel('NDA Document').fill(p.ndaDocument)
  await fillByPlaceholder(page, 'Current address', p.currentAddress)
  await fillByPlaceholder(page, 'Permanent residence', p.permanentResidence)
  await fillByPlaceholder(page, 'Hometown', p.hometown)
  await fillByPlaceholder(page, 'Full name', p.emergencyContactFullName) // emergency
  await fillByPlaceholder(page, 'Relationship', p.emergencyContactRelationship)
  await fillByPlaceholder(page, 'Phone', p.emergencyContactPhone) // emergency placeholder
  await fillByPlaceholder(page, 'Address', p.emergencyContactAddress)
}

export type SeededSubset = {
  title: string
  phone: string
  gender: string
  nationalId: string
  bankAccount: string
}

export function buildSeededSubset(ts: number): SeededSubset {
  return {
    title: `seed-title-${ts}`,
    phone: '0987654321',
    gender: 'Female',
    nationalId: `SEED${ts}`.slice(0, 50),
    bankAccount: `SEEDBA${ts}`,
  }
}

export async function fillSeededSubset(page: Page, s: SeededSubset): Promise<void> {
  await fillByPlaceholder(page, 'Job title', s.title)
  await fillByPlaceholder(page, 'Enter phone number', s.phone)
  await fillByPlaceholder(page, 'Gender', s.gender)
  await fillByPlaceholder(page, 'National ID', s.nationalId)
  await fillByPlaceholder(page, 'Bank account', s.bankAccount)
}
```

Implement `setDateByFieldLabel` robustly: open calendar scoped to field; navigate months until header shows target month/year; click day. If `getByLabel` fails for documents, fall back to `.nth(0)` / `.nth(1)` of `path or URL` within Documents card.

- [ ] **Step 2: Commit**

```bash
git add client/e2e/helpers/user-edit-form.ts
git commit -m "test(client): add user-edit form fill helpers for e2e"
```

---

### Task 2: Assert helper + four scenarios

**Files:**
- Create: `client/e2e/user-edit-submit.spec.ts`
- Modify: `client/e2e/helpers/api.ts` (add small helpers)

**Interfaces:**
- Consumes: fill helpers + api helpers
- Produces: four passing tests when API up

- [ ] **Step 1: Add to `api.ts`**

```ts
/** Normalize date-only strings from API (may include time). */
export function dateOnly(iso: string | null | undefined): string | null {
  if (!iso) return null
  return iso.slice(0, 10)
}

export function pickHrFields(u: UserGet) {
  const { id, username, ...rest } = u
  // strip nothing else — callers ignore updatedUtc/updatedBy for D
  return rest
}
```

- [ ] **Step 2: Write `user-edit-submit.spec.ts`**

```ts
import { test, expect } from '@playwright/test'
import {
  getFirstUserId,
  getUserById,
  putUser,
  toUserUpdate,
  dateOnly,
} from './helpers/api'
import {
  waitForEditFormReady,
  fillAllEditable,
  fillSeededSubset,
  fillByPlaceholder,
  clickSave,
  buildAllFieldsPayload,
  buildSeededSubset,
} from './helpers/user-edit-form'

test.describe('user edit submit (real API)', () => {
  test('A: update all fields should pass', async ({ page, request }) => {
    const id = await getFirstUserId(request)
    const original = await getUserById(request, id)
    const ts = Date.now()
    const payload = buildAllFieldsPayload(ts)
    try {
      await page.goto(`/users/${id}/edit`)
      await waitForEditFormReady(page)
      await fillAllEditable(page, payload)
      await clickSave(page)
      await page.waitForURL(`**/users/${id}`)
      const after = await getUserById(request, id)
      expect(after.fullName).toBe(payload.fullName)
      expect(after.title).toBe(payload.title)
      expect(after.email).toBe(payload.email)
      expect(after.personalEmail).toBe(payload.personalEmail)
      expect(after.phone).toBe(payload.phone)
      expect(after.status).toBe(payload.statusValue)
      expect(dateOnly(after.dateOfBirth)).toBe(payload.dateOfBirth)
      expect(dateOnly(after.nationalIdIssueDate)).toBe(payload.nationalIdIssueDate)
      expect(after.gender).toBe(payload.gender)
      expect(after.nationalId).toBe(payload.nationalId)
      expect(after.bankAccount).toBe(payload.bankAccount)
      expect(after.emergencyContactFullName).toBe(payload.emergencyContactFullName)
      // assert remaining payload fields similarly (all keys from AllFieldsPayload except statusLabel)
    } finally {
      await putUser(request, id, toUserUpdate(original))
    }
  })

  test('B: update seeded subset should pass', async ({ page, request }) => {
    const id = await getFirstUserId(request)
    const original = await getUserById(request, id)
    const subset = buildSeededSubset(Date.now())
    try {
      await page.goto(`/users/${id}/edit`)
      await waitForEditFormReady(page)
      await fillSeededSubset(page, subset)
      await clickSave(page)
      await page.waitForURL(`**/users/${id}`)
      const after = await getUserById(request, id)
      expect(after.title).toBe(subset.title)
      expect(after.phone).toBe(subset.phone)
      expect(after.gender).toBe(subset.gender)
      expect(after.nationalId).toBe(subset.nationalId)
      expect(after.bankAccount).toBe(subset.bankAccount)
      expect(after.email).toBe(original.email)
      expect(after.fullName).toBe(original.fullName)
    } finally {
      await putUser(request, id, toUserUpdate(original))
    }
  })

  test('C: update minimal title should pass', async ({ page, request }) => {
    const id = await getFirstUserId(request)
    const original = await getUserById(request, id)
    const title = `e2e-min-${Date.now()}`
    try {
      await page.goto(`/users/${id}/edit`)
      await waitForEditFormReady(page)
      await fillByPlaceholder(page, 'Job title', title)
      await clickSave(page)
      await page.waitForURL(`**/users/${id}`)
      const after = await getUserById(request, id)
      expect(after.title).toBe(title)
    } finally {
      await putUser(request, id, toUserUpdate(original))
    }
  })

  test('D: submit without changes should pass', async ({ page, request }) => {
    const id = await getFirstUserId(request)
    const original = await getUserById(request, id)
    try {
      await page.goto(`/users/${id}/edit`)
      await waitForEditFormReady(page)
      await clickSave(page)
      await page.waitForURL(`**/users/${id}`)
      const after = await getUserById(request, id)
      expect(after.fullName).toBe(original.fullName)
      expect(after.email).toBe(original.email)
      expect(after.title).toBe(original.title)
      expect(after.phone).toBe(original.phone)
      expect(after.status).toBe(original.status)
      expect(dateOnly(after.dateOfBirth)).toBe(dateOnly(original.dateOfBirth))
      // compare remaining HR fields vs original (skip updatedUtc/updatedBy)
    } finally {
      await putUser(request, id, toUserUpdate(original))
    }
  })
})
```

Expand asserts in A/D to cover every field listed in `AllFieldsPayload` / `UserGet` HR fields (implementer must not leave “assert remaining” as a comment — write every `expect`).

- [ ] **Step 3: Run tests** (API must be up)

```bash
cd client && pnpm test:e2e e2e/user-edit-submit.spec.ts
```

Expected: 4 passed. If date helper flakes, fix `setDateByFieldLabel` before committing.

- [ ] **Step 4: Commit**

```bash
git add client/e2e/user-edit-submit.spec.ts client/e2e/helpers/api.ts client/e2e/helpers/user-edit-form.ts
git commit -m "test(client): add user-edit submit scenarios A-D"
```

---

### Task 3: Docs

**Files:** `docs/plans/todo.md`, `docs/plans/progress.md`

- [ ] Check off / add: Playwright user-edit submit scenarios (all / subset / minimal / no-op)
- [ ] Append progress session with runbook reminder
- [ ] Commit: `docs: record user-edit submit e2e scenarios`

---

## Self-review

1. Spec coverage: A/B/C/D + restore + GET assert + dates + no avatar — Tasks 1–2.
2. No placeholders left in implementer asserts.
3. Types: `AllFieldsPayload` / `SeededSubset` align with `UserGet` field names for expects.

## Out of scope

- CI, mocks, negative validation, changing `users.spec.ts` smokes beyond coexistence.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-07-19-user-edit-submit-e2e.md`.**

**1. Subagent-Driven (recommended)** — fresh subagent per task + review  
**2. Inline Execution** — this session with checkpoints  

**Which approach?**
