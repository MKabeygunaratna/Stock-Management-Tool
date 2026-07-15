const PART_NUMBER_HEADERS = /^(part\s*number|part\s*no\.?|part\s*#|sku|item\s*code)$/i;
const QUANTITY_HEADERS = /^(qty|quantity|amount)$/i;

const cellText = (cell) => {
  const value = cell?.value;
  if (value == null) return '';
  if (typeof value === 'object' && 'text' in value) return String(value.text).trim();
  if (typeof value === 'object' && 'result' in value) return String(value.result).trim();
  return String(value).trim();
};

/**
 * Reads the first worksheet of an uploaded .xlsx file and returns
 * [{ partNumber, quantity, rowNumber }]. Detects "Part Number"/"Qty"-style
 * headers if present; otherwise assumes column A = part number, B = quantity.
 */
export async function parseStockOutWorkbook(file) {
  const { default: ExcelJS } = await import('exceljs');
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error('The uploaded file has no worksheets');

  const headerRow = sheet.getRow(1);
  let partCol = 1;
  let qtyCol = 2;
  let hasHeader = false;

  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const text = cellText(cell);
    if (PART_NUMBER_HEADERS.test(text)) {
      partCol = colNumber;
      hasHeader = true;
    } else if (QUANTITY_HEADERS.test(text)) {
      qtyCol = colNumber;
      hasHeader = true;
    }
  });

  const rows = [];
  const firstDataRow = hasHeader ? 2 : 1;

  for (let i = firstDataRow; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);
    const partNumber = cellText(row.getCell(partCol));
    const quantityText = cellText(row.getCell(qtyCol));
    if (!partNumber && !quantityText) continue; // skip fully blank rows

    rows.push({
      rowNumber: i,
      partNumber,
      quantity: Number(quantityText),
    });
  }

  return rows;
}

/**
 * Builds and downloads a blank .xlsx template with the exact headers
 * parseStockOutWorkbook() looks for, plus one example row.
 */
export async function downloadStockOutTemplate() {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Stock Out');

  sheet.columns = [
    { header: 'Part Number', key: 'partNumber', width: 22 },
    { header: 'Qty', key: 'quantity', width: 12 },
  ];
  sheet.getRow(1).font = { bold: true };
  sheet.addRow({ partNumber: 'HON-ELE-001', quantity: 2 });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'stock-out-template.xlsx';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
