const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');

const stockIn = async (req, res, next) => {
  try {
    const { productId, quantity, reason, reference } = req.body;
    const qty = Number(quantity);

    if (!productId || !qty || qty <= 0) {
      throw new AppError(400, 'productId and a positive quantity are required');
    }

    const movement = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: Number(productId) } });
      if (!product || !product.isActive) throw new AppError(404, 'Product not found');

      const updated = await tx.product.update({
        where: { id: product.id },
        data: { currentStock: { increment: qty } },
      });

      return tx.stockMovement.create({
        data: {
          productId: product.id,
          userId: req.user.id,
          type: 'IN',
          quantity: qty,
          unitPrice: product.costPrice,
          reason: reason || null,
          reference: reference || null,
          stockAfter: updated.currentStock,
        },
        include: { product: true },
      });
    });

    res.status(201).json(movement);
  } catch (err) {
    next(err);
  }
};

const stockOut = async (req, res, next) => {
  try {
    const { buyerName, buyerCompany, reference, notes, items } = req.body;

    if (!buyerName) {
      throw new AppError(400, 'Buyer name is required');
    }
    if (!Array.isArray(items) || items.length === 0) {
      throw new AppError(400, 'At least one item is required');
    }

    const normalizedItems = items.map((item) => ({
      productId: Number(item.productId),
      quantity: Number(item.quantity),
    }));

    for (const item of normalizedItems) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        throw new AppError(400, 'Each item requires a productId and a positive quantity');
      }
    }

    const invoice = await prisma.$transaction(async (tx) => {
      // Validate every line before mutating anything (all-or-nothing)
      const products = new Map();
      for (const item of normalizedItems) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product || !product.isActive) {
          throw new AppError(404, `Product ${item.productId} not found`);
        }
        if (product.currentStock < item.quantity) {
          throw new AppError(400, `Insufficient stock for ${product.name}. Available: ${product.currentStock}`);
        }
        products.set(item.productId, product);
      }

      const draftInvoice = await tx.invoice.create({
        data: {
          invoiceNumber: 'PENDING',
          buyerName,
          buyerCompany: buyerCompany || null,
          userId: req.user.id,
          totalAmount: 0,
        },
      });

      let totalAmount = 0;
      for (const item of normalizedItems) {
        const product = products.get(item.productId);
        const updated = await tx.product.update({
          where: { id: product.id },
          data: { currentStock: { decrement: item.quantity } },
        });

        const unitPrice = Number(product.sellingPrice);
        totalAmount += unitPrice * item.quantity;

        await tx.stockMovement.create({
          data: {
            productId: product.id,
            userId: req.user.id,
            type: 'OUT',
            quantity: item.quantity,
            unitPrice: product.sellingPrice,
            reason: notes || null,
            reference: reference || null,
            stockAfter: updated.currentStock,
            invoiceId: draftInvoice.id,
          },
        });
      }

      return tx.invoice.update({
        where: { id: draftInvoice.id },
        data: {
          invoiceNumber: `INV-${String(draftInvoice.id).padStart(6, '0')}`,
          totalAmount,
        },
        include: {
          movements: { include: { product: { include: { brand: true } } } },
          user: { select: { id: true, username: true, fullName: true } },
        },
      });
    });

    res.status(201).json(invoice);
  } catch (err) {
    next(err);
  }
};

const history = async (req, res, next) => {
  try {
    const { brandId, productId, type, from, to, page = 1, limit = 20 } = req.query;

    const where = {};
    if (productId) where.productId = Number(productId);
    if (type) where.type = type;
    if (brandId) where.product = { brandId: Number(brandId) };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const pageNum = Math.max(1, Number(page));
    const take = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * take;

    const [items, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: {
          product: { include: { brand: true, category: true } },
          user: { select: { id: true, username: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.stockMovement.count({ where }),
    ]);

    res.json({
      items,
      total,
      page: pageNum,
      limit: take,
      totalPages: Math.ceil(total / take),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { stockIn, stockOut, history };
