---
name: staging-deploy
description: Read and summarize staging deploy output after a branch push or PR update.
---

# Staging Deploy

## Purpose
Read staging deploy output and report the result for the touched surfaces only.

## Read first
- docs/STAGING_CHECKLIST.md
- docs/RELEASE_CHECKLIST.md
- docs/PR_TEMPLATE.md
- CHANGELOG.md

## Steps
1. Confirm the target branch or environment.
2. Identify the surfaces touched by the change.
3. Read the GitHub Actions and Railway output.
4. Extract deploy status and staging URL when available.
5. Apply the staging checklist to the touched surfaces only.
6. Summarize missing checks, blockers, and follow-ups.

## Rules
- Never assume env parity.
- Do not claim deploy success without deploy output.
- Use `not applicable` only with a clear reason.
- Keep the summary concise.
