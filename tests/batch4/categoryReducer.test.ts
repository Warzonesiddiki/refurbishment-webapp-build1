import { describe, expect, it } from "vitest";
import { categoryReducer, selectCategoryPath } from "@/store/reducers/categoryReducer";

describe("categoryReducer", () => {
  it("adds category", () => {
    const s = categoryReducer({ categories: [] }, { type: "ADD_CATEGORY", payload: { name: "Memory", sortOrder: 1 } });
    expect(s.categories).toHaveLength(1);
  });

  it("returns correct category path", () => {
    const root = { id: "1", name: "Parts", sortOrder: 1 };
    const child = { id: "2", name: "Memory", sortOrder: 1, parentId: "1" };
    expect(selectCategoryPath([root, child], "2").map((c) => c.id)).toEqual(["1", "2"]);
  });
});
