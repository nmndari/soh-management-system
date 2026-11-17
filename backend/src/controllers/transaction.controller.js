import { parsePagination } from '../utils/pagination.js'

/** Зардал ба орлогын controller (service-ээ хүлээж авна). */
export function createTransactionController(service) {
  return {
    list: async (req, res) => {
      const q = req.validatedQuery
      res.json(await service.list(req.user.sohId, { ...q, ...parsePagination(q) }))
    },
    stats: async (req, res) => res.json({ data: await service.getStats(req.user.sohId) }),
    getById: async (req, res) =>
      res.json({ data: await service.getById(req.user.sohId, req.params.id) }),
    create: async (req, res) =>
      res.status(201).json({ data: await service.create(req.user.sohId, req.user.id, req.body) }),
    update: async (req, res) =>
      res.json({ data: await service.update(req.user.sohId, req.params.id, req.body) }),
    remove: async (req, res) => {
      await service.remove(req.user.sohId, req.params.id)
      res.status(204).end()
    },
  }
}
