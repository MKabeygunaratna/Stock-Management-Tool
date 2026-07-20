const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const withRetry = require('../utils/withRetry');

const stockIn = async (req, res, next) => {
  try {
    const { productId, quantity, reason, reference, supplierId, paidAmount } = req.body;
    const qty = Number(quantity);

    if (!productId || !qty || qty <= 0) {
      throw new AppError(400, 'productId and a positive quantity are required');
    }

    let paid;
    if (paidAmount !== undefined && paidAmount !== null && paidAmount !== '') {
      paid = Number(paidAmount);
      if (Number.isNaN(paid) || paid < 0) {
        throw new AppError(400, 'paidAmount must be zero or a positive number');
      }
    }
    if (paid !== undefined && !supplierId) {
      throw new AppError(400, 'supplierId is required when paidAmount is set');
    }

    const movement = await withRetry(() => prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: Number(productId) } });
      if (!product || !product.isActive) throw new AppError(404, 'Product not found');

      let supplier = null;
      if (supplierId) {
        supplier = await tx.supplier.findUnique({ where: { id: Number(supplierId) } });
        if (!supplier || !supplier.isActive) throw new AppError(404, 'Supplier not found');
      }

      const updated = await tx.product.update({
        where: { id: product.id },
        data: { currentStock: { increment: qty } },
      });

      // Total cost is fixed at the product's cost price at the time of this
      // stock-in, matching how the payable ledger values every credit movement.
      const totalCost = qty * Number(product.costPrice);
      const paidForThis = supplier ? Math.min(paid ?? 0, totalCost) : 0;
      const fullyPaid = supplier ? paidForThis >= totalCost - 0.005 : false;
      const paymentType = supplier ? (fullyPaid ? 'CASH' : 'CREDIT') : null;

      const created = await tx.stockMovement.create({
        data: {
          productId: product.id,
          userId: req.user.id,
          type: 'IN',
          quantity: qty,
          unitPrice: product.costPrice,
          costPrice: product.costPrice,
          reason: reason || null,
          reference: reference || null,
          stockAfter: updated.currentStock,
          supplierId: supplier?.id || null,
          paymentType,
        },
        include: { product: true, supplier: true },
      });

      // A partial payment made on a credit stock-in: record it immediately so
      // the supplier's payable balance already reflects only the remainder.
      if (supplier && paymentType === 'CREDIT' && paidForThis > 0.005) {
        await tx.supplierPayment.create({
          data: {
            supplierId: supplier.id,
            amount: paidForThis,
            method: 'Cash',
            reference: reference || null,
            notes: `Paid at stock-in of ${qty} x ${product.name}`,
            userId: req.user.id,
          },
        });
      }

      return created;
    }, { timeout: 15000 }));

    res.status(201).json(movement);
  } catch (err) {
    next(err);
  }
};

const stockOut = async (req, res, next) => {
  try {
    const { buyerName, buyerCompany, customerId, reference, notes, items } = req.body;

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

    const invoice = await withRetry(() => prisma.$transaction(async (tx) => {
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

      let customer = null;
      if (customerId) {
        customer = await tx.customer.findUnique({ where: { id: Number(customerId) } });
        if (!customer || !customer.isActive) {
          throw new AppError(404, 'Customer not found');
        }
      }

      const draftInvoice = await tx.invoice.create({
        data: {
          invoiceNumber: 'PENDING',
          buyerName,
          buyerCompany: buyerCompany || null,
          customerId: customer?.id || null,
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
            costPrice: product.costPrice,
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
          customer: true,
        },
      });
    }, { timeout: 20000, maxWait: 10000 }));

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
