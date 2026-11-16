import { pool } from '../config/database.js';

export async function listCategories() {
  const [rows] = await pool.execute(
    `SELECT category_id AS id, slug, name, is_active AS isActive
     FROM categories
     WHERE is_active = TRUE
     ORDER BY name`,
  );
  return rows.map((row) => ({ ...row, id: String(row.id), isActive: Boolean(row.isActive) }));
}

function escapeLike(value) {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

export async function listPlaces({ q, category, sort, page, pageSize }) {
  const conditions = ["p.visibility_status = 'PUBLISHED'"];
  const params = [];

  if (q) {
    conditions.push('(p.name LIKE ? OR p.description LIKE ? OR p.zone LIKE ?)');
    const pattern = `%${escapeLike(q)}%`;
    params.push(pattern, pattern, pattern);
  }

  if (category) {
    conditions.push(`EXISTS (
      SELECT 1 FROM place_categories pc_filter
      JOIN categories c_filter ON c_filter.category_id = pc_filter.category_id
      WHERE pc_filter.place_id = p.place_id AND c_filter.slug = ? AND c_filter.is_active = TRUE
    )`);
    params.push(category);
  }

  const where = conditions.join(' AND ');
  const offset = (page - 1) * pageSize;
  const orderBy = sort === 'name' ? 'p.name ASC' : 'ratingAverage DESC, p.name ASC';
  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM places p WHERE ${where}`,
    params,
  );
  const [rows] = await pool.execute(
    `SELECT
       p.place_id AS id,
       p.slug,
       p.name,
       p.description,
       p.zone,
       p.address,
       p.price_estimate AS price,
       (SELECT m.storage_key
        FROM media m
        WHERE m.place_id = p.place_id AND m.media_type = 'IMAGE'
        ORDER BY m.is_cover DESC, m.position, m.media_id
        LIMIT 1) AS image,
       (SELECT m.alt_text
        FROM media m
        WHERE m.place_id = p.place_id AND m.media_type = 'IMAGE'
        ORDER BY m.is_cover DESC, m.position, m.media_id
        LIMIT 1) AS imageAlt,
       (SELECT GROUP_CONCAT(m.storage_key ORDER BY m.position, m.media_id SEPARATOR '\n')
        FROM media m
        WHERE m.place_id = p.place_id AND m.media_type = 'IMAGE' AND m.is_cover = FALSE) AS gallery,
       (SELECT GROUP_CONCAT(
          CONCAT(
            CASE h.weekday
              WHEN 1 THEN 'Lunes' WHEN 2 THEN 'Martes' WHEN 3 THEN 'Miércoles'
              WHEN 4 THEN 'Jueves' WHEN 5 THEN 'Viernes' WHEN 6 THEN 'Sábado'
              ELSE 'Domingo'
            END,
            ': ',
            CASE WHEN h.is_closed THEN 'Cerrado'
              ELSE CONCAT(TIME_FORMAT(h.opens_at, '%H:%i'), '–', TIME_FORMAT(h.closes_at, '%H:%i'),
                IF(h.closes_next_day, ' (+1 día)', ''))
            END
          ) ORDER BY h.weekday SEPARATOR '\n'
        )
        FROM place_opening_hours h
        WHERE h.place_id = p.place_id) AS hours,
       (SELECT m.storage_key
        FROM media m
        WHERE m.place_id = p.place_id AND m.media_type = 'VIDEO'
        ORDER BY m.position, m.media_id
        LIMIT 1) AS videoSrc,
       (SELECT m.alt_text
        FROM media m
        WHERE m.place_id = p.place_id AND m.media_type = 'VIDEO'
        ORDER BY m.position, m.media_id
        LIMIT 1) AS videoDescription,
       GROUP_CONCAT(DISTINCT c.slug ORDER BY c.slug SEPARATOR ',') AS categoryIds,
       r.ratingAverage AS ratingAverage,
       COALESCE(r.reviewCount, 0) AS reviewCount
     FROM places p
     LEFT JOIN place_categories pc ON pc.place_id = p.place_id
     LEFT JOIN categories c ON c.category_id = pc.category_id AND c.is_active = TRUE
     LEFT JOIN (
       SELECT place_id, ROUND(AVG(rating), 2) AS ratingAverage, COUNT(*) AS reviewCount
       FROM reviews
       WHERE visibility_status = 'VISIBLE'
       GROUP BY place_id
     ) r ON r.place_id = p.place_id
     WHERE ${where}
     GROUP BY p.place_id
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset],
  );

  const items = rows.map((row) => ({
    ...row,
    id: String(row.id),
    categoryIds: row.categoryIds ? row.categoryIds.split(',') : [],
    ratingAverage: row.ratingAverage === null ? null : Number(row.ratingAverage),
    reviewCount: Number(row.reviewCount),
  }));

  return { items, total: Number(countRows[0].total), page, pageSize };
}
