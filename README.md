# Trackam

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new?template=https://github.com/jeffreyon/trackam)

Trackam is an open source operator platform for logistics companies. It gives operators a dashboard to dispatch shipments, manage riders and routes, and participate in the OLI network — a shared trust layer for cross-operator custody verification.

Trackam is the operator-facing layer. The OLI Switch is the private network switch that handles proof-of-handover, identity verification, wallet settlement, and disputes across operators. Trackam proxies to the switch on behalf of each operator.

## What it does


Basically if you run a logistics business in Nigeria, you know the pain. You hand a package to another company's driver and then it's just... trust and prayer. Maybe a phone call. Maybe a WhatsApp message that gets buried.

Trackam fixes that. Every handover gets a QR scan, a proof hash, GPS stamp. The driver doesn't need to install anything just opens a link, verifies with OTP, shows a QR. The person receiving scans it, done. Custody transferred, recorded, visible to everyone involved.

The cool part: each operator runs their own dashboard, but they all connect through a shared layer. So when your driver drops off 15 packages at another company's warehouse, that warehouse joins the custody leg from their own system. One scan, one click.

**Dispatch & shipment management**
- Create shipments with goods description, pickup/delivery locations, distance, rider assignment, and recipient contact
- Track each shipment through its lifecycle: `pending → in_transit → handed_over → delivered` (or `failed` / `ghosted` / `disputed`)
- Manual status updates with notes; full timeline log per shipment
- Dispatch runs: group multiple shipment legs onto one vehicle trip

**Proof of Handover (PoH)**
- Every custody transfer generates a cryptographic event on the OLI network
- Receiver identity verified against a government ID registry (BVN in Nigeria) for non-final handovers
- GPS coordinates captured at each handover
- The chain is append-only — you cannot revise history
- Each event produces a tamper-evident proof hash

**Multi-operator waybills**
- Generate waybills that multiple independent operators can claim and join
- Sender gets a physical claim token — proof of physical handoff without platform auth
- Each operator leg is independently tracked and verified on the OLI Switch
- Real-time SSE notifications when custody changes across the network

**Custodian OTP sessions**
- Non-platform users (riders, hub staff) verify identity via OTP before initiating handovers
- Custodian sessions are short-lived and invalidated when custody is passed
- Enables verified handovers without requiring every handler to have a platform account

**Disputes**
- Raise disputes on any shipment with a reason and optional contested handover event
- Dispute detail shows the full handover chain, evidence weight, and notes
- Evidence weight scored by what was captured at the contested handover: BVN + GPS = very high, BVN only = high, override with reason = medium, none = low
- Admin workflow: open → investigating → resolved (upheld / rejected / settled)
- Fees auto-waived on upheld disputes

**Cost accounting**
- Auto-calculates fuel cost at dispatch using configurable fuel price and efficiency multiplier
- Tracks rider fee, fuel cost, and total logistics cost per shipment
- Dashboard shows monthly spend, cost breakdown, and value-at-risk for active shipments

**Rider & route management**
- Register riders with vehicle type, city coverage, and base fee
- Ghost rate and total shipments tracked automatically
- Save frequently used routes for quick dispatch

**Risk scoring**
- Each shipment gets a risk score (low / medium / high) based on route distance, vehicle-distance mismatch, and rider ghost rate

## Architecture

Trackam is one half of a two-repo system:

```
trackam (this repo, open source)
  └── Operator dashboard, dispatch, rider management
  └── Proxies handover/waybill/custodian operations to OLI Switch

oli-switch (private)
  └── Proof of Handover chain
  └── Cross-operator waybill network
  └── Identity verification (BVN / government ID)
  └── Prepaid operator wallets + fee settlement
  └── Dispute resolution
  └── Webhook delivery to operator backends
```

Every operator running trackam registers with the OLI Switch and receives an API key. The switch is the single source of truth for network-level events. Trackam holds operator-local data (riders, routes, shipments, settings) and surfaces switch events through its dashboard.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, TypeScript, React Router, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express 5, raw SQL via `pg` |
| Database | PostgreSQL |
| Auth | JWT + HTTP-only session cookies |
| Network | OLI Switch (private, REST + SSE) |
| Container | Docker (separate images for frontend and backend) |

**Frontend runtime config** — the frontend image writes `window.__APP_CONFIG__` at container start via `scripts/writeRuntimeConfig.mjs`, so `VITE_API_URL` is injected at runtime rather than baked into the build. One Docker image works across environments.

## Local setup

### Prerequisites

- Node.js 20+
- PostgreSQL running locally (default: `postgres://postgres@127.0.0.1:6429/trackam`)
- Access to an OLI Switch instance (or a local dev instance of oli-switch)

### Backend

```bash
cd backend
cp .env.example .env          # edit DATABASE_URL, JWT_SECRET, OLI_SWITCH_URL, OLI_API_KEY
npm install
npm run db:init               # creates the database if it doesn't exist
npm run db:migrate            # runs all migrations in order
npm run db:seed               # seeds two local demo accounts
npm run dev                   # starts on PORT from .env (default 4429)
```

Demo accounts after seed:
- Admin: `admin@example.com` / `password123`
- User: `user@example.com` / `password123`

