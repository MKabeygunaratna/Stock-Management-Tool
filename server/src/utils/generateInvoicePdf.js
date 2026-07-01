const PDFDocument = require('pdfkit');
const company = require('../config/company');

const formatMoney = (value) =>
  `Rs. ${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const streamInvoicePdf = (invoice, res) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
  doc.pipe(res);

  doc.fontSize(18).font('Helvetica-Bold').text(company.name);
  doc.fontSize(10).font('Helvetica').text(company.address);
  doc.text(`${company.phone}  |  ${company.email}`);

  doc.moveDown(1.5);
  doc.fontSize(16).font('Helvetica-Bold').text('INVOICE', { align: 'right' });
  doc.fontSize(10).font('Helvetica');
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, { align: 'right' });
  doc.text(`Date: ${new Date(invoice.createdAt).toLocaleString()}`, { align: 'right' });
  doc.text(`Served by: ${invoice.user.fullName}`, { align: 'right' });

  doc.moveDown(1.5);
  doc.font('Helvetica-Bold').text('Bill To:');
  doc.font('Helvetica').text(invoice.buyerName);
  if (invoice.buyerCompany) doc.text(invoice.buyerCompany);

  doc.moveDown(1.5);

  const columns = [
    { key: 'partNumber', label: 'Part #', width: 80 },
    { key: 'name', label: 'Name', width: 150 },
    { key: 'brand', label: 'Brand', width: 80 },
    { key: 'qty', label: 'Qty', width: 45 },
    { key: 'unitPrice', label: 'Unit Price', width: 70 },
    { key: 'lineTotal', label: 'Line Total', width: 80 },
  ];

  const tableLeft = doc.page.margins.left;
  let y = doc.y;

  const drawRow = (values, isHeader) => {
    let x = tableLeft;
    doc.font(isHeader ? 'Helvetica-Bold' : 'Helvetica').fontSize(9);
    columns.forEach((col, i) => {
      doc.text(values[i], x, y, { width: col.width, align: i >= 3 ? 'right' : 'left' });
      x += col.width;
    });
    y += 18;
  };

  drawRow(columns.map((c) => c.label), true);
  doc.moveTo(tableLeft, y).lineTo(tableLeft + columns.reduce((s, c) => s + c.width, 0), y).stroke();
  y += 4;

  invoice.movements.forEach((m) => {
    drawRow([
      m.product.partNumber,
      m.product.name,
      m.product.brand.name,
      String(m.quantity),
      formatMoney(m.unitPrice),
      formatMoney(Number(m.unitPrice) * m.quantity),
    ], false);
  });

  y += 6;
  doc.moveTo(tableLeft, y).lineTo(tableLeft + columns.reduce((s, c) => s + c.width, 0), y).stroke();
  y += 10;

  doc.font('Helvetica-Bold').fontSize(11).text(`Total: ${formatMoney(invoice.totalAmount)}`, tableLeft, y, {
    width: columns.reduce((s, c) => s + c.width, 0),
    align: 'right',
  });

  if (invoice.movements[0]?.reference) {
    doc.moveDown(2).font('Helvetica').fontSize(9).text(`Reference: ${invoice.movements[0].reference}`);
  }
  if (invoice.movements[0]?.reason) {
    doc.font('Helvetica').fontSize(9).text(`Notes: ${invoice.movements[0].reason}`);
  }

  doc.end();
};

module.exports = { streamInvoicePdf };
