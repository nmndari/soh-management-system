import * as service from '../services/resident.service.js'
import * as paymentService from '../services/payment.service.js'
import { parsePagination } from '../utils/pagination.js'

export const list = async (req, res) => {
  const q = req.validatedQuery
  res.json(await service.list(req.user.sohId, { ...q, ...parsePagination(q) }))
}

export const stats = async (req, res) => res.json({ data: await service.getStats(req.user.sohId) })

export const getById = async (req, res) =>
  res.json({ data: await service.getById(req.user.sohId, req.params.id) })

export const create = async (req, res) =>
  res.status(201).json({ data: await service.create(req.user.sohId, req.body) })

export const update = async (req, res) =>
  res.json({ data: await service.update(req.user.sohId, req.params.id, req.body) })

export const remove = async (req, res) => {
  await service.softDelete(req.user.sohId, req.params.id)
  res.status(204).end()
}

export const payments = async (req, res) =>
  res.json({
    data: await paymentService.getResidentHistory(
      req.user.sohId,
      req.params.id,
      req.validatedQuery.year,
    ),
  })
