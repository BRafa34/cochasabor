import { Router } from 'express';
import { login, logout, register } from '../controllers/authentication-controller.js';
import { rateLimit } from '../middlewares/rate-limit.js';
import { limitPasswordWork } from '../middlewares/password-work-limit.js';

export const authenticationRoutes = Router();
authenticationRoutes.post(
  '/auth/register',
  rateLimit({ limit: 5, windowMs: 60 * 60 * 1000 }),
  limitPasswordWork,
  register,
);
authenticationRoutes.post(
  '/auth/login',
  rateLimit({ limit: 10, windowMs: 15 * 60 * 1000 }),
  limitPasswordWork,
  login,
);
authenticationRoutes.post('/auth/logout', logout);