To also seed demo shipment data:
```bash
npm run db:seed:demo
npm run db:seed:logistics     # riders, routes, and shipments
```

### Frontend

```bash
cd frontend
cp .env.local.example .env.local    # set VITE_API_URL=http://127.0.0.1:4429
npm install
npm run dev                         # starts on port 3429 by default
```

## Environment variables

### Backend (`.env`)

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `4429` |
| `FRONTEND_URL` | CORS allowed origin | `http://127.0.0.1:3429` |
| `DATABASE_URL` | PostgreSQL connection string | — |
| `JWT_SECRET` | Signing secret for JWT tokens | — |
| `JWT_EXPIRATION_SECONDS` | Token lifetime | `3600` |
| `SESSION_COOKIE_NAME` | Cookie name | `trackam_session` |
| `SESSION_COOKIE_MAX_AGE_DAYS` | Cookie max age | `7` |
| `SESSION_COOKIE_SECURE` | Require HTTPS for cookie | `false` (true in prod) |
| `BOOTSTRAP_ADMIN_EMAIL` | Seed admin email | — |
| `BOOTSTRAP_ADMIN_PASSWORD` | Seed admin password | — |
| `STORAGE_DIRECTORY` | File upload directory | `storage` |
| `STORAGE_URL_PREFIX` | Public URL prefix for uploads | — |
| `OLI_SWITCH_URL` | Base URL of the OLI Switch instance | — |
| `OLI_API_KEY` | Operator API key issued by the switch | — |

### Frontend (`.env.local`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend base URL (used at dev time; overridden at runtime in Docker) |

## Deployment (Railway)

Railway deploys the frontend and backend as two separate services from the same repository, with a managed PostgreSQL database.

### Services to create

1. **PostgreSQL** — add the Railway Postgres plugin; note the `DATABASE_URL`
2. **Backend** — point to `/backend`, Dockerfile build; set all backend env vars
3. **Frontend** — point to `/frontend`, Dockerfile build; set `VITE_API_URL` to the backend's Railway public URL

### Backend env vars to set in Railway

```
DATABASE_URL=<from Railway Postgres>
JWT_SECRET=<generate a strong random string>
JWT_EXPIRATION_SECONDS=3600
FRONTEND_URL=https://<your-frontend>.up.railway.app
SESSION_COOKIE_SECURE=true
BOOTSTRAP_ADMIN_EMAIL=<your admin email>
BOOTSTRAP_ADMIN_PASSWORD=<strong password>
STORAGE_DIRECTORY=storage
STORAGE_URL_PREFIX=https://<your-backend>.up.railway.app/storage
PORT=8080
OLI_SWITCH_URL=https://<your-oli-switch>.up.railway.app
OLI_API_KEY=<issued by the OLI Switch admin>
```

### Run migrations on first deploy

In the Railway backend service shell:

```bash
npm run db:migrate
npm run db:seed:bootstrap-admin
```

### Frontend env var

```
VITE_API_URL=https://<your-backend>.up.railway.app
PORT=3000
```

## Database schema

Core tables (created by migrations in `backend/migrations/`):

**Platform**
- `users` — accounts with roles
- `riders` — rider profiles with vehicle type, BVN, and ghost rate
- `routes` — saved pickup-to-delivery routes with default rider and fee
- `shipments` — each dispatch leg with cost, status, risk score, and waybill link
- `shipment_status_log` — full audit trail of status changes
- `logistics_settings` — per-user config (fuel price, efficiency multiplier, ghost threshold)
- `dispatch_runs` — grouped vehicle trips
- `dispatch_run_legs` — junction between runs and shipment legs

**OLI Network**
- `lite_waybills` — waybills generated for cross-operator shipments; include claim token
- `handover_tokens` — one-time tokens that authorize a custody transfer
- `handover_events` — immutable PoH records: who gave to whom, when, with what evidence
- `custodian_sessions` — OTP-verified sessions for non-platform handlers
- `phone_verifications` — OTP table for sender identity at waybill creation

## Project structure

```
trackam/
  backend/
    migrations/       SQL migrations (run in order via migrate.js)
    scripts/          DB init, migrate, seed scripts
    src/
      app/
        auth/         Authentication
        users/        User management
        riders/       Rider profiles and ghost tracking
        routes/       Saved dispatch routes
        shipments/    Shipment lifecycle
        runs/         Dispatch runs
        oli/          OLI Switch proxy (waybill, handover, custodian, disputes)
        logistics_dashboard/  Aggregated dashboard data
        logistics_settings/   Per-operator config
      core/           DB client, auth middleware, error handling
    server.js         Entry point
  frontend/
    src/
      pages/          Page components
      components/     Shared UI components
      services/       API client modules
      lib/            Formatting utilities, API client
    scripts/          Runtime config injection
```

## Contributing

Trackam is the open operator layer of the OLI network. Contributions to the operator platform are welcome.

The OLI Switch (trust and settlement infrastructure) is maintained separately and is not part of this repository.

Areas where contributions are most useful:
- Additional country support for government ID verification
- Operator dashboard UX improvements
- Additional vehicle types and routing logic
- Translations
- Documentation

Please open an issue before submitting a pull request for significant changes.
