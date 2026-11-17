import * as feeService from '../services/fee.service.js'
import * as paymentService from '../services/payment.service.js'
import { parsePagination } from '../utils/pagination.js'

export const listCharges = async (req, res) => {
  const q = req.validatedQuery
  res.json(await feeService.listCharges(req.user.sohId, { ...q, ...parsePagination(q) }))
}

export const generate = async (req, res) =>
  res.status(201).json({
    data: await feeService.generateMonthlyCharges(req.user.sohId, req.body.period),
  })

export const listPayments = async (req, res) => {
  const q = req.validatedQuery
  res.json(await paymentService.list(req.user.sohId, { ...q, ...parsePagination(q) }))
}

export const createPayment = async (req, res) =>
  res.status(201).json({
    data: await paymentService.recordPayment(req.user.sohId, req.user.id, req.body),
  })

export const deletePayment = async (req, res) => {
  await paymentService.reversePayment(req.user.sohId, req.params.id)
  res.status(204).end()
}
