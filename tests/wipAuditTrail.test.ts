import { describe, expect, it } from "vitest";
import { appReducer, createInitialState } from "@/store/appState";

describe("WIP movement audit trail", () => {
  it("logs reserve movement and audit when adding part to WIP", () => {
    const state = createInitialState();
    const wip = state.wipJobs[0];
    const part = state.parts.find((p) => p.onHand > 0);
    expect(wip).toBeTruthy();
    expect(part).toBeTruthy();
    if (!wip || !part) return;

    const next = appReducer(state, { type: "WIP_ADD_PART", wipId: wip.id, partBarcode: part.barcode });

    expect(next.movementLog[0].entityType).toBe("part");
    expect(next.movementLog[0].action).toBe("reserve");
    expect(next.movementLog[0].note).toContain(wip.wip);

    expect(next.auditLog[0].entityType).toBe("wip");
    expect(next.auditLog[0].action).toBe("add_part");
  });
});
