type ExportValue = string | number | boolean | null | undefined;

export function downloadBlob(data: BlobPart, filename: string, type: string) {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function toCsv(rows: ExportValue[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const text = cell === null || cell === undefined ? "" : String(cell);
          const escaped = text.replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(",")
    )
    .join("\n");
}

export function exportCsv(filename: string, rows: ExportValue[][]) {
  const csv = toCsv(rows);
  downloadBlob(csv, filename, "text/csv");
}

export function exportJson(filename: string, data: unknown) {
  const json = JSON.stringify(data, null, 2);
  downloadBlob(json, filename, "application/json");
}
