const prisma = require('../config/prisma');

const summary = async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { brand: true },
    });

    const totalParts = products.length;

    let totalStockValue = 0;
    let lowStockCount = 0;
    const brandMap = new Map();

    for (const p of products) {
      const value = p.currentStock * Number(p.costPrice);
      totalStockValue += value;
      if (p.currentStock <= p.reorderLevel) lowStockCount += 1;

      const key = p.brand.name;
      const entry = brandMap.get(key) || { brandId: p.brandId, brandName: key, totalStock: 0, totalValue: 0 };
      entry.totalStock += p.currentStock;
      entry.totalValue += value;
      brandMap.set(key, entry);
    }

    const stockByBrand = Array.from(brandMap.values()).sort((a, b) => b.totalValue - a.totalValue);

    const outMovements = await prisma.stockMovement.findMany({
      where: { type: 'OUT' },
      include: { product: { include: { brand: true } } },
    });

    let totalSalesRevenue = 0;
    const salesBrandMap = new Map();

    for (const m of outMovements) {
      const revenue = m.quantity * Number(m.unitPrice);
      totalSalesRevenue += revenue;

      const key = m.product.brand.name;
      const entry = salesBrandMap.get(key) || {
        brandId: m.product.brandId,
        brandName: key,
        totalQty: 0,
        totalRevenue: 0,
      };
      entry.totalQty += m.quantity;
      entry.totalRevenue += revenue;
      salesBrandMap.set(key, entry);
    }

    const salesByBrand = Array.from(salesBrandMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);

    const totalInvoices = await prisma.invoice.count();

    const recentMovements = await prisma.stockMovement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        product: { include: { brand: true } },
        user: { select: { id: true, username: true, fullName: true } },
      },
    });

    res.json({
      totalParts,
      totalStockValue,
      lowStockCount,
      stockByBrand,
      totalSalesRevenue,
      totalInvoices,
      salesByBrand,
      recentMovements,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { summary };
