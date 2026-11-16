let activePasswordOperations = 0;
const MAX_ACTIVE_OPERATIONS = 2;

export function limitPasswordWork(_request, response, next) {
  if (activePasswordOperations >= MAX_ACTIVE_OPERATIONS) {
    response.set('Retry-After', '2');
    response.status(503).json({
      code: 'AUTHENTICATION_BUSY',
      message: 'El servicio de autenticación está ocupado. Intenta de nuevo en unos segundos.',
    });
    return;
  }

  activePasswordOperations += 1;
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    activePasswordOperations = Math.max(0, activePasswordOperations - 1);
  };
  response.once('finish', release);
  response.once('close', release);
  next();
}
