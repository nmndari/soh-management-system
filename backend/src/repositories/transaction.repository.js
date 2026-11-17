/*
  expenses ба incomes хүснэгт ижил бүтэцтэй тул нэг repository-оор хоёуланг нь удирдана.
  table нь зөвхөн дотроос дамжих тогтмол утга ('expenses' | 'incomes') — хэрэглэгчээс ирэхгүй.
*/
import { db } from '../config/db.js'

const TABLES = { expense: 'expenses', income: 'incomes' }

const tableOf = (kind) => {
  const table = TABLES[kind]
  if (!table) throw new Error(`Unknown transaction kind: ${kind}`)
  return table
}

const columns = (t) => `
  t.id, t.title, t.category_id AS categoryId, c.name AS category, t.description, t.amount,
  CONVERT(char(10), t.[date], 23) AS [date]`

export const list = (kind, sohId, f, conn = db) => {
  const t = tableOf(kind)
  return conn.query(
    `SELECT COUNT(*) OVER() AS total, ${columns(t)}
     FROM ${t} t JOIN categories c ON c.id = t.category_id
     WHERE t.soh_id = @sohId
       AND (@like IS NULL OR t.title LIKE @like OR t.description LIKE @like)
       AND (@categoryId IS NULL OR t.category_id = @categoryId)
       AND (@from IS NULL OR t.[date] >= @from)
       AND (@to IS NULL OR t.[date] <= @to)
     ORDER BY t.[date] DESC, t.id DESC
     OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
    {
      sohId,
      like: f.search ? `%${f.search}%` : null,
      categoryId: f.categoryId ?? null,
      from: f.from ?? null,
      to: f.to ?? null,
      offset: f.offset,
      limit: f.limit,
    },
  )
}

export const findById = (kind, sohId, id, conn = db) => {
  const t = tableOf(kind)
  return conn.queryOne(
    `SELECT ${columns(t)} FROM ${t} t JOIN categories c ON c.id = t.category_id
     WHERE t.soh_id = @sohId AND t.id = @id`,
    { sohId, id },
  )
}

export const create = (kind, sohId, data, conn = db) => {
  const t = tableOf(kind)
  const residentCol = kind === 'income' ? ', resident_id' : ''
  const residentVal = kind === 'income' ? ', @residentId' : ''
  return conn.queryOne(
    `INSERT INTO ${t} (soh_id, title, category_id, description, amount, [date], created_by${residentCol})
     OUTPUT inserted.id
     VALUES (@sohId, @title, @categoryId, @description, @amount, @date, @createdBy${residentVal})`,
    {
      sohId,
      title: data.title,
      categoryId: data.categoryId,
      description: data.description ?? null,
      amount: data.amount,
      date: data.date,
      createdBy: data.createdBy ?? null,
      ...(kind === 'income' && { residentId: data.residentId ?? null }),
    },
  )
}

export const update = (kind, sohId, id, data, conn = db) => {
  const t = tableOf(kind)
  return conn.execute(
    `UPDATE ${t} SET title = @title, category_id = @categoryId, description = @description,
            amount = @amount, [date] = @date, updated_at = SYSUTCDATETIME()
     WHERE soh_id = @sohId AND id = @id`,
    {
      sohId,
      id,
      title: data.title,
      categoryId: data.categoryId,
      description: data.description ?? null,
      amount: data.amount,
      date: data.date,
    },
  )
}

export const remove = (kind, sohId, id, conn = db) => {
  const t = tableOf(kind)
  return conn.execute(`DELETE FROM ${t} WHERE soh_id = @sohId AND id = @id`, { sohId, id })
}

/** Нийт дүн, тухайн үеийн дүн, тоо */
export const stats = (kind, sohId, range, conn = db) => {
  const t = tableOf(kind)
  return conn.queryOne(
    `SELECT ISNULL(SUM(amount), 0) AS total,
            ISNULL(SUM(CASE WHEN [date] BETWEEN @from AND @to THEN amount END), 0) AS thisMonth,
            COUNT(*) AS [count]
     FROM ${t} WHERE soh_id = @sohId`,
    { sohId, from: range.from, to: range.to },
  )
}
