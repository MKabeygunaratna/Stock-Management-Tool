const prisma = require('../config/prisma');

const list = async (req, res, next) => {
  try {
    const { userId, success, page = 1, limit = 20 } = req.query;

    const where = {};
    if (userId) where.userId = Number(userId);
    if (success === 'true') where.success = true;
    if (success === 'false') where.success = false;

    const pageNum = Math.max(1, Number(page));
    const take = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * take;

    const [items, total] = await Promise.all([
      prisma.loginLog.findMany({
        where,
        include: { user: { select: { id: true, username: true, fullName: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.loginLog.count({ where }),
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

module.exports = { list };
