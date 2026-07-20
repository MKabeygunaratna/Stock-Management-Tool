const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');

// Payments are append-only: once recorded they aren't edited or deleted,
// consistent with how a running credit ledger should behave.
const create = async (req, res, next) => {
  try {
    const { supplierId, amount, method, reference, notes } = req.body;
    const supId = Number(supplierId);
    const amt = Number(amount);

    if (!supId) throw new AppError(400, 'supplierId is required');
    if (!amt || amt <= 0) throw new AppError(400, 'A positive amount is required');

    const supplier = await prisma.supplier.findUnique({ where: { id: supId } });
    if (!supplier) throw new AppError(404, 'Supplier not found');

    const payment = await prisma.supplierPayment.create({
      data: {
        supplierId: supId,
        amount: amt,
        method: method || null,
        reference: reference || null,
        notes: notes || null,
        userId: req.user.id,
      },
      include: { user: { select: { id: true, fullName: true } } },
    });

    res.status(201).json(payment);
  } catch (err) {
    next(err);
  }
};

module.exports = { create };
