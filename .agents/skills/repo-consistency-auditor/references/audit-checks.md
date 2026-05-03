# Audit Checks

## Use order
1. Product and gap framing:
   - `docs/PRD.md`
   - `docs/GAP_ANALYSIS.md`
2. Boundary and decision layer:
   - `docs/DOMAIN_MODEL.md`
   - `docs/DECISIONS.md`
3. Plan and workflow layer:
   - `docs/IMPLEMENTATION_PLAN.md`
   - `docs/MIGRATION_WORKFLOW.md`
4. Current reality docs:
   - `docs/ARCHITECTURE.md`
   - `docs/DB_SCHEMA.md`
   - `docs/API_SPEC.md`
   - `docs/UI_ARCHITECTURE.md`
5. Release and validation docs:
   - `docs/RELEASE_CHECKLIST.md`
   - `docs/PR_TEMPLATE.md`
   - `docs/STAGING_CHECKLIST.md`
6. Implementation evidence:
   - code
   - scripts
   - workflow files
   - SQL files
   - tests
   - changed docs

## Core questions
- Do the code, scripts, workflow files, and docs describe the same scaffold?
- Do route methods, auth, and payloads still match `docs/API_SPEC.md`?
- Do schema sources and `docs/DB_SCHEMA.md` still agree, or is the gap called out explicitly?
- Do current UI routes and guidance files still match `docs/UI_ARCHITECTURE.md` and `frontend/intelligence.md`?
- Did the change leave dead references to removed docs or skills?
- Can the release checklist be completed truthfully from the evidence that exists?

## Drift categories
| Category | Typical signal | Usually requires |
|---|---|---|
| Contract drift | docs say `PATCH`, code still uses `PUT` | `docs/API_SPEC.md`, `docs/DECISIONS.md`, or code correction |
| Schema drift | `initDb.js` and SQL files no longer match | `docs/DB_SCHEMA.md`, `docs/MIGRATION_WORKFLOW.md`, or schema follow-up |
| Workflow drift | docs or CI mention missing commands | doc update or script alignment |
| Harness drift | prompt routing points at deleted files | skill and routing updates |
| UI drift | route or guidance files moved but docs did not | `docs/UI_ARCHITECTURE.md` or frontend guidance update |

## Severity guidance
- High:
  - security or auth gap
  - schema-path mismatch that blocks truthful release notes
  - release-blocking API mismatch
- Medium:
  - missing doc updates
  - validation truth gap
  - dead harness references
- Low:
  - stale wording
  - weak cross-reference
  - minor ambiguity
