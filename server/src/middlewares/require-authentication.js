import { findSession } from '../models/accounts-model.js';
import { clearSessionCookie, getSessionToken, hashSessionToken } from '../utils/session-cookie.js';

export async function requireAuthentication(request, response, next) {
  const token = getSessionToken(request);
  if (!token || !/^[A-Za-z0-9_-]{40,50}$/.test(token)) {
    clearSessionCookie(response);
    response
      .status(401)
      .json({ code: 'AUTHENTICATION_REQUIRED', message: 'Inicia sesión para continuar.' });
    return;
  }

  try {
    const sessionHash = hashSessionToken(token);
    const user = await findSession(sessionHash);
    if (!user) {
      clearSessionCookie(response);
      response
        .status(401)
        .json({ code: 'SESSION_EXPIRED', message: 'La sesión no es válida o expiró.' });
      return;
    }
    request.authenticatedUser = {
      id: String(user.id),
      email: user.email,
      displayName: user.displayName,
    };
    next();
  } catch (error) {
    next(error);
  }
}
