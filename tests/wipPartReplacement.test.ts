import { describe, expect, it } from "vitest";
import { appReducer, createInitialState } from "@/store/appState";

describe("WIP_REPLACE_PART", () => {
  it("allocates installed part and creates harvested part inventory record", () => {
    let state = createInitialState();
    const wip = state.wipJobs[0];
    const installed = state.parts.find((p) => p.available > 0)!;
    const beforeReserved = installed.reserved ?? 0;
    const beforePartsCount = state.parts.length;

    state = appReducer(state, {
      type: "WIP_REPLACE_PART",
      wipId: wip.id,
      installedPartBarcode: installed.barcode,
      removedPart: {
        component: "RAM",
        name: "8GB DDR4 SODIMM",
        category: "Memory",
        spec: "8GB DDR4 2666",
        condition: "Used",
        estimatedValue: 12,
        removedSerial: "RM-OLD-001",
        destination: "Scrap Bin",
      },
      technician: "Tech Replace",
    });

    const installedAfter = state.parts.find((p) => p.id === installed.id)!;
    expect((installedAfter.reserved ?? 0) - beforeReserved).toBe(1);

    expect(state.parts.length).toBe(beforePartsCount + 1);
    const harvested = state.parts.find((p) => p.name.includes("8GB DDR4 SODIMM (Harvested)"));
    expect(harvested).toBeTruthy();
    expect(harvested?.onHand).toBe(1);
    expect(harvested?.available).toBe(1);
    expect(harvested?.importMeta?.removedSerial).toBe("RM-OLD-001");
    expect(harvested?.location).toBe("Scrap Bin");

    const wipAfter = state.wipJobs.find((x) => x.id === wip.id)!;
    expect(wipAfter.parts.some((p) => p.barcode === installed.barcode)).toBe(true);
    const replacedPart = wipAfter.parts[wipAfter.parts.length - 1];
    expect(replacedPart?.barcode).toBe(installed.barcode);
    expect(replacedPart?.cost).toBe(Math.max(0, installed.cost - 12));
    expect(wipAfter.history.some((h) => h.action.includes("Part replaced") && h.action.includes("Scrap Bin"))).toBe(true);

    expect(state.movementLog.some((m) => m.action === "harvest_in" && m.ref === harvested?.barcode)).toBe(true);
    expect(state.auditLog.some((a) => a.action === "replace_part" && a.entityId === wip.id)).toBe(true);
    expect(
      state.auditLog.some((a) => a.action === "harvest_in" && a.payload?.destination === "Scrap Bin" && a.payload?.removedSerial === "RM-OLD-001")
    ).toBe(true);
  });

  it("is atomic when installed part has no available stock", () => {
    let state = createInitialState();
    const wip = state.wipJobs[0];
    const blocked = state.parts.find((p) => p.available <= 0) ?? state.parts[0];

    state = {
      ...state,
      parts: state.parts.map((p) =>
        p.id === blocked.id
          ? {
              ...p,
              available: 0,
              reserved: p.onHand,
            }
          : p
      ),
    };

    const before = state;
    const next = appReducer(state, {
      type: "WIP_REPLACE_PART",
      wipId: wip.id,
      installedPartBarcode: blocked.barcode,
      removedPart: {
        component: "SSD",
        name: "256GB SATA SSD",
      },
    });

    expect(next.parts.length).toBe(before.parts.length);
    expect(next.wipJobs.find((x) => x.id === wip.id)?.parts.length).toBe(before.wipJobs.find((x) => x.id === wip.id)?.parts.length);
    expect(next.alerts[0]?.title).toBe("Out of stock");
  });
  it("defaults harvested part metadata when optional fields are omitted", () => {
    let state = createInitialState();
    const wip = state.wipJobs[0];
    const installed = state.parts.find((p) => p.available > 0)!;

    state = appReducer(state, {
      type: "WIP_REPLACE_PART",
      wipId: wip.id,
      installedPartBarcode: installed.barcode,
      removedPart: {
        component: "SSD",
        name: "256GB SATA SSD",
      },
    });

    const harvested = state.parts.find((p) => p.name.includes("256GB SATA SSD (Harvested)"));
    expect(harvested?.condition).toBe("Refurbished");
    expect(harvested?.spec).toContain(wip.wip);
  });

});
