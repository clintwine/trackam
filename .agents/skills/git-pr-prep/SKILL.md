---
name: "git-pr-prep"
description: "Prepare repository changes for pull request review."
---

# Git PR Prep

## Purpose
Prepare changes for review.

## Output
- branch name
- commit grouping suggestion
- PR title
- PR body
- changelog status
- changelog release-evidence follow-up
- migration notes
- test/check summary
- follow-up list

## Rules
- concise
- reflect actual changes only
- if PR and deploy results are not yet known, include the pending changelog release-evidence backfill note instead of pretending it is complete
- include staging notes if relevant
