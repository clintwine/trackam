# Agentic Coding Velocity Metrics

## Objective
- Measure useful velocity for Phase 0 hardening work.
- Optimize for truthful docs, scoped fixes, and runnable validation over feature count.

## What good velocity means here
| Theme | Meaning in this template |
|---|---|
| Truthfulness | Docs, skills, routes, scripts, and SQL artifacts describe the same current scaffold |
| Scope control | Each change closes one hardening gap without dragging in a new domain plan |
| Command realism | Validation and workflow guidance only names commands that actually exist |
| Handoff quality | Another agent can continue from the updated docs without rediscovering drift |

## Guardrails
- Do not invent missing routes, tables, scripts, or future domains.
- Do not claim a migration, envelope, or transaction rule the code does not implement.
- Do not leave doc-routing references pointing at deleted files.
- Do not use app-specific or retail-specific brand residue as scaffold truth.
- Do not treat unavailable backend lint, typecheck, or build scripts as passing checks.

## False velocity signals
| Anti-metric | Why it is misleading |
|---|---|
| More docs | More files do not help if they still point at dead paths |
| More skills | A larger harness is worse if it routes work to deleted or irrelevant artifacts |
| More commands in docs | Claimed automation is noise when the repo cannot run it |
| Future-phase plans | They hide the current hardening work that actually matters |

## Phase 0 scorecard
| Check | Pass condition |
|---|---|
| Runtime truth captured | Core docs match the code, scripts, and config |
| Broken references removed | Deleted docs and skills are no longer referenced |
| Schema truth recorded | `initDb.js`, preserved SQL files, and gaps are documented honestly |
| API truth recorded | Route methods, auth, and payload shapes match live controllers |
| UI truth recorded | Current surfaces, providers, and request patterns are documented accurately |
| Validation truth recorded | Available commands ran; unavailable checks are called out |
| Handoff quality | Another agent can tell what still blocks the template from Phase 0 completion |

## Current state, gap, recommended target
| Current state | Gap | Recommended target |
|---|---|---|
| Prior metrics focused on commerce slices | They measured the wrong work for this scaffold | Measure template hardening and handoff quality instead |
| Validation commands are asymmetric across frontend and backend | Docs previously implied broader coverage | Keep the scorecard tied to real available checks |
| The harness was larger than the truthful doc set | Routing drift wasted future effort | Keep the scorecard sensitive to deleted files and stale skill references |
