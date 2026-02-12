import { describe, expect, it } from "vitest";
import { runMigrations, validateMigrationChain } from "@/store/persistence/migrations";

describe("migrations", () => {
  it("runMigrations applies all migrations in order", () => {
    const input = {
      suppliers: [{ id: "1", name: "A" }],
      cashEntries: [{ type: "Cash Out", amount: 10 }],
    };

    const out = runMigrations(input, 1, 3) as { suppliers: Array<{ lots?: number }>; cashEntries: Array<{ amount: number }> };
    expect(out.suppliers[0].lots).toBe(0);
    expect(out.cashEntries[0].amount).toBe(-10);
  });

  it("throws on missing chain", () => {
    expect(() => validateMigrationChain(4)).toThrow();
  });
});
