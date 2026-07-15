const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');

// Payments are append-only: once recorded they aren't edited or deleted,
// consistent with how a running credit ledger should behave.
const create = async (req, res, next) => {
  try {
    const { customerId, amount, method, reference, notes } = req.body;
    const custId = Number(customerId);
    const amt = Number(amount);

    if (!custId) throw new AppError(400, 'customerId is required');
    if (!amt || amt <= 0) throw new AppError(400, 'A positive amount is required');

    const customer = await prisma.customer.findUnique({ where: { id: custId } });
    if (!customer) throw new AppError(404, 'Customer not found');

    const payment = await prisma.payment.create({
      data: {
        customerId: custId,
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
