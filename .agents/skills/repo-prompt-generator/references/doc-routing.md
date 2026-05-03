# Doc Routing

## Maintenance rule
- Keep this file aligned with the current doc and skill set.
- If files or skills are removed, update this file in the same change.

## Base set for most prompts
- `AGENTS.md`
- `docs/ARCHITECTURE.md`
- `docs/DECISIONS.md`

## Add by task shape
| Task shape | Add docs | Recommend skills | Notes |
|---|---|---|---|
| Docs extraction | `docs/GAP_ANALYSIS.md`, `docs/DB_SCHEMA.md`, `docs/API_SPEC.md`, `docs/UI_ARCHITECTURE.md` | none | Require current reality first. |
| Backend or API work | `backend/AGENTS.md`, `docs/DB_SCHEMA.md`, `docs/API_SPEC.md`, `docs/MIGRATION_WORKFLOW.md` | `backend-dev` | Add schema, bootstrap, auth, and contract rules. |
| Frontend or UX work | `frontend/AGENTS.md`, `docs/UI_ARCHITECTURE.md`, `frontend/docs/DESIGN_SYSTEM.md`, `frontend/intelligence.md`, `brand/BRAND_CONSTRAINTS.md`, `docs/API_SPEC.md` when API-backed | `frontend-dev` | Add route, loading, empty, error, responsive, and brand rules. |
| Brand extraction or refresh | `brand/BRAND_CONSTRAINTS.md`, `frontend/docs/DESIGN_SYSTEM.md`, `frontend/intelligence.md` | `brand-constraint-extractor` | Use when assets or references need to become UI-ready constraints. |
| Template or harness cleanup | `README.md`, `IMPLEMENT.md`, `docs/GAP_ANALYSIS.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/RELEASE_CHECKLIST.md` | `repo-consistency-auditor` | Use for Phase 0 hardening, routing cleanup, and doc or skill consolidation. |
| Full-stack feature or hardening work | `backend/AGENTS.md`, `frontend/AGENTS.md`, `docs/DB_SCHEMA.md`, `docs/API_SPEC.md`, `docs/UI_ARCHITECTURE.md`, `frontend/docs/DESIGN_SYSTEM.md`, `frontend/intelligence.md`, `brand/BRAND_CONSTRAINTS.md`, `docs/MIGRATION_WORKFLOW.md` | `backend-dev`, `frontend-dev` | Order the work as docs, backend, frontend, validation. |
| Consistency audit or drift review | `README.md`, `IMPLEMENT.md`, `docs/GAP_ANALYSIS.md`, `docs/PRD.md`, `docs/DOMAIN_MODEL.md`, `docs/IMPLEMENTATION_PLAN.md`, plus touched current-reality docs | `repo-consistency-auditor` | Use after implementation or during broader repo audits. |
| Validation and wrap-up | `docs/RELEASE_CHECKLIST.md`, `docs/MIGRATION_WORKFLOW.md` when schema changed | `validation-runner` | Require lint, typecheck, tests, and build where those commands exist. |
| PR or deploy follow-through | `docs/PR_TEMPLATE.md`, `docs/RELEASE_CHECKLIST.md`, `docs/STAGING_CHECKLIST.md`, `CHANGELOG.md` when material | `git-pr-prep`, `pr-publish`, `staging-deploy` | Only include when the user explicitly wants PR or deploy follow-through. |

## Add by concern
| Concern | Add docs | Why |
|---|---|---|
| Schema or bootstrap | `docs/DB_SCHEMA.md`, `docs/MIGRATION_WORKFLOW.md` | Current table truth plus executable bootstrap rules |
| Endpoint or payload changes | `docs/API_SPEC.md` | Route methods, auth, and payload contracts |
| UI routes or page behavior | `docs/UI_ARCHITECTURE.md`, `frontend/docs/DESIGN_SYSTEM.md`, `frontend/intelligence.md` | Current route tree, shells, and shared frontend guidance |
| Brand direction | `brand/BRAND_CONSTRAINTS.md` | Visual tone and project-level constraints |
| Auth, RBAC, sessions, security | `docs/ARCHITECTURE.md`, `docs/API_SPEC.md`, `docs/DECISIONS.md`, `backend/AGENTS.md` | Current auth transport and policy choices |
| Template or harness drift | `README.md`, `IMPLEMENT.md`, `docs/GAP_ANALYSIS.md`, `docs/IMPLEMENTATION_PLAN.md` | Current Phase 0 scope and hardening backlog |
| Validation or release readiness | `docs/RELEASE_CHECKLIST.md`, `docs/PR_TEMPLATE.md`, `docs/STAGING_CHECKLIST.md` | Truthful validation and release handoff |

## Current scaffold facts to reflect in prompts
- Frontend is React 19 + Vite + TypeScript + React Router.
- Backend is Express 5 + Postgres with raw SQL repositories.
- Auth uses JWT plus a session cookie, with bearer fallback.
- The primary schema path is `npm run db:migrate`.
- `npm run db:init` delegates to the migration runner.
- The repo exposes `db:seed` and `db:seed:demo`.
- Backend tests use Jest + Supertest.
- Frontend checks are lint, typecheck, tests, and build.
- Backend lint, typecheck, and build scripts are not defined today.
- User and admin dashboards exist; no storefront or commerce runtime is part of this template baseline.
