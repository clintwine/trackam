# frontend/AGENTS.md

## Scope
Frontend only.

## Goals
Extract and standardize:
- route structure
- public vs auth vs user vs admin boundaries
- shared layout and component usage
- request-state handling
- responsive behavior
- mobile navigation gaps
- reusable design rules in `frontend/docs/DESIGN_SYSTEM.md`
- reusable frontend guidance in `frontend/intelligence.md`

## Rules
- Document current patterns first.
- If sources disagree, record:
  - current state
  - gap
  - recommended target
- Do not assume storefront or commerce UI exists here.
- Prefer shared `src/components/ui/*` primitives over one-off controls.
- Keep user and admin dashboards functionally clear before adding visual flourish.
- Treat `frontend/intelligence.md` as the reusable frontend guidance layer.
- Treat `brand/BRAND_CONSTRAINTS.md` as the project-level visual overlay.

## Update these docs
- docs/UI_ARCHITECTURE.md
- docs/ARCHITECTURE.md
- docs/GAP_ANALYSIS.md
- frontend/docs/DESIGN_SYSTEM.md
- frontend/intelligence.md
- brand/BRAND_CONSTRAINTS.md when visual tone changes materially
