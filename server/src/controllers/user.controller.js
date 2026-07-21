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

const countActiveAdmins = () => prisma.user.count({ where: { role: 'ADMIN', isActive: true } });

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
    const id = Number(req.params.id);
    const { fullName, role, isActive, password } = req.body;
    if (role !== undefined && !['ADMIN', 'STAFF'].includes(role)) {
      throw new AppError(400, 'role must be ADMIN or STAFF');
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) throw new AppError(404, 'User not found');

    const wasActiveAdmin = target.role === 'ADMIN' && target.isActive;
    const willBeActiveAdmin =
      (role !== undefined ? role : target.role) === 'ADMIN' &&
      (isActive !== undefined ? isActive : target.isActive);
    if (wasActiveAdmin && !willBeActiveAdmin && (await countActiveAdmins()) <= 1) {
      throw new AppError(400, 'At least one active admin must remain. Promote another user to admin first.');
    }

    const data = { fullName, role, isActive };
    if (password) {
      data.passwordHash = await hashPassword(password);
    }

    const user = await prisma.user.update({ where: { id }, data });
    res.json(toPublicUser(user));
  } catch (err) {
    next(err);
  }
};

const setStatus = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      throw new AppError(400, 'isActive must be true or false');
    }
    if (id === req.user.id && !isActive) {
      throw new AppError(400, 'You cannot disable your own account');
    }

    if (!isActive) {
      const target = await prisma.user.findUnique({ where: { id } });
      if (target?.role === 'ADMIN' && target.isActive && (await countActiveAdmins()) <= 1) {
        throw new AppError(400, 'Cannot disable the only active admin. Promote another user to admin first.');
      }
    }

    const user = await prisma.user.update({ where: { id }, data: { isActive } });
    res.json(toPublicUser(user));
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (id === req.user.id) {
      throw new AppError(400, 'You cannot delete your own account');
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) throw new AppError(404, 'User not found');
    if (target.role === 'ADMIN' && target.isActive && (await countActiveAdmins()) <= 1) {
      throw new AppError(400, 'Cannot delete the only active admin. Promote another user to admin first.');
    }

    await prisma.$transaction(async (tx) => {
      await tx.refreshToken.deleteMany({ where: { userId: id } });
      await tx.user.delete({ where: { id } });
    });

    res.json({ message: 'User deleted' });
  } catch (err) {
    const isFkViolation = err.code === 'P2003' || /foreign key constraint/i.test(err.message || '');
    if (isFkViolation) {
      return next(new AppError(409, 'Cannot delete this user because they have stock movements or invoices on record. Disable the account instead.'));
    }
    next(err);
  }
};

module.exports = { list, create, update, setStatus, remove };
