type ExportValue = string | number | boolean | null | undefined;

export function downloadBlob(data: BlobPart, filename: string, type: string) {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
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
  downloadBlob(`\uFEFF${csv}`, filename, "text/csv;charset=utf-8");
}

export function exportJson(filename: string, data: unknown) {
  const json = JSON.stringify(data, null, 2);
  downloadBlob(json, filename, "application/json");
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function exportExcel(filename: string, rows: ExportValue[][]) {
  const sheetRows = rows
    .map((row) => {
      const cells = row
        .map((cell) => {
          const text = cell === null || cell === undefined ? "" : String(cell);
          return `<Cell><Data ss:Type=\"String\">${escapeXml(text)}</Data></Cell>`;
        })
        .join("");

      return `<Row>${cells}</Row>`;
    })
    .join("");

  const workbook = `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="Report">
  <Table>${sheetRows}</Table>
 </Worksheet>
</Workbook>`;

  downloadBlob(workbook, filename, "application/vnd.ms-excel");
}
