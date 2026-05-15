# NEXT GEN V3 Gateway Execution Slice

## What this increment delivers
This execution slice implements a concrete **Command/Query API scaffold** for the v3 architecture plan and validates it with end-to-end in-memory tests.

### Delivered components
- **Versioned API contracts** (`src/v3/api/contracts.ts`)
  - Command request/response envelopes
  - Journal query request/response envelopes
  - Explicit auth + tenant routing fields
- **In-memory gateway** (`src/v3/api/gateway.ts`)
  - Tenant/auth validation
  - Command dispatch into v3 command bus
  - Event append via registered handlers
  - Query-time projection + scope/window filtering + result limiting
  - Snapshot return on query for replay parity checks

## Architectural impact
This closes a major gap between domain primitives and service topology by introducing a concrete boundary layer where:
- UI and adapters can submit intent via stable contracts.
- Tenant routing and auth checks are centralized.
- Read models are returned with deterministic projection metadata.

## Why this is transformative
- Enables future server deployment without changing client intent shape.
- Creates a seam for policy enforcement, rate limiting, and observability.
- Establishes testable command/query semantics before full microservice extraction.

## Next follow-up
1. Replace in-memory auth with signed session claims and role scopes.
2. Add projection worker queue and snapshot persistence.
3. Add drift dashboard comparing dual-write legacy vs v3 projections.
