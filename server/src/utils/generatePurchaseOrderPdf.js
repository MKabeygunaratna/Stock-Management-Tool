const PDFDocument = require('pdfkit');
const company = require('../config/company');

const formatMoney = (value) =>
  `Rs. ${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const conditionLabel = (condition) => (condition === 'RECONDITION' ? 'Recondition' : 'Brand New');

const streamPurchaseOrderPdf = (order, res) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${order.orderNumber}.pdf"`);
  doc.pipe(res);

  const left = doc.page.margins.left;

  doc.fillColor('#cc0000').fontSize(32).font('Helvetica-Bold').text('NIHON', left, 50);
  doc.fillColor('black').fontSize(11).font('Helvetica-Bold').text('AUTO ENTERPRISES', left, doc.y - 2, { underline: true, characterSpacing: 1 });

  doc.fontSize(11).font('Helvetica-Bold').text(company.name, 300, 50, { width: 250, align: 'right' });
  doc.fontSize(10).font('Helvetica').text(company.address, { width: 250, align: 'right' });
  doc.text(company.phone, { width: 250, align: 'right' });
  doc.text(`E-MAIL-${company.email}`, { width: 250, align: 'right' });

  doc.moveDown(1.5);
  doc.fontSize(16).font('Helvetica-Bold').text('PURCHASE ORDER', { align: 'right' });
  doc.fontSize(10).font('Helvetica');
  doc.text(`Order #: ${order.orderNumber}`, { align: 'right' });
  doc.text(`Date: ${new Date(order.createdAt).toLocaleString()}`, { align: 'right' });
  doc.text(`Requested by: ${order.user.fullName}`, { align: 'right' });

  // Order details box: supplier and notes each get a proper label
  const detailLines = [];
  if (order.supplierName) detailLines.push({ label: 'Supplier Name', value: order.supplierName });
  if (order.notes) detailLines.push({ label: 'Notes', value: order.notes });

  const boxWidth = 260;
  const boxPadding = 8;
  const detailLineHeight = 14;
  const boxHeight = Math.max(detailLines.length, 1) * detailLineHeight + boxPadding * 2;
  const boxY = doc.y + 20;

  doc.rect(left, boxY, boxWidth, boxHeight).strokeColor('#d4d4d8').lineWidth(1).stroke();

  doc.fontSize(9);
  if (detailLines.length === 0) {
    doc.font('Helvetica').fillColor('#71717a').text('No supplier or notes provided', left + boxPadding, boxY + boxPadding);
  } else {
    detailLines.forEach(({ label, value }, i) => {
      const lineY = boxY + boxPadding + i * detailLineHeight;
      doc.font('Helvetica-Bold').fillColor('black').text(`${label}:`, left + boxPadding, lineY, { continued: true });
      doc.font('Helvetica').text(` ${value}`, { width: boxWidth - boxPadding * 2 - 10 });
    });
  }

  doc.x = left;
  doc.y = boxY + boxHeight + 20;

  const columns = [
    { key: 'partNumber', label: 'Part #', width: 68 },
    { key: 'name', label: 'Name', width: 105 },
    { key: 'brand', label: 'Brand', width: 37 },
    { key: 'status', label: 'In System', width: 45 },
    { key: 'condition', label: 'Condition', width: 55 },
    { key: 'qty', label: 'Qty', width: 30 },
    { key: 'unitCost', label: 'Est. Unit Cost', width: 60 },
    { key: 'lineTotal', label: 'Est. Line Total', width: 70 },
  ];
  const tableWidth = columns.reduce((s, c) => s + c.width, 0);

  const tableLeft = left;
  let y = doc.y;

  const drawRow = (values, isHeader) => {
    let x = tableLeft;
    doc.font(isHeader ? 'Helvetica-Bold' : 'Helvetica').fontSize(9);
    columns.forEach((col, i) => {
      doc.text(values[i], x, y, { width: col.width, align: i >= 5 ? 'right' : 'left' });
      x += col.width;
    });
    y += 18;
  };

  drawRow(columns.map((c) => c.label), true);
  doc.moveTo(tableLeft, y).lineTo(tableLeft + tableWidth, y).stroke();
  y += 4;

  order.items.forEach((item) => {
    drawRow([
      item.partNumber || '-',
      item.name,
      item.brandName || '-',
      item.isNew ? 'New Item' : 'Existing',
      conditionLabel(item.condition),
      String(item.quantity),
      formatMoney(item.estimatedCost),
      formatMoney(Number(item.estimatedCost) * item.quantity),
    ], false);
  });

  y += 6;
  doc.moveTo(tableLeft, y).lineTo(tableLeft + tableWidth, y).stroke();
  y += 10;

  doc.font('Helvetica-Bold').fontSize(11).text(`Estimated Total: ${formatMoney(order.totalEstimatedCost)}`, tableLeft, y, {
    width: tableWidth,
    align: 'right',
  });

  // Policies and signatures are anchored to the bottom of the page, not the flow of content above
  const pageBottom = doc.page.height - doc.page.margins.bottom;
  const sigLabelY = pageBottom - 12;
  const sigLineY = sigLabelY - 15;
  const policyLineHeight = 11;
  const policiesY = sigLineY - 15 - company.policies.length * policyLineHeight;

  doc.fillColor('#cc0000').fontSize(8).font('Helvetica');
  company.policies.forEach((p, i) => {
    doc.text(`• ${p}`, tableLeft, policiesY + i * policyLineHeight, { width: tableWidth });
  });
  doc.fillColor('black');

  doc.fontSize(10).font('Helvetica');
  doc.text('....................................', tableLeft, sigLineY);
  doc.text('Prepared By', tableLeft, sigLabelY);
  doc.text('....................................', 350, sigLineY);
  doc.text('Approved By', 350, sigLabelY);

  doc.end();
};

module.exports = { streamPurchaseOrderPdf };
