import { describe, expect, it } from "vitest";
import { checkCompatibility, getCurrentVersion, getMigrationPath, runMigrations, validateMigrationChain } from "@/utils/backup/schemaVersion";

describe("schema versioning", () => {
  it("returns current version and migration path", () => {
    expect(getCurrentVersion()).toBe(5);
    expect(getMigrationPath(1, 5)).toEqual([2, 3, 4, 5]);
    expect(validateMigrationChain()).toBe(true);
  });

  it("checks compatibility", () => {
    expect(checkCompatibility(5).compatible).toBe(true);
    expect(checkCompatibility(6).compatible).toBe(false);
  });

  it("runs migrations", () => {
    const out = runMigrations({ x: 1 }, 1, 5);
    expect(out.applied).toEqual([2,3,4,5]);
  });
});
