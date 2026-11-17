import { db } from '../config/db.js'

export const getSoh = (sohId, conn = db) =>
  conn.queryOne(
    `SELECT id, name, address, phone, email,
            entrance_count AS entranceCount, monthly_fee AS monthlyFee, fee_due_day AS feeDueDay,
            bank_name AS bankName, bank_account AS bankAccount, logo_url AS logoUrl,
            min_app_version AS minAppVersion,
            feature_polls AS featurePolls, feature_complaints AS featureComplaints
     FROM soh WHERE id = @sohId`,
    { sohId },
  )

export const updateSoh = (sohId, s, conn = db) =>
  conn.execute(
    `UPDATE soh SET
       name = @name, address = @address, phone = @phone, email = @email,
       entrance_count = @entranceCount, monthly_fee = @monthlyFee, fee_due_day = @feeDueDay,
       bank_name = @bankName, bank_account = @bankAccount,
       updated_at = SYSUTCDATETIME()
     WHERE id = @sohId`,
    { sohId, ...s },
  )

/* ---------- Ангилал ---------- */

export const listCategories = (sohId, type, conn = db) =>
  conn.query(
    `SELECT id, type, name, sort_order AS sortOrder
     FROM categories
     WHERE soh_id = @sohId AND (@type IS NULL OR type = @type)
     ORDER BY type, sort_order, name`,
    { sohId, type: type ?? null },
  )

export const findCategory = (sohId, id, conn = db) =>
  conn.queryOne(
    `SELECT id, type, name FROM categories WHERE soh_id = @sohId AND id = @id`,
    { sohId, id },
  )

export const findCategoryByName = (sohId, type, name, conn = db) =>
  conn.queryOne(
    `SELECT id, type, name FROM categories WHERE soh_id = @sohId AND type = @type AND name = @name`,
    { sohId, type, name },
  )

export const createCategory = (sohId, { type, name, sortOrder = 0 }, conn = db) =>
  conn.queryOne(
    `INSERT INTO categories (soh_id, type, name, sort_order)
     OUTPUT inserted.id, inserted.type, inserted.name, inserted.sort_order AS sortOrder
     VALUES (@sohId, @type, @name, @sortOrder)`,
    { sohId, type, name, sortOrder },
  )

export const updateCategory = (sohId, id, { name, sortOrder }, conn = db) =>
  conn.execute(
    `UPDATE categories SET name = @name, sort_order = ISNULL(@sortOrder, sort_order),
            updated_at = SYSUTCDATETIME()
     WHERE soh_id = @sohId AND id = @id`,
    { sohId, id, name, sortOrder: sortOrder ?? null },
  )

export const deleteCategory = (sohId, id, conn = db) =>
  conn.execute(`DELETE FROM categories WHERE soh_id = @sohId AND id = @id`, { sohId, id })
