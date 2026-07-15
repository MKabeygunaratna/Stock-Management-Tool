const prisma = require('../config/prisma');

const invoiceProfit = (invoice) => {
  let totalCost = 0;
  for (const m of invoice.movements) {
    totalCost += Number(m.costPrice) * m.quantity;
  }
  const totalRevenue = Number(invoice.totalAmount);
  return { totalRevenue, totalCost, totalProfit: totalRevenue - totalCost };
};

const list = async (req, res, next) => {
  try {
    const { search, from, to, page = 1, limit = 20 } = req.query;

    const where = {};
    if (search) {
      where.OR = [
        { buyerName: { contains: search, mode: 'insensitive' } },
        { buyerCompany: { contains: search, mode: 'insensitive' } },
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const pageNum = Math.max(1, Number(page));
    const take = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * take;

    const [items, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          movements: { select: { quantity: true, costPrice: true } },
          user: { select: { id: true, username: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.invoice.count({ where }),
    ]);

    const withProfit = items.map(({ movements, ...invoice }) => ({
      ...invoice,
      itemCount: movements.length,
      ...invoiceProfit({ ...invoice, movements }),
    }));

    res.json({
      items: withProfit,
      total,
      page: pageNum,
      limit: take,
      totalPages: Math.ceil(total / take),
    });
  } catch (err) {
    next(err);
  }
};

const summary = async (req, res, next) => {
  try {
    const { from, to } = req.query;

    const where = {};
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const invoices = await prisma.invoice.findMany({
      where,
      select: {
        totalAmount: true,
        movements: { select: { quantity: true, costPrice: true } },
      },
    });

    let totalRevenue = 0;
    let totalCost = 0;
    for (const invoice of invoices) {
      const { totalRevenue: rev, totalCost: cost } = invoiceProfit(invoice);
      totalRevenue += rev;
      totalCost += cost;
    }

    res.json({
      invoiceCount: invoices.length,
      totalRevenue,
      totalCost,
      totalProfit: totalRevenue - totalCost,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, summary };
