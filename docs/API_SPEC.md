# API Spec

## Conventions

- Auth: session cookie (`trackam_session`) or bearer token on all authenticated routes
- Admin routes: require `x-admin-secret` header
- Success responses: raw objects or arrays from controllers
- Error responses: `{ message }` or `{ message, issues }` for validation errors
- Pagination: `?page=&limit=` on list endpoints that support it

---

## Platform endpoints

| Method | Path | Auth | Response |
|---|---|---|---|
| GET | `/health` | Public | `{ status: "ok" }` |
| GET | `/ready` | Public | `{ status: "ready" \| "degraded", checks }` |
| POST | `/api/auth/signup` | Public | `{ idToken, user, verification }` |
| POST | `/api/auth/login` | Public | `{ idToken, user }` + session cookie |
| GET | `/api/auth/me` | Authenticated | `{ uid, user, roles, permissions, isAdmin }` |
| POST | `/api/auth/forgot-password` | Public | `{ message, email }` |
| POST | `/api/auth/verify-email` | Public | `{ message }` |
| POST | `/api/auth/logout` | Authenticated | `{ success: true }` |
| GET | `/api/users` | Admin | `UserProfile[]` |
| GET | `/api/users/:id` | Self or admin | `UserProfile` |
| PUT | `/api/users/:id` | Self or admin | `UserProfile` |
| GET | `/api/roles` | Admin | `RoleItem[]` |
| GET | `/api/notifications` | Authenticated | `NotificationItem[]` |
| POST | `/api/notifications/mark-read` | Authenticated | `{ success: true }` |
| GET | `/api/settings/global` | Public | `GlobalSettings` |

---

## Logistics endpoints

| Method | Path | Auth | Response |
|---|---|---|---|
| GET | `/api/riders` | Authenticated | `Rider[]` |
| POST | `/api/riders` | Authenticated | `Rider` |
| PUT | `/api/riders/:id` | Authenticated | `Rider` |
| DELETE | `/api/riders/:id` | Authenticated | `{ success: true }` |
| GET | `/api/routes` | Authenticated | `Route[]` |
| POST | `/api/routes` | Authenticated | `Route` |
| PUT | `/api/routes/:id` | Authenticated | `Route` |
| DELETE | `/api/routes/:id` | Authenticated | `{ success: true }` |
| GET | `/api/shipments` | Authenticated | `Shipment[]` (paginated) |
| POST | `/api/shipments` | Authenticated | `Shipment` |
| GET | `/api/shipments/:id` | Authenticated | `Shipment` with status log |
| PATCH | `/api/shipments/:id/status` | Authenticated | `Shipment` |
| GET | `/api/runs` | Authenticated | `DispatchRun[]` |
| POST | `/api/runs` | Authenticated | `DispatchRun` |
| PATCH | `/api/runs/:id/status` | Authenticated | `DispatchRun` |
| POST | `/api/runs/:id/legs` | Authenticated | `DispatchRunLeg` |
| GET | `/api/dashboard` | Authenticated | Aggregated metrics |
| GET | `/api/settings/logistics` | Authenticated | `LogisticsSettings` |
| PUT | `/api/settings/logistics` | Authenticated | `LogisticsSettings` |

---

## OLI proxy endpoints

All routes proxy to the OLI Switch using the operator's registered API key.

### Waybill

| Method | Path | Auth | Response |
|---|---|---|---|
| POST | `/api/oli/waybill` | Authenticated | `{ waybillId, waybillNumber, claimToken, ... }` |
| POST | `/api/oli/waybill/claim` | Authenticated | `{ shipmentId, waybillId, ... }` |
| POST | `/api/oli/waybill/:id/join` | Authenticated | `{ shipmentId, ... }` |
| GET | `/api/oli/waybill` | Authenticated | `Waybill[]` (paginated) |
| GET | `/api/oli/waybill/:id` | Authenticated | `Waybill` with shipment legs |

### Handover

| Method | Path | Auth | Response |
|---|---|---|---|
| POST | `/api/oli/handover/initiate` | Authenticated | `{ token, expiresAt, shipmentId }` |
| POST | `/api/oli/handover/confirm` | Public (token-gated) | `{ proofHash, occurredAt, receiverName, ... }` |
| GET | `/api/oli/handover/:shipmentId/events` | Authenticated | `HandoverEvent[]` |

### Custodian

| Method | Path | Auth | Response |
|---|---|---|---|
| POST | `/api/oli/custodian/otp/request` | Public | `{ sessionId }` |
| POST | `/api/oli/custodian/otp/verify` | Public | `{ sessionToken }` |
| POST | `/api/oli/custodian/handover/initiate` | Custodian session | `{ token, expiresAt }` |

### Disputes

| Method | Path | Auth | Response |
|---|---|---|---|
| POST | `/api/oli/disputes` | Authenticated | `Dispute` |
| GET | `/api/oli/disputes` | Authenticated | `Dispute[]` (paginated) |
| GET | `/api/oli/disputes/:id` | Authenticated | `Dispute` with chain, evidence, notes |
| POST | `/api/oli/disputes/:id/notes` | Authenticated | `DisputeNote` |

### Fees

| Method | Path | Auth | Response |
|---|---|---|---|
| GET | `/api/oli/fees` | Authenticated | `Fee[]` (paginated) |

### Wallet

| Method | Path | Auth | Response |
|---|---|---|---|
| GET | `/api/oli/wallet` | Authenticated | `{ balance, currency }` |
| GET | `/api/oli/wallet/transactions` | Authenticated | `WalletTransaction[]` |
| POST | `/api/oli/wallet/topup` | Authenticated | `{ paymentUrl }` |

---

## Contract notes

- `/api/oli/handover/confirm` is public — it is accessed via QR code or link by the receiver without a platform account. It is gated by the handover token in the request body, not by session auth.
- `/api/oli/custodian/*` endpoints are public but OTP/session-token gated at the application layer.
- Paginated endpoints accept `?page=1&limit=20`. Maximum limit is 200.
- All OLI proxy endpoints return the switch's response shape unchanged.
