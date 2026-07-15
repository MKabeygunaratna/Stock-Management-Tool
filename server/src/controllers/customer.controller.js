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

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({ where, orderBy: { name: 'asc' }, skip, take }),
      prisma.customer.count({ where }),
    ]);

    const customerIds = customers.map((c) => c.id);
    const [invoiceSums, paymentSums] = await Promise.all([
      customerIds.length
        ? prisma.invoice.groupBy({ by: ['customerId'], where: { customerId: { in: customerIds } }, _sum: { totalAmount: true } })
        : [],
      customerIds.length
        ? prisma.payment.groupBy({ by: ['customerId'], where: { customerId: { in: customerIds } }, _sum: { amount: true } })
        : [],
    ]);
    const invoiceMap = new Map(invoiceSums.map((r) => [r.customerId, Number(r._sum.totalAmount || 0)]));
    const paymentMap = new Map(paymentSums.map((r) => [r.customerId, Number(r._sum.amount || 0)]));

    const items = customers.map((c) => ({
      ...c,
      balance: (invoiceMap.get(c.id) || 0) - (paymentMap.get(c.id) || 0),
    }));

    res.json({ items, total, page: pageNum, limit: take, totalPages: Math.ceil(total / take) });
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new AppError(404, 'Customer not found');

    const [invoices, payments] = await Promise.all([
      prisma.invoice.findMany({
        where: { customerId: id },
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { id: true, fullName: true } } },
      }),
      prisma.payment.findMany({
        where: { customerId: id },
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { id: true, fullName: true } } },
      }),
    ]);

    const entries = [
      ...invoices.map((inv) => ({
        type: 'INVOICE',
        id: inv.id,
        date: inv.createdAt,
        reference: inv.invoiceNumber,
        notes: null,
        debit: Number(inv.totalAmount),
        credit: 0,
        by: inv.user.fullName,
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

    const totalInvoiced = invoices.reduce((s, i) => s + Number(i.totalAmount), 0);
    const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);

    res.json({
      customer,
      totalInvoiced,
      totalPaid,
      balance: totalInvoiced - totalPaid,
      ledger,
    });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { name, company, phone, address, creditLimit } = req.body;
    if (!name) throw new AppError(400, 'Customer name is required');

    const customer = await prisma.customer.create({
      data: {
        name,
        company: company || null,
        phone: phone || null,
        address: address || null,
        creditLimit: creditLimit !== undefined && creditLimit !== '' ? creditLimit : null,
      },
    });
    res.status(201).json(customer);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { name, company, phone, address, creditLimit, isActive } = req.body;
    const customer = await prisma.customer.update({
      where: { id: Number(req.params.id) },
      data: {
        name,
        company,
        phone,
        address,
        creditLimit: creditLimit !== undefined && creditLimit !== '' ? creditLimit : creditLimit === '' ? null : undefined,
        isActive,
      },
    });
    res.json(customer);
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [invoiceCount, paymentCount] = await Promise.all([
      prisma.invoice.count({ where: { customerId: id } }),
      prisma.payment.count({ where: { customerId: id } }),
    ]);
    if (invoiceCount > 0 || paymentCount > 0) {
      await prisma.customer.update({ where: { id }, data: { isActive: false } });
      return res.json({ message: 'Customer has invoice/payment history, deactivated instead of deleted' });
    }
    await prisma.customer.delete({ where: { id } });
    res.json({ message: 'Customer deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, getOne, create, update, remove };
