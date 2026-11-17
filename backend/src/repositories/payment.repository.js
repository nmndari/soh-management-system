import { db } from '../config/db.js'

const COLUMNS = `
  p.id, p.resident_id AS residentId, p.charge_id AS chargeId, p.amount,
  CONVERT(varchar(19), p.paid_at, 126) AS paidAt, p.method, p.note, p.income_id AS incomeId`

export const create = (sohId, p, conn = db) =>
  conn.queryOne(
    `INSERT INTO payments (soh_id, resident_id, charge_id, amount, paid_at, method, note, income_id, created_by)
     OUTPUT inserted.id
     VALUES (@sohId, @residentId, @chargeId, @amount, @paidAt, @method, @note, @incomeId, @createdBy)`,
    { sohId, ...p },
  )

export const findById = (sohId, id, conn = db) =>
  conn.queryOne(`SELECT ${COLUMNS} FROM payments p WHERE p.soh_id = @sohId AND p.id = @id`, {
    sohId,
    id,
  })

export const remove = (id, conn = db) =>
  conn.execute(`DELETE FROM payments WHERE id = @id`, { id })

export const list = (sohId, f, conn = db) =>
  conn.query(
    `SELECT COUNT(*) OVER() AS total, ${COLUMNS},
            r.last_name AS lastName, r.first_name AS firstName, r.entrance, r.apartment,
            c.period
     FROM payments p
     JOIN residents r ON r.id = p.resident_id
     LEFT JOIN fee_charges c ON c.id = p.charge_id
     WHERE p.soh_id = @sohId
       AND (@residentId IS NULL OR p.resident_id = @residentId)
       AND (@method IS NULL OR p.method = @method)
       AND (@from IS NULL OR CAST(p.paid_at AS date) >= @from)
       AND (@to IS NULL OR CAST(p.paid_at AS date) <= @to)
     ORDER BY p.paid_at DESC
     OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
    {
      sohId,
      residentId: f.residentId ?? null,
      method: f.method ?? null,
      from: f.from ?? null,
      to: f.to ?? null,
      offset: f.offset,
      limit: f.limit,
    },
  )

export const listByResident = (residentId, year, conn = db) =>
  conn.query(
    `SELECT ${COLUMNS}, c.period FROM payments p
     LEFT JOIN fee_charges c ON c.id = p.charge_id
     WHERE p.resident_id = @residentId AND (@year IS NULL OR YEAR(p.paid_at) = @year)
     ORDER BY p.paid_at DESC`,
    { residentId, year: year ?? null },
  )
