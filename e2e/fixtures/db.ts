import type { Page } from "@playwright/test";
import { createLaptop, createPart, createSale } from "./factories";
import { injectState } from "../utils/testHelpers";

export class DbFixture {
  constructor(private readonly page: Page) {}

  async clear() {
    await this.page.evaluate(() => localStorage.removeItem("tahir-erp:app-state"));
  }

  async seed(data: Record<string, unknown>) {
    await injectState(this.page, data);
  }

  async seedLaptops(count: number) {
    const laptops = Array.from({ length: count }, (_, i) => createLaptop({ barcode: `E2E-LAP-${i + 1}` }));
    await injectState(this.page, { laptops });
    return laptops;
  }

  async seedParts(count: number) {
    const parts = Array.from({ length: count }, (_, i) => createPart({ barcode: `E2E-PART-${i + 1}` }));
    await injectState(this.page, { parts });
    return parts;
  }

  async seedSales(count: number) {
    const sales = Array.from({ length: count }, (_, i) => createSale({ invoice: `INV-E2E-${i + 1}` }));
    await injectState(this.page, { sales });
    return sales;
  }

  async seedFullWorkflow() {
    const laptops = await this.seedLaptops(3);
    const parts = await this.seedParts(3);
    const sales = await this.seedSales(1);
    return { laptops, parts, sales };
  }
}
