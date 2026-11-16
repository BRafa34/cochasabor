const windows = new Map();

export function rateLimit({ limit, windowMs }) {
  return (request, response, next) => {
    const key = request.ip ?? 'unknown';
    const now = Date.now();
    let entry = windows.get(key);
    if (!entry || entry.expiresAt <= now) {
      entry = { count: 0, expiresAt: now + windowMs };
      windows.set(key, entry);
    }
    if (entry.count >= limit) {
      response.set('Retry-After', String(Math.max(1, Math.ceil((entry.expiresAt - now) / 1000))));
      response.status(429).json({
        code: 'RATE_LIMITED',
        message: 'Demasiados intentos. Espera antes de volver a intentar.',
      });
      return;
    }
    entry.count += 1;
    if (windows.size > 5000) {
      for (const [storedKey, storedEntry] of windows) {
        if (storedEntry.expiresAt <= now) windows.delete(storedKey);
      }
    }
    next();
  };
}
