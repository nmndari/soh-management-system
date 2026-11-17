import { db } from '../config/db.js'

const COLUMNS = `
  a.id, a.title, a.category_id AS categoryId, c.name AS category, a.content,
  CONVERT(char(10), a.[date], 23) AS [date], a.status, a.audience, a.notify,
  CONVERT(varchar(19), a.published_at, 126) AS publishedAt`

const FROM = `FROM announcements a JOIN categories c ON c.id = a.category_id`

export const list = (sohId, f, conn = db) =>
  conn.query(
    `SELECT COUNT(*) OVER() AS total, ${COLUMNS} ${FROM}
     WHERE a.soh_id = @sohId
       AND (@like IS NULL OR a.title LIKE @like OR a.content LIKE @like)
       AND (@categoryId IS NULL OR a.category_id = @categoryId)
       AND (@status IS NULL OR a.status = @status)
     ORDER BY a.[date] DESC, a.id DESC
     OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
    {
      sohId,
      like: f.search ? `%${f.search}%` : null,
      categoryId: f.categoryId ?? null,
      status: f.status ?? null,
      offset: f.offset,
      limit: f.limit,
    },
  )

export const stats = (sohId, conn = db) =>
  conn.queryOne(
    `SELECT COUNT(*) AS total,
            ISNULL(SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END), 0) AS published,
            ISNULL(SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END), 0) AS draft,
            ISNULL(SUM(CASE WHEN status = 'published' AND notify = 1 THEN 1 ELSE 0 END), 0) AS notified
     FROM announcements WHERE soh_id = @sohId`,
    { sohId },
  )

export const recent = (sohId, top, conn = db) =>
  conn.query(
    `SELECT TOP (@top) ${COLUMNS} ${FROM} WHERE a.soh_id = @sohId ORDER BY a.[date] DESC, a.id DESC`,
    { sohId, top },
  )

export const findById = (sohId, id, conn = db) =>
  conn.queryOne(`SELECT ${COLUMNS} ${FROM} WHERE a.soh_id = @sohId AND a.id = @id`, { sohId, id })

export const create = (sohId, a, conn = db) =>
  conn.queryOne(
    `INSERT INTO announcements (soh_id, title, category_id, content, [date], status, audience, notify,
                                published_at, created_by)
     OUTPUT inserted.id
     VALUES (@sohId, @title, @categoryId, @content, @date, @status, @audience, @notify,
             CASE WHEN @status = 'published' THEN SYSUTCDATETIME() END, @createdBy)`,
    { sohId, ...a },
  )

export const update = (sohId, id, a, conn = db) =>
  conn.execute(
    `UPDATE announcements SET
       title = @title, category_id = @categoryId, content = @content, [date] = @date,
       status = @status, audience = @audience, notify = @notify,
       published_at = CASE WHEN @status = 'published' THEN ISNULL(published_at, SYSUTCDATETIME()) END,
       updated_at = SYSUTCDATETIME()
     WHERE soh_id = @sohId AND id = @id`,
    { sohId, id, ...a },
  )

export const setStatus = (sohId, id, status, conn = db) =>
  conn.execute(
    `UPDATE announcements SET
       status = @status,
       notify = CASE WHEN @status = 'draft' THEN 0 ELSE notify END,
       published_at = CASE WHEN @status = 'published' THEN ISNULL(published_at, SYSUTCDATETIME()) END,
       updated_at = SYSUTCDATETIME()
     WHERE soh_id = @sohId AND id = @id`,
    { sohId, id, status },
  )

/* ---------- Оршин суугчид: зөвхөн нийтэлсэн, өөрийн орцынх ---------- */

const RESIDENT_SCOPE = `a.soh_id = @sohId AND a.status = 'published'
  AND (a.audience = 'all' OR a.audience = @audience)`

export const listForResident = (sohId, audience, f, conn = db) =>
  conn.query(
    `SELECT COUNT(*) OVER() AS total, ${COLUMNS} ${FROM}
     WHERE ${RESIDENT_SCOPE}
       AND (@like IS NULL OR a.title LIKE @like OR a.content LIKE @like)
       AND (@categoryId IS NULL OR a.category_id = @categoryId)
     ORDER BY a.published_at DESC, a.id DESC
     OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
    {
      sohId,
      audience,
      like: f.search ? `%${f.search}%` : null,
      categoryId: f.categoryId ?? null,
      offset: f.offset,
      limit: f.limit,
    },
  )

export const findForResident = (sohId, audience, id, conn = db) =>
  conn.queryOne(`SELECT ${COLUMNS} ${FROM} WHERE ${RESIDENT_SCOPE} AND a.id = @id`, {
    sohId,
    audience,
    id,
  })

export const remove = (sohId, id, conn = db) =>
  conn.execute(`DELETE FROM announcements WHERE soh_id = @sohId AND id = @id`, { sohId, id })
