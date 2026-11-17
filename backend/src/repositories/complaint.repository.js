import { db } from '../config/db.js'

const COLUMNS = `
  c.id, c.resident_id AS residentId, c.type, c.category_id AS categoryId, cat.name AS category,
  c.title, c.content, c.image_urls AS imageUrlsJson, c.status,
  CONVERT(varchar(19), c.created_at, 126) AS createdAt,
  CONVERT(varchar(19), c.resolved_at, 126) AS resolvedAt,
  r.last_name AS lastName, r.first_name AS firstName, r.phone, r.entrance, r.apartment,
  (SELECT COUNT(*) FROM complaint_replies cr WHERE cr.complaint_id = c.id) AS replyCount`

const FROM = `
  FROM complaints c
  JOIN residents r ON r.id = c.resident_id
  LEFT JOIN categories cat ON cat.id = c.category_id`

export const list = (sohId, f, conn = db) =>
  conn.query(
    `SELECT COUNT(*) OVER() AS total, ${COLUMNS} ${FROM}
     WHERE c.soh_id = @sohId
       AND (@residentId IS NULL OR c.resident_id = @residentId)
       AND (@type IS NULL OR c.type = @type)
       AND (@status IS NULL OR c.status = @status)
       AND (@categoryId IS NULL OR c.category_id = @categoryId)
       AND (@like IS NULL OR c.title LIKE @like OR c.content LIKE @like
            OR (r.last_name + N' ' + r.first_name) LIKE @like)
     ORDER BY c.created_at DESC, c.id DESC
     OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
    {
      sohId,
      residentId: f.residentId ?? null,
      type: f.type ?? null,
      status: f.status ?? null,
      categoryId: f.categoryId ?? null,
      like: f.search ? `%${f.search}%` : null,
      offset: f.offset,
      limit: f.limit,
    },
  )

export const stats = (sohId, conn = db) =>
  conn.queryOne(
    `SELECT COUNT(*) AS total,
            ISNULL(SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END), 0) AS new,
            ISNULL(SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END), 0) AS inProgress,
            ISNULL(SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END), 0) AS resolved,
            ISNULL(SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END), 0) AS rejected
     FROM complaints WHERE soh_id = @sohId`,
    { sohId },
  )

export const findById = (sohId, id, conn = db) =>
  conn.queryOne(`SELECT ${COLUMNS} ${FROM} WHERE c.soh_id = @sohId AND c.id = @id`, { sohId, id })

export const create = (sohId, c, conn = db) =>
  conn.queryOne(
    `INSERT INTO complaints (soh_id, resident_id, category_id, type, title, content, image_urls)
     OUTPUT inserted.id
     VALUES (@sohId, @residentId, @categoryId, @type, @title, @content, @imageUrls)`,
    {
      sohId,
      residentId: c.residentId,
      categoryId: c.categoryId ?? null,
      type: c.type,
      title: c.title,
      content: c.content,
      imageUrls: c.imageUrls?.length ? JSON.stringify(c.imageUrls) : null,
    },
  )

export const setStatus = (sohId, id, status, conn = db) =>
  conn.execute(
    `UPDATE complaints SET status = @status,
            resolved_at = CASE WHEN @status IN ('resolved', 'rejected') THEN SYSUTCDATETIME() END,
            updated_at = SYSUTCDATETIME()
     WHERE soh_id = @sohId AND id = @id`,
    { sohId, id, status },
  )

export const listReplies = (complaintId, conn = db) =>
  conn.query(
    `SELECT cr.id, cr.author_type AS authorType, cr.author_id AS authorId, cr.message,
            CONVERT(varchar(19), cr.created_at, 126) AS createdAt,
            CASE WHEN cr.author_type = 'admin' THEN a.full_name
                 ELSE r.last_name + N' ' + r.first_name END AS authorName
     FROM complaint_replies cr
     LEFT JOIN admins a ON cr.author_type = 'admin' AND a.id = cr.author_id
     LEFT JOIN residents r ON cr.author_type = 'resident' AND r.id = cr.author_id
     WHERE cr.complaint_id = @complaintId
     ORDER BY cr.created_at, cr.id`,
    { complaintId },
  )

export const addReply = ({ complaintId, authorType, authorId, message }, conn = db) =>
  conn.queryOne(
    `INSERT INTO complaint_replies (complaint_id, author_type, author_id, message)
     OUTPUT inserted.id
     VALUES (@complaintId, @authorType, @authorId, @message)`,
    { complaintId, authorType, authorId, message },
  )
