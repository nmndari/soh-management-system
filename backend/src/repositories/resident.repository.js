import { db } from '../config/db.js'

// v_resident_payment_status нь энэ сарын нэхэмжлэлээс төлөвийг тооцдог
const SELECT = `
  SELECT r.id, r.last_name AS lastName, r.first_name AS firstName, r.phone, r.email,
         r.entrance, r.floor, r.apartment,
         v.payment_status AS paymentStatus, v.period AS chargePeriod,
         v.amount AS chargeAmount, v.paid_amount AS chargePaidAmount,
         CONVERT(char(10), v.due_date, 23) AS chargeDueDate
  FROM residents r
  JOIN v_resident_payment_status v ON v.resident_id = r.id`

export const list = (sohId, f, conn = db) =>
  conn.query(
    `${SELECT.replace('SELECT r.id', 'SELECT COUNT(*) OVER() AS total, r.id')}
     WHERE r.soh_id = @sohId AND r.deleted_at IS NULL
       AND (@like IS NULL
            OR (r.last_name + N' ' + r.first_name) LIKE @like
            OR (r.first_name + N' ' + r.last_name) LIKE @like
            OR r.phone LIKE @like OR r.apartment LIKE @like)
       AND (@entrance IS NULL OR r.entrance = @entrance)
       AND (@paymentStatus IS NULL OR v.payment_status = @paymentStatus)
     ORDER BY r.entrance, TRY_CAST(r.apartment AS int), r.id
     OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
    {
      sohId,
      like: f.search ? `%${f.search}%` : null,
      entrance: f.entrance ?? null,
      paymentStatus: f.paymentStatus ?? null,
      offset: f.offset,
      limit: f.limit,
    },
  )

export const stats = (sohId, conn = db) =>
  conn.queryOne(
    `SELECT COUNT(*) AS total,
            ISNULL(SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END), 0) AS paid,
            ISNULL(SUM(CASE WHEN payment_status = 'unpaid' THEN 1 ELSE 0 END), 0) AS unpaid,
            ISNULL(SUM(CASE WHEN payment_status = 'no_charge' THEN 1 ELSE 0 END), 0) AS noCharge
     FROM v_resident_payment_status WHERE soh_id = @sohId`,
    { sohId },
  )

export const findById = (sohId, id, conn = db) =>
  conn.queryOne(
    `${SELECT} WHERE r.soh_id = @sohId AND r.id = @id AND r.deleted_at IS NULL`,
    { sohId, id },
  )

// Сонголттой талбар дутуу ирсэн ч SQL параметр бүгд зарлагдсан байх ёстой
const fields = (r) => ({
  lastName: r.lastName,
  firstName: r.firstName,
  phone: r.phone,
  email: r.email ?? null,
  entrance: r.entrance,
  floor: r.floor ?? null,
  apartment: r.apartment,
})

export const create = (sohId, r, conn = db) =>
  conn.queryOne(
    `INSERT INTO residents (soh_id, last_name, first_name, phone, email, entrance, floor, apartment)
     OUTPUT inserted.id
     VALUES (@sohId, @lastName, @firstName, @phone, @email, @entrance, @floor, @apartment)`,
    { sohId, ...fields(r) },
  )

export const update = (sohId, id, r, conn = db) =>
  conn.execute(
    `UPDATE residents SET
       last_name = @lastName, first_name = @firstName, phone = @phone, email = @email,
       entrance = @entrance, floor = @floor, apartment = @apartment,
       updated_at = SYSUTCDATETIME()
     WHERE soh_id = @sohId AND id = @id AND deleted_at IS NULL`,
    { sohId, id, ...fields(r) },
  )

export const softDelete = (sohId, id, conn = db) =>
  conn.execute(
    `UPDATE residents SET deleted_at = SYSUTCDATETIME(), is_active = 0, updated_at = SYSUTCDATETIME()
     WHERE soh_id = @sohId AND id = @id AND deleted_at IS NULL`,
    { sohId, id },
  )

/* ---------- Апп нэвтрэлт ---------- */

/** Утасны дугаараар идэвхтэй оршин суугч (OTP нэвтрэлт) */
export const findByPhone = (phone, conn = db) =>
  conn.queryOne(
    `SELECT id, soh_id AS sohId, last_name AS lastName, first_name AS firstName, phone, entrance
     FROM residents WHERE phone = @phone AND deleted_at IS NULL AND is_active = 1`,
    { phone },
  )

/** СӨХ мэдэхгүй үед (refresh token) id-аар */
export const findActiveById = (id, conn = db) =>
  conn.queryOne(
    `SELECT id, soh_id AS sohId, entrance FROM residents
     WHERE id = @id AND deleted_at IS NULL AND is_active = 1`,
    { id },
  )

export const updateEmail = (sohId, id, email, conn = db) =>
  conn.execute(
    `UPDATE residents SET email = @email, updated_at = SYSUTCDATETIME()
     WHERE soh_id = @sohId AND id = @id AND deleted_at IS NULL`,
    { sohId, id, email },
  )

export const countActive = (sohId, conn = db) =>
  conn.queryOne(
    `SELECT COUNT(*) AS n FROM residents WHERE soh_id = @sohId AND deleted_at IS NULL`,
    { sohId },
  )
