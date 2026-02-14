import { describe, expect, it } from "vitest";
import { canTransitionLaptopStatus, canTransitionLotStatus } from "@/domain/statusTransitions";

describe("status transition matrix", () => {
  it("allows expected laptop transitions", () => {
    expect(canTransitionLaptopStatus("Pending Verification", "Pending Grading")).toBe(true);
    expect(canTransitionLaptopStatus("In Processing", "Ready for Sale")).toBe(true);
    expect(canTransitionLaptopStatus("Ready for Sale", "Sold")).toBe(true);
  });

  it("blocks invalid laptop transitions", () => {
    expect(canTransitionLaptopStatus("Pending Verification", "Sold")).toBe(false);
    expect(canTransitionLaptopStatus("Sold", "Ready for Sale")).toBe(false);
  });

  it("allows expected lot transitions", () => {
    expect(canTransitionLotStatus("Pending", "Partially Verified")).toBe(true);
    expect(canTransitionLotStatus("Partially Verified", "Verified")).toBe(true);
    expect(canTransitionLotStatus("Fully Graded", "Completed")).toBe(true);
  });

  it("blocks invalid lot transitions", () => {
    expect(canTransitionLotStatus("Pending", "Completed")).toBe(false);
    expect(canTransitionLotStatus("Partially Verified", "Completed")).toBe(false);
  });
});
