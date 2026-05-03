# Prompt Recipes

## Required sections
- Task
- Read first
- Use skills
- Current repo truth to preserve
- Scope
- Out of scope
- Execution order
- Deliverables
- Validation
- Output style

## Universal prompt skeleton
```text
Task
- <state the requested outcome in one or two lines>

Read first
- AGENTS.md
- <minimal relevant docs>

Use skills
- <only the skills that materially help>

Current repo truth to preserve
- <current architecture, contract, or gap that matters to this task>

Scope
- <what to change>

Out of scope
- <what not to change>

Execution order
1. <read and confirm current truth>
2. <update docs first when required>
3. <implement the relevant surfaces>
4. <run validation>

Deliverables
- <changed behavior, docs, and any status summary expected>

Validation
- Run the repo's applicable lint, typecheck, tests, and build before done.

Output style
- Be concise.
- Use bullets, short sections, and compact tables.
```

## Conditional blocks
- Docs-only:
  - Require extraction order `code -> config -> migrations or bootstrap scripts -> existing docs`.
  - Say `document current reality, not idealized architecture.`
  - For inconsistencies, require `current state`, `gap`, and `recommended target`.
  - Say not to refactor large areas.
- Backend:
  - Call out schema, bootstrap, authz, and contract truth.
  - Require doc updates if schema or API behavior changes.
- Frontend:
  - Call out route boundaries, request states, responsive behavior, shared primitives, and current guidance files.
  - Add `brand/BRAND_CONSTRAINTS.md` when visual tone matters.
  - Require API contract alignment when UI depends on backend data.
- Template or harness cleanup:
  - Require removal of dead references to deleted files or skills.
  - Call out prompt-routing updates when docs or skills change.
  - Keep the work grounded in the current Phase 0 baseline.
- Full-stack:
  - Sequence `docs -> backend -> frontend -> validation`.
  - Keep the prompt explicit about which side owns each change.
- Review:
  - Say `review only.`
  - Require findings first, ordered by severity, with file references.
  - Mention residual risks or test gaps if no findings are present.

## Prompt-writing rules
- Do not tell the implementing agent to read every doc in the repo.
- Do not invent missing routes, tables, or UI screens in the prompt.
- Do not hide key repo gaps; name them when they affect scope.
- Prefer explicit deliverables over vague `make it better` language.
- Prefer one ready-to-run prompt over commentary about how to prompt.
