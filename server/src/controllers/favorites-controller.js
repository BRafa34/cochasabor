import { listFavorites, removeFavorite, saveFavorite } from '../models/favorites-model.js';

function validId(value) {
  if (typeof value !== 'string' || !/^\d{1,20}$/.test(value)) return false;
  return BigInt(value) > 0n && BigInt(value) <= 18446744073709551615n;
}

export async function getMyFavorites(request, response, next) {
  try {
    response.json({ items: await listFavorites(request.authenticatedUser.id) });
  } catch (error) {
    next(error);
  }
}

export async function putMyFavorite(request, response, next) {
  try {
    if (!validId(request.params.placeId)) {
      response
        .status(400)
        .json({ code: 'INVALID_PLACE_ID', message: 'El ID del lugar no es válido.' });
      return;
    }

    const saved = await saveFavorite(request.authenticatedUser.id, request.params.placeId);
    if (!saved) {
      response
        .status(404)
        .json({ code: 'PLACE_NOT_FOUND', message: 'No se encontró el lugar publicado.' });
      return;
    }
    response.json({ saved: true, placeId: request.params.placeId });
  } catch (error) {
    next(error);
  }
}

export async function deleteMyFavorite(request, response, next) {
  try {
    if (!validId(request.params.placeId)) {
      response
        .status(400)
        .json({ code: 'INVALID_PLACE_ID', message: 'El ID del lugar no es válido.' });
      return;
    }

    await removeFavorite(request.authenticatedUser.id, request.params.placeId);
    response.status(204).end();
  } catch (error) {
    next(error);
  }
}
