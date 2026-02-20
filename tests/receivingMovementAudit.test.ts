import { describe, expect, it } from "vitest";
import { appReducer, createInitialState } from "@/store/appState";

describe("receiving movement audit metadata", () => {
  it("records receiving -> inventory movement with import job reference", () => {
    const state = createInitialState();
    const next = appReducer(state, {
      type: "ADD_LAPTOP",
      payload: {
        barcode: "ALM-LP-AUDIT-001",
        brand: "Dell",
        model: "Latitude",
        specs: "16GB DDR4 / 512GB NVMe / iGPU",
        grade: "B",
        status: "Pending Verification",
        track: "-",
        cost: 450,
        date: "2026-02-20",
        lot: "ALM-LOT-202602-01",
        importMeta: { importJobId: "JOB-20260220-00001" },
      },
    });

    const movement = next.movementLog[0];
    expect(movement.ref).toBe("ALM-LP-AUDIT-001");
    expect(movement.from).toBe("RECEIVING:ALM-LOT-202602-01");
    expect(movement.to).toBe("INVENTORY");
    expect(movement.qty).toBe(1);
    expect(movement.note).toContain("importJob=JOB-20260220-00001");
  });
});
