import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");

function read(file: string) {
  return fs.readFileSync(path.join(repoRoot, file), "utf8");
}

describe("database migration contract", () => {
  it("defines all core tables in 0001_init.sql", () => {
    const sql = read("db/migrations/0001_init.sql");

    const requiredTables = [
      "companies",
      "users",
      "roles",
      "permissions",
      "role_permissions",
      "user_roles",
      "suppliers",
      "lots",
      "laptops",
      "parts",
      "wip_jobs",
      "wip_parts",
      "wip_labor",
      "wip_history",
      "sales",
      "sale_items",
      "receipts",
      "purchases",
      "payments",
      "cash_register_entries",
      "owner_ledger_entries",
      "movement_log",
      "audit_log",
      "idempotency_keys",
      "sequences",
    ];

    for (const table of requiredTables) {
      expect(sql).toContain(`CREATE TABLE ${table}`);
    }
  });

  it("enables RLS for tenant-scoped tables in 0002_rls.sql", () => {
    const sql = read("db/migrations/0002_rls.sql");
    expect(sql).toContain("CREATE OR REPLACE FUNCTION app_current_company_id()");

    const protectedTables = [
      "users",
      "suppliers",
      "lots",
      "laptops",
      "parts",
      "wip_jobs",
      "sales",
      "purchases",
      "payments",
      "idempotency_keys",
      "sequences",
    ];

    for (const table of protectedTables) {
      expect(sql).toContain(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);
      expect(sql).toContain(`CREATE POLICY ${table}_tenant_policy ON ${table}`);
    }
  });

  it("provides concurrency and idempotency helpers in 0003_integrity_functions.sql", () => {
    const sql = read("db/migrations/0003_integrity_functions.sql");

    const requiredFunctions = [
      "touch_updated_at",
      "next_sequence_value",
      "reserve_part_stock",
      "consume_reserved_part_stock",
      "release_part_stock",
      "claim_idempotency_key",
      "cleanup_expired_idempotency_keys",
    ];

    for (const fn of requiredFunctions) {
      expect(sql).toContain(`FUNCTION ${fn}`);
    }

    expect(sql).toContain("FOR UPDATE");
    expect(sql).toContain("EXCEPTION WHEN unique_violation");
  });
});
