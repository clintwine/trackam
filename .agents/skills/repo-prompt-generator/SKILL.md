---
name: repo-prompt-generator
description: Generate ready-to-send prompts that stay aligned with the current Phase 0 doc set, runtime truth, and surviving local skills.
---

# Repo Prompt Generator

## Purpose
Turn a rough idea into one prompt another Codex instance can execute against this template without drifting from the current docs or harness.

## Read first
- AGENTS.md
- docs/ARCHITECTURE.md
- docs/DECISIONS.md
- references/doc-routing.md
- references/prompt-recipes.md

## Workflow
1. Classify the idea:
   - docs-only
   - backend
   - frontend
   - full-stack
   - review
   - template-harness
   - brand
   - validation or release follow-through
2. Identify touched surfaces:
   - schema or bootstrap
   - API contracts
   - auth or security
   - user or admin UI
   - brand or visual direction
   - documentation or harness only
3. Select the smallest relevant doc set and skill set from `references/doc-routing.md`.
4. Ground the prompt in current reality before asking for changes.
5. Build one ready-to-send prompt using `references/prompt-recipes.md`.
6. Include only repo-true constraints, outputs, and validation.

## Rules
- Prefer current repo docs over intuition.
- Keep doc lists minimal and task-specific.
- Always include `AGENTS.md`.
- Add `backend/AGENTS.md` only when backend, schema, API, auth, or scripts are touched.
- Add `frontend/AGENTS.md` when UI, routes, request states, responsive behavior, or frontend guidance are touched.
- Add `brand/BRAND_CONSTRAINTS.md` when visual tone or branding matters.
- When docs and code may disagree, tell the implementing agent to document:
  - current state
  - gap
  - recommended target
- For doc-only prompts, require extraction order:
  - code
  - config
  - migrations or bootstrap scripts
  - existing docs
- For implementation prompts, require priority order:
  - docs
  - code or config
  - validation
- Keep `references/doc-routing.md` in sync with the repo.

## Output
- optional assumptions
- one ready-to-send prompt in a fenced code block
