import * as XLSX from 'xlsx';

/**
 * Exports data to a standard Excel (.xlsx) file.
 */
export const exportToExcel = (data: any[], fileName: string, sheetName = 'Sheet1') => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

/**
 * Exports tabular data to a UTF-8 CSV file that opens cleanly in Excel.
 */
export const exportToCSV = (headers: string[], rows: any[][], fileName: string) => {
  const escapeCell = (value: any) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map(row => row.map(escapeCell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.csv`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/**
 * Downloads a spreadsheet import template with designated column headers.
 */
export const downloadExcelTemplate = (headers: string[], fileName: string) => {
  // Create worksheet with headers as first row
  const worksheet = XLSX.utils.aoa_to_sheet([headers]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
  XLSX.writeFile(workbook, `${fileName}_template.xlsx`);
};

/**
 * Parses an Excel (.xlsx, .xls) or CSV (.csv) file into a JSON array.
 */
export const parseExcelFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        resolve(jsonData);
      } catch (error) {
        reject(new Error('Failed to parse sheet. Please ensure it is a valid Excel or CSV file.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsArrayBuffer(file);
  });
};

/** Converts an Excel serial date or date string into a Date, returning null when invalid. */
export const parseSpreadsheetDate = (value: any): Date | null => {
  if (value === undefined || value === null || value === '') return null;
  const date = value instanceof Date
    ? value
    : typeof value === 'number'
      ? new Date(Date.UTC(1899, 11, 30) + Math.round(value * 86400000))
      : new Date(String(value).trim());
  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * Formats a clean printable window and triggers print/PDF preview.
 */
export const printReport = (title: string, headers: string[], rows: any[][]) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to print reports.');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            margin: 40px;
            color: #1f2937;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 15px;
            margin-bottom: 25px;
          }
          h1 {
            font-size: 22px;
            font-weight: 700;
            color: #1e3a8a;
            margin: 0;
          }
          .meta-info {
            font-size: 12px;
            color: #6b7280;
            text-align: right;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          th, td {
            border: 1px solid #e5e7eb;
            padding: 8px 12px;
            text-align: left;
            font-size: 11px;
          }
          th {
            background-color: #f9fafb;
            font-weight: 600;
            color: #374151;
            text-transform: uppercase;
            font-size: 10px;
            letter-spacing: 0.05em;
          }
          tr:nth-child(even) td {
            background-color: #f9fafb;
          }
          @media print {
            body { margin: 20px; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>${title}</h1>
            <div style="font-size: 11px; color: #4b5563; margin-top: 4px;">ASKSHREE MixFlow SaaS Platform</div>
          </div>
          <div class="meta-info">
            <div>Printed Date: ${new Date().toLocaleString()}</div>
            <div>Tenant ID: Scoped Session</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${rows.map(row => `
              <tr>
                ${row.map(cell => `<td>${cell !== null && cell !== undefined ? cell : ''}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
