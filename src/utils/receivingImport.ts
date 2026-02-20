export type ImportRow = Record<string, string>;

export type ReceivingCanonicalFields = {
  lotId: string;
  assetClass: string;
  assetTag: string;
  palletId: string;
  brand: string;
  model: string;
  cpuModel: string;
  cpuSpeed: string;
  ramSize: string;
  memoryType: string;
  storageSize: string;
  storageType: string;
  opticalDrive: string;
  screenSize: string;
  screenResolution: string;
  coaStatus: string;
  webcamStatus: string;
  keyboardStatus: string;
  cosmeticCondition: string;
  functionalCondition: string;
  rslCode: string;
  finalGrade: string;
  acAdapterStatus: string;
  serialNumber: string;
  purchasePrice: string;
  soldFlag: string;
};

const COLUMN_ALIASES: Record<keyof ReceivingCanonicalFields, string[]> = {
  lotId: ["LOT", "LOT_NO", "LOT NUMBER", "LOTNUMBER"],
  assetClass: ["CLASS", "ASSET_CLASS"],
  assetTag: ["ASSET", "ASSET TAG", "ASSET_TAG"],
  palletId: ["PALLET", "PALLET_ID", "PALLET NO"],
  brand: ["BRAND", "MAKE"],
  model: ["MODEL", "ITEM_NAME", "ITEM", "DESCRIPTION"],
  cpuModel: ["CPU", "PROCESSOR"],
  cpuSpeed: ["SPEED", "CPU_SPEED", "SPEED_GHZ"],
  ramSize: ["RAM", "RAM_GB", "MEMORY", "MEMORY_SIZE"],
  memoryType: ["MEM TYPE", "MEM TYPE ", "MEM_TYPE", "MEMORY TYPE", "MEMORY_TYPE", "RAM_TYPE"],
  storageSize: ["HDD", "SSD", "STORAGE", "SSD_GB", "HDD_GB"],
  storageType: ["HDD TYPE", "HDD_TYPE", "SSD TYPE", "SSD_TYPE", "STORAGE_TYPE"],
  opticalDrive: ["OPTICAL", "ODD"],
  screenSize: ["SCREEN", "SCREEN_SIZE", "DISPLAY"],
  screenResolution: ["RESOLUTION", "SCREEN_RESOLUTION", "DISPLAY_RESOLUTION"],
  coaStatus: ["COA", "LICENSE", "WINDOWS_LICENSE"],
  webcamStatus: ["WEBCAM", "CAMERA"],
  keyboardStatus: ["KEYBOARD", "KBD"],
  cosmeticCondition: ["COSMETIC", "COSMETIC_GRADE"],
  functionalCondition: ["FUNCTIONAL", "FUNCTIONAL_STATUS", "TEST_RESULT"],
  rslCode: ["RSL", "RSL_CODE"],
  finalGrade: ["GRADE", "FINAL_GRADE"],
  acAdapterStatus: ["AC", "ADAPTER", "AC_ADAPTER"],
  serialNumber: ["SERIAL", "SERIAL_NO", "SERIAL NUMBER", "BARCODE"],
  purchasePrice: ["PRICE", "COST", "VALUATION_RATE", "RATE"],
  soldFlag: ["SOLD", "IS_SOLD", "SOLD_FLAG", "SALE_STATUS"],
};

function normalizeHeader(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[\s_-]+/g, " ");
}

function getValueByAliases(row: ImportRow, aliases: string[]) {
  const normalized = new Map<string, string>();
  Object.entries(row).forEach(([key, value]) => {
    normalized.set(normalizeHeader(key), String(value ?? "").trim());
  });
  for (const alias of aliases) {
    const hit = normalized.get(normalizeHeader(alias));
    if (hit) return hit;
  }
  return "";
}

export function extractReceivingCanonicalFields(row: ImportRow): ReceivingCanonicalFields {
  return Object.keys(COLUMN_ALIASES).reduce((acc, key) => {
    const typedKey = key as keyof ReceivingCanonicalFields;
    acc[typedKey] = getValueByAliases(row, COLUMN_ALIASES[typedKey]);
    return acc;
  }, {} as ReceivingCanonicalFields);
}

export function isSoldLike(value: string) {
  return /^(1|true|yes|y|sold)$/i.test((value || "").trim());
}

function hasIdentity(canonical: ReceivingCanonicalFields) {
  return Boolean(canonical.assetTag.trim() || canonical.serialNumber.trim());
}

export function validateReceivingCanonicalFields(canonical: ReceivingCanonicalFields): string[] {
  const errors: string[] = [];
  if (!canonical.lotId.trim()) errors.push("Missing LOT");
  if (!hasIdentity(canonical)) errors.push("Missing ASSET or SERIAL");

  const maybePrice = canonical.purchasePrice.trim();
  if (maybePrice) {
    const normalized = maybePrice.replace(/,/g, "");
    if (!Number.isFinite(Number(normalized))) {
      errors.push("Invalid PRICE");
    }
  }

  if (isSoldLike(canonical.soldFlag)) {
    errors.push("Row marked as SOLD");
  }

  return errors;
}

export function invalidImportRowsToCsv(
  rows: Array<{ barcode: string; model: string; error: string; canonical: Record<string, string> }>,
) {
  const headers = ["barcode", "model", "error", "lotId", "assetTag", "serialNumber", "soldFlag", "purchasePrice"];
  const escaped = (v: string) => {
    const value = String(v ?? "");
    if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
    return value;
  };

  const lines = [headers.join(",")];
  rows.forEach((row) => {
    const values = [
      row.barcode,
      row.model,
      row.error,
      row.canonical.lotId || "",
      row.canonical.assetTag || "",
      row.canonical.serialNumber || "",
      row.canonical.soldFlag || "",
      row.canonical.purchasePrice || "",
    ];
    lines.push(values.map(escaped).join(","));
  });
  return lines.join("\n");
}
