const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const { hashPassword } = require('../utils/password');

const toPublicUser = (user) => ({
  id: user.id,
  username: user.username,
  fullName: user.fullName,
  role: user.role,
  isActive: user.isActive,
  createdAt: user.createdAt,
});

const list = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
    res.json(users.map(toPublicUser));
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { username, password, fullName, role } = req.body;
    if (!username || !password || !fullName) {
      throw new AppError(400, 'username, password and fullName are required');
    }
    if (role && !['ADMIN', 'STAFF'].includes(role)) {
      throw new AppError(400, 'role must be ADMIN or STAFF');
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { username, passwordHash, fullName, role: role || 'STAFF' },
    });
    res.status(201).json(toPublicUser(user));
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { fullName, role, isActive, password } = req.body;
    const data = { fullName, role, isActive };

    if (password) {
      data.passwordHash = await hashPassword(password);
    }

    const user = await prisma.user.update({
      where: { id: Number(req.params.id) },
      data,
    });
    res.json(toPublicUser(user));
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (id === req.user.id) {
      throw new AppError(400, 'You cannot disable your own account');
    }
    await prisma.user.update({ where: { id }, data: { isActive: false } });
    res.json({ message: 'User disabled' });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, create, update, remove };
