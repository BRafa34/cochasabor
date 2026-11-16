import { pool } from '../config/database.js';

function publicAccount(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    email: row.email,
    displayName: row.displayName,
    createdAt: row.createdAt,
  };
}

export async function createAccount({ email, displayName, passwordHash }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [roles] = await connection.execute(
      "SELECT role_id FROM roles WHERE code = 'MEMBER' LIMIT 1",
    );
    if (roles.length === 0) throw new Error('No existe el rol MEMBER en la base de datos.');

    const [result] = await connection.execute(
      `INSERT INTO users (email, display_name, password_hash)
       VALUES (?, ?, ?)`,
      [email, displayName, passwordHash],
    );
    await connection.execute(
      `INSERT INTO user_role_assignments (user_id, role_id)
       VALUES (?, ?)`,
      [result.insertId, roles[0].role_id],
    );
    const [rows] = await connection.execute(
      `SELECT user_id AS id, email, display_name AS displayName, created_at AS createdAt
       FROM users WHERE user_id = ?`,
      [result.insertId],
    );
    await connection.commit();
    return publicAccount(rows[0]);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function findLoginAccount(email) {
  const [rows] = await pool.execute(
    `SELECT user_id AS id, email, display_name AS displayName,
            password_hash AS passwordHash, created_at AS createdAt
     FROM users
     WHERE email = ? AND anonymized_at IS NULL
     LIMIT 1`,
    [email],
  );
  return rows[0] ?? null;
}

export async function getAccountById(userId) {
  const [rows] = await pool.execute(
    `SELECT user_id AS id, email, display_name AS displayName, created_at AS createdAt
     FROM users
     WHERE user_id = ? AND anonymized_at IS NULL`,
    [userId],
  );
  return publicAccount(rows[0]);
}

export async function getAccountCredentials(userId) {
  const [rows] = await pool.execute(
    `SELECT user_id AS id, email, display_name AS displayName,
            password_hash AS passwordHash, created_at AS createdAt
     FROM users
     WHERE user_id = ? AND anonymized_at IS NULL`,
    [userId],
  );
  return rows[0] ?? null;
}

export async function updateAccount({ userId, email, displayName, passwordHash, newSession }) {
  const assignments = [];
  const values = [];
  if (email !== undefined) {
    assignments.push('email = ?');
    values.push(email);
  }
  if (displayName !== undefined) {
    assignments.push('display_name = ?');
    values.push(displayName);
  }
  if (passwordHash !== undefined) {
    assignments.push('password_hash = ?');
    values.push(passwordHash);
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute(
      `UPDATE users SET ${assignments.join(', ')}
       WHERE user_id = ? AND anonymized_at IS NULL`,
      [...values, userId],
    );
    const [rows] = await connection.execute(
      `SELECT user_id AS id, email, display_name AS displayName, created_at AS createdAt
       FROM users WHERE user_id = ? AND anonymized_at IS NULL`,
      [userId],
    );
    if (!rows[0]) {
      await connection.rollback();
      return null;
    }
    if (newSession) {
      await connection.execute(
        `UPDATE user_sessions SET revoked_at = UTC_TIMESTAMP(6)
         WHERE user_id = ? AND revoked_at IS NULL`,
        [userId],
      );
      await connection.execute(
        `INSERT INTO user_sessions (session_id, user_id, expires_at, last_seen_at)
         VALUES (?, ?, ?, UTC_TIMESTAMP(6))`,
        [newSession.sessionHash, userId, newSession.expiresAt],
      );
    }
    await connection.commit();
    return publicAccount(rows[0]);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function anonymizeAccount({ userId }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      `SELECT user_id FROM users WHERE user_id = ? AND anonymized_at IS NULL FOR UPDATE`,
      [userId],
    );
    if (rows.length === 0) {
      await connection.rollback();
      return false;
    }
    await connection.execute(
      `UPDATE users
       SET email = NULL, display_name = 'Cuenta eliminada', password_hash = NULL,
           anonymized_at = UTC_TIMESTAMP(6)
       WHERE user_id = ?`,
      [userId],
    );
    await connection.execute(
      `UPDATE user_sessions SET revoked_at = UTC_TIMESTAMP(6)
       WHERE user_id = ? AND revoked_at IS NULL`,
      [userId],
    );
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function createSession({ sessionHash, userId, expiresAt }) {
  await pool.execute(
    `DELETE FROM user_sessions
     WHERE expires_at <= UTC_TIMESTAMP(6)
        OR revoked_at < DATE_SUB(UTC_TIMESTAMP(6), INTERVAL 30 DAY)`,
  );
  await pool.execute(
    `INSERT INTO user_sessions (session_id, user_id, expires_at, last_seen_at)
     VALUES (?, ?, ?, UTC_TIMESTAMP(6))`,
    [sessionHash, userId, expiresAt],
  );
}

export async function findSession(sessionHash) {
  const [result] = await pool.execute(
    `UPDATE user_sessions
     SET last_seen_at = UTC_TIMESTAMP(6)
     WHERE session_id = ? AND expires_at > UTC_TIMESTAMP(6)
       AND last_seen_at > DATE_SUB(UTC_TIMESTAMP(6), INTERVAL 30 MINUTE)
       AND revoked_at IS NULL`,
    [sessionHash],
  );
  if (result.affectedRows === 0) return null;
  const [rows] = await pool.execute(
    `SELECT u.user_id AS id, u.email, u.display_name AS displayName
     FROM user_sessions s
     JOIN users u ON u.user_id = s.user_id
     WHERE s.session_id = ? AND s.expires_at > UTC_TIMESTAMP(6)
       AND s.revoked_at IS NULL AND u.anonymized_at IS NULL
     LIMIT 1`,
    [sessionHash],
  );
  return rows[0] ?? null;
}

export async function revokeSession(sessionHash) {
  await pool.execute(
    `UPDATE user_sessions SET revoked_at = UTC_TIMESTAMP(6)
     WHERE session_id = ? AND revoked_at IS NULL`,
    [sessionHash],
  );
}

export function toPublicAccount(row) {
  return publicAccount(row);
}
