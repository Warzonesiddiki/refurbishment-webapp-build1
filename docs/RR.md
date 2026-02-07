# Risk Register (RR) v1.1

1) UI coverage risk: pages may miss roadmap sections. Mitigation: gap analysis per phase.
2) Accounting correctness risk: VAT calculations inconsistent. Mitigation: unit tests + cross-report reconciliation checks.
3) Stock integrity risk: WIP part consumption concurrency. Mitigation: transactional updates + constraints.
4) Idempotency risk: duplicate creates on retry. Mitigation: idempotency keys + unique constraints + tested stubs.
5) Auditability risk: missing movement/audit logs. Mitigation: log middleware + required logging in API layer + tested stubs.
