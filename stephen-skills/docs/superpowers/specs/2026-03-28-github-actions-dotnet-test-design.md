# GitHub Actions: `dotnet test` on pull requests

## Purpose

Run the backend test suite on every pull request so merges are blocked when tests fail. The repository root matches the Git workspace (`Cms.slnx` at root).

## Triggers

- **`pull_request` only** — default types: `opened`, `synchronize`, `reopened`.
- **No** `push` to default branch (explicit product choice).

## Runner and dependencies

- **`ubuntu-latest`** — hosted runner with Docker available for **Testcontainers.MsSql** (`api/Cms.Tests`).
- **.NET SDK 10** — align with `net10.0` in `api/Cms.Tests/Cms.Tests.csproj` and solution projects.

## Workflow layout

- Add workflow file(s) under **`.github/workflows/` at the repository root** (not under `client/.github/`, which GitHub does not load for a root repo).

## Job steps (target state)

1. **Checkout** — `actions/checkout` (default ref for PR events is correct for CI on the PR head).
2. **Setup .NET** — `actions/setup-dotnet` with SDK channel/version for .NET 10.
3. **Optional: NuGet cache** — cache keyed on `api/Directory.Packages.props` and lockfiles if present, to speed restore.
4. **Test** — `dotnet test` against **`Cms.slnx`**, single configuration (**`Release` recommended** for CI consistency; document if `Debug` is chosen instead).

No repository secrets are required for a standard restore + test unless private NuGet feeds are introduced later.

## Failure behavior

- Non-zero exit from build or tests fails the job; PR checks show failure until fixed.

## Fork pull requests

- First-time contributors may need **approval to run workflows** (repository/org setting). Testcontainers image pulls on `ubuntu-latest` are expected to work for typical MSSQL testcontainer usage.

## Out of scope (follow-ups)

- **Path filters** — not in v1; add only if CI minutes or noise becomes a problem.
- **Relocating `client/.github/workflows/ci.yml`** to root `.github/` — separate change; needed if frontend CI should run on GitHub for this repo.

## Success criteria

- Opening or updating a PR runs the workflow and executes **`dotnet test`** on **`Cms.slnx`**.
- A deliberately failing test causes the check to fail.
- Workflow completes successfully when the test suite passes locally and on CI.
