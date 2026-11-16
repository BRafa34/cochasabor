import { listCategories, listPlaces } from '../models/directory-model.js';

export async function getCategories(_request, response, next) {
  try {
    response.json({ items: await listCategories() });
  } catch (error) {
    next(error);
  }
}

function positiveInteger(value, fallback, max) {
  if (value === undefined) return fallback;
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return parsed > 0 && parsed <= max ? parsed : null;
}

export async function getPlaces(request, response, next) {
  try {
    const page = positiveInteger(request.query.page, 1, 1000000);
    const pageSize = positiveInteger(request.query.pageSize, 6, 50);
    const sort = request.query.sort ?? 'rating';

    if (page === null || pageSize === null || !['rating', 'name'].includes(sort)) {
      response.status(400).json({
        code: 'INVALID_QUERY',
        message: 'Los filtros de página u orden no son válidos.',
      });
      return;
    }

    const q = typeof request.query.q === 'string' ? request.query.q.trim().slice(0, 120) : '';
    const category =
      typeof request.query.category === 'string' ? request.query.category.trim() : '';
    response.json(await listPlaces({ q, category, sort, page, pageSize }));
  } catch (error) {
    next(error);
  }
}
