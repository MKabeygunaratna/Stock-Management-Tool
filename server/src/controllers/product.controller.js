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

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { brand: true, category: true },
        orderBy: { name: 'asc' },
        skip,
        take,
      }),
      prisma.product.count({ where }),
    ]);

    const filtered = lowStock === 'true'
      ? items.filter((p) => p.currentStock <= p.reorderLevel)
      : items;

    res.json({
      items: filtered,
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
      partNumber, name, description, unit, brandId, categoryId,
      costPrice, sellingPrice, currentStock, reorderLevel,
    } = req.body;

    if (!partNumber || !name || !brandId) {
      throw new AppError(400, 'partNumber, name and brandId are required');
    }

    const product = await prisma.product.create({
      data: {
        partNumber,
        name,
        description,
        unit: unit || 'pcs',
        brandId: Number(brandId),
        categoryId: categoryId ? Number(categoryId) : null,
        costPrice: costPrice ?? 0,
        sellingPrice: sellingPrice ?? 0,
        currentStock: currentStock ?? 0,
        reorderLevel: reorderLevel ?? 5,
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
      partNumber, name, description, unit, brandId, categoryId,
      costPrice, sellingPrice, reorderLevel,
    } = req.body;

    const product = await prisma.product.update({
      where: { id: Number(req.params.id) },
      data: {
        partNumber,
        name,
        description,
        unit,
        brandId: brandId !== undefined ? Number(brandId) : undefined,
        categoryId: categoryId !== undefined ? (categoryId ? Number(categoryId) : null) : undefined,
        costPrice,
        sellingPrice,
        reorderLevel,
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

module.exports = { list, getOne, create, update, remove };
