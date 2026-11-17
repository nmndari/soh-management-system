/*
  Зарлал ба хурлын controller. Хоёулаа ижил CRUD + төлөв солих хэлбэртэй.
*/
import * as announcementService from '../services/announcement.service.js'
import * as meetingService from '../services/meeting.service.js'
import { parsePagination } from '../utils/pagination.js'

function createContentController(service, statusActions) {
  const controller = {
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
  for (const action of statusActions) {
    controller[action] = async (req, res) =>
      res.json({ data: await service[action](req.user.sohId, req.params.id) })
  }
  return controller
}

export const announcementController = createContentController(announcementService, [
  'publish',
  'unpublish',
])

export const meetingController = createContentController(meetingService, [
  'publish',
  'complete',
  'unpublish',
])
