# Release Checklist

## Scope gate
- change scope is explicit
- touched runtime or harness area is identified
- `current state`, `gap`, and `recommended target` are recorded when sources disagreed

## Docs and drift
- touched docs match the current code, config, and schema evidence
- deleted docs or skills are no longer referenced
- repo consistency audit completed for the touched area
- `CHANGELOG.md` updated when the meaning or use of the template changed materially

## Schema and workflow truth
- schema-affecting changes updated the executable bootstrap source or documented why not
- preserved SQL drift is called out explicitly when it remains
- workflow or CI docs only reference commands that exist

## Validation
- backend tests run when backend is in scope
- frontend lint runs when frontend is in scope
- frontend typecheck runs when frontend is in scope
- frontend tests run when frontend is in scope
- frontend build runs when frontend is in scope
- unavailable backend lint, typecheck, or build scripts are reported explicitly

## PR and staging follow-through
- PR notes prepared when publishing is in scope
- staging checks only claimed when staging work was actually performed
- missing deploy evidence is reported as missing, not implied
