# Staging Checklist

## How to use
- Apply this checklist only to the surfaces touched by the current change.
- Mark each item as `pass`, `fail`, or `not applicable`.
- If a check is `not applicable`, record a short reason in the deploy summary.

## Core checks
- app boots
- touched auth flows still work
- touched API routes respond as expected
- required env vars for touched surfaces are present
- required schema or bootstrap steps were run, or their absence is called out explicitly

## Surface checks
- public landing touched by the change works
- user dashboard surfaces touched by the change work
- admin dashboard surfaces touched by the change work
- notification, event, device, session, or settings surfaces touched by the change work

## Deploy summary minimums
- staging URL or unavailable note
- deploy status
- checks run
- `not applicable` checks with reasons
- blockers or follow-ups
