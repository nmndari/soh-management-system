import { db } from '../config/db.js'

const COLUMNS = `id, soh_id AS sohId, full_name AS fullName, email, role, is_active AS isActive`

export const findByEmail = (email, conn = db) =>
  conn.queryOne(`SELECT ${COLUMNS}, password_hash AS passwordHash FROM admins WHERE email = @email`, { email })

export const findById = (id, conn = db) =>
  conn.queryOne(`SELECT ${COLUMNS} FROM admins WHERE id = @id`, { id })

export const touchLastLogin = (id, conn = db) =>
  conn.execute(`UPDATE admins SET last_login_at = SYSUTCDATETIME() WHERE id = @id`, { id })

export const listActiveIds = (sohId, conn = db) =>
  conn.query(`SELECT id FROM admins WHERE soh_id = @sohId AND is_active = 1`, { sohId })
