# Mobbin Design Workflow

## Purpose
- Use Mobbin or similar references as pattern input, not as a source of truth.
- Keep the resulting UI aligned with `frontend/docs/DESIGN_SYSTEM.md`, `frontend/intelligence.md`, and `brand/BRAND_CONSTRAINTS.md`.

## Rules
- Preserve the existing public, auth, user, and admin runtime boundaries.
- Prefer adapting navigation, form, table, and request-state patterns over copying whole screens.
- Do not import retail, storefront, or checkout patterns unless the runtime actually adds those surfaces.
- Keep the workspace baseline calm, operational, and readable.

## Reference storage
- Put reference notes or screenshots under `frontend/design/mobbin/`.
- Summarize reusable decisions in docs instead of embedding raw screenshots into the main docs.
