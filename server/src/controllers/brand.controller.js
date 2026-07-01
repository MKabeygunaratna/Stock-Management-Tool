const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');

const list = async (req, res, next) => {
  try {
    const brands = await prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    res.json(brands);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) throw new AppError(400, 'Name is required');
    const brand = await prisma.brand.create({ data: { name } });
    res.status(201).json(brand);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const brand = await prisma.brand.update({
      where: { id: Number(id) },
      data: { name },
    });
    res.json(brand);
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const productCount = await prisma.product.count({ where: { brandId: Number(id) } });
    if (productCount > 0) {
      await prisma.brand.update({ where: { id: Number(id) }, data: { isActive: false } });
      return res.json({ message: 'Brand has products, deactivated instead of deleted' });
    }
    await prisma.brand.delete({ where: { id: Number(id) } });
    res.json({ message: 'Brand deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, create, update, remove };
