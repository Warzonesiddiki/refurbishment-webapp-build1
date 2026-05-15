import { describe, expect, it } from "vitest";
import { createInitialState } from "@/store/appState";
import { selectMTDProfitSummary, selectVATLiability } from "@/store/selectors/financeSelectors";

describe("finance selectors", () => {
  it("compute summaries", () => {
    const state = createInitialState();
    const mtd = selectMTDProfitSummary(state);
    expect(mtd).toHaveProperty("revenue");
    expect(typeof selectVATLiability(state, new Date())).toBe("number");
  });
});
