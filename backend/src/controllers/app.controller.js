/*
  Оршин суугчийн апп-ын controller (/app/*). req.resident = { id, sohId, entrance }
*/
import { publicUrl, removeFiles } from '../middlewares/upload.js'
import * as appService from '../services/app.service.js'
import * as complaintService from '../services/complaint.service.js'
import * as notificationService from '../services/notification.service.js'
import * as pollService from '../services/poll.service.js'
import { parsePagination } from '../utils/pagination.js'
import { complaintCreate } from '../validators/schemas.js'

const paged = (req) => ({ ...req.validatedQuery, ...parsePagination(req.validatedQuery) })

/* Тохиргоо, профайл */
export const config = async (req, res) =>
  res.json({ data: await appService.getConfig(req.user?.sohId) })
export const me = async (req, res) => res.json({ data: await appService.getMe(req.resident) })
export const updateMe = async (req, res) =>
  res.json({ data: await appService.updateMe(req.resident, req.body) })
export const home = async (req, res) => res.json({ data: await appService.getHome(req.resident) })

/* Зарлал, хурал */
export const announcements = async (req, res) =>
  res.json(await appService.listAnnouncements(req.resident, paged(req)))
export const announcement = async (req, res) =>
  res.json({ data: await appService.getAnnouncement(req.resident, req.params.id) })
export const meetings = async (req, res) =>
  res.json(await appService.listMeetings(req.resident, paged(req)))
export const meeting = async (req, res) =>
  res.json({ data: await appService.getMeeting(req.resident, req.params.id) })

/* Санал асуулга */
export const polls = async (req, res) =>
  res.json(await pollService.listForResident(req.resident, paged(req)))
export const poll = async (req, res) =>
  res.json({ data: await pollService.getForResident(req.resident, req.params.id) })
export const vote = async (req, res) =>
  res.status(201).json({
    data: await pollService.vote(req.resident, req.params.id, req.body.optionId),
  })
export const pollResults = async (req, res) =>
  res.json({ data: await pollService.getResultsForResident(req.resident, req.params.id) })

/* Санал гомдол, засварын хүсэлт */
export const complaints = async (req, res) =>
  res.json(await complaintService.listForResident(req.resident, paged(req)))
export const complaint = async (req, res) =>
  res.json({ data: await complaintService.getForResident(req.resident, req.params.id) })
// multipart тул validation-ийг файл хадгалсны дараа энд хийж, алдаа гарвал файлыг устгана
export async function createComplaint(req, res) {
  try {
    const body = complaintCreate.parse(req.body ?? {})
    const imageUrls = (req.files || []).map(publicUrl)
    const data = await complaintService.createByResident(req.resident, body, imageUrls)
    res.status(201).json({ data })
  } catch (err) {
    removeFiles(req.files)
    throw err
  }
}

/* Санхүү */
export const payments = async (req, res) =>
  res.json({ data: await appService.getPayments(req.resident, req.validatedQuery.year) })
export const expenses = async (req, res) =>
  res.json(await appService.listExpenses(req.resident, paged(req)))
export const reportSummary = async (req, res) =>
  res.json({ data: await appService.getReportSummary(req.resident, req.validatedQuery.period) })

/* Мэдэгдэл, төхөөрөмж */
export const notifications = async (req, res) => {
  const { unread, limit } = req.validatedQuery
  res.json(await notificationService.listForResident(req.resident.id, { unreadOnly: unread, limit }))
}
export const readNotification = async (req, res) => {
  await notificationService.markReadForResident(req.resident.id, req.params.id)
  res.status(204).end()
}
export const registerDevice = async (req, res) => {
  await notificationService.registerDevice(req.resident.id, req.body.fcmToken, req.body.platform)
  res.status(204).end()
}
export const removeDevice = async (req, res) => {
  await notificationService.removeDevice(req.resident.id, req.params.token)
  res.status(204).end()
}
