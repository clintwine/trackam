# backend/AGENTS.md

## Scope
Backend only.

## Goals
Extract and standardize:
- service and repository boundaries
- auth and RBAC behavior
- route and payload contracts
- schema and bootstrap truth
- notification and event handling
- settings, device, and session flows
- script and workflow drift that affects backend truth

## Rules
- Trust runtime code, bootstrap scripts, and SQL files as separate evidence sources.
- If routes, bootstrap scripts, and migrations disagree, document the gap instead of smoothing it over.
- Do not rewrite applied baseline migrations.
- Do not claim a transaction boundary unless the code actually uses one.
- Keep current state, gap, and recommended target explicit.

## Update these docs
- docs/ARCHITECTURE.md
- docs/DB_SCHEMA.md
- docs/API_SPEC.md
- docs/DECISIONS.md
- docs/MIGRATION_WORKFLOW.md
- docs/GAP_ANALYSIS.md
