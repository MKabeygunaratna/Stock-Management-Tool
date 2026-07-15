const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const withRetry = require('../utils/withRetry');
const { streamPurchaseOrderPdf } = require('../utils/generatePurchaseOrderPdf');

const toItemOutput = (item) => ({
  id: item.id,
  productId: item.productId,
  partNumber: item.partNumber,
  name: item.name,
  brandName: item.brandName,
  condition: item.condition,
  quantity: item.quantity,
  estimatedCost: item.estimatedCost,
  isNew: item.productId === null,
});

const list = async (req, res, next) => {
  try {
    const { search, from, to, page = 1, limit = 20 } = req.query;

    const where = {};
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { supplierName: { contains: search, mode: 'insensitive' } },
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
      prisma.purchaseOrder.findMany({
        where,
        include: {
          items: { select: { id: true } },
          user: { select: { id: true, username: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    res.json({
      items: items.map(({ items: lines, ...order }) => ({ ...order, itemCount: lines.length })),
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
    const order = await prisma.purchaseOrder.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        items: true,
        user: { select: { id: true, username: true, fullName: true } },
      },
    });
    if (!order) throw new AppError(404, 'Purchase order not found');
    res.json({ ...order, items: order.items.map(toItemOutput) });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { supplierName, notes, items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      throw new AppError(400, 'At least one item is required');
    }

    const normalizedItems = items.map((item) => ({
      productId: item.productId ? Number(item.productId) : null,
      partNumber: item.partNumber || null,
      name: item.name || null,
      brandName: item.brandName || null,
      condition: item.condition || 'NEW',
      quantity: Number(item.quantity),
      estimatedCost: Number(item.estimatedCost) || 0,
    }));

    for (const item of normalizedItems) {
      if (!item.productId && !item.name) {
        throw new AppError(400, 'Each new item requires a name');
      }
      if (!item.quantity || item.quantity <= 0) {
        throw new AppError(400, 'Each item requires a positive quantity');
      }
      if (!['NEW', 'RECONDITION'].includes(item.condition)) {
        throw new AppError(400, 'condition must be NEW or RECONDITION');
      }
    }

    const order = await withRetry(() => prisma.$transaction(async (tx) => {
      const productIds = normalizedItems.filter((i) => i.productId).map((i) => i.productId);
      const products = productIds.length
        ? await tx.product.findMany({ where: { id: { in: productIds } }, include: { brand: true } })
        : [];
      const productMap = new Map(products.map((p) => [p.id, p]));

      const draftOrder = await tx.purchaseOrder.create({
        data: {
          orderNumber: 'PENDING',
          supplierName: supplierName || null,
          notes: notes || null,
          userId: req.user.id,
          totalEstimatedCost: 0,
        },
      });

      let totalEstimatedCost = 0;
      for (const item of normalizedItems) {
        const product = item.productId ? productMap.get(item.productId) : null;
        if (item.productId && !product) {
          throw new AppError(404, `Product ${item.productId} not found`);
        }

        totalEstimatedCost += item.estimatedCost * item.quantity;

        await tx.purchaseOrderItem.create({
          data: {
            purchaseOrderId: draftOrder.id,
            productId: product ? product.id : null,
            partNumber: product ? product.partNumber : item.partNumber,
            name: product ? product.name : item.name,
            brandName: product ? product.brand.name : item.brandName,
            condition: product ? product.condition : item.condition,
            quantity: item.quantity,
            estimatedCost: item.estimatedCost,
          },
        });
      }

      return tx.purchaseOrder.update({
        where: { id: draftOrder.id },
        data: {
          orderNumber: `PO-${String(draftOrder.id).padStart(6, '0')}`,
          totalEstimatedCost,
        },
        include: {
          items: true,
          user: { select: { id: true, username: true, fullName: true } },
        },
      });
    }));

    res.status(201).json({ ...order, items: order.items.map(toItemOutput) });
  } catch (err) {
    next(err);
  }
};

const pdf = async (req, res, next) => {
  try {
    const order = await prisma.purchaseOrder.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        items: true,
        user: { select: { id: true, username: true, fullName: true } },
      },
    });
    if (!order) throw new AppError(404, 'Purchase order not found');
    streamPurchaseOrderPdf({ ...order, items: order.items.map(toItemOutput) }, res);
  } catch (err) {
    next(err);
  }
};

module.exports = { list, getOne, create, pdf };
