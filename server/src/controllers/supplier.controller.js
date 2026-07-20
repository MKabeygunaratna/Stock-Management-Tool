const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');

const list = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;

    const where = { isActive: true };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const pageNum = Math.max(1, Number(page));
    const take = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * take;

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({ where, orderBy: { name: 'asc' }, skip, take }),
      prisma.supplier.count({ where }),
    ]);

    const supplierIds = suppliers.map((s) => s.id);
    const [creditMovements, paymentSums] = await Promise.all([
      supplierIds.length
        ? prisma.stockMovement.findMany({
            where: { supplierId: { in: supplierIds }, paymentType: 'CREDIT' },
            select: { supplierId: true, quantity: true, costPrice: true },
          })
        : [],
      supplierIds.length
        ? prisma.supplierPayment.groupBy({ by: ['supplierId'], where: { supplierId: { in: supplierIds } }, _sum: { amount: true } })
        : [],
    ]);

    const owedMap = new Map();
    for (const m of creditMovements) {
      const cost = m.quantity * Number(m.costPrice);
      owedMap.set(m.supplierId, (owedMap.get(m.supplierId) || 0) + cost);
    }
    const paymentMap = new Map(paymentSums.map((r) => [r.supplierId, Number(r._sum.amount || 0)]));

    const items = suppliers.map((s) => ({
      ...s,
      balance: (owedMap.get(s.id) || 0) - (paymentMap.get(s.id) || 0),
    }));

    res.json({ items, total, page: pageNum, limit: take, totalPages: Math.ceil(total / take) });
  } catch (err) {
    next(err);
  }
};

const listAll = async (req, res, next) => {
  try {
    const suppliers = await prisma.supplier.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
    res.json(suppliers);
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const supplier = await prisma.supplier.findUnique({ where: { id } });
    if (!supplier) throw new AppError(404, 'Supplier not found');

    const [creditMovements, payments] = await Promise.all([
      prisma.stockMovement.findMany({
        where: { supplierId: id, paymentType: 'CREDIT' },
        orderBy: { createdAt: 'asc' },
        include: { product: true, user: { select: { id: true, fullName: true } } },
      }),
      prisma.supplierPayment.findMany({
        where: { supplierId: id },
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { id: true, fullName: true } } },
      }),
    ]);

    const entries = [
      ...creditMovements.map((m) => ({
        type: 'STOCK_IN',
        id: m.id,
        date: m.createdAt,
        reference: m.reference || `Stock In - ${m.product.name}`,
        notes: `${m.quantity} x ${m.product.name}`,
        debit: m.quantity * Number(m.costPrice),
        credit: 0,
        by: m.user.fullName,
      })),
      ...payments.map((p) => ({
        type: 'PAYMENT',
        id: p.id,
        date: p.createdAt,
        reference: p.reference || p.method || 'Payment',
        notes: p.notes,
        debit: 0,
        credit: Number(p.amount),
        by: p.user.fullName,
      })),
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    let running = 0;
    const ledger = entries.map((entry) => {
      running += entry.debit - entry.credit;
      return { ...entry, balance: running };
    });

    const totalCredit = creditMovements.reduce((s, m) => s + m.quantity * Number(m.costPrice), 0);
    const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);

    res.json({
      supplier,
      totalCredit,
      totalPaid,
      balance: totalCredit - totalPaid,
      ledger,
    });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { name, company, phone, address } = req.body;
    if (!name) throw new AppError(400, 'Supplier name is required');

    const supplier = await prisma.supplier.create({
      data: {
        name,
        company: company || null,
        phone: phone || null,
        address: address || null,
      },
    });
    res.status(201).json(supplier);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { name, company, phone, address, isActive } = req.body;
    const supplier = await prisma.supplier.update({
      where: { id: Number(req.params.id) },
      data: { name, company, phone, address, isActive },
    });
    res.json(supplier);
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [movementCount, paymentCount, orderCount] = await Promise.all([
      prisma.stockMovement.count({ where: { supplierId: id } }),
      prisma.supplierPayment.count({ where: { supplierId: id } }),
      prisma.purchaseOrder.count({ where: { supplierId: id } }),
    ]);
    if (movementCount > 0 || paymentCount > 0 || orderCount > 0) {
      await prisma.supplier.update({ where: { id }, data: { isActive: false } });
      return res.json({ message: 'Supplier has stock/payment/order history, deactivated instead of deleted' });
    }
    await prisma.supplier.delete({ where: { id } });
    res.json({ message: 'Supplier deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, listAll, getOne, create, update, remove };
