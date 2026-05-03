---
name: backend-dev
description: Implement backend changes for one scoped runtime or harness area.
---

# Backend Dev

## Purpose
Implement backend changes without drifting from the current Phase 0 contract and schema truth.

## Read first
- AGENTS.md
- backend/AGENTS.md
- docs/DB_SCHEMA.md
- docs/API_SPEC.md
- docs/ARCHITECTURE.md
- docs/DECISIONS.md
- docs/MIGRATION_WORKFLOW.md when schema, bootstrap, or workflow behavior is touched

## Focus
- routes
- services and repositories
- auth and RBAC
- notifications, events, sessions, devices, and settings
- schema or bootstrap alignment
- workflow or script drift that affects backend truth

## Workflow
1. Confirm the current route, schema, and script truth first.
2. Update docs first when the backend contract or boundary understanding is changing.
3. Implement the smallest backend change that closes the scoped gap.
4. Keep `initDb.js`, preserved SQL notes, and backend docs aligned or call out the remaining mismatch explicitly.
5. Run backend tests.

## Rules
- Do not claim a transaction boundary unless the code actually uses one.
- Do not claim `db:migrate` behavior if the script does not exist.
- Do not edit applied baseline SQL files.
- Keep output concise.
