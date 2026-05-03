---
name: repo-consistency-auditor
description: Review one repo area, diff, or documentation chain for drift between current docs, code, scripts, workflow files, and local skill routing.
---

# Repo Consistency Auditor

## Purpose
Detect drift between the current Phase 0 docs, the live runtime, and the local harness before release or during broader repo audits.

## Read first
- AGENTS.md
- README.md
- IMPLEMENT.md
- docs/GAP_ANALYSIS.md
- docs/PRD.md
- docs/DOMAIN_MODEL.md
- docs/IMPLEMENTATION_PLAN.md
- docs/MIGRATION_WORKFLOW.md
- docs/DECISIONS.md
- docs/ARCHITECTURE.md
- docs/DB_SCHEMA.md
- docs/API_SPEC.md
- docs/UI_ARCHITECTURE.md
- docs/AGENTIC_CODING_VELOCITY_METRICS.md
- docs/RELEASE_CHECKLIST.md
- docs/PR_TEMPLATE.md
- docs/STAGING_CHECKLIST.md
- CHANGELOG.md
- references/audit-checks.md
- backend/AGENTS.md when backend, schema, or API is in scope
- frontend/AGENTS.md when frontend or UI is in scope
- brand/BRAND_CONSTRAINTS.md when visual direction is in scope

## Audit modes
- `docs-only`
- `implementation-diff`
- `repo-audit`
- `release-readiness`

## Workflow
1. Pick the smallest audit scope:
   - one doc chain
   - one runtime area
   - one implementation diff
   - one harness or routing area
2. Build the source-of-truth chain in this order:
   - `docs/PRD.md` and `docs/GAP_ANALYSIS.md`
   - `docs/DOMAIN_MODEL.md` and `docs/DECISIONS.md`
   - `docs/IMPLEMENTATION_PLAN.md` and `docs/MIGRATION_WORKFLOW.md`
   - current-reality docs for the touched surfaces
   - kept skill docs and prompt-routing refs when harness files are in scope
   - code, scripts, workflow files, SQL artifacts, tests, and diff
3. Compare only the touched surfaces:
   - naming and domain boundaries
   - schema, bootstrap, and workflow truth
   - API contracts and auth rules
   - UI routes, states, and guidance locations
   - validation and release truth
   - deleted files or skills that are still referenced
4. Record mismatches using:
   - current state
   - gap
   - recommended target
5. Classify severity:
   - high: security, schema, API, auth, or release-blocking drift
   - medium: missing doc updates, routing drift, validation truth gaps
   - low: stale wording, weak cross-references, residual ambiguity
6. State whether `docs/RELEASE_CHECKLIST.md` can be completed truthfully.

## Rules
- Review first. Do not auto-edit unless the user explicitly asks for fixes.
- Present findings first, ordered by severity, with file references.
- Treat stale references to removed docs or skills as real drift.
- Do not claim hardening that the code, scripts, or workflow files do not implement.
- If no major findings exist, say so explicitly and note any residual risks or testing gaps.

## Done
- audit verdict
- findings or explicit no-findings result
- required doc or code follow-up
- release-readiness statement
