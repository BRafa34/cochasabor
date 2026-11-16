import { Router } from 'express';
import {
  deleteReview,
  getPlaceReviews,
  getReview,
  getReviews,
  patchReview,
  postReview,
  putReview,
} from '../controllers/reviews-controller.js';
import { requireAuthentication } from '../middlewares/require-authentication.js';

export const reviewRoutes = Router();
reviewRoutes.get('/places/:placeId/reviews', getPlaceReviews);
reviewRoutes.get('/reviews', getReviews);
reviewRoutes.get('/reviews/:reviewId', getReview);
reviewRoutes.post('/places/:placeId/reviews', requireAuthentication, postReview);
reviewRoutes.put('/reviews/:reviewId', requireAuthentication, putReview);
reviewRoutes.patch('/reviews/:reviewId', requireAuthentication, patchReview);
reviewRoutes.delete('/reviews/:reviewId', requireAuthentication, deleteReview);
