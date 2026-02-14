export type LaptopLifecycleStatus =
  | "Pending Verification"
  | "Pending Grading"
  | "In Processing"
  | "Ready for Sale"
  | "Sold"
  | "Returned"
  | "On Hold"
  | "Scrapped"
  | "Missing"
  | "Disposed";

export type LotLifecycleStatus =
  | "Pending"
  | "Partially Verified"
  | "Verified"
  | "Partially Graded"
  | "Fully Graded"
  | "Grading"
  | "Completed";

const laptopTransitions: Record<string, Set<string>> = {
  "Pending Verification": new Set(["Pending Grading", "On Hold", "Scrapped", "Missing"]),
  "Pending Grading": new Set(["In Processing", "Ready for Sale", "On Hold", "Scrapped", "Missing"]),
  "In Processing": new Set(["Ready for Sale", "On Hold", "Scrapped", "Missing"]),
  "Ready for Sale": new Set(["Sold", "In Processing", "On Hold", "Scrapped", "Missing"]),
  Sold: new Set(["Returned"]),
  Returned: new Set(["In Processing", "Ready for Sale", "Scrapped", "Missing"]),
  "On Hold": new Set(["Pending Verification", "Pending Grading", "In Processing", "Ready for Sale", "Scrapped", "Missing"]),
  Scrapped: new Set([]),
  Missing: new Set(["Pending Verification", "Pending Grading", "In Processing", "Ready for Sale", "Returned"]),
  Disposed: new Set([]),
};

const lotTransitions: Record<string, Set<string>> = {
  Pending: new Set(["Partially Verified", "Verified"]),
  "Partially Verified": new Set(["Verified", "Partially Graded"]),
  Verified: new Set(["Partially Graded", "Grading", "Fully Graded", "Completed"]),
  Grading: new Set(["Partially Graded", "Fully Graded", "Completed"]),
  "Partially Graded": new Set(["Fully Graded", "Completed"]),
  "Fully Graded": new Set(["Completed"]),
  Completed: new Set([]),
};

export function canTransitionLaptopStatus(from: string, to: string) {
  if (from === to) return true;
  const allowed = laptopTransitions[from];
  if (!allowed) return true;
  return allowed.has(to);
}

export function canTransitionLotStatus(from: string, to: string) {
  if (from === to) return true;
  const allowed = lotTransitions[from];
  if (!allowed) return true;
  return allowed.has(to);
}
