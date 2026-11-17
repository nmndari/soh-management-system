import * as repo from '../repositories/report.repository.js'
import { listResponse } from '../utils/pagination.js'
import { lastMonths, parsePeriod } from '../utils/period.js'

export async function getSummary(sohId, period) {
  const s = await repo.summary(sohId, parsePeriod(period))
  return { ...s, balance: s.totalIncome - s.totalExpense }
}

/** Сүүлийн N сар. Гүйлгээгүй сарыг 0-ээр нөхнө. */
export async function getMonthly(sohId, months) {
  const keys = lastMonths(months)
  const range = {
    from: `${keys[0]}-01`,
    to: parsePeriod(keys[keys.length - 1]).to,
  }
  const rows = await repo.monthly(sohId, range)
  const byMonth = new Map(rows.map((r) => [r.month, r]))
  return keys.map((month) => ({
    month,
    income: byMonth.get(month)?.income ?? 0,
    expense: byMonth.get(month)?.expense ?? 0,
  }))
}

export const getExpenseByCategory = (sohId, period) =>
  repo.expenseByCategory(sohId, parsePeriod(period))

export async function getTransactions(sohId, period, filters) {
  const rows = await repo.transactions(sohId, parsePeriod(period), filters)
  return listResponse(rows, filters)
}
