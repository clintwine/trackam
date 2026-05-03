# Domain Model

## Purpose
- Define the current Phase 0 domain language for this scaffold.
- Keep the model limited to what the runtime actually ships today.

## Core primitives
| Primitive | Role | Current state | Notes |
|---|---|---|---|
| User | Identity and profile anchor | Implemented | Stores auth, profile, and preferences |
| Role | RBAC definition | Implemented | Permissions are resolved at request time |
| Session | Session history record | Implemented | Tracks login sessions and logout endings |
| Device | Known device record | Implemented | Supports current-device visibility |
| Notification | User-facing feed entry | Partial | Read and mark-read only |
| Event | Generic operational or audit entry | Partial | Public create route is still exposed |
| Settings | Global template configuration | Partial | Single-row model today |

## Surface model
| Surface | Role | Current state |
|---|---|---|
| Public | Landing and entry point | Implemented |
| Auth | Signup, login, forgot-password, verify-email | Implemented |
| User workspace | Overview, account, notifications, security | Implemented |
| Admin workspace | Overview, users, events, roles | Implemented |

## Domain boundaries
| Domain | Owns | Does not own | Current state |
|---|---|---|---|
| Identity and access | users, roles, auth context | notification state, global settings, event-ingestion policy | Implemented |
| Session and device history | sessions, devices | authorization policy definition | Implemented |
| Notification feed | user-facing notification records | event ingestion, business-source ownership | Partial |
| Event log | generic event records | canonical source of truth for users, settings, or notifications | Partial |
| Global settings | one shared config record | per-user settings, transactional history | Partial |
| Presentation shells | route trees, layouts, page composition | backend data ownership | Implemented |

## State transitions
| Flow | Current state | Notes |
|---|---|---|
| Guest -> authenticated | Implemented | login returns token and session cookie |
| Authenticated -> admin access | Implemented | depends on `users.roles` and resolved permissions |
| Session active -> ended | Implemented | logout marks recent sessions ended |
| Device current -> not current | Implemented | registering a device clears other current flags |
| Notification unread -> read | Implemented | ownership is now enforced in the repository update |

## Invariants
- `users.roles` stores role ids, while resolved auth context loads full role documents.
- Notifications belong to users through `notifications.to_uid`.
- Events may describe activity, but they are not the source of truth for users, settings, or notifications.
- Settings remain configuration inputs, not transactional records.
- Public, auth, user, and admin are separate surfaces over the same backend modules.
- Applied SQL files are append-only; later migrations correct earlier baseline shapes.

## Current state, gap, recommended target
| Current state | Gap | Recommended target |
|---|---|---|
| The scaffold has a stable platform domain set | Older docs mixed in unrelated domain stories | Keep the domain model grounded in users, access, settings, notifications, and dashboards |
| Notifications and events exist | Event ingestion is still under-protected | Tighten event exposure in later Phase 0 work |
| Settings are global and minimal | The config surface is not strongly typed beyond one row | Keep the model simple until a real config expansion is justified |
