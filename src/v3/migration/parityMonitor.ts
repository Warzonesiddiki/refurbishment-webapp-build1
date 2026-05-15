import type { JournalRow } from "@/v3/finance/journalProjection";

type NormalizedJournalRow = {
  source: JournalRow["source"];
  reference: string;
  counterparty: string;
  amount: number;
  date: string;
};

export type JournalParityDrift = {
  key: string;
  issue: "missing_in_v3" | "extra_in_v3" | "value_mismatch";
  legacy?: JournalRow;
  v3?: JournalRow;
};

export type JournalParityReport = {
  isAligned: boolean;
  checkedAt: string;
  legacyCount: number;
  v3Count: number;
  drifts: JournalParityDrift[];
};

function normalizeRow(row: JournalRow): NormalizedJournalRow {
  return {
    source: row.source,
    reference: row.reference.trim(),
    counterparty: row.counterparty.trim(),
    amount: Number(row.amount.toFixed(2)),
    date: row.date,
  };
}

function parityKey(row: JournalRow) {
  return `${row.source}|${row.reference}|${row.date}`;
}

function rowsEqual(a: JournalRow, b: JournalRow) {
  const na = normalizeRow(a);
  const nb = normalizeRow(b);

  return na.source === nb.source && na.reference === nb.reference && na.counterparty === nb.counterparty && na.amount === nb.amount && na.date === nb.date;
}

export function buildJournalParityReport(input: { legacyRows: JournalRow[]; v3Rows: JournalRow[] }): JournalParityReport {
  const legacyMap = new Map<string, JournalRow>();
  const v3Map = new Map<string, JournalRow>();

  input.legacyRows.forEach((row) => legacyMap.set(parityKey(row), row));
  input.v3Rows.forEach((row) => v3Map.set(parityKey(row), row));

  const drifts: JournalParityDrift[] = [];
  const allKeys = new Set([...legacyMap.keys(), ...v3Map.keys()]);

  allKeys.forEach((key) => {
    const legacy = legacyMap.get(key);
    const v3 = v3Map.get(key);

    if (legacy && !v3) {
      drifts.push({ key, issue: "missing_in_v3", legacy });
      return;
    }

    if (!legacy && v3) {
      drifts.push({ key, issue: "extra_in_v3", v3 });
      return;
    }

    if (legacy && v3 && !rowsEqual(legacy, v3)) {
      drifts.push({ key, issue: "value_mismatch", legacy, v3 });
    }
  });

  return {
    isAligned: drifts.length === 0,
    checkedAt: new Date().toISOString(),
    legacyCount: input.legacyRows.length,
    v3Count: input.v3Rows.length,
    drifts,
  };
}
