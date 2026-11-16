import { Router } from 'express';
import {
  deleteMyAccount,
  getMyAccount,
  patchMyAccount,
} from '../controllers/accounts-controller.js';
import { requireAuthentication } from '../middlewares/require-authentication.js';
import { limitPasswordWork } from '../middlewares/password-work-limit.js';

export const accountsRoutes = Router();
accountsRoutes.get('/auth/me', requireAuthentication, getMyAccount);
accountsRoutes.get('/accounts/me', requireAuthentication, getMyAccount);
accountsRoutes.patch('/accounts/me', requireAuthentication, limitPasswordWork, patchMyAccount);
accountsRoutes.delete('/accounts/me', requireAuthentication, limitPasswordWork, deleteMyAccount);
