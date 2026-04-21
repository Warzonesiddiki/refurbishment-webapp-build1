# Audit Round 2 (UI/UX + Stability)

Date: 2026-04-21

## Scope
- UX/error handling polish on high-risk paths.
- Restore/import safety and user feedback clarity.
- Actionability review of error screens.

## Findings

### 1) Restore UX allowed stale messages and large file uploads (High)
- Previous behavior:
  - Prior restore message remained visible during subsequent attempts.
  - No file-size boundary before reading/processing uploaded backup files.
- Risk:
  - Confusing operator feedback in live environments.
  - Potential browser performance issues with oversized file reads.
- Fix implemented:
  - Clear prior `restoreMessage` when opening the file picker.
  - Enforce a 5MB restore file-size limit with explicit error message.

### 2) Error screen reload action was a visual no-op (High)
- Previous behavior:
  - Reload button had no handler, so recovery affordance was misleading.
- Risk:
  - Operators stuck after hard failures without a working in-UI recovery action.
- Fix implemented:
  - Connected reload CTA to `window.location.reload()`.

## Remaining high-priority backlog
1. Add app-level Error Boundary around top-level layout routes.
2. Add reducer-level transition guards for all critical status changes.
3. Add restore/import telemetry events (success/failure reasons).
4. Add oversized/wrong-version restore test cases.
5. Add critical-flow user journey tests focused on outcomes, not element presence.

## Recommended next sprint (stability)
- Week 1: Error Boundary + transition guard + restore telemetry.
- Week 2: negative-path integration tests + invariant checks + reporting consistency tests.

