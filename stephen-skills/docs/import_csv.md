# CSV Import — Lessons from Furniture, Applied to Devices (Future)

Furniture CSV import (see `docs/plans/asset-management-design.md`, implemented against `samples/furniture.csv`) is the first bulk-import feature in this codebase. This doc captures what was learned so a future **Device CSV import** doesn't re-derive it.

## Reusable building blocks (don't rebuild)

- **CsvHelper** package already added (`api/Directory.Packages.props`) — reuse it, don't introduce a second CSV lib.
- **`IAssetTypeService.FindOrCreateAsync` / `ISupplierService.FindOrCreateAsync`** — case-insensitive find-or-create by name, with `CacheControlService.Remove(key)` cache invalidation. `Supplier` is shared between Furniture and Device — **reuse `ISupplierService.FindOrCreateAsync` as-is** for device import, no new code needed there.
- **`IDeviceTypeService`** currently only has `GetAllAsync()` (like AssetType/Supplier had before Furniture import) — will need the same `FindOrCreateAsync` + cache-invalidation treatment added, mirroring `AssetTypeService`/`SupplierService`.
- **`FurnitureImportParsers.ParseFlexibleDate` / `ParsePrice`** — these are generic (not Furniture-specific despite the name/namespace). Move them to a shared location (e.g. `api/Cms.Core/Common/CsvImportParsers.cs`) before starting Device import, rather than duplicating or awkwardly reaching into the Furniture module's internals.

## Design decisions that worked (apply the same way to Devices)

1. **Partial import, not all-or-nothing.** Row-by-row processing; valid rows get created, invalid rows are skipped and reported with `{ row, reason }`. One bad row doesn't block the rest of the file. Apply identically to Device import.
2. **Auto-create missing lookups by name**, case-insensitive. Device import will need this for `DeviceType` (new) and `Supplier` (reuse). Don't require admin to pre-seed lookups before importing.
3. **Required vs optional field handling differs by field, decided explicitly per field — don't apply one rule to everything:**
   - Truly required fields (Furniture: `Name`, `Type of Asset`, valid `Quantity`) → unparseable/missing = **row error, skip the row**.
   - Optional fields where the raw value just doesn't fit the expected type (Furniture: `Price`) → **don't error the row** — leave the field null and append the raw unparsed value into `Notes` (e.g. `"[unparsed price: 1.234.56]"`) so the source data isn't silently lost. Decide this per-field for Devices too (e.g. `WarrantyDate` likely optional-lossy like Price; `Serial` is probably required-hard-error if Device needs a unique serial).
