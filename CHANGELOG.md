# Changelog

This file records material changes to how the template should be understood or used.

## 2026-04-03

### Fixed
- Added explicit Rollup and Lightning CSS Linux optional dependencies to the frontend manifest and regenerated the lockfile so Alpine-based CI and Railway builds install the native binaries required by Vite production builds.
- Scaffolded projects now render `backend/.env` with the local database URL, bootstrap-admin values, generated JWT secret, session cookie name, and storage URL instead of leaving the copied example credentials in place.

### Changed
- Added an environment-driven `db:seed:bootstrap-admin` flow so scaffolded apps can provision one remote admin account during deploys without relying on demo credentials, and wired that contract into the Railway workflow, manifest, and docs.

## 2026-04-01

### Changed
- Consolidated `web_app` around a Phase 0 workspace and admin baseline instead of the copied commerce roadmap.
- Rewrote the core architecture, schema, API, UI, PRD, migration, and release docs to match the live scaffold.
- Added a manifest-backed harness with `template.json`, root `.gitignore`, `db:migrate`, and `db:seed:demo`.
- Switched `db:init` to the migration runner and added `0003_remove_app_registry_and_installed_apps.sql` to remove the legacy registry surface from the active runtime.
- Added `frontend/docs/DESIGN_SYSTEM.md` and `frontend/docs/MOBBIN_DESIGN_WORKFLOW.md` as repo-true frontend guidance paths.
- Reframed brand guidance around the current generic workspace UI instead of retail-specific residue.
- Aligned scaffold-rendered backend/frontend package names and frontend local-dev port binding with the manifest-driven verify contract.
- Marked the remaining hardening backlog explicitly: user-write narrowing, event-ingestion hardening, mobile navigation, and backend validation scripts.

### Removed
- Removed backend and frontend app-registry and installed-app runtime surfaces.

## 2026-03-20

### Added
- `docs/MIGRATION_WORKFLOW.md` to make per-slice migration decisions, safety rules, run order, and release expectations explicit.
- `docs/SLICE_TESTING_GUIDE.md` to make per-slice backend, frontend, and integration test intent explicit.

### Changed
- Wired migration and test-planning rules into `IMPLEMENT.md`.
- Expanded `docs/SLICE_IMPLEMENTATION_TEMPLATE.md` so every slice must declare migration need and test intent.
- Tightened `docs/RELEASE_CHECKLIST.md` so release gating now proves migration handling and slice test coverage or deferral.
- Added a short readiness overlay to `docs/IMPLEMENTATION_PLAN.md`.
- Updated repo prompt routing to include the new workflow docs.
- Updated all starter slice packs under `docs/slices/` so each one now declares migration need, run order, required tests, and allowed deferrals.
- Made `docs/STAGING_CHECKLIST.md` slice-scoped and `not applicable` aware for early-slice staging truth.
- Expanded `docs/PR_TEMPLATE.md` so PR handoff now captures migration evidence, test evidence, residual risk, changelog status, and slice-scoped staging scope.
- Aligned `implementation-orchestrator`, `repo-consistency-auditor`, `validation-runner`, `pr-publish`, and `staging-deploy` with the current migration, testing, release, and staging workflow.
- Tightened deferred-test tracking so slice docs, the runbook, validation output, and PR handoff now require an explicit follow-up hook.
- Tightened `docs/RELEASE_CHECKLIST.md` so release gating now matches current repo reality for available checks, unavailable backend scripts, and slice-scoped `not applicable` staging checks.
