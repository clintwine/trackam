# Implementation Runbook

## Source of truth
- docs/GAP_ANALYSIS.md
- docs/ARCHITECTURE.md
- docs/DECISIONS.md
- docs/DOMAIN_MODEL.md
- docs/DB_SCHEMA.md
- docs/API_SPEC.md
- docs/UI_ARCHITECTURE.md
- frontend/docs/DESIGN_SYSTEM.md
- frontend/docs/MOBBIN_DESIGN_WORKFLOW.md
- docs/IMPLEMENTATION_PLAN.md
- docs/MIGRATION_WORKFLOW.md when schema, bootstrap, CI, or deploy behavior is touched
- frontend/intelligence.md when frontend structure or reusable UI guidance is touched
- brand/BRAND_CONSTRAINTS.md when visual tone or branding is touched
- docs/RELEASE_CHECKLIST.md

## Workflow
1. Reduce the request to one bounded runtime or harness area.
2. Inspect code, config, migrations or bootstrap scripts, then existing docs.
3. Record `current state`, `gap`, and `recommended target` where drift exists.
4. Update docs first when contracts, schema truth, runtime boundaries, or harness routing are changing.
5. If a non-domain fix belongs in future scaffolds, patch this template or the root scaffolder instead of only patching one generated app.
6. Make the smallest code or config fixes needed to keep the docs and harness truthful.
7. Run a repo consistency audit across the touched files.
8. Run the available validation commands.
9. Update `CHANGELOG.md` when the change materially affects how the template should be used or understood.
10. Prepare PR or deploy follow-through only when explicitly requested.

## Skill boundaries
- `repo-consistency-auditor` for drift review
- `validation-runner` for available checks
- `git-pr-prep`, `pr-publish`, and `staging-deploy` only when PR or deploy follow-through is explicitly in scope

## Rules
- Do not invent future phases or domain plans.
- Do not claim migrations, deploy steps, or scripts that do not exist.
- Treat `backend/migrations/`, `backend/scripts/initDb.js`, `backend/scripts/seedLocal.js`, and `.github/workflows/railway-deploy.yml` as separate evidence sources until they are aligned.
- Do not rewrite applied baseline migrations.
- Remove stale references when files or skills are deleted.
- Report unavailable checks explicitly instead of silently passing them.

## Do not
- expand scope into new commerce domains
- refactor unrelated runtime code
- silently preserve broken cross-doc links
- skip validation or hide missing commands
