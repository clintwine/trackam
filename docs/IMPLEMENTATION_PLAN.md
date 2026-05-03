# Implementation Plan

## Purpose
- Define the current Phase 0 hardening plan for `web_app`.
- Replace the copied commerce slice queue with a smaller template-governance backlog.

## Phase 0 workstreams
| Workstream | Current state | Gap | Recommended target |
|---|---|---|---|
| 1. Docs and harness truth | Core docs and local skills were copied from a commerce scaffold | Runtime and harness drifted from actual code | Keep docs, prompts, and skills aligned to the live workspace scaffold |
| 2. Schema and bootstrap alignment | `db:init`, preserved SQL files, and CI expectations disagree | Operators cannot trust one schema path | Choose and align one executable bootstrap path |
| 3. API contract hardening | Broad user write surface, unscoped notification mark-read, and public event create remain | Security and contract posture is weaker than desired | Narrow the exposed routes deliberately |
| 4. UI shell hardening | User and admin shells exist but still carry placeholder residue | Mobile nav, error states, and copy quality lag | Tighten current surfaces before adding new ones |
| 5. Scaffolder integration | Template manifest is still missing | `web_app` is not yet first-class in the manifest-driven flow | Add and verify `template.json` in a later hardening cut |
| 6. Validation and release truth | Frontend validation exists, backend lint or build scripts do not | Release docs previously implied more than the repo can run | Keep validation and release docs limited to real commands |

## Recommended execution order
1. Keep docs, harness skills, and routing references truthful.
2. Align schema sources, package scripts, and CI expectations.
3. Harden API boundaries that are already live.
4. Tighten user and admin UI polish on the existing routes.
5. Finish scaffolder manifest integration only after the template copy set is clean enough to ship.

## Execution rules
- Work one bounded hardening area at a time.
- Start from code, config, migrations or bootstrap scripts, then docs.
- Update docs first when contracts or architecture understanding change.
- Do not introduce new product domains to make the plan look more complete.
- Preserve baseline SQL history; fix truth around it instead of rewriting it.

## Done criteria for a Phase 0 change
- The touched runtime or harness area is described truthfully.
- Broken references to removed docs or skills are gone.
- Available validation has been run and unavailable checks are called out explicitly.
- `CHANGELOG.md` is updated when the meaning or use of the template changed materially.
