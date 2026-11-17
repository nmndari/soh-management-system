/*
  Админы санал асуулга ба санал гомдлын controller.
*/
import * as complaintService from '../services/complaint.service.js'
import * as pollService from '../services/poll.service.js'
import { parsePagination } from '../utils/pagination.js'

const paged = (req) => ({ ...req.validatedQuery, ...parsePagination(req.validatedQuery) })
const sohId = (req) => req.user.sohId

export const polls = {
  list: async (req, res) => res.json(await pollService.list(sohId(req), paged(req))),
  getById: async (req, res) => res.json({ data: await pollService.getById(sohId(req), req.params.id) }),
  create: async (req, res) =>
    res.status(201).json({ data: await pollService.create(sohId(req), req.user.id, req.body) }),
  update: async (req, res) =>
    res.json({ data: await pollService.update(sohId(req), req.params.id, req.body) }),
  remove: async (req, res) => {
    await pollService.remove(sohId(req), req.params.id)
    res.status(204).end()
  },
  publish: async (req, res) => res.json({ data: await pollService.publish(sohId(req), req.params.id) }),
  close: async (req, res) => res.json({ data: await pollService.close(sohId(req), req.params.id) }),
  results: async (req, res) =>
    res.json({ data: await pollService.getResults(sohId(req), req.params.id) }),
}

export const complaints = {
  list: async (req, res) => res.json(await complaintService.list(sohId(req), paged(req))),
  stats: async (req, res) => res.json({ data: await complaintService.getStats(sohId(req)) }),
  getById: async (req, res) =>
    res.json({ data: await complaintService.getById(sohId(req), req.params.id) }),
  updateStatus: async (req, res) =>
    res.json({
      data: await complaintService.updateStatus(sohId(req), req.params.id, req.body.status),
    }),
  reply: async (req, res) =>
    res.status(201).json({
      data: await complaintService.addAdminReply(
        sohId(req),
        req.user.id,
        req.params.id,
        req.body.message,
      ),
    }),
}
