const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');

const list = async (req, res, next) => {
  try {
    const { brandId, categoryId, search, lowStock, page = 1, limit = 20 } = req.query;

    const where = { isActive: true };
    if (brandId) where.brandId = Number(brandId);
    if (categoryId) where.categoryId = Number(categoryId);
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { partNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const pageNum = Math.max(1, Number(page));
    const take = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * take;

    if (lowStock === 'true') {
      // currentStock <= reorderLevel compares two columns, which Prisma's
      // query builder can't express — filter/paginate the low-stock subset in JS.
      const all = await prisma.product.findMany({
        where,
        include: { brand: true, category: true, supplier: true },
        orderBy: { name: 'asc' },
      });
      const filtered = all.filter((p) => p.currentStock <= p.reorderLevel);
      const total = filtered.length;

      return res.json({
        items: filtered.slice(skip, skip + take),
        total,
        page: pageNum,
        limit: take,
        totalPages: Math.ceil(total / take),
      });
    }

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { brand: true, category: true, supplier: true },
        orderBy: { name: 'asc' },
        skip,
        take,
      }),
      prisma.product.count({ where }),
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

const lowStock = async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { brand: true, category: true },
      orderBy: { name: 'asc' },
    });
    const items = products
      .filter((p) => p.currentStock <= p.reorderLevel)
      .sort((a, b) => (a.currentStock - a.reorderLevel) - (b.currentStock - b.reorderLevel));
    res.json({ items, total: items.length });
  } catch (err) {
    next(err);
  }
};

const toCode = (name) => name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 3) || 'GEN';

const suggestPartNumber = async (req, res, next) => {
  try {
    const { brandId, categoryId } = req.query;
    if (!brandId) throw new AppError(400, 'brandId is required');

    const brand = await prisma.brand.findUnique({ where: { id: Number(brandId) } });
    if (!brand) throw new AppError(404, 'Brand not found');

    let category = null;
    if (categoryId) {
      category = await prisma.category.findUnique({ where: { id: Number(categoryId) } });
      if (!category) throw new AppError(404, 'Category not found');
    }

    const prefix = `${toCode(brand.name)}-${category ? `${toCode(category.name)}-` : ''}`;

    const existing = await prisma.product.findMany({
      where: { partNumber: { startsWith: prefix } },
      select: { partNumber: true },
    });

    const suffixPattern = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\d+)$`);
    let maxSeq = 0;
    for (const { partNumber } of existing) {
      const match = partNumber.match(suffixPattern);
      if (match) maxSeq = Math.max(maxSeq, Number(match[1]));
    }

    res.json({ partNumber: `${prefix}${String(maxSeq + 1).padStart(4, '0')}` });
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: Number(req.params.id) },
      include: { brand: true, category: true },
    });
    if (!product) throw new AppError(404, 'Product not found');
    res.json(product);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const {
      partNumber, name, description, unit, brandId, categoryId, supplierId,
      costPrice, sellingPrice, currentStock, reorderLevel, condition,
    } = req.body;

    if (!partNumber || !name || !brandId) {
      throw new AppError(400, 'partNumber, name and brandId are required');
    }
    if (condition && !['NEW', 'RECONDITION'].includes(condition)) {
      throw new AppError(400, 'condition must be NEW or RECONDITION');
    }

    const product = await prisma.product.create({
      data: {
        partNumber,
        name,
        description,
        unit: unit || 'pcs',
        brandId: Number(brandId),
        categoryId: categoryId ? Number(categoryId) : null,
        supplierId: supplierId ? Number(supplierId) : null,
        costPrice: costPrice ?? 0,
        sellingPrice: sellingPrice ?? 0,
        currentStock: currentStock ?? 0,
        reorderLevel: reorderLevel ?? 5,
        condition: condition || 'NEW',
      },
    });
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const {
      partNumber, name, description, unit, brandId, categoryId, supplierId,
      costPrice, sellingPrice, reorderLevel, condition,
    } = req.body;

    if (condition && !['NEW', 'RECONDITION'].includes(condition)) {
      throw new AppError(400, 'condition must be NEW or RECONDITION');
    }

    const product = await prisma.product.update({
      where: { id: Number(req.params.id) },
      data: {
        partNumber,
        name,
        description,
        unit,
        brandId: brandId !== undefined ? Number(brandId) : undefined,
        categoryId: categoryId !== undefined ? (categoryId ? Number(categoryId) : null) : undefined,
        supplierId: supplierId !== undefined ? (supplierId ? Number(supplierId) : null) : undefined,
        costPrice,
        sellingPrice,
        reorderLevel,
        condition,
      },
    });
    res.json(product);
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const movementCount = await prisma.stockMovement.count({ where: { productId: id } });
    if (movementCount > 0) {
      await prisma.product.update({ where: { id }, data: { isActive: false } });
      return res.json({ message: 'Product has stock history, deactivated instead of deleted' });
    }
    await prisma.product.delete({ where: { id } });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, lowStock, suggestPartNumber, getOne, create, update, remove };
