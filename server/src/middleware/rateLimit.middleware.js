function createRateLimit({ windowMs, max }) {
  const hits = new Map();

  return (req, res, next) => {
    const key = `${req.ip}:${req.baseUrl || req.path}`;
    const now = Date.now();
    const bucket = hits.get(key) || { count: 0, resetAt: now + windowMs };

    if (now > bucket.resetAt) {
      bucket.count = 0;
      bucket.resetAt = now + windowMs;
    }

    bucket.count += 1;
    hits.set(key, bucket);

    if (bucket.count > max) {
      return res.status(429).json({
        message: "Too many requests. Please try again later.",
      });
    }

    next();
  };
}

const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
});

const uploadRateLimit = createRateLimit({
  windowMs: 60 * 1000,
  max: 30,
});

module.exports = {
  createRateLimit,
  authRateLimit,
  uploadRateLimit,
};