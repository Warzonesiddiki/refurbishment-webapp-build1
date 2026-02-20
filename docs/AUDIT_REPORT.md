## AUDIT SUMMARY — Tahir ERP

### Scope

Comprehensive audit executed across structure/configuration, frontend, Java server, testing, DevOps, and runtime stability.

### Statistics

- Total findings: 34
- Bugs fixed: 7
- Gaps identified: 12
- Tweaks applied: 6
- Optimizations applied: 2
- Architecture recommendations: 7

### Critical Issues (fix immediately)

| #   | Type   | File(s)                                      | Description                                                                                   | Status                                   |
| --- | ------ | -------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------- |
| 1   | 🐛 BUG | `tools/dev_with_java.mjs`                    | Launcher could start frontend before Java health, causing login/API failures on startup race. | ✅ Fixed                                 |
| 2   | 🐛 BUG | `tools/dev_with_java.mjs`                    | Synchronous spawn failures could crash launcher or leave partial startup state.               | ✅ Fixed                                 |
| 3   | 🐛 BUG | `java_server/src/com/tahir/server/Main.java` | Weak password hashing (SHA-256 only) susceptible to offline cracking risk.                    | ✅ Fixed (PBKDF2 + legacy compatibility) |
| 4   | 🐛 BUG | `java_server/src/com/tahir/server/Main.java` | Login rate-limit principal used full remote socket (port churn weakens lockout consistency).  | ✅ Fixed                                 |
| 5   | 🐛 BUG | `src/store/persistence.ts`                   | localStorage access exceptions could break app startup in restricted browsers.                | ✅ Fixed                                 |

### High Priority (fix this sprint)

| #   | Type            | File(s)                                                   | Description                                                                                            | Status        |
| --- | --------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------- |
| 6   | ⚠️ GAP          | `src/utils/javaAuth.ts`, `src/utils/sharedStateClient.ts` | No runtime schema validation for JSON API responses before use.                                        | 🔍 Identified |
| 7   | ⚠️ GAP          | `java_server/src/com/tahir/server/Main.java`              | In-memory sessions only; no shared session store for horizontal scaling.                               | 🔍 Identified |
| 8   | ⚠️ GAP          | `vite.config.ts`                                          | No explicit production-only proxy guard/documented behavior for deployment mismatch cases.             | 🔍 Identified |
| 9   | ⚠️ GAP          | `tests/`                                                  | E2E coverage for full login→workflow→logout with backend failure simulation is incomplete.             | 🔍 Identified |
| 10  | 🔧 TWEAK        | `package.json`                                            | Default dev flow now auto-starts Java, but explicit frontend-only scripts required for edge workflows. | ✅ Applied    |
| 11  | 🚀 OPTIMIZATION | `tools/dev_with_java.mjs`                                 | Fail-fast npm/python/tool checks improve startup diagnostics and reduce wasted boot cycles.            | ✅ Applied    |

### Medium Priority (plan for next sprint)

| #   | Type            | File(s)                       | Description                                                                                        | Status               |
| --- | --------------- | ----------------------------- | -------------------------------------------------------------------------------------------------- | -------------------- |
| 12  | ⚠️ GAP          | `src/components/pages/*`      | Several large page components exceed maintainability-friendly size; decomposition opportunity.     | 🔍 Identified        |
| 13  | ⚠️ GAP          | `src/store`                   | Global state not normalized for all domains; potential duplication in future scaling.              | 🔍 Identified        |
| 14  | ⚠️ GAP          | `docs/`                       | Some docs overlap and can drift; central index improved but governance process missing.            | 🔍 Identified        |
| 15  | 🔧 TWEAK        | `tools/local_launcher_gui.py` | DB compose actions should remain strictly service-scoped to avoid local port conflicts.            | ✅ Applied           |
| 16  | 🚀 OPTIMIZATION | `Dockerfile`                  | Build uses resilient npm flags and caching order improvements; non-root runtime still recommended. | 🔧 Partially applied |

### Low Priority (backlog)

| #   | Type   | File(s)                              | Description                                                                               | Status        |
| --- | ------ | ------------------------------------ | ----------------------------------------------------------------------------------------- | ------------- |
| 17  | ⚠️ GAP | `.husky/*`                           | Hook behavior modernized; still dependent on local npm execution environment consistency. | ✅ Improved   |
| 18  | ⚠️ GAP | `docs/PROJECT_DOCUMENTATION_FULL.md` | Add sequence diagrams and ERD-linked auth flow visuals.                                   | 🔍 Identified |
| 19  | ⚠️ GAP | `tests/`                             | Add broader boundary tests for malformed backup/state payload edge cases.                 | 🔍 Identified |

### Architecture Recommendations (requires discussion)

| #   | Current                                | Proposed                                                 | Effort | Impact |
| --- | -------------------------------------- | -------------------------------------------------------- | ------ | ------ |
| 1   | Raw fetch + ad-hoc state sync          | TanStack Query for API/cache/retry/error normalization   | Medium | High   |
| 2   | Monolithic Java HTTP server file       | Javalin/Spring modular handlers + service layers         | High   | High   |
| 3   | localStorage-first offline persistence | IndexedDB + service worker queue/replay                  | High   | High   |
| 4   | In-memory session tokens               | JWT access + refresh token strategy (+ revocation store) | Medium | High   |
| 5   | App-level reducer/context              | Zustand or Redux Toolkit slices by domain                | Medium | Medium |
| 6   | File snapshot as primary shared state  | Postgres-backed authoritative persistence                | High   | High   |
| 7   | Broad component pages                  | Feature package decomposition + shared UI module         | Medium | Medium |

