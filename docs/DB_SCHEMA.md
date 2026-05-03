# DB Schema

## Purpose
- Record current schema truth.
- Keep historical SQL, migration runner behavior, and executable bootstrap aligned.

## Current schema sources
| Source | Current state | Notes |
|---|---|---|
| `backend/migrations/0001_baseline.sql` | Historical baseline SQL | Includes the older `installed_apps` column |
| `backend/migrations/0002_phase1_contracts.sql` | Additive SQL | Adds the notifications index |
| `backend/migrations/0003_remove_app_registry_and_installed_apps.sql` | Additive SQL | Removes `installed_apps` and any legacy `app_registry` table |
| `backend/scripts/migrate.js` | Executable migration runner | Creates `schema_migrations` and applies ordered SQL files |
| `backend/scripts/initDb.js` | Bootstrap alias | Delegates to the migration runner |
| `backend/scripts/seedLocal.js` | Idempotent local demo seed | Inserts roles, users, settings, notifications, events, devices, and sessions |
| `backend/scripts/seedBootstrapAdmin.js` | Idempotent remote bootstrap admin seed | Upserts one admin user from environment variables |
| `backend/scripts/seedDemo.js` | Guarded staging demo seed | Seeds demo users only when `DEMO_SEED_ALLOWED=true` |

## Tables after current migrations
| Table | Purpose | Key columns | Notes |
|---|---|---|---|
| `roles` | Role definitions | `id` PK, `permissions text[]` | Seeded with `admin`, `user` |
| `users` | Identity, profile, and auth state | `id` PK, `email` UNIQUE, `roles text[]`, `password_hash` | Stores preferences and profile fields |
| `notifications` | User notification feed | `id` PK, `to_uid` FK, `read` | Mark-read is now scoped by authenticated user id |
| `events` | Generic operational log | `id` PK, `type`, `payload jsonb` | Public create API still exists |
| `devices` | Known device records | `id` PK, `uid` FK, `device_id`, `is_current` | Current-device clearing happens in repository code |
| `sessions` | Session history | `id` PK, `uid` FK, `created_at`, `ended_at` | Logout marks recent sessions ended |
| `settings` | Global settings row | `id` PK, `support_email`, `allowed_regions text[]` | Uses `id = 'global'` convention |
| `schema_migrations` | Applied migration tracker | `version` PK, `applied_at` | Created by the migration runner |

## Relationships and constraints
- Foreign keys:
  - `notifications.to_uid -> users.id` (`ON DELETE CASCADE`)
  - `devices.uid -> users.id` (`ON DELETE CASCADE`)
  - `sessions.uid -> users.id` (`ON DELETE CASCADE`)
- Unique constraints:
  - `users.email`
- Secondary indexes:
  - `notifications_to_uid_created_at_idx (to_uid, created_at DESC)`
- No FK links `users.roles[]` to `roles.id`.

## Schema behavior notes
- Timestamps are stored as `BIGINT` epoch milliseconds in runtime tables.
- `0001_baseline.sql` is preserved as history; later SQL files carry the removal of legacy app-related schema.
- Fresh environments should use the migration runner path, not manual reconstruction from one SQL file.

## Current state, gap, recommended target
| Current state | Gap | Recommended target |
|---|---|---|
| The repo now has one migration-backed schema path | Historical SQL still shows older fields before later removals | Keep using additive migrations instead of rewriting history |
| Local and CI paths can both call `db:migrate` | Production access could be misread as coming from demo users | Keep schema changes migration-first and keep the bootstrap-admin contract explicit |
| Notification ownership exists in schema and write path | Other hardening work remains open | Continue tightening user writes and event ingestion in later cuts |
