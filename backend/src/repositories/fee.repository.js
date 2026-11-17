import { db } from '../config/db.js'

const CHARGE_COLUMNS = `
  c.id, c.resident_id AS residentId, c.period, c.amount, c.paid_amount AS paidAmount,
  c.status, CONVERT(char(10), c.due_date, 23) AS dueDate`

/** Тухайн сарын нэхэмжлэлийг бүх идэвхтэй оршин суугчид үүсгэнэ. Давхар үүсгэхгүй. */
export const generateForPeriod = (sohId, period, conn = db) =>
  conn.execute(
    `INSERT INTO fee_charges (soh_id, resident_id, period, amount, due_date)
     SELECT r.soh_id, r.id, @period, s.monthly_fee,
            DATEFROMPARTS(CAST(LEFT(@period, 4) AS int), CAST(RIGHT(@period, 2) AS int), s.fee_due_day)
     FROM residents r
     JOIN soh s ON s.id = r.soh_id
     WHERE r.soh_id = @sohId AND r.deleted_at IS NULL
       AND NOT EXISTS (SELECT 1 FROM fee_charges c WHERE c.resident_id = r.id AND c.period = @period)`,
    { sohId, period },
  )

/** Нэг оршин суугчид тухайн сарын нэхэмжлэл үүсгэнэ (байхгүй бол). */
export const ensureForResident = (sohId, residentId, period, conn = db) =>
  conn.execute(
    `INSERT INTO fee_charges (soh_id, resident_id, period, amount, due_date)
     SELECT s.id, @residentId, @period, s.monthly_fee,
            DATEFROMPARTS(CAST(LEFT(@period, 4) AS int), CAST(RIGHT(@period, 2) AS int), s.fee_due_day)
     FROM soh s
     WHERE s.id = @sohId AND s.monthly_fee > 0
       AND NOT EXISTS (SELECT 1 FROM fee_charges c WHERE c.resident_id = @residentId AND c.period = @period)`,
    { sohId, residentId, period },
  )

export const list = (sohId, f, conn = db) =>
  conn.query(
    `SELECT COUNT(*) OVER() AS total, ${CHARGE_COLUMNS},
            r.last_name AS lastName, r.first_name AS firstName, r.entrance, r.apartment
     FROM fee_charges c
     JOIN residents r ON r.id = c.resident_id
     WHERE c.soh_id = @sohId
       AND (@period IS NULL OR c.period = @period)
       AND (@status IS NULL OR c.status = @status)
       AND (@entrance IS NULL OR r.entrance = @entrance)
     ORDER BY c.period DESC, r.entrance, TRY_CAST(r.apartment AS int)
     OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
    {
      sohId,
      period: f.period ?? null,
      status: f.status ?? null,
      entrance: f.entrance ?? null,
      offset: f.offset,
      limit: f.limit,
    },
  )

export const listByResident = (residentId, year, conn = db) =>
  conn.query(
    `SELECT ${CHARGE_COLUMNS} FROM fee_charges c
     WHERE c.resident_id = @residentId AND (@year IS NULL OR LEFT(c.period, 4) = @year)
     ORDER BY c.period DESC`,
    { residentId, year: year ? String(year) : null },
  )

export const findById = (sohId, id, conn = db) =>
  conn.queryOne(
    `SELECT ${CHARGE_COLUMNS} FROM fee_charges c WHERE c.soh_id = @sohId AND c.id = @id`,
    { sohId, id },
  )

/** Хамгийн хуучин төлөгдөөгүй нэхэмжлэл */
export const findOldestUnpaid = (residentId, conn = db) =>
  conn.queryOne(
    `SELECT TOP 1 ${CHARGE_COLUMNS} FROM fee_charges c
     WHERE c.resident_id = @residentId AND c.paid_amount < c.amount
     ORDER BY c.period`,
    { residentId },
  )

export const addPaid = (id, delta, conn = db) =>
  conn.execute(
    `UPDATE fee_charges SET paid_amount = paid_amount + @delta, updated_at = SYSUTCDATETIME()
     WHERE id = @id`,
    { id, delta },
  )
