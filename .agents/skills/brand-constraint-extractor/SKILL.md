---
name: brand-constraint-extractor
description: Extract structured brand constraints from assets, reference screens, and notes into `brand/BRAND_CONSTRAINTS.md`.
---

# Brand Constraint Extractor

## Purpose
Translate raw brand material into stable UI constraints another agent can use during planning and implementation.

## Read first
- AGENTS.md
- docs/UI_ARCHITECTURE.md
- frontend/intelligence.md
- brand/BRAND_CONSTRAINTS.md
- references/constraint-checklist.md

## Workflow
1. Inspect `brand/assets/`, `brand/references/`, and any provided notes.
2. Inventory the sources actually used.
3. Extract stable brand decisions into `brand/BRAND_CONSTRAINTS.md`.
4. Separate explicit source-backed rules from inferred guidance.
5. Note what should affect `frontend/intelligence.md` versus what stays brand-only.

## Rules
- Do not invent colors, typography, or motion rules without evidence.
- Do not let one reference screen define the whole brand.
- Preserve stronger or newer source material over older notes.
- Keep the output concise and implementation-friendly.
