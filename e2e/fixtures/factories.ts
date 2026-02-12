export const createLaptop = (overrides: Record<string, unknown> = {}) => ({
  id: `laptop-${Math.random().toString(36).slice(2, 8)}`,
  barcode: "ABC123",
  make: "Lenovo",
  model: "ThinkPad T14",
  status: "AVAILABLE",
  ...overrides,
});

export const createPart = (overrides: Record<string, unknown> = {}) => ({
  id: `part-${Math.random().toString(36).slice(2, 8)}`,
  barcode: "PART001",
  name: "SSD 512GB",
  stock: 10,
  ...overrides,
});

export const createSale = (overrides: Record<string, unknown> = {}) => ({
  id: `sale-${Math.random().toString(36).slice(2, 8)}`,
  invoice: "INV-1001",
  status: "PENDING",
  total: 1000,
  ...overrides,
});

export const createPurchase = (overrides: Record<string, unknown> = {}) => ({ id: "purchase-1", ...overrides });
export const createWIP = (overrides: Record<string, unknown> = {}) => ({ id: "wip-1", stage: "D1", ...overrides });
export const createSupplier = (overrides: Record<string, unknown> = {}) => ({ id: "supplier-1", name: "Default", ...overrides });
