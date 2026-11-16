const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:4200')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);

export function requireAllowedOrigin(request, response, next) {
  if (safeMethods.has(request.method)) {
    next();
    return;
  }

  const origin = request.get('origin');
  if (origin && !allowedOrigins.includes(origin.replace(/\/+$/, ''))) {
    response.status(403).json({
      code: 'ORIGIN_NOT_ALLOWED',
      message: 'El origen de esta solicitud no está permitido.',
    });
    return;
  }
  next();
}
