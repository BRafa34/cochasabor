import { pool } from '../config/database.js';

export async function listFavorites(userId) {
  const [rows] = await pool.execute(
    `SELECT
       p.place_id AS id,
       p.slug,
       p.name,
       p.description,
       p.zone,
       p.address,
       p.price_estimate AS price,
       f.created_at AS savedAt,
       (SELECT GROUP_CONCAT(c.slug ORDER BY c.slug SEPARATOR ',')
        FROM place_categories pc
        JOIN categories c ON c.category_id = pc.category_id AND c.is_active = TRUE
        WHERE pc.place_id = p.place_id) AS categoryIds,
       (SELECT ROUND(AVG(r.rating), 2)
        FROM reviews r
        WHERE r.place_id = p.place_id AND r.visibility_status = 'VISIBLE') AS ratingAverage,
       (SELECT COUNT(*)
        FROM reviews r
        WHERE r.place_id = p.place_id AND r.visibility_status = 'VISIBLE') AS reviewCount
     FROM favorites f
     JOIN places p ON p.place_id = f.place_id
     WHERE f.user_id = ? AND p.visibility_status = 'PUBLISHED'
     ORDER BY f.created_at DESC, p.place_id DESC`,
    [userId],
  );

  return rows.map((row) => ({
    ...row,
    id: String(row.id),
    categoryIds: row.categoryIds ? row.categoryIds.split(',') : [],
    ratingAverage: row.ratingAverage === null ? null : Number(row.ratingAverage),
    reviewCount: Number(row.reviewCount),
  }));
}

export async function saveFavorite(userId, placeId) {
  const [places] = await pool.execute(
    `SELECT place_id FROM places
     WHERE place_id = ? AND visibility_status = 'PUBLISHED'`,
    [placeId],
  );
  if (places.length === 0) return false;

  await pool.execute(
    `INSERT INTO favorites (user_id, place_id)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE created_at = favorites.created_at`,
    [userId, placeId],
  );
  return true;
}

export async function removeFavorite(userId, placeId) {
  await pool.execute(`DELETE FROM favorites WHERE user_id = ? AND place_id = ?`, [userId, placeId]);
}
