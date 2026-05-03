# PRD

## Phase 0 product definition

### Why this template exists
- Provide a reusable workspace/account/admin baseline that teams can extend without starting auth, admin shells, and account plumbing from scratch.
- Keep the template truthful about what already exists before adding new domains.
- Make the Phase 0 hardening backlog explicit so maintainers can close drift methodically.

### Product goals
- Give scaffold adopters a runnable React and Express baseline with auth, roles, sessions, notifications, settings, and dashboard shells.
- Give maintainers a doc and harness set that matches real code, scripts, and validations.
- Keep future expansion optional instead of implying a product roadmap the runtime does not ship.

## Target users
| User | What they need | Current support |
|---|---|---|
| Scaffold adopter or product team | A reusable baseline for account and admin features | Supported by the current runtime and Phase 0 docs |
| Admin operator | One place to review users, roles, and events | Partial via the admin dashboard |
| Authenticated end user | Account visibility, notifications, device history, session history | Partial via the user dashboard |
| Template maintainer | Clear architecture, contract, and hardening priorities | Supported by the current doc set |

## Current implementation reality
- Implemented today:
  - auth
  - users
  - roles
  - notifications
  - events
  - devices
  - sessions
  - settings
  - public landing
  - user dashboard shell
  - admin dashboard shell
- Deferred or incomplete today:
  - hardened user write boundary
  - narrowed event ingestion surface
  - mobile dashboard navigation
  - stronger page-level error states

## Phase 0 scope

### In scope
- Current-runtime documentation and harness truthfulness
- Template governance and change routing
- Schema, bootstrap, and workflow alignment
- API contract truthfulness
- UI architecture truthfulness
- Small runtime fixes that remove obvious placeholder residue

### Out of scope
- New commerce, storefront, catalog, cart, checkout, order, payment, inventory, shipping, review, or CMS features
- Large runtime refactors
- Rewriting applied baseline migrations
- Treating sibling app code as the source of truth for this template

## Phase 0 user stories
- When I open this template as an adopter, I want the docs to describe the runtime that actually exists, so I can build on it without rediscovering the code.
- When I work in the admin dashboard, I want the current modules and gaps documented clearly, so I do not assume missing operations already exist.
- When I work in the user dashboard, I want auth, notifications, and security surfaces to be described truthfully, so UI work stays scoped.
- When I maintain the template, I want script, workflow, and schema behavior made explicit, so I can harden them without rewriting history.

## Phase 0 success criteria
- Top-level docs and current-reality docs all describe the same scaffold.
- The local skill and prompt-routing harness only references surviving files and relevant skills.
- Schema, API, UI, validation, and release docs stop claiming behavior that the code does not implement.
- Remaining gaps are documented as gaps, not implied features.
