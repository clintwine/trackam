# Architecture

## System shape

Trackam is the operator-facing layer of a two-repo system. It handles operator-local concerns (dispatch, riders, routes, shipments, settings) and proxies network-level operations to the OLI Switch.

```
┌─────────────────────────────────────┐
│  trackam (this repo)                │
│                                     │
│  frontend/   React 19, Vite, TS     │
│  backend/    Express 5, PostgreSQL  │
│                                     │
│  Operator-local:                    │
│    riders, routes, shipments,       │
│    dispatch runs, settings,         │
│    dashboard aggregations           │
│                                     │
│  OLI proxy (src/app/oli/):          │
│    waybill generation               │
│    handover initiation/confirm      │
│    custodian OTP sessions           │
│    dispute management               │
└──────────────────┬──────────────────┘
                   │ REST + SSE
                   │ X-OLI-API-Key
                   ▼
┌─────────────────────────────────────┐
│  OLI Switch (private repo)          │
│                                     │
│  Proof of Handover chain            │
│  Cross-operator waybill network     │
│  Government ID verification (BVN)   │
│  Prepaid operator wallets           │
│  Fee settlement                     │
│  Dispute resolution                 │
│  Webhook delivery                   │
└─────────────────────────────────────┘
```

## Frontend runtime boundaries

| Surface | Paths | Guard | Shell |
|---|---|---|---|
| Public | `/` | none | none |
| Auth | `/auth/*` | none | `AuthLayout` |
| User | `/dashboard/*` | `requireAuth` | `DashboardLayout` |
| Admin | `/admin/dashboard/*` | `adminLoader` | `AdminDashboardLayout` |
| Fallback | `*` | none | `ErrorPage` |

## Backend module boundaries

| Module | Route prefix | Auth | Responsibility |
|---|---|---|---|
| auth | `/api/auth` | mixed | Login, signup, session management |
| users | `/api/users` | authenticated | User profiles, roles |
| riders | `/api/riders` | authenticated | Rider registration, ghost tracking |
| routes | `/api/routes` | authenticated | Saved dispatch routes |
| shipments | `/api/shipments` | authenticated | Shipment lifecycle, status log |
| runs | `/api/runs` | authenticated | Dispatch run grouping |
| oli | `/api/oli` | authenticated | OLI Switch proxy |
| logistics_dashboard | `/api/dashboard` | authenticated | Aggregated metrics |
| logistics_settings | `/api/settings/logistics` | authenticated | Per-operator config |

## OLI proxy pattern

The `oli` module forwards requests to the OLI Switch with the operator's API key attached. It does not hold network state locally — it reads from the switch and surfaces events to the operator dashboard via SSE.

```
operator request
  → trackam backend (authenticated)
  → oli module
  → OLI Switch (X-OLI-API-Key: <operator key>)
  → response proxied back to operator
```

Webhook events from the switch arrive at a registered endpoint on the trackam backend and are forwarded to the frontend via SSE or stored as notifications.

## Request and data flow

- Frontend: route loader or `useEffect` → service module → axios client (`withCredentials`) → backend route
- Backend: route → auth middleware → service → repository → PostgreSQL
- OLI events: switch webhook → `POST /api/oli/webhook` → notification store → SSE to frontend

## Auth model

- Login returns an `idToken`
- Backend mints a session cookie from that token
- Protected routes accept the cookie; bearer fallback supported
- RBAC derived from `users.roles` and `roles.permissions`
- OLI Switch auth is operator-level (API key), separate from user-level auth

## Schema and bootstrap

- `npm run db:migrate` applies SQL migrations, records versions in `schema_migrations`
- `npm run db:init` delegates to the migration runner
- `npm run db:seed` runs local seed (roles, users, demo accounts)
- `npm run db:seed:bootstrap-admin` upserts one environment-driven admin
- `npm run db:seed:demo` and `npm run db:seed:logistics` seed demo data for staging

## Transaction boundary

- A `withTransaction` helper exists in `backend/src/core/db/postgres.js`
- Multi-write flows (shipment creation + status log, dispatch run + legs) use explicit transactions
- OLI proxy calls are not wrapped in local transactions — the switch handles atomicity for network operations
