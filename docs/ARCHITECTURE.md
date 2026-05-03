# Architecture

## Purpose
- Describe the scaffold that exists today.
- Keep current runtime truth separate from later hardening targets.

## System shape
- Frontend: `frontend/` using React 19, Vite, TypeScript, and React Router.
- Backend: `backend/` using Express 5, Postgres, JWT cookie or bearer auth, and raw SQL repositories.
- Shared runtime package: none.
- Static storage: backend serves local files from `/storage`.

## Frontend runtime boundaries
| Surface | Paths | Guard | Shell |
|---|---|---|---|
| Public | `/` | none | none |
| Auth | `/auth/*` | none | `AuthLayout` |
| User | `/dashboard/*` | `requireAuth` | `DashboardLayout` |
| Admin | `/admin/dashboard/*` | `adminLoader` | `AdminDashboardLayout` |
| Fallback | `*` | none | `ErrorPage` |

## Backend module boundaries
| Module | Route prefix | Current auth shape |
|---|---|---|
| auth | `/api/auth` | mixed public and authenticated routes |
| users | `/api/users` | authenticated; admin for list, self or admin for read and write |
| roles | `/api/roles` | admin-only |
| notifications | `/api/notifications` | authenticated |
| events | `/api/events` | public list and create |
| devices | `/api/devices` | authenticated |
| sessions | `/api/sessions` | authenticated |
| settings | `/api/settings` | public read |

## Request and data flow
- Frontend:
  - route loader or page `useEffect`
  - service module
  - axios client with `withCredentials`
  - backend route
- Backend:
  - route
  - auth middleware when required
  - service
  - repository
  - Postgres

## Auth and authorization model
- Login returns an `idToken`.
- The backend also mints a session cookie from that token.
- Protected routes accept the cookie and still allow bearer fallback.
- RBAC is derived from `users.roles` plus `roles.permissions`.
- `req.authz.roles` contains role documents, not only role ids.

## Frontend composition model
- `main.tsx` wraps the app with:
  - `ToastProvider`
  - `AppProvider`
  - `AuthProvider`
- Route loaders and `AuthProvider` both call the auth endpoint today.
- Pages mostly fetch directly inside `useEffect` rather than through a shared cache layer.

## Schema and bootstrap boundary
- `npm run db:migrate` applies SQL migrations and records versions in `schema_migrations`.
- `npm run db:init` delegates to the migration runner.
- `npm run db:seed` runs the local seed.
- `npm run db:seed:bootstrap-admin` upserts one environment-driven scaffold admin.
- `npm run db:seed:demo` exists for guarded staging demo seeding.
- Preserved SQL artifacts:
  - `backend/migrations/0001_baseline.sql`
  - `backend/migrations/0002_phase1_contracts.sql`
  - `backend/migrations/0003_remove_app_registry_and_installed_apps.sql`

## Transaction reality
- A transaction helper exists in `backend/src/core/db/postgres.js`.
- Current module code does not call that helper.
- Multi-write flows such as login and device registration still run without an explicit transaction boundary.

## Current state, gap, recommended target
| Current state | Gap | Recommended target |
|---|---|---|
| Generic workspace runtime is implemented | Older docs described broader or different surfaces | Keep architecture docs centered on auth, dashboards, notifications, settings, and admin operations |
| Migration runner and manifest are now present | Production bootstrap can otherwise be mistaken for demo seeding | Keep architecture docs anchored to the migration runner, the bootstrap-admin seed contract, and the current Railway workflow |
| Route handlers still return mostly raw JSON payloads | The API is not yet uniformly shaped | Harden deliberately instead of documenting an idealized contract |
| Public `POST /api/events` remains open | Operational write surface is broader than a hardened baseline | Narrow the exposure rules in a follow-up cut |
