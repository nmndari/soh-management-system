import { db } from '../config/db.js'

export const create = ({ phone, codeHash, expiresAt }, conn = db) =>
  conn.execute(
    `INSERT INTO otp_codes (phone, code_hash, expires_at) VALUES (@phone, @codeHash, @expiresAt)`,
    { phone, codeHash, expiresAt },
  )

/** Сүүлийн N секундэд илгээсэн кодын тоо (давтамж хязгаарлах) */
export const countSince = (phone, seconds, conn = db) =>
  conn.queryOne(
    `SELECT COUNT(*) AS n FROM otp_codes
     WHERE phone = @phone AND created_at > DATEADD(SECOND, -@seconds, SYSUTCDATETIME())`,
    { phone, seconds },
  )

/** Хамгийн сүүлийн хүчинтэй (ашиглаагүй, хугацаа дуусаагүй) код */
export const findLatestValid = (phone, conn = db) =>
  conn.queryOne(
    `SELECT TOP 1 id, code_hash AS codeHash, attempts FROM otp_codes
     WHERE phone = @phone AND used_at IS NULL AND expires_at > SYSUTCDATETIME()
     ORDER BY created_at DESC, id DESC`,
    { phone },
  )

export const incrementAttempts = (id, conn = db) =>
  conn.execute(`UPDATE otp_codes SET attempts = attempts + 1 WHERE id = @id`, { id })

export const markUsed = (id, conn = db) =>
  conn.execute(`UPDATE otp_codes SET used_at = SYSUTCDATETIME() WHERE id = @id`, { id })

/** Тухайн дугаарын хүчинтэй бусад кодыг хүчингүй болгоно */
export const invalidateAll = (phone, conn = db) =>
  conn.execute(
    `UPDATE otp_codes SET used_at = SYSUTCDATETIME() WHERE phone = @phone AND used_at IS NULL`,
    { phone },
  )
