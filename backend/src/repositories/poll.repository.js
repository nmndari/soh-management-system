import { db } from '../config/db.js'

// Хариултын сонголтыг FOR JSON-оор, санал тоолж нэг query-д авна
const COLUMNS = `
  p.id, p.title, p.description, p.audience, p.status, p.notify,
  CONVERT(varchar(19), p.starts_at, 126) AS startsAt,
  CONVERT(varchar(19), p.ends_at, 126) AS endsAt,
  CONVERT(varchar(19), p.created_at, 126) AS createdAt,
  (SELECT COUNT(*) FROM poll_votes v WHERE v.poll_id = p.id) AS totalVotes,
  (SELECT o.id, o.[text],
          (SELECT COUNT(*) FROM poll_votes v WHERE v.option_id = o.id) AS votes
   FROM poll_options o WHERE o.poll_id = p.id ORDER BY o.position FOR JSON PATH) AS optionsJson`

export const list = (sohId, f, conn = db) =>
  conn.query(
    `SELECT COUNT(*) OVER() AS total, ${COLUMNS}
     FROM polls p
     WHERE p.soh_id = @sohId
       AND (@like IS NULL OR p.title LIKE @like OR p.description LIKE @like)
       AND (@status IS NULL OR p.status = @status)
     ORDER BY p.created_at DESC, p.id DESC
     OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
    {
      sohId,
      like: f.search ? `%${f.search}%` : null,
      status: f.status ?? null,
      offset: f.offset,
      limit: f.limit,
    },
  )

export const findById = (sohId, id, conn = db) =>
  conn.queryOne(`SELECT ${COLUMNS} FROM polls p WHERE p.soh_id = @sohId AND p.id = @id`, {
    sohId,
    id,
  })

/* ---------- Оршин суугчид харагдах ---------- */

const RESIDENT_SCOPE = `
  p.soh_id = @sohId AND p.status IN ('active', 'closed')
  AND (p.audience = 'all' OR p.audience = @audience)`

export const listForResident = (sohId, residentId, audience, f, conn = db) =>
  conn.query(
    `SELECT COUNT(*) OVER() AS total, ${COLUMNS},
            (SELECT v.option_id FROM poll_votes v WHERE v.poll_id = p.id AND v.resident_id = @residentId) AS myOptionId
     FROM polls p
     WHERE ${RESIDENT_SCOPE}
       AND (@status IS NULL OR p.status = @status)
     ORDER BY CASE WHEN p.status = 'active' THEN 0 ELSE 1 END, p.ends_at, p.id DESC
     OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
    { sohId, residentId, audience, status: f.status ?? null, offset: f.offset, limit: f.limit },
  )

export const findForResident = (sohId, residentId, audience, id, conn = db) =>
  conn.queryOne(
    `SELECT ${COLUMNS},
            (SELECT v.option_id FROM poll_votes v WHERE v.poll_id = p.id AND v.resident_id = @residentId) AS myOptionId
     FROM polls p WHERE ${RESIDENT_SCOPE} AND p.id = @id`,
    { sohId, residentId, audience, id },
  )

/** Идэвхтэй бөгөөд санал өгөөгүй санал асуулгын тоо (нүүр хуудсанд) */
export const countPendingForResident = (sohId, residentId, audience, conn = db) =>
  conn.queryOne(
    `SELECT COUNT(*) AS n FROM polls p
     WHERE ${RESIDENT_SCOPE} AND p.status = 'active'
       AND (p.ends_at IS NULL OR p.ends_at > SYSUTCDATETIME())
       AND NOT EXISTS (SELECT 1 FROM poll_votes v WHERE v.poll_id = p.id AND v.resident_id = @residentId)`,
    { sohId, residentId, audience },
  )

/* ---------- Бичих ---------- */

const fields = (p) => ({
  title: p.title,
  description: p.description ?? null,
  audience: p.audience,
  startsAt: p.startsAt ?? null,
  endsAt: p.endsAt ?? null,
  notify: p.notify,
})

export const create = (sohId, p, conn = db) =>
  conn.queryOne(
    `INSERT INTO polls (soh_id, title, description, audience, starts_at, ends_at, status, notify, created_by)
     OUTPUT inserted.id
     VALUES (@sohId, @title, @description, @audience, @startsAt, @endsAt, @status, @notify, @createdBy)`,
    { sohId, ...fields(p), status: p.status, createdBy: p.createdBy ?? null },
  )

export const update = (sohId, id, p, conn = db) =>
  conn.execute(
    `UPDATE polls SET title = @title, description = @description, audience = @audience,
            starts_at = @startsAt, ends_at = @endsAt, notify = @notify, updated_at = SYSUTCDATETIME()
     WHERE soh_id = @sohId AND id = @id`,
    { sohId, id, ...fields(p) },
  )

export const setStatus = (sohId, id, status, conn = db) =>
  conn.execute(
    `UPDATE polls SET status = @status, updated_at = SYSUTCDATETIME(),
            starts_at = CASE WHEN @status = 'active' THEN ISNULL(starts_at, SYSUTCDATETIME()) ELSE starts_at END
     WHERE soh_id = @sohId AND id = @id`,
    { sohId, id, status },
  )

/** Санал авсан бол устгахгүй (poll_votes → polls FK) */
export const remove = (sohId, id, conn = db) =>
  conn.execute(`DELETE FROM polls WHERE soh_id = @sohId AND id = @id`, { sohId, id })

export async function replaceOptions(pollId, options, conn = db) {
  await conn.execute(`DELETE FROM poll_options WHERE poll_id = @pollId`, { pollId })
  for (let i = 0; i < options.length; i++) {
    await conn.execute(
      `INSERT INTO poll_options (poll_id, position, [text]) VALUES (@pollId, @position, @text)`,
      { pollId, position: i + 1, text: options[i] },
    )
  }
}

export const vote = ({ pollId, optionId, residentId }, conn = db) =>
  conn.execute(
    `INSERT INTO poll_votes (poll_id, option_id, resident_id) VALUES (@pollId, @optionId, @residentId)`,
    { pollId, optionId, residentId },
  )

/** Санал өгөх эрхтэй оршин суугчдын тоо */
export const eligibleCount = (sohId, entrance, conn = db) =>
  conn.queryOne(
    `SELECT COUNT(*) AS n FROM residents
     WHERE soh_id = @sohId AND deleted_at IS NULL AND (@entrance IS NULL OR entrance = @entrance)`,
    { sohId, entrance },
  )

/** Хугацаа нь дууссан идэвхтэй санал асуулгыг хаана */
export const closeExpired = (conn = db) =>
  conn.execute(
    `UPDATE polls SET status = 'closed', updated_at = SYSUTCDATETIME()
     WHERE status = 'active' AND ends_at IS NOT NULL AND ends_at <= SYSUTCDATETIME()`,
  )
