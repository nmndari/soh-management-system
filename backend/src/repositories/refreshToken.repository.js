import { db } from '../config/db.js'

export const create = ({ userType, userId, tokenHash, expiresAt }, conn = db) =>
  conn.execute(
    `INSERT INTO refresh_tokens (user_type, user_id, token_hash, expires_at)
     VALUES (@userType, @userId, @tokenHash, @expiresAt)`,
    { userType, userId, tokenHash, expiresAt },
  )

/** Хүчинтэй (хугацаа дуусаагүй, хүчингүй болоогүй) token */
export const findValid = (tokenHash, conn = db) =>
  conn.queryOne(
    `SELECT id, user_type AS userType, user_id AS userId,
            CONVERT(varchar(19), expires_at, 126) AS expiresAt
     FROM refresh_tokens
     WHERE token_hash = @tokenHash AND revoked_at IS NULL AND expires_at > SYSUTCDATETIME()`,
    { tokenHash },
  )

export const revoke = (tokenHash, conn = db) =>
  conn.execute(
    `UPDATE refresh_tokens SET revoked_at = SYSUTCDATETIME()
     WHERE token_hash = @tokenHash AND revoked_at IS NULL`,
    { tokenHash },
  )
