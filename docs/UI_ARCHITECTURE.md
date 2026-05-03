# UI Architecture

## Purpose
- Record current UI runtime truth for `web_app`.
- Keep reusable guidance in `frontend/docs/DESIGN_SYSTEM.md` and `frontend/intelligence.md`.

## Surfaces
- Public: `/`
- Auth: `/auth/login`, `/auth/signup`, `/auth/forgot-password`, `/auth/verify-email`
- User dashboard: `/dashboard`, `/dashboard/account`, `/dashboard/notifications`, `/dashboard/security`
- Admin dashboard: `/admin/dashboard`, `/admin/dashboard/users`, `/admin/dashboard/events`, `/admin/dashboard/roles`

## Route map
| Area | Path | Guard | Shell | Notes |
|---|---|---|---|---|
| Public | `/` | none | none | Placeholder landing surface |
| Auth | `/auth/*` | none | `AuthLayout` | Form flows only |
| User | `/dashboard/*` | `requireAuth` | `DashboardLayout` | Sidebar hidden on small screens |
| Admin | `/admin/dashboard/*` | `adminLoader` | `AdminDashboardLayout` | Separate admin nav |
| Fallback | `*` | none | `ErrorPage` | 404 screen |

## Current UI coverage
| Area | Status | Current state |
|---|---|---|
| Auth flows | Existing | Login, signup, forgot-password, verify-email |
| User account | Existing | Overview, account, notifications, security |
| Admin operations | Partial | Overview, users, events, roles |
| Settings UI | Missing | Only backend global settings read exists |
| Write-oriented admin forms | Missing | No create or edit workflows for admin entities |

## Shared components and patterns
- Layout shells:
  - `AuthLayout`
  - `DashboardLayout`
  - `AdminDashboardLayout`
- Cross-cutting providers:
  - `ToastProvider`
  - `AppProvider`
  - `AuthProvider`
- Data layer:
  - route loaders for auth guards
  - page-local `useEffect`
  - service modules under `src/services/*`
- UI primitives:
  - `src/components/ui/*`
  - pages still mix shared primitives and raw HTML controls

## State patterns
- Loading:
  - page-local booleans with inline pulse skeletons
- Empty:
  - dashed or muted bordered cards with short guidance
- Error:
  - auth pages show inline messages plus toast feedback
  - dashboard and admin pages still under-specify fetch failures on some routes

## Current visual baseline
- Theme:
  - dark-first neutral workspace baseline from `src/index.css`
  - blue primary accent
  - border-first cards and restrained shadows
- Guidance sources:
  - `frontend/docs/DESIGN_SYSTEM.md`
  - `frontend/docs/MOBBIN_DESIGN_WORKFLOW.md`
  - `frontend/intelligence.md`
  - `brand/BRAND_CONSTRAINTS.md`

## Current state, gap, recommended target
| Current state | Gap | Recommended target |
|---|---|---|
| User and admin dashboard shells are implemented | Mobile navigation is still weak | Add a mobile drawer or sheet pattern in a later hardening cut |
| `AuthProvider` and route loaders both fetch auth state | Duplicate boot-time calls increase noise | Consolidate auth bootstrap ownership later |
| Pages mix primitives and raw controls | UI composition is inconsistent | Prefer shared primitives when touching a page |
| Dashboard copy and error handling are uneven | UX polish still carries placeholder residue | Tighten copy and explicit error states incrementally |
