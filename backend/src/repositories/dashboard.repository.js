import { db } from '../config/db.js'

export const openComplaints = (sohId, conn = db) =>
  conn.queryOne(
    `SELECT COUNT(*) AS n FROM complaints
     WHERE soh_id = @sohId AND status IN ('new', 'in_progress')`,
    { sohId },
  )
