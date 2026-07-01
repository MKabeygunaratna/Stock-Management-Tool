const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const { streamInvoicePdf } = require('../utils/generateInvoicePdf');

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
          user: { select: { id: true, username: true, fullName: true } },
          movements: { select: { id: true, quantity: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.invoice.count({ where }),
    ]);

    const withItemCount = items.map((inv) => ({ ...inv, itemCount: inv.movements.length }));

    res.json({
      items: withItemCount,
      total,
      page: pageNum,
      limit: take,
      totalPages: Math.ceil(total / take),
    });
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        movements: { include: { product: { include: { brand: true } } } },
        user: { select: { id: true, username: true, fullName: true } },
      },
    });
    if (!invoice) throw new AppError(404, 'Invoice not found');
    res.json(invoice);
  } catch (err) {
    next(err);
  }
};

const pdf = async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        movements: { include: { product: { include: { brand: true } } } },
        user: { select: { id: true, username: true, fullName: true } },
      },
    });
    if (!invoice) throw new AppError(404, 'Invoice not found');
    streamInvoicePdf(invoice, res);
  } catch (err) {
    next(err);
  }
};

module.exports = { list, getOne, pdf };
