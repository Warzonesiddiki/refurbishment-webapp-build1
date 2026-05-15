export type VATMode = "INCLUSIVE" | "EXCLUSIVE";

export type FilingFrequency = "MONTHLY" | "QUARTERLY" | "ANNUALLY";

export type VATCategory = "STANDARD" | "ZERO_RATED" | "EXEMPT" | "OUT_OF_SCOPE";

export type VATRate = {
  id: string;
  code: string;
  name: string;
  rate: number;
  isDefault: boolean;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
};

export type VATConfig = {
  defaultRate: string;
  defaultMode: VATMode;
  registrationNumber: string;
  registrationName: string;
  filingFrequency: FilingFrequency;
  fiscalYearStart: number;
};
