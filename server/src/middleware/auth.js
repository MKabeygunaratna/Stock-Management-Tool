const AppError = require('../utils/AppError');
const { verifyToken } = require('../utils/jwt');

const auth = (req, res, next) => {
  const token = req.cookies?.accessToken;
  if (!token) {
    return next(new AppError(401, 'Not authenticated'));
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.id, username: payload.username, role: payload.role };
    next();
  } catch (err) {
    next(new AppError(401, 'Invalid or expired token'));
  }
};

module.exports = auth;
