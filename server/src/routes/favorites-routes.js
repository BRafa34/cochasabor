import { Router } from 'express';
import {
  deleteMyFavorite,
  getMyFavorites,
  putMyFavorite,
} from '../controllers/favorites-controller.js';
import { requireAuthentication } from '../middlewares/require-authentication.js';

export const favoritesRoutes = Router();
favoritesRoutes.get('/me/favorites', requireAuthentication, getMyFavorites);
favoritesRoutes.put('/me/favorites/:placeId', requireAuthentication, putMyFavorite);
favoritesRoutes.delete('/me/favorites/:placeId', requireAuthentication, deleteMyFavorite);
