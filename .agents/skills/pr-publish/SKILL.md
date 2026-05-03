---
name: pr-publish
description: Use when the diff is already complete and validated and you need to push the branch and open or update a GitHub PR.
---

# PR Publish

## Read first
- AGENTS.md
- docs/PR_TEMPLATE.md
- docs/RELEASE_CHECKLIST.md
- docs/STAGING_CHECKLIST.md
- CHANGELOG.md

## Preconditions
- implementation is complete
- validation status is available
- the current diff is the intended PR scope
- `docs/RELEASE_CHECKLIST.md` is complete or blockers are explicit

## Workflow
1. Confirm the current branch is the intended feature branch.
2. If PR notes are missing, use `git-pr-prep` to draft the title and body from the real diff.
3. Ensure the PR body captures:
   - current state
   - recommended target
   - touched docs and contracts
   - schema or bootstrap notes
   - validation summary
   - remaining gaps or follow-ups
   - staging scope when relevant
4. Commit the scoped changes if needed.
5. Push the branch.
6. Open or update the PR with `gh pr create` or `gh pr edit`.
7. Record the published PR URL and state.

## Rules
- Do not implement feature work here.
- Do not claim deploy results here.
- Keep the PR body tied to the real diff only.
