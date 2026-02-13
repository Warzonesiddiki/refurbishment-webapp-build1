export type SettingsSectionKey = "company" | "financial" | "inventory" | "system" | "backup" | "diagnostics" | "danger";

import type { SectionHelpHintData } from "@/components/ui/SectionHelpHint";

export type SettingsSectionHint = SectionHelpHintData;

export const SETTINGS_SECTION_HINTS: Record<SettingsSectionKey, SettingsSectionHint> = {
  company: {
    title: "Company Profile",
    summary: "Set legal/business identity values used in documents and reports.",
    bullets: [
      "Keep TRN and address accurate for invoices and compliance exports.",
      "Review company name before generating external-facing documents.",
    ],
  },
  financial: {
    title: "Financial Defaults",
    summary: "Control currency, VAT, and date formatting used by calculations and screens.",
    bullets: [
      "Changing VAT impacts downstream sales and reporting math.",
      "Choose a date format consistent with your operations team.",
    ],
  },
  inventory: {
    title: "Inventory Rules",
    summary: "Configure rates and thresholds that influence stock and costing workflows.",
    bullets: [
      "Reorder levels should reflect lead time and demand variability.",
      "Labor/tech rates feed refurbishment margin calculations.",
    ],
  },
  system: {
    title: "System Preferences",
    summary: "Manage behavior defaults and UX-level preferences for daily operations.",
    bullets: [
      "Apply changes during low-traffic periods if multiple users are active.",
      "Keep conventions consistent across all operator stations.",
    ],
  },
  backup: {
    title: "Backup & Restore",
    summary: "Create secure snapshots and restore scoped modules when needed.",
    bullets: [
      "Run dry-run first to preview impact before actual restore.",
      "Enable rollback point creation for safer recovery.",
    ],
  },
  diagnostics: {
    title: "Diagnostics Tools",
    summary: "Run maintenance actions to reconcile state and reduce operational drift.",
    bullets: [
      "Use diagnostics after imports/restores or unusual operator interruptions.",
      "Log outcomes of each tool run for audit traceability.",
    ],
  },
  danger: {
    title: "Danger Zone",
    summary: "High-impact actions that may reset or remove critical business data.",
    bullets: [
      "Always confirm latest backup before executing destructive actions.",
      "Limit access to trusted admins only.",
    ],
  },
};

function isSettingsSectionKey(value: string): value is SettingsSectionKey {
  return value in SETTINGS_SECTION_HINTS;
}

export function getSettingsSectionHint(section: string): SettingsSectionHint {
  return isSettingsSectionKey(section) ? SETTINGS_SECTION_HINTS[section] : SETTINGS_SECTION_HINTS.company;
}
