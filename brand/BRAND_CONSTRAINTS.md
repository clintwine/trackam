# Brand Constraints

## Purpose
- Provide a generic visual baseline for the current workspace scaffold.
- This file is a temporary bridge until project-specific branding exists.
- The guidance below is inferred from the current codebase, not from an external retail reference.

## Brand summary
- Brand or client: generic workspace baseline
- Product context: account and admin workspace scaffold
- Audience: scaffold adopters, operators, and signed-in end users
- Positioning: clear, dependable, utilitarian, extensible

## Adjectives
- Should feel:
  - calm
  - clear
  - dependable
  - modern
- Should not feel:
  - retail-promotional
  - luxury-editorial
  - playful to the point of distraction
  - visually noisy

## Color direction
| Token area | Direction | Notes |
|---|---|---|
| Background | Dark neutral by default | Matches the current `src/index.css` baseline |
| Card and panel surfaces | Slightly raised dark neutrals | Keep contrast clear without heavy chrome |
| Primary | Soft blue accent | Primary CTA, active state, focus companion |
| Secondary and muted | Neutral grays | Support cards, empty states, metadata, and table chrome |
| Status colors | Conventional success, warning, error semantics | Must remain legible in both themes |

## Typography direction
- Primary font style: neutral sans with strong UI readability
- Weight and casing: sentence case, medium emphasis, compact headings
- Avoid: decorative display faces, condensed editorial styles, overly thin weights

## Imagery and illustration
- Prefer product-agnostic graphics, simple abstractions, or minimal interface-supportive imagery.
- Do not build the scaffold around retail merchandising, promo banners, or price-forward imagery.

## Iconography and shape language
- Icon style: simple outline utility icons
- Corner radius preference: medium
- Border vs shadow preference: border-first with restrained shadow
- Density preference: moderate information density with clear grouping

## Motion tone
- Motion should feel: quick, quiet, and intentional
- Motion should not feel: theatrical, floaty, or game-like
- Preferred timing: short fades and slides around 150-220ms

## UI do and do not
- Do:
  - keep auth, navigation, status, and task clarity obvious
  - use compact cards, tables, and settings blocks
  - keep dashboard panels easy to scan
- Do not:
  - use retail promo language or checkout metaphors
  - make the scaffold depend on one product vertical
  - let decorative styling overpower workflow clarity

## Source material
| Source | Path or note | Type |
|---|---|---|
| Current token system | `frontend/src/index.css` | direct |
| Current shells and pages | `frontend/src/components/layout/*`, `frontend/src/pages/*` | direct |
| Current frontend guidance | `frontend/intelligence.md` | direct |
| This baseline itself | inferred from the current workspace scaffold | inferred |

## Translation into reusable guidance
- Reusable frontend guidance belongs in `frontend/intelligence.md`.
- Project-specific or future client overrides belong here.
- Page-specific decisions should stay close to the touched UI work instead of turning this file into a route inventory.
