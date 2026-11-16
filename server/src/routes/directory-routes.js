import { Router } from 'express';
import { getCategories, getPlaces } from '../controllers/directory-controller.js';

export const directoryRoutes = Router();
directoryRoutes.get('/categories', getCategories);
directoryRoutes.get('/places', getPlaces);
