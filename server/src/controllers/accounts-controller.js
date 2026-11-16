import {
  anonymizeAccount,
  getAccountById,
  getAccountCredentials,
  updateAccount,
} from '../models/accounts-model.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import {
  clearSessionCookie,
  createSessionExpiry,
  createSessionToken,
  hashSessionToken,
  setSessionCookie,
} from '../utils/session-cookie.js';

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function validEmail(email) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validPassword(password) {
  return (
    typeof password === 'string' &&
    [...password].length >= 12 &&
    Buffer.byteLength(password, 'utf8') <= 256
  );
}

function parseObject(body) {
  return body !== null && typeof body === 'object' && !Array.isArray(body);
}

async function verifyCurrentPassword(userId, password) {
  const credentials = await getAccountCredentials(userId);
  if (!credentials?.passwordHash || typeof password !== 'string') return false;
  return verifyPassword(password, credentials.passwordHash);
}

export async function getMyAccount(request, response, next) {
  try {
    const account = await getAccountById(request.authenticatedUser.id);
    if (!account) {
      response
        .status(404)
        .json({ code: 'ACCOUNT_NOT_FOUND', message: 'No se encontró la cuenta.' });
      return;
    }
    response.json({ account });
  } catch (error) {
    next(error);
  }
}

export async function patchMyAccount(request, response, next) {
  try {
    if (!parseObject(request.body)) {
      response
        .status(400)
        .json({ code: 'INVALID_ACCOUNT', message: 'El cuerpo debe ser un objeto JSON.' });
      return;
    }
    const allowed = new Set(['displayName', 'email', 'currentPassword', 'newPassword']);
    if (Object.keys(request.body).some((key) => !allowed.has(key))) {
      response
        .status(400)
        .json({ code: 'INVALID_ACCOUNT', message: 'La solicitud contiene campos no permitidos.' });
      return;
    }

    const displayName =
      request.body.displayName === undefined
        ? undefined
        : typeof request.body.displayName === 'string'
          ? request.body.displayName.trim()
          : null;
    const email =
      request.body.email === undefined
        ? undefined
        : typeof request.body.email === 'string'
          ? normalizeEmail(request.body.email)
          : null;
    const newPassword = request.body.newPassword;
    const currentPassword = request.body.currentPassword;

    if (
      displayName === null ||
      (displayName !== undefined && (displayName.length < 1 || displayName.length > 120))
    ) {
      response.status(400).json({
        code: 'INVALID_DISPLAY_NAME',
        message: 'El nombre debe tener entre 1 y 120 caracteres.',
      });
      return;
    }
    if (email === null || (email !== undefined && !validEmail(email))) {
      response
        .status(400)
        .json({ code: 'INVALID_EMAIL', message: 'El correo no tiene un formato válido.' });
      return;
    }
    if (newPassword !== undefined && !validPassword(newPassword)) {
      response.status(400).json({
        code: 'INVALID_PASSWORD',
        message: 'La nueva contraseña debe tener al menos 12 caracteres y como máximo 256 bytes.',
      });
      return;
    }
    if (displayName === undefined && email === undefined && newPassword === undefined) {
      response
        .status(400)
        .json({ code: 'EMPTY_UPDATE', message: 'Incluye al menos un campo para actualizar.' });
      return;
    }
    if (
      (email !== undefined || newPassword !== undefined) &&
      !(await verifyCurrentPassword(request.authenticatedUser.id, currentPassword))
    ) {
      response.status(401).json({
        code: 'CURRENT_PASSWORD_REQUIRED',
        message: 'La contraseña actual es incorrecta o requerida para este cambio.',
      });
      return;
    }

    const rotatesSession = email !== undefined || newPassword !== undefined;
    const newToken = rotatesSession ? createSessionToken() : null;
    const account = await updateAccount({
      userId: request.authenticatedUser.id,
      displayName,
      email,
      ...(newPassword !== undefined ? { passwordHash: await hashPassword(newPassword) } : {}),
      ...(newToken
        ? {
            newSession: {
              sessionHash: hashSessionToken(newToken),
              expiresAt: createSessionExpiry(),
            },
          }
        : {}),
    });
    if (!account) {
      response
        .status(404)
        .json({ code: 'ACCOUNT_NOT_FOUND', message: 'No se encontró la cuenta.' });
      return;
    }
    if (newToken) setSessionCookie(response, newToken);
    response.json({ account });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      response
        .status(409)
        .json({ code: 'EMAIL_ALREADY_REGISTERED', message: 'Ese correo ya está registrado.' });
      return;
    }
    next(error);
  }
}

export async function deleteMyAccount(request, response, next) {
  try {
    if (!parseObject(request.body) || typeof request.body.currentPassword !== 'string') {
      response.status(400).json({
        code: 'CURRENT_PASSWORD_REQUIRED',
        message: 'Confirma la contraseña actual para eliminar la cuenta.',
      });
      return;
    }
    if (
      !(await verifyCurrentPassword(request.authenticatedUser.id, request.body.currentPassword))
    ) {
      response
        .status(401)
        .json({ code: 'INVALID_CREDENTIALS', message: 'La contraseña actual es incorrecta.' });
      return;
    }
    const deleted = await anonymizeAccount({ userId: request.authenticatedUser.id });
    if (!deleted) {
      response
        .status(404)
        .json({ code: 'ACCOUNT_NOT_FOUND', message: 'No se encontró la cuenta.' });
      return;
    }
    clearSessionCookie(response);
    response.status(204).end();
  } catch (error) {
    next(error);
  }
}
