# Project V4 — Next-Level Roadmap

## Vision

Build **Refurbishment WebApp V4** as a secure, observable, AI-assisted, enterprise-ready platform that supports multi-site operations, offline-first workflows, and high-confidence audits for every business event.

## Strategic Goals

1. **Platform-grade security** (Zero Trust, strong auth, secure-by-default infrastructure).
2. **Operational excellence** (SLOs, deep observability, automated incident response).
3. **Scale and resilience** (modular services, queue-driven workflows, safe deployments).
4. **Product intelligence** (forecasting, anomaly detection, workflow recommendations).
5. **Developer velocity** (golden paths, policy automation, fast CI/CD).

## Architecture (Target State)

- **Frontend**: Vite + React with feature modules, design system tokens, and RUM telemetry.
- **API Gateway/BFF**: single ingress for auth, rate-limits, request shaping.
- **Domain services**:
  - Auth & Identity
  - Inventory & Refurbishment Workflow
  - Sales & Fulfillment
  - Reporting & Analytics
  - Notification/Automation
- **Data layer**:
  - PostgreSQL (OLTP)
  - Redis (cache/session/rate limiting)
  - Object storage for snapshots and exports
  - Event stream (Kafka/NATS) for async integration and audit pipeline
- **Ops**: containerized workloads, IaC, progressive delivery, and SLO-driven monitoring.

## V4 Capability Pillars

### 1) Security & Compliance

- Migrate from ad-hoc auth flows to **JWT + refresh token rotation** with device/session controls.
- Add optional **MFA** (TOTP and recovery codes).
- Enforce **role and policy-based access control** (RBAC + ABAC attributes).
- Add **secrets management** and key rotation policy.
- Encrypt sensitive fields at rest; TLS everywhere.
- Implement immutable **audit trail** for privileged actions.

### 2) Reliability & Performance

- Define SLOs (availability, latency, error budget).
- Introduce **OpenTelemetry** tracing across frontend/API/services.
- Add circuit breakers, timeouts, retries, and idempotency keys.
- Build synthetic checks and canary health probes.
- Optimize hot paths with caching and read models.

### 3) Product Experience

- Offline-first scanner/sales flows (queued local actions + conflict resolution).
- Advanced global search (assets, customers, transactions, states).
- Configurable workflow engine for refurbishment stages.
- Multi-language and accessibility AA compliance.

### 4) Data & AI

- Standardize event schemas and data contracts.
- Build a warehouse sync for business intelligence.
- Add ML features:
  - demand forecasting
  - margin/risk anomaly detection
  - next-best-action recommendations
- Human-in-the-loop controls for high-impact predictions.

### 5) Engineering Excellence

- Monorepo quality gates: lint, typecheck, tests, security scans, license checks.
- Contract tests between frontend and services.
- Ephemeral preview environments per PR.
- Architecture decision records (ADR) and ownership map.

## Delivery Plan

### Phase 1 (0–6 weeks): Foundation Hardening

- Finalize secure auth model and migration plan.
- Add centralized config validation and secrets handling.
- Establish observability baseline (logs/metrics/traces).
- Restore and enforce commit hooks + CI policy checks.

### Phase 2 (6–12 weeks): Modularization & Data Backbone

- Extract domain boundaries behind service interfaces.
- Introduce event bus and async processors.
- Add Redis-backed distributed rate limiting/session controls.
- Launch reporting pipeline with curated metrics.

### Phase 3 (12–20 weeks): AI-Enabled Operations

- Ship forecasting and anomaly alerts.
- Add workflow assistant for operators.
- Build executive KPI cockpit with drill-downs.

### Phase 4 (20+ weeks): Enterprise Expansion

- Multi-tenant capability and regional deployment model.
- Compliance package (SOC2 readiness controls, evidence automation).
- Marketplace/integration SDK for partners.

## KPIs (V4 Success Metrics)

- 99.95% monthly API availability.
- p95 API latency < 250ms on core read endpoints.
- 80% reduction in auth-related incident rate.
- < 15 minute MTTD and < 60 minute MTTR for P1 incidents.
- 2x developer deployment frequency with no increase in change-failure rate.

## Immediate Backlog (Actionable Next 10)

1. Add auth integration tests for PBKDF2 + legacy hash verification paths.
2. Add proxy-trust config toggle and tests for spoofed forwarding headers.
3. Introduce centralized error model and response envelope standard.
4. Add OpenTelemetry SDK wiring for API and frontend.
5. Add Redis adapter for sessions/rate limits.
6. Define event contracts for login, state mutation, and inventory transitions.
7. Add CI security scans (SAST + dependency audit + secret scanning).
8. Build a canary deployment workflow.
9. Add dashboard for login abuse and lockout patterns.
10. Publish ADR-001..003 for auth, domain boundaries, and observability.
