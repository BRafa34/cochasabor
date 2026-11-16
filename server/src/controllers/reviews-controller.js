import {
  createReview,
  getReviewById,
  hideReview,
  listReviewsByPlace,
  listReviews,
  updateReview,
} from '../models/reviews-model.js';

function positiveInteger(value, fallback, max) {
  if (value === undefined) return fallback;
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return parsed > 0 && parsed <= max ? parsed : null;
}

function validId(value) {
  if (typeof value !== 'string' || !/^\d{1,20}$/.test(value)) return false;
  return BigInt(value) > 0n && BigInt(value) <= 18446744073709551615n;
}

function parseReviewFields(body, partial = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { valid: false, error: 'El cuerpo debe ser un objeto JSON.' };
  }

  const changes = {};
  if (Object.hasOwn(body, 'rating')) {
    if (!Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) {
      return { valid: false, error: 'La calificación debe ser un número entero de 1 a 5.' };
    }
    changes.rating = body.rating;
  }
  if (Object.hasOwn(body, 'comment')) {
    if (typeof body.comment !== 'string') {
      return { valid: false, error: 'El comentario debe ser texto.' };
    }
    changes.comment = body.comment.trim();
    if (changes.comment.length < 10 || changes.comment.length > 1000) {
      return { valid: false, error: 'El comentario debe tener entre 10 y 1000 caracteres.' };
    }
  }

  if (!partial && (!Object.hasOwn(changes, 'rating') || !Object.hasOwn(changes, 'comment'))) {
    return { valid: false, error: 'La calificación y el comentario son obligatorios.' };
  }
  if (partial && Object.keys(changes).length === 0) {
    return { valid: false, error: 'Incluye al menos la calificación o el comentario.' };
  }
  return { valid: true, changes };
}

export async function getPlaceReviews(request, response, next) {
  try {
    if (!validId(request.params.placeId)) {
      response
        .status(400)
        .json({ code: 'INVALID_PLACE_ID', message: 'El ID del lugar no es válido.' });
      return;
    }
    const page = positiveInteger(request.query.page, 1, 1000000);
    const pageSize = positiveInteger(request.query.pageSize, 10, 50);
    if (page === null || pageSize === null) {
      response.status(400).json({
        code: 'INVALID_QUERY',
        message: 'La página debe ser positiva y pageSize debe estar entre 1 y 50.',
      });
      return;
    }

    const result = await listReviewsByPlace(request.params.placeId, page, pageSize);
    if (result === null) {
      response.status(404).json({ code: 'PLACE_NOT_FOUND', message: 'No se encontró el lugar.' });
      return;
    }
    response.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getReviews(request, response, next) {
  try {
    const page = positiveInteger(request.query.page, 1, 1000000);
    const pageSize = positiveInteger(request.query.pageSize, 10, 50);
    if (page === null || pageSize === null) {
      response.status(400).json({
        code: 'INVALID_QUERY',
        message: 'La página debe ser positiva y pageSize debe estar entre 1 y 50.',
      });
      return;
    }
    response.json(await listReviews(page, pageSize));
  } catch (error) {
    next(error);
  }
}

export async function getReview(request, response, next) {
  try {
    if (!validId(request.params.reviewId)) {
      response
        .status(400)
        .json({ code: 'INVALID_REVIEW_ID', message: 'El ID de reseña no es válido.' });
      return;
    }
    const review = await getReviewById(request.params.reviewId);
    if (!review) {
      response.status(404).json({ code: 'REVIEW_NOT_FOUND', message: 'No se encontró la reseña.' });
      return;
    }
    response.json(review);
  } catch (error) {
    next(error);
  }
}

export async function postReview(request, response, next) {
  try {
    if (!validId(request.params.placeId)) {
      response
        .status(400)
        .json({ code: 'INVALID_PLACE_ID', message: 'El ID del lugar no es válido.' });
      return;
    }
    const parsed = parseReviewFields(request.body);
    if (!parsed.valid) {
      response.status(400).json({ code: 'INVALID_REVIEW', message: parsed.error });
      return;
    }

    const result = await createReview({
      placeId: request.params.placeId,
      userId: request.authenticatedUser.id,
      ...parsed.changes,
    });
    if (result.kind === 'place-not-found') {
      response
        .status(404)
        .json({ code: 'PLACE_NOT_FOUND', message: 'No se encontró el lugar publicado.' });
      return;
    }
    response.status(201).json(result.review);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      response.status(409).json({
        code: 'REVIEW_ALREADY_EXISTS',
        message: 'Esta cuenta ya tiene una reseña para este lugar.',
      });
      return;
    }
    next(error);
  }
}

export async function patchReview(request, response, next) {
  try {
    if (!validId(request.params.reviewId)) {
      response
        .status(400)
        .json({ code: 'INVALID_REVIEW_ID', message: 'El ID de reseña no es válido.' });
      return;
    }
    const parsed = parseReviewFields(request.body, true);
    if (!parsed.valid) {
      response.status(400).json({ code: 'INVALID_REVIEW', message: parsed.error });
      return;
    }

    const review = await updateReview({
      reviewId: request.params.reviewId,
      userId: request.authenticatedUser.id,
      changes: parsed.changes,
    });
    if (!review) {
      response
        .status(404)
        .json({ code: 'REVIEW_NOT_FOUND', message: 'No se encontró una reseña editable.' });
      return;
    }
    response.json(review);
  } catch (error) {
    next(error);
  }
}

export async function putReview(request, response, next) {
  try {
    if (!validId(request.params.reviewId)) {
      response
        .status(400)
        .json({ code: 'INVALID_REVIEW_ID', message: 'El ID de reseña no es válido.' });
      return;
    }
    const parsed = parseReviewFields(request.body);
    if (!parsed.valid) {
      response.status(400).json({ code: 'INVALID_REVIEW', message: parsed.error });
      return;
    }

    const review = await updateReview({
      reviewId: request.params.reviewId,
      userId: request.authenticatedUser.id,
      changes: parsed.changes,
    });
    if (!review) {
      response
        .status(404)
        .json({ code: 'REVIEW_NOT_FOUND', message: 'No se encontró una reseña editable.' });
      return;
    }
    response.json(review);
  } catch (error) {
    next(error);
  }
}

export async function deleteReview(request, response, next) {
  try {
    if (!validId(request.params.reviewId)) {
      response
        .status(400)
        .json({ code: 'INVALID_REVIEW_ID', message: 'El ID de reseña no es válido.' });
      return;
    }
    const hidden = await hideReview({
      reviewId: request.params.reviewId,
      userId: request.authenticatedUser.id,
    });
    if (!hidden) {
      response
        .status(404)
        .json({ code: 'REVIEW_NOT_FOUND', message: 'No se encontró una reseña eliminable.' });
      return;
    }
    response.status(204).end();
  } catch (error) {
    next(error);
  }
}
