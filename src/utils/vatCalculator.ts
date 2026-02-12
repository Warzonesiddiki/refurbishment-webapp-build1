import type { VATMode, VATRate } from "@/store/types/VATTypes";

export const STANDARD_RATE = 15;
export const ZERO_RATE = 0;
export const VAT_ROUNDING = 2;

const round2 = (value: number) => Number(value.toFixed(VAT_ROUNDING));

export function calculateVAT(amount: number, rate: number, mode: VATMode) {
  if (mode === "EXCLUSIVE") {
    const net = round2(amount);
    const vat = round2((net * rate) / 100);
    return { net, vat, gross: round2(net + vat) };
  }
  const gross = round2(amount);
  const net = round2(gross / (1 + rate / 100));
  return { net, vat: round2(gross - net), gross };
}

export type LineVATResult = {
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
  vatAmount: number;
  totalAmount: number;
};

export function calculateLineVAT(
  qty: number,
  unitPrice: number,
  discountPercent: number,
  vatRate: number,
  mode: VATMode
): LineVATResult {
  const grossAmount = round2(qty * unitPrice);
  const discountAmount = round2((grossAmount * discountPercent) / 100);
  const discounted = round2(grossAmount - discountAmount);
  const computed = calculateVAT(discounted, vatRate, mode);
  return {
    grossAmount,
    discountAmount,
    netAmount: computed.net,
    vatAmount: computed.vat,
    totalAmount: computed.gross,
  };
}

export function reverseCalculateFromGross(grossAmount: number, vatRate: number) {
  const { net, vat } = calculateVAT(grossAmount, vatRate, "INCLUSIVE");
  return { net, vat };
}

export function validateVATNumber(vatNumber: string, country = "AE") {
  const clean = vatNumber.replace(/\s+/g, "").toUpperCase();
  if (country === "AE") return /^\d{15}$/.test(clean);
  if (country === "GB") return /^GB(\d{9}|\d{12})$/.test(clean);
  return /^[A-Z]{2}[A-Z0-9]{6,14}$/.test(clean);
}

export function determineVATRate(itemType: string, customerType: string, destination: string): VATRate {
  const isExport = destination.toLowerCase() !== "local";
  if (isExport || customerType.toLowerCase() === "export") {
    return {
      id: "zero-rate",
      code: "ZERO",
      name: "Zero Rated",
      rate: ZERO_RATE,
      isDefault: false,
      effectiveFrom: new Date(0).toISOString(),
      effectiveTo: null,
      isActive: true,
    };
  }
  const code = itemType.toLowerCase().includes("exempt") ? "EXEMPT" : "STANDARD";
  const rate = code === "EXEMPT" ? 0 : STANDARD_RATE;
  return {
    id: `${code.toLowerCase()}-rate`,
    code,
    name: code === "EXEMPT" ? "Exempt" : "Standard",
    rate,
    isDefault: code === "STANDARD",
    effectiveFrom: new Date(0).toISOString(),
    effectiveTo: null,
    isActive: true,
  };
}
