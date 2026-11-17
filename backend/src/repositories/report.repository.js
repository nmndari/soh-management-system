import { db } from '../config/db.js'

const rangeParams = (sohId, range) => ({
  sohId,
  from: range?.from ?? null,
  to: range?.to ?? null,
})

const IN_RANGE = `(@from IS NULL OR [date] BETWEEN @from AND @to)`

export const summary = (sohId, range, conn = db) =>
  conn.queryOne(
    `SELECT
       (SELECT ISNULL(SUM(amount), 0) FROM incomes  WHERE soh_id = @sohId AND ${IN_RANGE}) AS totalIncome,
       (SELECT ISNULL(SUM(amount), 0) FROM expenses WHERE soh_id = @sohId AND ${IN_RANGE}) AS totalExpense,
       (SELECT COUNT(*) FROM incomes  WHERE soh_id = @sohId AND ${IN_RANGE})
     + (SELECT COUNT(*) FROM expenses WHERE soh_id = @sohId AND ${IN_RANGE}) AS transactionCount`,
    rangeParams(sohId, range),
  )

/** Сар бүрийн орлого, зарлага. Мөргүй сарыг service нөхнө. */
export const monthly = (sohId, range, conn = db) =>
  conn.query(
    `SELECT [month], SUM(income) AS income, SUM(expense) AS expense FROM (
       SELECT FORMAT([date], 'yyyy-MM') AS [month], amount AS income, 0 AS expense
       FROM incomes WHERE soh_id = @sohId AND ${IN_RANGE}
       UNION ALL
       SELECT FORMAT([date], 'yyyy-MM'), 0, amount
       FROM expenses WHERE soh_id = @sohId AND ${IN_RANGE}
     ) x GROUP BY [month] ORDER BY [month]`,
    rangeParams(sohId, range),
  )

export const expenseByCategory = (sohId, range, conn = db) =>
  conn.query(
    `SELECT c.name, SUM(e.amount) AS value
     FROM expenses e JOIN categories c ON c.id = e.category_id
     WHERE e.soh_id = @sohId AND (@from IS NULL OR e.[date] BETWEEN @from AND @to)
     GROUP BY c.name ORDER BY value DESC`,
    rangeParams(sohId, range),
  )

export const transactions = (sohId, range, f, conn = db) =>
  conn.query(
    `SELECT COUNT(*) OVER() AS total, * FROM (
       SELECT i.id, i.title, c.name AS category, i.amount,
              CONVERT(char(10), i.[date], 23) AS [date], 'income' AS type
       FROM incomes i JOIN categories c ON c.id = i.category_id
       WHERE i.soh_id = @sohId AND (@from IS NULL OR i.[date] BETWEEN @from AND @to)
       UNION ALL
       SELECT e.id, e.title, c.name, e.amount, CONVERT(char(10), e.[date], 23), 'expense'
       FROM expenses e JOIN categories c ON c.id = e.category_id
       WHERE e.soh_id = @sohId AND (@from IS NULL OR e.[date] BETWEEN @from AND @to)
     ) t
     WHERE (@type IS NULL OR t.type = @type)
     ORDER BY t.[date] DESC, t.type, t.id DESC
     OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
    { ...rangeParams(sohId, range), type: f.type ?? null, offset: f.offset, limit: f.limit },
  )
