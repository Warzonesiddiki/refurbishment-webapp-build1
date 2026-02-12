import { createLaptop, createPart, createSale } from "./factories";

export const emptyState = {};
export const minimalData = {
  laptops: [createLaptop()],
  parts: [createPart()],
};
export const fullWorkflowData = {
  laptops: [createLaptop({ barcode: "WF-1" }), createLaptop({ barcode: "WF-2" })],
  parts: [createPart({ barcode: "WF-P1" })],
  sales: [createSale()],
};
export const largeDataset = {
  laptops: Array.from({ length: 50 }, (_, i) => createLaptop({ barcode: `LG-${i}` })),
};
