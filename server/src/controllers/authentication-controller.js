import { randomBytes } from 'node:crypto';
import {
  createAccount,
  createSession,
  findLoginAccount,
  revokeSession,
} from '../models/accounts-model.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import {
  clearSessionCookie,
  createSessionExpiry,
  createSessionToken,
  getSessionToken,
  hashSessionToken,
  setSessionCookie,
} from '../utils/session-cookie.js';

let dummyHashPromise;
function getDummyHash() {
  dummyHashPromise ??= hashPassword(`not-a-real-account-${randomBytes(24).toString('hex')}`);
  return dummyHashPromise;
}

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

export async function register(request, response, next) {
  try {
    const email = normalizeEmail(request.body?.email);
    const displayName =
      typeof request.body?.displayName === 'string' ? request.body.displayName.trim() : '';
    const password = request.body?.password;
    if (
      !validEmail(email) ||
      displayName.length < 1 ||
      displayName.length > 120 ||
      !validPassword(password)
    ) {
      response.status(400).json({
        code: 'INVALID_ACCOUNT',
        message:
          'Proporciona un correo válido, un nombre de hasta 120 caracteres y una contraseña de al menos 12 caracteres.',
      });
      return;
    }

    const account = await createAccount({
      email,
      displayName,
      passwordHash: await hashPassword(password),
    });
    response.status(201).json({ account });
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

export async function login(request, response, next) {
  try {
    const email = normalizeEmail(request.body?.email);
    const password = request.body?.password;
    if (
      !validEmail(email) ||
      typeof password !== 'string' ||
      Buffer.byteLength(password, 'utf8') > 256
    ) {
      response
        .status(401)
        .json({ code: 'INVALID_CREDENTIALS', message: 'Correo o contraseña incorrectos.' });
      return;
    }

    const account = await findLoginAccount(email);
    const passwordHash = account?.passwordHash ?? (await getDummyHash());
    const valid = await verifyPassword(password, passwordHash);
    if (!account || !account.passwordHash || !valid) {
      response
        .status(401)
        .json({ code: 'INVALID_CREDENTIALS', message: 'Correo o contraseña incorrectos.' });
      return;
    }

    const token = createSessionToken();
    const sessionHash = hashSessionToken(token);
    const expiresAt = createSessionExpiry();
    await createSession({ sessionHash, userId: account.id, expiresAt });
    setSessionCookie(response, token);
    response.json({
      account: {
        id: String(account.id),
        email: account.email,
        displayName: account.displayName,
        createdAt: account.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(request, response, next) {
  try {
    const token = getSessionToken(request);
    if (token && /^[A-Za-z0-9_-]{40,50}$/.test(token)) {
      await revokeSession(hashSessionToken(token));
    }
    clearSessionCookie(response);
    response.status(204).end();
  } catch (error) {
    next(error);
  }
}
