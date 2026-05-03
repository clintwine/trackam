# Frontend Design System

## Role
- Reusable UI contract for the `web_app` template.
- Route inventory belongs in `docs/UI_ARCHITECTURE.md`.
- Project-level visual tone belongs in `brand/BRAND_CONSTRAINTS.md`.

## Baseline
- Theme: dark-first neutral workspace baseline with a soft blue primary accent.
- Surfaces: border-first cards, restrained shadows, medium radius, compact spacing.
- Typography: neutral sans, sentence case, short headings.
- Density: moderate information density optimized for account and admin flows.

## Layout rules
- Keep public, auth, user dashboard, and admin dashboard visually distinct.
- Favor clear page headers, compact cards, and dense operational lists over promo-heavy layouts.
- Reuse shared shells in `src/components/layout/*`.

## Component rules
- Prefer `src/components/ui/*` primitives before raw controls.
- Keep tables and list rows compact, readable, and action-oriented.
- Keep forms explicit about required fields, validation, and submit state.
- Use one primary action per card or module.

## State rules
- Loading states should preserve layout with skeletons.
- Empty states should explain the missing state in one sentence.
- Error states should be explicit; do not let fetch failures look like successful empty states.

## Responsive rules
- Dashboard and admin nav need a mobile-friendly fallback when touched.
- Keep core actions visible without relying on hover.
- Avoid layouts that only work at desktop widths.

## Token boundary
- Keep semantic tokens in `src/index.css`.
- Prefer semantic classes like `bg-card`, `text-foreground`, `border-border`, and `bg-primary`.
- Do not hard-code one-off colors into components.
