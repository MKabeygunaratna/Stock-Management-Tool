const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const { comparePassword } = require('../utils/password');
const { getClientIp, getClientMac } = require('../utils/network');
const {
  REFRESH_TOKEN_TTL_MS,
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  setAuthCookies,
  clearAuthCookies,
} = require('../utils/tokens');

// Reuse of a just-rotated token within this window is treated as a duplicate/concurrent
// request rather than theft (e.g. two requests firing back-to-back as the access token expires).
const REUSE_GRACE_PERIOD_MS = 60 * 1000;

const toPublicUser = (user) => ({
  id: user.id,
  username: user.username,
  fullName: user.fullName,
  role: user.role,
  isActive: user.isActive,
  notificationsEnabled: user.notificationsEnabled,
});

const issueSession = async (res, user) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });

  setAuthCookies(res, accessToken, refreshToken);
};

const rotateToken = async (res, user, oldRowId) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();

  const newRow = await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });
  await prisma.refreshToken.update({
    where: { id: oldRowId },
    data: { revokedAt: new Date(), replacedById: newRow.id },
  });

  setAuthCookies(res, accessToken, refreshToken);
};

const login = async (req, res, next) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      throw new AppError(400, 'Username and password are required');
    }

    const ipAddress = getClientIp(req);
    const macAddress = await getClientMac(ipAddress);
    const userAgent = req.headers['user-agent'] || null;
    const logAttempt = (success, userId) =>
      prisma.loginLog.create({
        data: { userId: userId || null, username, success, ipAddress, macAddress, userAgent },
      }).catch(() => {});
      // Best-effort: a logging failure should never block a login.

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !user.isActive) {
      await logAttempt(false, null);
      throw new AppError(401, 'Invalid username or password');
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      await logAttempt(false, user.id);
      throw new AppError(401, 'Invalid username or password');
    }

    await issueSession(res, user);
    await logAttempt(true, user.id);
    res.json({ user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) throw new AppError(401, 'Not authenticated');

    const tokenHash = hashToken(token);
    let stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!stored) {
      clearAuthCookies(res);
      throw new AppError(401, 'Session expired, please log in again');
    }

    if (stored.revokedAt) {
      const withinGrace = Date.now() - stored.revokedAt.getTime() < REUSE_GRACE_PERIOD_MS;

      if (withinGrace && stored.replacedById) {
        // Likely a duplicate/concurrent request racing the rotation, not theft — follow the
        // chain to whatever token currently supersedes this one and rotate that instead.
        let current = await prisma.refreshToken.findUnique({ where: { id: stored.replacedById } });
        while (current?.revokedAt && current.replacedById) {
          current = await prisma.refreshToken.findUnique({ where: { id: current.replacedById } });
        }
        if (!current || current.revokedAt || current.expiresAt < new Date()) {
          clearAuthCookies(res);
          throw new AppError(401, 'Session expired, please log in again');
        }
        stored = current;
      } else {
        // Reuse of a stale, already-rotated token — likely theft. Revoke the whole session family.
        await prisma.refreshToken.updateMany({
          where: { userId: stored.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        clearAuthCookies(res);
        throw new AppError(401, 'Session invalidated, please log in again');
      }
    }

    if (stored.expiresAt < new Date()) {
      clearAuthCookies(res);
      throw new AppError(401, 'Session expired, please log in again');
    }

    const user = await prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user || !user.isActive) {
      clearAuthCookies(res);
      throw new AppError(401, 'Not authenticated');
    }

    await rotateToken(res, user, stored.id);
    res.json({ user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      const tokenHash = hashToken(token);
      await prisma.refreshToken.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    clearAuthCookies(res);
    res.json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
};

const me = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || !user.isActive) {
      throw new AppError(401, 'Not authenticated');
    }
    res.json({ user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
};

const updateNotificationPreference = async (req, res, next) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
      throw new AppError(400, 'enabled must be a boolean');
    }
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { notificationsEnabled: enabled },
    });
    res.json({ user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, refresh, logout, me, updateNotificationPreference };
