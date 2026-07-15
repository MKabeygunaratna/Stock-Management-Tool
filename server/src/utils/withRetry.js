// Neon's serverless Postgres suspends after inactivity; the first query after
// a cold start can drop with P1001/P1017 and only succeeds on retry.
const RETRYABLE_CODES = new Set(['P1001', 'P1017']);
const RETRYABLE_MESSAGE = /Can't reach database server|Server has closed the connection/;

const withRetry = async (fn, attempts = 3, delayMs = 300) => {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      const isRetryable = RETRYABLE_CODES.has(err.code) || RETRYABLE_MESSAGE.test(err.message || '');
      if (!isRetryable || i === attempts - 1) throw err;
      await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
    }
  }
};

module.exports = withRetry;
