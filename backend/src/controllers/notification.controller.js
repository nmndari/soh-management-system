import * as service from '../services/notification.service.js'

export const list = async (req, res) => {
  const { unread, limit } = req.validatedQuery
  res.json(await service.listForAdmin(req.user.id, { unreadOnly: unread, limit }))
}

export const markRead = async (req, res) => {
  await service.markRead(req.user.id, req.params.id)
  res.status(204).end()
}

export const markAllRead = async (req, res) => {
  await service.markAllRead(req.user.id)
  res.status(204).end()
}