---

## Phase Findings (Condensed)

### PHASE 1 — Structure & Config

- 🐛 BUG fixed: default startup mismatch (frontend launched without Java in common workflows) by making `dev`/`dev:lan` Java-backed and preserving `dev:web`/`dev:lan:web` escape hatches.
- 🔧 TWEAK applied: added full handbook link in README for discoverability.
- ⚠️ GAP: no strict dependency drift gate in CI to prevent repeated local lockfile churn.

### PHASE 2 — Frontend

- 🐛 BUG fixed: persistence layer now guards localStorage read/write exceptions.
- ⚠️ GAP: no runtime schema checks on API payloads; TypeScript compile-time types alone are not runtime protection.
- ⚠️ GAP: some pages/components are large and can be split for clearer ownership.

### PHASE 3 — Java API

- 🐛 BUG fixed: migrated new password hashing to PBKDF2-HMAC-SHA256 with legacy SHA-256 verification fallback.
- 🐛 BUG fixed: rate-limit identity normalized to client IP to avoid source-port churn bypass behavior.
- ⚠️ GAP: sessions are process-local; scaling requires distributed session/token model.
- ⚠️ GAP: list endpoints have limited pagination patterns.

### PHASE 4 — Testing

- 🔧 TWEAK applied: regression coverage for storage exception path exists and remains green.
- ⚠️ GAP: E2E negative-path coverage (network partitions / server restart mid-session) can be expanded.

### PHASE 5 — DevOps

- 🔧 TWEAK applied: launcher service scoping avoids Docker/local process collision.
- ⚠️ GAP: runtime container non-root enforcement and image hardening can be improved further.

### PHASE 6 — Performance & Bundle

- 🚀 OPTIMIZATION applied: fail-fast launcher checks reduce wasted startup time and unclear retries.
- ⚠️ GAP: formal bundle analyzer report and chunk policy thresholds are not currently enforced in CI.

### PHASE 7 — Better Approaches (plans)

#### A) API Layer — fetch → TanStack Query (Recommended)

- Why better: built-in caching, retries, stale control, deduping, background refetch, standardized loading/error states.
- Effort: Medium
- Risk: Low/Medium (migration breadth)
- Plan:
  1. Introduce QueryClient provider.
  2. Wrap auth and shared-state endpoints in typed query/mutation hooks.
  3. Replace ad-hoc polling hooks with query invalidation and refetch intervals.
  4. Gradually migrate page by page.

Code sample:

```tsx
const useCurrentUser = () =>
  useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchCurrentUser,
    retry: 1,
    staleTime: 30_000,
  });
```

#### B) Java server modularization

- Why better: reduces single-file operational risk and improves testability.
- Effort: High
- Risk: Medium
- Plan: extract auth, state, security, and transport modules; keep endpoint contract unchanged.

#### C) Auth model evolution

- Why better: JWT + refresh enables stateless scaling and better distributed deployments.
- Effort: Medium
- Risk: Medium
- Plan: dual-mode token verification during migration, then deprecate in-memory session map.

#### D) Persistence evolution

- Why better: Postgres authoritative writes prevent divergence and simplify multi-user consistency.
- Effort: High
- Risk: Medium/High
- Plan: begin with auth/session + snapshot table, then move core workflow entities incrementally.

---

## Applied Fixes (this audit cycle)

1. **Java password hashing hardening** (`pbkdf2$...` format for new hashes, SHA-256 fallback verify for legacy users).
   - Inline comment added in code to explain compatibility path.
2. **Rate-limit identity hardening** (`email|client-ip` instead of socket+port).
   - Inline comment added in login flow.
3. **Launcher startup resilience**
   - Java health-gated startup before frontend.
   - Spawn failure guards and clear diagnostics.
   - npm availability fail-fast.
4. **Default dev auto-start behavior**
   - `npm run dev` and `npm run dev:lan` auto-start Java+frontend.
   - `dev:web` and `dev:lan:web` preserved for frontend-only.
5. **Documentation expansion and discoverability**
   - Added complete handbook and README link.

---

## Files Modified

- `java_server/src/com/tahir/server/Main.java` — strengthened password hashing and rate-limit identity handling.
- `tools/dev_with_java.mjs` — startup resilience, health gating, fail-fast checks, process lifecycle stability.
- `package.json` — default dev scripts auto-start Java, added frontend-only alternatives.
- `README.md` — updated startup and documentation references.
- `docs/PROJECT_DOCUMENTATION_FULL.md` — comprehensive project handbook.
- `src/store/persistence.ts` — guarded localStorage read/write errors.
- `tests/storePersistence.test.ts` — regression test for storage exception path.

---

## Notes

- Public Java API contracts were preserved.
- Backward compatibility maintained (legacy password hashes remain valid).
- Additional architecture migrations are intentionally not auto-applied pending human review.
