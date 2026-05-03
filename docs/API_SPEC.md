# API Spec

## Purpose
- Document the live HTTP contract.
- Avoid claiming a hardened envelope the code does not yet implement.

## Current conventions
- Auth:
  - session cookie (`local_session` by default) or bearer token
  - protected routes use `localAuth`
  - admin routes add `attachAuthz` and admin checks
- Success responses:
  - mostly raw objects or arrays from controllers
- Error responses:
  - mostly `{ message }`
  - Zod validation errors return `{ message, issues }`
- Pagination:
  - no public pagination contract
  - repositories use fixed limits where needed

## Implemented endpoints
| Area | Method | Path | Auth | Current response shape |
|---|---|---|---|---|
| Health | GET | `/health` | Public | `{ status: "ok" }` |
| Health | GET | `/ready` | Public | `{ status: "ready" }` |
| Auth | POST | `/api/auth/signup` | Public | `{ idToken, user, verification }` |
| Auth | POST | `/api/auth/login` | Public | `{ idToken, user }` and sets session cookie |
| Auth | GET | `/api/auth/me` | Authenticated | `{ uid, user, roles, permissions, isAdmin }` |
| Auth | POST | `/api/auth/forgot-password` | Public | `{ message, email }` |
| Auth | POST | `/api/auth/verify-email` | Public | `{ message }` |
| Auth | POST | `/api/auth/logout` | Authenticated | `{ success: true }` |
| Users | GET | `/api/users` | Admin | `UserProfile[]` |
| Users | GET | `/api/users/:id` | Self or admin | `UserProfile` |
| Users | PUT | `/api/users/:id` | Self or admin | `UserProfile` |
| Roles | GET | `/api/roles` | Admin | `RoleItem[]` |
| Roles | GET | `/api/roles/:id` | Admin | `RoleItem` |
| Notifications | GET | `/api/notifications` | Authenticated | `NotificationItem[]` |
| Notifications | POST | `/api/notifications/mark-read` | Authenticated | `{ success: true }` |
| Events | GET | `/api/events` | Public | `EventItem[]` |
| Events | POST | `/api/events` | Public | `EventItem` |
| Settings | GET | `/api/settings/global` | Public | `GlobalSettings` |
| Devices | GET | `/api/devices` | Authenticated | `DeviceItem[]` |
| Devices | POST | `/api/devices` | Authenticated | `DeviceItem` |
| Sessions | GET | `/api/sessions` | Authenticated | `SessionItem[]` |

## Contract notes
- `/api/auth/me` returns role documents in `roles`, not a `string[]` of role ids.
- `PUT /api/users/:id` is still a broad upsert route today.
- `notifications/mark-read` is ownership-scoped by authenticated user id, but still returns only `{ success: true }`.
- `events` supports an optional `type` query filter on list.

## Current state, gap, recommended target
| Current state | Gap | Recommended target |
|---|---|---|
| Routes mostly return raw JSON payloads | The API is not yet uniform | Keep the current payload shapes documented until the code is hardened |
| `PUT /api/users/:id` is shared by self and admin | Self-safe vs admin-safe writes are not separated | Split or narrow the mutation surface later |
| `notifications/mark-read` is now ownership-scoped | Response remains minimal | Expand the response only when a real consumer needs counts or detail |
| `POST /api/events` is public | Operational write surface is broad | Move to authenticated or signed ingestion later |
