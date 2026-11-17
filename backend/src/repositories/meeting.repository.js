import { db } from '../config/db.js'

// Хэлэлцэх асуудлыг FOR JSON-оор нэг query-д авна
const COLUMNS = `
  m.id, m.title, m.type, CONVERT(char(10), m.[date], 23) AS [date],
  CONVERT(char(5), m.[time], 108) AS [time], m.location, m.format,
  m.meeting_link AS meetingLink, m.meeting_code AS meetingCode, m.meeting_password AS meetingPassword,
  m.audience, m.description, m.status, m.notify,
  (SELECT ai.[text] FROM meeting_agenda_items ai WHERE ai.meeting_id = m.id
   ORDER BY ai.position FOR JSON PATH) AS agendaJson`

export const list = (sohId, f, conn = db) =>
  conn.query(
    `SELECT COUNT(*) OVER() AS total, ${COLUMNS}
     FROM meetings m
     WHERE m.soh_id = @sohId
       AND (@like IS NULL OR m.title LIKE @like OR m.location LIKE @like)
       AND (@status IS NULL OR m.status = @status)
       AND (@type IS NULL OR m.type = @type)
     ORDER BY m.[date] DESC, m.[time] DESC, m.id DESC
     OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
    {
      sohId,
      like: f.search ? `%${f.search}%` : null,
      status: f.status ?? null,
      type: f.type ?? null,
      offset: f.offset,
      limit: f.limit,
    },
  )

export const stats = (sohId, today, conn = db) =>
  conn.queryOne(
    `SELECT COUNT(*) AS total,
            ISNULL(SUM(CASE WHEN status = 'scheduled' AND [date] >= @today THEN 1 ELSE 0 END), 0) AS upcoming,
            ISNULL(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) AS completed,
            ISNULL(SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END), 0) AS draft
     FROM meetings WHERE soh_id = @sohId`,
    { sohId, today },
  )

export const upcoming = (sohId, today, top, conn = db) =>
  conn.query(
    `SELECT TOP (@top) ${COLUMNS} FROM meetings m
     WHERE m.soh_id = @sohId AND m.status = 'scheduled' AND m.[date] >= @today
     ORDER BY m.[date], m.[time]`,
    { sohId, today, top },
  )

/* ---------- Оршин суугчид: товлогдсон, дууссан, өөрийн орцынх ---------- */

const RESIDENT_SCOPE = `m.soh_id = @sohId AND m.status IN ('scheduled', 'completed')
  AND (m.audience = 'all' OR m.audience = @audience)`

export const listForResident = (sohId, audience, today, f, conn = db) =>
  conn.query(
    `SELECT COUNT(*) OVER() AS total, ${COLUMNS}
     FROM meetings m
     WHERE ${RESIDENT_SCOPE}
       AND (@upcoming = 0 OR (m.status = 'scheduled' AND m.[date] >= @today))
     ORDER BY CASE WHEN @upcoming = 1 THEN m.[date] END ASC,
              CASE WHEN @upcoming = 0 THEN m.[date] END DESC,
              m.[time]
     OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
    { sohId, audience, today, upcoming: f.upcoming ? 1 : 0, offset: f.offset, limit: f.limit },
  )

export const findForResident = (sohId, audience, id, conn = db) =>
  conn.queryOne(`SELECT ${COLUMNS} FROM meetings m WHERE ${RESIDENT_SCOPE} AND m.id = @id`, {
    sohId,
    audience,
    id,
  })

export const findById = (sohId, id, conn = db) =>
  conn.queryOne(`SELECT ${COLUMNS} FROM meetings m WHERE m.soh_id = @sohId AND m.id = @id`, {
    sohId,
    id,
  })

const fields = (m) => ({
  title: m.title,
  type: m.type,
  date: m.date,
  time: m.time,
  location: m.location ?? null,
  format: m.format,
  meetingLink: m.meetingLink ?? null,
  meetingCode: m.meetingCode ?? null,
  meetingPassword: m.meetingPassword ?? null,
  audience: m.audience,
  description: m.description ?? null,
  status: m.status,
  notify: m.notify,
})

export const create = (sohId, m, conn = db) =>
  conn.queryOne(
    `INSERT INTO meetings (soh_id, title, type, [date], [time], location, format, meeting_link,
                           meeting_code, meeting_password, audience, description, status, notify, created_by)
     OUTPUT inserted.id
     VALUES (@sohId, @title, @type, @date, @time, @location, @format, @meetingLink,
             @meetingCode, @meetingPassword, @audience, @description, @status, @notify, @createdBy)`,
    { sohId, ...fields(m), createdBy: m.createdBy ?? null },
  )

export const update = (sohId, id, m, conn = db) =>
  conn.execute(
    `UPDATE meetings SET
       title = @title, type = @type, [date] = @date, [time] = @time, location = @location,
       format = @format, meeting_link = @meetingLink, meeting_code = @meetingCode,
       meeting_password = @meetingPassword, audience = @audience, description = @description,
       status = @status, notify = @notify, updated_at = SYSUTCDATETIME()
     WHERE soh_id = @sohId AND id = @id`,
    { sohId, id, ...fields(m) },
  )

export const setStatus = (sohId, id, status, conn = db) =>
  conn.execute(
    `UPDATE meetings SET status = @status,
            notify = CASE WHEN @status = 'draft' THEN 0 ELSE notify END,
            updated_at = SYSUTCDATETIME()
     WHERE soh_id = @sohId AND id = @id`,
    { sohId, id, status },
  )

export const remove = (sohId, id, conn = db) =>
  conn.execute(`DELETE FROM meetings WHERE soh_id = @sohId AND id = @id`, { sohId, id })

/** Хэлэлцэх асуудлыг бүхэлд нь солино (транзакц дотор дуудна). */
export async function replaceAgenda(meetingId, items, conn = db) {
  await conn.execute(`DELETE FROM meeting_agenda_items WHERE meeting_id = @meetingId`, { meetingId })
  for (let i = 0; i < items.length; i++) {
    await conn.execute(
      `INSERT INTO meeting_agenda_items (meeting_id, position, [text]) VALUES (@meetingId, @position, @text)`,
      { meetingId, position: i + 1, text: items[i] },
    )
  }
}
