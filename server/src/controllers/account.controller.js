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

const monthly = async (req, res, next) => {
  try {
    const months = Math.min(24, Math.max(1, Number(req.query.months) || 12));
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

    const invoices = await prisma.invoice.findMany({
      where: { createdAt: { gte: start } },
      select: {
        createdAt: true,
        totalAmount: true,
        movements: { select: { quantity: true, costPrice: true } },
      },
    });

    const buckets = new Map();
    for (let i = 0; i < months; i++) {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      buckets.set(key, {
        month: key,
        label: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        rangeStart: new Date(d.getFullYear(), d.getMonth(), 1).toISOString(),
        rangeEnd: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString(),
        revenue: 0,
        cost: 0,
        profit: 0,
        invoiceCount: 0,
      });
    }

    for (const invoice of invoices) {
      const d = invoice.createdAt;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const bucket = buckets.get(key);
      if (!bucket) continue;
      const { totalRevenue, totalCost } = invoiceProfit(invoice);
      bucket.revenue += totalRevenue;
      bucket.cost += totalCost;
      bucket.profit += totalRevenue - totalCost;
      bucket.invoiceCount += 1;
    }

    res.json({ items: Array.from(buckets.values()) });
  } catch (err) {
    next(err);
  }
};

const balanceSheet = async (req, res, next) => {
  try {
    const now = new Date();

    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { currentStock: true, costPrice: true },
    });
    const stockValue = products.reduce((sum, p) => sum + p.currentStock * Number(p.costPrice), 0);

    const [invoiceAgg, paymentAgg] = await Promise.all([
      prisma.invoice.groupBy({
        by: ['customerId'],
        where: { customerId: { not: null } },
        _sum: { totalAmount: true },
        _min: { createdAt: true },
      }),
      prisma.payment.groupBy({ by: ['customerId'], _sum: { amount: true } }),
    ]);
    const custPaymentMap = new Map(paymentAgg.map((r) => [r.customerId, Number(r._sum.amount || 0)]));
    const custIds = invoiceAgg.map((r) => r.customerId);
    const customers = custIds.length
      ? await prisma.customer.findMany({ where: { id: { in: custIds } } })
      : [];
    const customerMap = new Map(customers.map((c) => [c.id, c]));

    const receivables = invoiceAgg
      .map((r) => {
        const invoiced = Number(r._sum.totalAmount || 0);
        const paid = custPaymentMap.get(r.customerId) || 0;
        const balance = invoiced - paid;
        const customer = customerMap.get(r.customerId);
        const daysOutstanding = Math.floor((now - new Date(r._min.createdAt)) / 86400000);
        return {
          id: r.customerId,
          name: customer?.name || 'Unknown customer',
          company: customer?.company || null,
          balance,
          oldestDate: r._min.createdAt,
          daysOutstanding,
        };
      })
      .filter((r) => r.balance > 0.005)
      .sort((a, b) => b.daysOutstanding - a.daysOutstanding);

    const [creditMovements, supplierPaymentAgg] = await Promise.all([
      prisma.stockMovement.findMany({
        where: { paymentType: 'CREDIT' },
        select: { supplierId: true, quantity: true, costPrice: true, createdAt: true },
      }),
      prisma.supplierPayment.groupBy({ by: ['supplierId'], _sum: { amount: true } }),
    ]);
    const owedMap = new Map();
    const oldestMap = new Map();
    for (const m of creditMovements) {
      const cost = m.quantity * Number(m.costPrice);
      owedMap.set(m.supplierId, (owedMap.get(m.supplierId) || 0) + cost);
      const existing = oldestMap.get(m.supplierId);
      if (!existing || m.createdAt < existing) oldestMap.set(m.supplierId, m.createdAt);
    }
    const supplierPaidMap = new Map(supplierPaymentAgg.map((r) => [r.supplierId, Number(r._sum.amount || 0)]));
    const supplierIds = Array.from(owedMap.keys());
    const suppliers = supplierIds.length
      ? await prisma.supplier.findMany({ where: { id: { in: supplierIds } } })
      : [];
    const supplierMap = new Map(suppliers.map((s) => [s.id, s]));

    const payables = supplierIds
      .map((id) => {
        const owed = owedMap.get(id) || 0;
        const paid = supplierPaidMap.get(id) || 0;
        const balance = owed - paid;
        const supplier = supplierMap.get(id);
        const daysOutstanding = Math.floor((now - new Date(oldestMap.get(id))) / 86400000);
        return {
          id,
          name: supplier?.name || 'Unknown supplier',
          company: supplier?.company || null,
          balance,
          oldestDate: oldestMap.get(id),
          daysOutstanding,
        };
      })
      .filter((p) => p.balance > 0.005)
      .sort((a, b) => b.daysOutstanding - a.daysOutstanding);

    const totalReceivable = receivables.reduce((s, r) => s + r.balance, 0);
    const totalPayable = payables.reduce((s, p) => s + p.balance, 0);
    const totalAssets = stockValue + totalReceivable;
    const totalLiabilities = totalPayable;

    res.json({
      stockValue,
      totalReceivable,
      totalPayable,
      totalAssets,
      totalLiabilities,
      netPosition: totalAssets - totalLiabilities,
      receivables,
      payables,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, summary, monthly, balanceSheet };
