import { pool } from '../config/database.js';

function mapReview(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    placeId: String(row.placeId),
    userId: String(row.userId),
    displayName: row.displayName,
    rating: Number(row.rating),
    comment: row.comment,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const reviewSelect = `
  SELECT r.review_id AS id, r.place_id AS placeId, r.user_id AS userId,
         u.display_name AS displayName, r.rating, r.comment,
         r.created_at AS createdAt, r.updated_at AS updatedAt
  FROM reviews r
  JOIN users u ON u.user_id = r.user_id
`;

export async function listReviewsByPlace(placeId, page, pageSize) {
  const [placeRows] = await pool.execute(
    `SELECT place_id FROM places WHERE place_id = ? AND visibility_status = 'PUBLISHED'`,
    [placeId],
  );
  if (placeRows.length === 0) return null;

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM reviews
     WHERE place_id = ? AND visibility_status = 'VISIBLE'`,
    [placeId],
  );
  const [rows] = await pool.execute(
    `${reviewSelect}
     WHERE r.place_id = ? AND r.visibility_status = 'VISIBLE'
     ORDER BY r.created_at DESC, r.review_id DESC
     LIMIT ? OFFSET ?`,
    [placeId, pageSize, (page - 1) * pageSize],
  );

  return {
    items: rows.map(mapReview),
    total: Number(countRows[0].total),
    page,
    pageSize,
  };
}

export async function listReviews(page, pageSize) {
  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM reviews r
     JOIN places p ON p.place_id = r.place_id
     WHERE r.visibility_status = 'VISIBLE' AND p.visibility_status = 'PUBLISHED'`,
  );
  const [rows] = await pool.execute(
    `${reviewSelect}
     JOIN places p ON p.place_id = r.place_id
     WHERE r.visibility_status = 'VISIBLE' AND p.visibility_status = 'PUBLISHED'
     ORDER BY r.created_at DESC, r.review_id DESC
     LIMIT ? OFFSET ?`,
    [pageSize, (page - 1) * pageSize],
  );
  return {
    items: rows.map(mapReview),
    total: Number(countRows[0].total),
    page,
    pageSize,
  };
}

export async function getReviewById(reviewId) {
  const [rows] = await pool.execute(
    `${reviewSelect}
     WHERE r.review_id = ? AND r.visibility_status = 'VISIBLE'
       AND EXISTS (SELECT 1 FROM places p WHERE p.place_id = r.place_id AND p.visibility_status = 'PUBLISHED')`,
    [reviewId],
  );
  return mapReview(rows[0]);
}

export async function createReview({ placeId, userId, rating, comment }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [places] = await connection.execute(
      `SELECT place_id FROM places WHERE place_id = ? AND visibility_status = 'PUBLISHED' FOR UPDATE`,
      [placeId],
    );
    if (places.length === 0) {
      await connection.rollback();
      return { kind: 'place-not-found' };
    }

    await connection.query('SET @cochasabor_user_id = ?', [userId]);
    const [result] = await connection.execute(
      `INSERT INTO reviews (place_id, user_id, rating, comment)
       VALUES (?, ?, ?, ?)`,
      [placeId, userId, rating, comment],
    );
    const [rows] = await connection.execute(
      `${reviewSelect}
       WHERE r.review_id = ? AND r.visibility_status = 'VISIBLE'`,
      [result.insertId],
    );
    await connection.commit();
    return { kind: 'created', review: mapReview(rows[0]) };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.query('SET @cochasabor_user_id = NULL').catch(() => {});
    connection.release();
  }
}

export async function updateReview({ reviewId, userId, changes }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [existing] = await connection.execute(
      `SELECT review_id FROM reviews
       WHERE review_id = ? AND user_id = ? AND visibility_status = 'VISIBLE'
       FOR UPDATE`,
      [reviewId, userId],
    );
    if (existing.length === 0) {
      await connection.rollback();
      return null;
    }

    const assignments = [];
    const values = [];
    if (changes.rating !== undefined) {
      assignments.push('rating = ?');
      values.push(changes.rating);
    }
    if (changes.comment !== undefined) {
      assignments.push('comment = ?');
      values.push(changes.comment);
    }

    await connection.query('SET @cochasabor_user_id = ?', [userId]);
    await connection.execute(`UPDATE reviews SET ${assignments.join(', ')} WHERE review_id = ?`, [
      ...values,
      reviewId,
    ]);
    const [rows] = await connection.execute(
      `${reviewSelect}
       WHERE r.review_id = ? AND r.visibility_status = 'VISIBLE'`,
      [reviewId],
    );
    await connection.commit();
    return mapReview(rows[0]);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.query('SET @cochasabor_user_id = NULL').catch(() => {});
    connection.release();
  }
}

export async function hideReview({ reviewId, userId }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [existing] = await connection.execute(
      `SELECT review_id FROM reviews
       WHERE review_id = ? AND user_id = ? AND visibility_status = 'VISIBLE'
       FOR UPDATE`,
      [reviewId, userId],
    );
    if (existing.length === 0) {
      await connection.rollback();
      return false;
    }

    await connection.query('SET @cochasabor_user_id = ?', [userId]);
    await connection.execute(
      `UPDATE reviews SET visibility_status = 'HIDDEN', hidden_at = CURRENT_TIMESTAMP(6)
       WHERE review_id = ?`,
      [reviewId],
    );
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.query('SET @cochasabor_user_id = NULL').catch(() => {});
    connection.release();
  }
}
