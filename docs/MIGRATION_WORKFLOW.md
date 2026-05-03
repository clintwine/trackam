# Migration Workflow

## Purpose
- Describe the schema-change path honestly.
- Keep the migration runner, preserved SQL files, and bootstrap alias aligned.

## Current reality
| Item | Current truth |
|---|---|
| Primary schema command | `npm run db:migrate` |
| Bootstrap alias | `npm run db:init` |
| Local seed command | `npm run db:seed` |
| Bootstrap admin seed command | `npm run db:seed:bootstrap-admin` |
| Demo seed command | `npm run db:seed:demo` |
| Preserved SQL files | `backend/migrations/0001_baseline.sql`, `0002_phase1_contracts.sql`, `0003_remove_app_registry_and_installed_apps.sql` |
| Migration runner script | `backend/scripts/migrate.js` |
| Tracking table | `schema_migrations` created by the migration runner |

## Decision rule for Phase 0 work
| Change type | What to do now |
|---|---|
| Docs-only change | No schema command needed |
| Schema-affecting change | Add a new forward-only SQL file, then update `docs/DB_SCHEMA.md` |
| Local bootstrap change | Keep `db:init` delegating to the migration runner |
| Workflow or CI change | Keep command names aligned with real package scripts |

## Rules
- Do not rewrite `0001_baseline.sql` or `0002_phase1_contracts.sql`.
- Prefer additive migrations over historical edits.
- Do not claim `db:migrate`, `db:seed:bootstrap-admin`, or `db:seed:demo` were run unless they were actually executed.
- Keep schema docs aligned with the post-migration runtime state.

## Validation notes
- If schema-affecting work lands, record whether `npm run db:migrate` was run.
- If bootstrap-admin behavior changes, note whether `db:seed:bootstrap-admin` was exercised or deferred.
- If demo-seed behavior changes, note whether `db:seed:demo` was exercised or deferred.
- Report unavailable commands as unavailable, not passed.
