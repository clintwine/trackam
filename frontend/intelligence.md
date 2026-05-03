# Frontend Intelligence

This document captures the current reusable frontend guidance for `templates/web_app`.

## Stack
- React 19
- React Router 7
- Vite 6
- Tailwind CSS 4 with CSS variable tokens
- Axios for HTTP
- Zustand for auth and profile state
- `lucide-react` for icons
- `framer-motion` for small UI motion

## App composition
- `src/main.tsx` wraps `App` with:
  - `ToastProvider`
  - `AppProvider`
  - `AuthProvider`
- `AuthProvider` fetches current-user state and syncs it into Zustand.

## Current route model
- `/` -> landing page
- `/auth/*` -> auth pages
- `/dashboard/*` -> authenticated user dashboard
- `/admin/dashboard/*` -> admin dashboard
- `*` -> error page

## Data and state patterns
- Auth route guards live in `src/scripts/auth.loader.ts`.
- Most screens fetch data in page-local `useEffect` hooks.
- There is no shared request cache library today.
- Loading states are mostly inline skeleton blocks.
- Empty states are mostly bordered cards with short text.
- Dashboard and admin error states are still thin and should be improved incrementally.

## Current visual baseline
- Theme:
  - dark-first neutral workspace baseline
  - blue primary accent
  - border-first cards
  - restrained shadows
- Shared layout emphasis:
  - clear side navigation on desktop
  - compact overview cards
  - simple list, table, and card patterns

## Current guidance set
- Runtime UI truth: `docs/UI_ARCHITECTURE.md`
- Reusable frontend guidance: this file
- Reference workflow: `frontend/docs/MOBBIN_DESIGN_WORKFLOW.md`
- Mobbin reference storage: `frontend/design/mobbin/README.md`
- Brand overlay: `brand/BRAND_CONSTRAINTS.md`

## Known frontend gaps
- Mobile navigation is not implemented for the dashboard shells.
- `AuthProvider` and route loaders duplicate auth bootstrap work.
- Some pages still need explicit fetch-failure states.
- Copy quality still includes placeholder wording in places that should be normalized.

## Update this file when
- the reusable route or provider model changes
- the default visual baseline changes
- a shared pattern becomes standard across multiple screens
- the current frontend guidance file set changes
