# Gap Analysis

## Executive summary
- `web_app` now has a manifest-backed, migration-backed Phase 0 baseline.
- The remaining gaps are runtime hardening and UX polish gaps, not missing commerce features.

## Current runtime baseline
- Backend:
  - auth
  - users
  - roles
  - notifications
  - events
  - devices
  - sessions
  - settings
- Frontend:
  - public landing
  - auth pages
  - user dashboard
  - admin dashboard
- Schema path:
  - primary command `npm run db:migrate`
  - bootstrap alias `npm run db:init`
  - seed commands `npm run db:seed`, `npm run db:seed:bootstrap-admin`, and `npm run db:seed:demo`

## Gap inventory
| Area | Current state | Gap | Recommended target |
|---|---|---|---|
| User write contract | Self and admin share `PUT /api/users/:id` | Write surface is broader than a hardened baseline should allow | Split or narrow user mutation paths |
| Event ingestion | Public `GET` and `POST /api/events` | Operational surface is under-protected | Move write access behind authenticated or signed ingestion |
| Frontend bootstrap | `AuthProvider` and loaders both fetch auth state | Duplicate requests and extra coupling remain | Consolidate auth bootstrap ownership |
| Mobile dashboard UX | Desktop sidebars are hidden on small screens | No mobile nav pattern exists | Add a drawer or sheet navigation pattern |
| Page quality | Some pages still carry placeholder copy and thin error handling | UX polish lags the documented baseline | Tighten copy and explicit error states incrementally |
| Validation coverage | Frontend lint, typecheck, tests, and build exist; backend only exposes tests | Backend lint, typecheck, and build scripts are unavailable | Keep reporting this honestly until scripts are added |

## What was resolved
- `template.json` now exists, so the template can participate in the manifest-driven scaffolder flow.
- The backend package now exposes `db:migrate`, `db:seed:bootstrap-admin`, and `db:seed:demo`.
- `db:init` now delegates to the migration runner instead of maintaining a separate schema path.
- Legacy registry and per-user module metadata were removed from the active runtime surface.
- Core docs and harness files now point to repo-true frontend guidance paths under `frontend/docs/`.

## What is not a Phase 0 gap
- Missing storefront, catalog, cart, checkout, order, payment, inventory, shipping, review, or CMS features.
- Those are out of scope for this template until the runtime actually adds them.
