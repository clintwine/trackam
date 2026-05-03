---
name: validation-runner
description: Run and report the available validation checks for the current Phase 0 scaffold.
---

# Validation Runner

## Purpose
Run the available post-change checks and report unavailable checks truthfully.

## Read first
- AGENTS.md
- docs/RELEASE_CHECKLIST.md
- docs/MIGRATION_WORKFLOW.md when schema, bootstrap, or workflow behavior changed
- backend/AGENTS.md when backend is in scope
- frontend/AGENTS.md when frontend is in scope

## Run
- `backend`: `npm test`
- `frontend`: `npm run lint`
- `frontend`: `npx tsc -b`
- `frontend`: `npm test -- --run`
- `frontend`: `npm run build`
- `backend` lint, typecheck, and build: report as unavailable when the scripts do not exist

## Rules
- If schema-affecting work landed, state whether `npm run db:init` was run.
- If failures appear:
  1. identify the root cause
  2. fix only in-scope issues
  3. rerun affected checks
  4. rerun the full available set
- Do not treat unavailable backend lint, typecheck, or build scripts as passing.
- Keep the summary concise.

## Output
- pass or fail per step
- unavailable per step when scripts do not exist
- short failure summary
- short fix summary
- schema-validation status when relevant
