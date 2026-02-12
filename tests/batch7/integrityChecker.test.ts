import { describe, expect, it } from "vitest";
import { createInitialState } from "@/store/appState";
import { computeChecksum, runIntegrityCheck, verifyChecksum } from "@/utils/integrityChecker";

describe("integrity checker", () => {
  it("checksum deterministic and tamper detectable", async () => {
    const data = { a: 1, b: [2] };
    const c1 = await computeChecksum(data);
    const c2 = await computeChecksum(data);
    expect(c1).toBe(c2);
    expect(await verifyChecksum({ ...data, a: 2 }, c1)).toBe(false);
  });

  it("runs integrity checks", async () => {
    const report = await runIntegrityCheck(createInitialState());
    expect(report.totalRecords).toBeGreaterThan(0);
  });
});
