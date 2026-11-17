import { db } from '../config/db.js'

export const listFor = (recipientType, recipientId, { unreadOnly, limit }, conn = db) =>
  conn.query(
    `SELECT TOP (@limit) id, type, title, message, ref_type AS refType, ref_id AS refId,
            CONVERT(varchar(19), created_at, 126) + 'Z' AS createdAt,
            CASE WHEN read_at IS NULL THEN 0 ELSE 1 END AS [read]
     FROM notifications
     WHERE recipient_type = @recipientType AND recipient_id = @recipientId
       AND (@unreadOnly = 0 OR read_at IS NULL)
     ORDER BY created_at DESC, id DESC`,
    { recipientType, recipientId, unreadOnly: unreadOnly ? 1 : 0, limit },
  )

export const unreadCount = (recipientType, recipientId, conn = db) =>
  conn.queryOne(
    `SELECT COUNT(*) AS n FROM notifications
     WHERE recipient_type = @recipientType AND recipient_id = @recipientId AND read_at IS NULL`,
    { recipientType, recipientId },
  )

export const markRead = (recipientType, recipientId, id, conn = db) =>
  conn.execute(
    `UPDATE notifications SET read_at = ISNULL(read_at, SYSUTCDATETIME())
     WHERE id = @id AND recipient_type = @recipientType AND recipient_id = @recipientId`,
    { recipientType, recipientId, id },
  )

export const markAllRead = (recipientType, recipientId, conn = db) =>
  conn.execute(
    `UPDATE notifications SET read_at = SYSUTCDATETIME()
     WHERE recipient_type = @recipientType AND recipient_id = @recipientId AND read_at IS NULL`,
    { recipientType, recipientId },
  )

export const insertForAdmins = (sohId, n, conn = db) =>
  conn.execute(
    `INSERT INTO notifications (recipient_type, recipient_id, type, title, message, ref_type, ref_id)
     SELECT 'admin', id, @type, @title, @message, @refType, @refId
     FROM admins WHERE soh_id = @sohId AND is_active = 1`,
    { sohId, type: n.type, title: n.title, message: n.message ?? null, refType: n.refType ?? null, refId: n.refId ?? null },
  )

/** Нэг оршин суугчид мэдэгдэл бичнэ */
export const insertForResident = (residentId, n, conn = db) =>
  conn.execute(
    `INSERT INTO notifications (recipient_type, recipient_id, type, title, message, ref_type, ref_id)
     VALUES ('resident', @residentId, @type, @title, @message, @refType, @refId)`,
    {
      residentId,
      type: n.type,
      title: n.title,
      message: n.message ?? null,
      refType: n.refType ?? null,
      refId: n.refId ?? null,
    },
  )

/** Зорилтот оршин суугчдад (бүгд эсвэл нэг орц) мэдэгдэл бичнэ. Нөлөөлсөн тоог буцаана. */
export const insertForResidents = (sohId, entrance, n, conn = db) =>
  conn.execute(
    `INSERT INTO notifications (recipient_type, recipient_id, type, title, message, ref_type, ref_id)
     SELECT 'resident', r.id, @type, @title, @message, @refType, @refId
     FROM residents r
     WHERE r.soh_id = @sohId AND r.deleted_at IS NULL AND (@entrance IS NULL OR r.entrance = @entrance)`,
    {
      sohId,
      entrance,
      type: n.type,
      title: n.title,
      message: n.message ?? null,
      refType: n.refType ?? null,
      refId: n.refId ?? null,
    },
  )
