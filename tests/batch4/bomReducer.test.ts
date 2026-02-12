import { describe, expect, it } from "vitest";
import { bomReducer } from "@/store/reducers/bomReducer";

describe("bomReducer", () => {
  it("adds and applies template", () => {
    let s = bomReducer({ templates: [], applied: [] }, {
      type: "ADD_BOM_TEMPLATE",
      payload: { name: "Dell 5420", items: [{ id: "i1", partId: "p1", quantity: 1, isOptional: false, alternatePartIds: [] }], isDefault: false, isActive: true },
    });
    s = bomReducer(s, { type: "APPLY_BOM_TO_WIP", payload: { wipId: "w1", templateId: s.templates[0].id } });
    expect(s.applied[0].wipId).toBe("w1");
  });
});
