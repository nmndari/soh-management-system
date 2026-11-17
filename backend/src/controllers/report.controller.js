import * as service from '../services/report.service.js'
import * as dashboardService from '../services/dashboard.service.js'
import { parsePagination } from '../utils/pagination.js'

export const summary = async (req, res) =>
  res.json({ data: await service.getSummary(req.user.sohId, req.validatedQuery.period) })

export const monthly = async (req, res) =>
  res.json({ data: await service.getMonthly(req.user.sohId, req.validatedQuery.months) })

export const expenseCategories = async (req, res) =>
  res.json({ data: await service.getExpenseByCategory(req.user.sohId, req.validatedQuery.period) })

export const transactions = async (req, res) => {
  const q = req.validatedQuery
  res.json(await service.getTransactions(req.user.sohId, q.period, { ...q, ...parsePagination(q) }))
}

export const dashboard = async (req, res) =>
  res.json({ data: await dashboardService.getSummary(req.user.sohId) })
