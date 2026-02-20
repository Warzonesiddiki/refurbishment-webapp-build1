import { describe, expect, it } from "vitest";
import {
  extractReceivingCanonicalFields,
  invalidImportRowsToCsv,
  isSoldLike,
  validateReceivingCanonicalFields,
} from "@/utils/receivingImport";

describe("receiving import canonical mapping", () => {
  it("maps requested receiving columns to canonical fields", () => {
    const mapped = extractReceivingCanonicalFields({
      LOT: "LOT-001",
      CLASS: "Laptop",
      ASSET: "A-99",
      PALLET: "P-7",
      BRAND: "Dell",
      MODEL: "Latitude 7420",
      CPU: "i7-1165G7",
      SPEED: "2.8 GHz",
      RAM: "16 GB",
      "Mem Type": "DDR4",
      HDD: "512 GB",
      "HDD Type": "NVMe",
      OPTICAL: "No",
      SCREEN: "14",
      RESOLUTION: "1920x1080",
      COA: "Win11Pro",
      WEBCAM: "Yes",
      Keyboard: "Good",
      COSMETIC: "B+",
      FUNCTIONAL: "Pass",
      RSL: "READY",
      GRADE: "A",
      AC: "Yes",
      SERIAL: "SN-777",
      PRICE: "640",
      SOLD: "No",
    });

    expect(mapped.lotId).toBe("LOT-001");
    expect(mapped.assetClass).toBe("Laptop");
    expect(mapped.memoryType).toBe("DDR4");
    expect(mapped.storageType).toBe("NVMe");
    expect(mapped.finalGrade).toBe("A");
    expect(mapped.serialNumber).toBe("SN-777");
    expect(mapped.purchasePrice).toBe("640");
  });

  it("recognizes sold-like values", () => {
    expect(isSoldLike("SOLD")).toBe(true);
    expect(isSoldLike("yes")).toBe(true);
    expect(isSoldLike("1")).toBe(true);
    expect(isSoldLike("no")).toBe(false);
  });

  it("validates required identity and lot fields", () => {
    const errors = validateReceivingCanonicalFields(
      extractReceivingCanonicalFields({ CLASS: "Laptop", SOLD: "No", PRICE: "abc" }),
    );

    expect(errors).toContain("Missing LOT");
    expect(errors).toContain("Missing ASSET or SERIAL");
    expect(errors).toContain("Invalid PRICE");
  });

  it("builds invalid-row csv export payload", () => {
    const csv = invalidImportRowsToCsv([
      {
        barcode: "",
        model: "Latitude",
        error: "Missing ASSET or SERIAL",
        canonical: {
          lotId: "LOT-9",
          assetTag: "",
          serialNumber: "",
          soldFlag: "No",
          purchasePrice: "100",
        },
      },
    ]);

    expect(csv).toContain("barcode,model,error,lotId,assetTag,serialNumber,soldFlag,purchasePrice");
    expect(csv).toContain("LOT-9");
    expect(csv).toContain("Missing ASSET or SERIAL");
  });
});