4. **Date parsing must handle messy real-world data, not just one format.** Furniture needed: `dd/MM/yyyy`, `dd,MM,yyyy` (comma-separated variant — real export artifact), bare 4-digit year → `Jan 1` of that year (lossy, intentional, documented inline), blank, and literal `-` → all treated as null except the two real formats. **Check the actual device CSV sample before assuming these same formats apply** — don't copy-paste the format list without checking source data first.
5. **CSV quoting/multi-line is real, not a hypothetical edge case.** The furniture sample had a genuinely multi-line quoted `Name` field and `Notes` with embedded commas/semicolons/newlines (including, in one row, literal credentials — flag anything like that for the Devices sample instead of importing it verbatim if it recurs). CsvHelper's defaults (`HeaderValidated = null`, `MissingFieldFound = null`) handled this with zero extra config — no custom quote-escaping logic needed.
6. **Bind by CSV header name, not column position.** `ClassMap<T>` with `.Map(m => m.X).Name("Header Text")` — robust to column reordering and to extra/trailing empty columns (furniture.csv had a trailing always-empty `Như comments` column that's simply never mapped, not stripped).

## Backend shape (reuse this skeleton for Devices)

- `DeviceImportResult { Created, Skipped, List<DeviceImportRowError { Row, Reason }> Errors }` — same shape as `FurnitureImportResult`, same reasoning.
- Import method lives on the existing `IDeviceService`/`DeviceService` (extend the module that already owns `CreateAsync`'s FK-check/validation idiom) rather than a new parallel service — same call made for Furniture.
- Manually validate the built `DeviceCreate` via `Validator.TryValidateObject` before calling `CreateAsync`, since the import path bypasses controller `ModelState` validation.
- Controller action: `POST /api/devices/import`, `[HttpPost("import")] Import(IFormFile file, ...)` — mirror the exact file-size/extension validation already written in `FurnitureController.Import` (5MB cap, `.csv` extension check).
- No EF migration needed, same as Furniture — no schema changes required just to support import.

## Frontend shape (reuse this skeleton for Devices)

- `UFileUpload` + `FormData` + raw `fetch` (not `useFetch`'s reactive JSON pattern) — one-shot multipart POST. Exact pattern already used for device *image* upload in `device-new.vue` (`v-slot="{ open, removeFile }"`, `fd.append('file', ...)`), reused again for Furniture CSV import.
- Show a toast with `created`/`skipped` counts; render row-level errors in a list inside a modal (not crammed into the toast) when `errors.length > 0`.
- Call the page's existing `execute()` refetch after a successful import instead of a full page reload.
- New `DeviceType`/`Supplier` rows created during import won't show up in already-fetched filter dropdowns until those `useFetch`s rerun (e.g. on page refresh) — acceptable, not worth forcing a refetch for a bounded import feature.

## List page UX conventions (learned after Furniture import shipped)

- **Import button goes in the navbar `#right` slot** of `UDashboardNavbar`, same place as the primary "Add X" button (see `devices.vue` "Add device"). Use `color="neutral" variant="outline" icon="i-lucide-upload"` so it reads as secondary next to the solid primary button. Do **not** put it in the filter row — it first shipped there and was moved.
- **Import modal stays in the page body**, opened via an `isImportModalOpen` ref; only the trigger button lives in the navbar.
- **Filter row for the list page** (Devices should follow the same shape as `furniture.vue`):
  - Search matches the entity's **name only** (not related fields like place) — backend `Contains` on name, placeholder "Search by name...".
  - Filter order: asset/device type → location (if any) → **supplier** → status tabs. Supplier reuses `GET /api/Suppliers` (already used by device pages) and sends `suppliers=<id>` repeated; `FurnitureQuery.Suppliers` already existed server-side, check `DeviceQuery` before adding anything.
  - **Clear button at the end of the filter row** resets search (both `search` and `debouncedSearch`), status tab, and every filter, then `pageIndex = 0`. Disabled when nothing is active. Every new filter must be added to `clearFilters`, `hasActiveFilters`, the URL builder, and the `watch([...])` refetch list.
- Importing creates new suppliers/types, so lookups fetched on mount (supplier/type dropdowns) are stale until reload — same accepted tradeoff as above.

## Open questions (answered — Device import, 2026-10-25)

- **Real sample?** Yes: `samples/vn_devices.csv` (164 rows, UTF-8 BOM, multi-line notes). Dates are `dd,MM,yyyy` (handled by `ParseFlexibleDate`); prices include `13,440,000 đ` (đ now stripped by `CsvImportParsers.ParsePrice`) and dotted/annotated values like `22.460.000 (Full VAT)` (left unparsed, appended to Notes).
- **Serial uniqueness?** Yes (`UX_Devices_Serial`). Upsert by Serial; blank/`N/A`/`-` serials get a deterministic generated `NOSN-xxxxxxxx`; duplicates inside the file get `-2`, `-3` suffixes. Result also reports `updated`.
- **Create `DeviceUser`?** Yes: when `User email` matches `User.Email` (and name is not "Free..."), an active assignment is created (handover date, agreement, working type) and status set to Assigned; unmatched users are noted in Notes.
- **Credentials in Notes** (found in the sample): credential-like lines are replaced with `[redacted]`.
- Shared parsers now live in `api/Cms.Core/Common/CsvImportParsers.cs`.
