import { api } from './api'
import { categoryIdByName } from './categories'
import { filterValue, transactionType } from './labels'
import { monthLabel } from '../utils/date'

/* ---------- Зардал ---------- */

async function expenseBody(form) {
  const categoryId = await categoryIdByName('expense', form.category)
  return {
    title: form.title.trim(),
    categoryId,
    description: form.description?.trim() || null,
    amount: Number(form.amount),
    date: form.date,
  }
}

export async function listExpenses({ search, category }) {
  const categoryName = filterValue(category, 'Бүх ангилал')
  const categoryId = categoryName ? await categoryIdByName('expense', categoryName) : undefined
  const res = await api.get('/expenses', { search, categoryId, limit: 100 })
  return { items: res.data, total: res.meta.total }
}

export const getExpenseStats = async () => (await api.get('/expenses/stats')).data

export const createExpense = async (form) => (await api.post('/expenses', await expenseBody(form))).data

export const updateExpense = async (id, form) =>
  (await api.put(`/expenses/${id}`, await expenseBody(form))).data

export const deleteExpense = (id) => api.del(`/expenses/${id}`)

/* ---------- Тайлан ---------- */

export async function getReport(period) {
  const [summary, monthly, categories, transactions] = await Promise.all([
    api.get('/reports/summary', { period }),
    api.get('/reports/monthly', { months: 6 }),
    api.get('/reports/expense-categories', { period }),
    api.get('/reports/transactions', { period, limit: 100 }),
  ])
  return {
    summary: summary.data,
    monthly: monthly.data.map((m) => ({ ...m, month: monthLabel(m.month) })),
    expenseCategories: categories.data,
    transactions: transactions.data.map((t) => ({ ...t, type: transactionType.toLabel(t.type) })),
    transactionTotal: transactions.meta.total,
  }
}

/* ---------- Хянах самбар ---------- */

export const getDashboard = async () => (await api.get('/dashboard/summary')).data
