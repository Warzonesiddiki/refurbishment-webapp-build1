# TESTING.md

## Scope
Unit, integration, and E2E coverage for Inventory, Receiving, Processing/WIP, Sales, Purchases, Finance, and Settings. All create flows must log movement/audit and honor idempotency keys.

## Layers
- **Unit**: VAT math, stock invariants, sequence validation, idempotency, logging hooks, UI feedback.
- **Integration (jsdom, mocked services)**:
  - Inventory flow: create laptop/part, validate sequence + stock rules.
  - WIP flow: create WIP, move stage, add/remove parts (stock math), labor totals.
  - Sales flow: compute totals/profit, generate invoice/receipt ids (patterns).
  - Purchase flow: VAT totals, payment application, cash-out link.
- **E2E (happy-path scaffolds)**:
  - Import lot wizard (upload→map→preview→commit)
  - Verification complete
  - Grading save
  - WIP move stage

## Running tests
```bash
npm run test        # vitest
npm run test -- --runInBand
```

## Data/Idempotency
- Idempotency keys required on create; tests assert duplicate keys return same record.
- Sequences validated against patterns for laptop/part/lot/wip/invoice/purchase/receipt/payment.

## Coverage
- Critical math/validation: near-100% statements/branches for VAT + stock + sequence validators.
- Hook wiring: smoke assertions for UI buttons invoking logging/idempotency.

## CI Notes
- jsdom environment; no external network.
- E2E scaffolds rely on mock services and in-memory state.
