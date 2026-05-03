# Decisions

| Topic | Current choice | Why it exists today | Notes |
|---|---|---|---|
| Product identity | Generic workspace/account/admin scaffold | Matches the current runtime | Phase 0 hardening baseline |
| Frontend routing | Separate public, auth, user, and admin trees | Clear shell and auth boundaries | No storefront tree |
| Backend module shape | Controller, service, repository split | Keeps raw SQL code organized | Used across all live modules |
| Data access | Shared `query()` helper with raw SQL | Low abstraction overhead | No ORM |
| Auth transport | Session cookie plus bearer fallback | Local-first auth with simple protected-route support | Login still returns `idToken` |
| RBAC model | `users.roles` plus `roles.permissions` | Simple admin and self gating | `users.roles` is an array of role ids; no DB FK |
| Response model | Raw JSON success payloads and `{ message }`-style errors | That is what current controllers and error handler emit | No uniform success envelope today |
| User mutation surface | Shared `PUT /api/users/:id` route for self or admin | Simple broad upsert path was easier to ship initially | High-risk gap; not the desired hardened end state |
| Notification mark-read | Authenticated route with ownership-scoped repository update | Minimal feed support with a safe write boundary | Response is still minimal |
| Event model | Public `GET` and `POST` event endpoints | Lightweight operational log | Public write surface is still a hardening gap |
| Settings model | One global settings row | Keeps config simple in Phase 0 | Public read only |
| Schema path | `db:migrate` is the primary schema path; `db:init` delegates to it | Aligns local, CI, and preserved SQL behavior | Historical baseline SQL remains append-only |
| Frontend guidance location | `frontend/docs/DESIGN_SYSTEM.md`, `frontend/docs/MOBBIN_DESIGN_WORKFLOW.md`, and `frontend/intelligence.md` | Keeps reusable guidance in repo-true paths | Route inventory still belongs in `docs/UI_ARCHITECTURE.md` |
| Brand baseline | Generic workspace baseline derived from current UI | Matches the current dashboard-heavy template | No retail reference is active |

## Gaps and recommended targets
| Current state | Gap | Recommended target |
|---|---|---|
| `PUT /api/users/:id` is shared by self and admin | Self-service write surface is broader than a hardened baseline should allow | Split or narrow user writes in a later hardening cut |
| Event create remains public | Operational ingestion is under-protected | Move to authenticated or signed ingestion |
| `AuthProvider` and route loaders both fetch auth state | Boot-time requests are duplicated | Consolidate bootstrap ownership later |
| Backend lint, typecheck, and build scripts are missing | Validation proof is uneven across layers | Add those scripts when the template runtime is ready to enforce them |

## Open questions
- Should user profile writes stay on one route at all, or split into self-safe and admin-safe surfaces?
- Should event ingestion remain public in this template?
- When mobile nav work lands, should user and admin share one pattern or diverge by density?
