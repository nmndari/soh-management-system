/*
  Оршин суугчийн апп-д зориулсан бизнес логик.
  resident = { id, sohId, entrance } (residentContext middleware-ээс)
  Оршин суугч зөвхөн өөрт хамаатай (бүх оршин суугч эсвэл өөрийн орц) мэдээллийг харна.
*/
import { env } from '../config/env.js'
import * as announcementRepo from '../repositories/announcement.repository.js'
import * as meetingRepo from '../repositories/meeting.repository.js'
import * as residentRepo from '../repositories/resident.repository.js'
import * as settingsRepo from '../repositories/settings.repository.js'
import * as txRepo from '../repositories/transaction.repository.js'
import { residentAudience } from '../utils/audience.js'
import { notFound } from '../utils/httpError.js'
import { listResponse } from '../utils/pagination.js'
import { parsePeriod, toDateString } from '../utils/period.js'
import { toMeetingDto } from './meeting.service.js'
import * as notificationService from './notification.service.js'
import * as paymentService from './payment.service.js'
import * as pollService from './poll.service.js'
import * as reportService from './report.service.js'
import { toResidentDto } from './resident.service.js'

/* ---------- Тохиргоо ---------- */

/** Апп асахад дуудна. Нууц мэдээлэл агуулахгүй. */
export async function getConfig(sohId = env.defaultSohId) {
  const soh = await settingsRepo.getSoh(sohId)
  if (!soh) throw notFound('СӨХ олдсонгүй')

  const [complaint, announcement] = await Promise.all([
    settingsRepo.listCategories(sohId, 'complaint'),
    settingsRepo.listCategories(sohId, 'announcement'),
  ])
  const pick = (list) => list.map(({ id, name }) => ({ id, name }))

  return {
    soh: {
      name: soh.name,
      address: soh.address,
      phone: soh.phone,
      email: soh.email,
      logoUrl: soh.logoUrl,
    },
    entranceCount: soh.entranceCount,
    monthlyFee: soh.monthlyFee,
    feeDueDay: soh.feeDueDay,
    bank: { name: soh.bankName, account: soh.bankAccount },
    categories: { complaint: pick(complaint), announcement: pick(announcement) },
    features: { polls: Boolean(soh.featurePolls), complaints: Boolean(soh.featureComplaints) },
    minAppVersion: soh.minAppVersion,
  }
}

/* ---------- Профайл ---------- */

export async function getMe(resident) {
  const row = await residentRepo.findById(resident.sohId, resident.id)
  if (!row) throw notFound('Оршин суугч олдсонгүй')
  const { paymentStatus, currentCharge, ...me } = toResidentDto(row)
  return {
    ...me,
    currentCharge: currentCharge && {
      ...currentCharge,
      status: paymentStatus,
    },
  }
}

export async function updateMe(resident, { email }) {
  await residentRepo.updateEmail(resident.sohId, resident.id, email)
  return getMe(resident)
}

/* ---------- Нүүр хуудас ---------- */

export async function getHome(resident) {
  const audience = residentAudience(resident.entrance)
  const today = toDateString()
  const page = { offset: 0, limit: 3 }

  const [me, announcements, meetings, pendingPolls, unreadCount] = await Promise.all([
    getMe(resident),
    announcementRepo.listForResident(resident.sohId, audience, page),
    meetingRepo.listForResident(resident.sohId, audience, today, { upcoming: true, offset: 0, limit: 1 }),
    pollService.countPendingForResident(resident),
    notificationService.unreadCountForResident(resident.id),
  ])

  return {
    resident: { id: me.id, lastName: me.lastName, firstName: me.firstName, entrance: me.entrance, apartment: me.apartment },
    currentCharge: me.currentCharge,
    latestAnnouncements: announcements.map(({ total: _t, content, ...a }) => ({
      ...a,
      notify: Boolean(a.notify),
      preview: content.slice(0, 120),
    })),
    nextMeeting: meetings[0] ? toMeetingDto((({ total: _t, ...m }) => m)(meetings[0])) : null,
    pendingPolls: pendingPolls.n,
    unreadCount,
  }
}

/* ---------- Зарлал ---------- */

const announcementDto = (a) => ({ ...a, notify: Boolean(a.notify) })

export async function listAnnouncements(resident, filters) {
  const rows = await announcementRepo.listForResident(
    resident.sohId,
    residentAudience(resident.entrance),
    filters,
  )
  return listResponse(rows, filters, announcementDto)
}

export async function getAnnouncement(resident, id) {
  const row = await announcementRepo.findForResident(
    resident.sohId,
    residentAudience(resident.entrance),
    id,
  )
  if (!row) throw notFound('Зарлал олдсонгүй')
  return announcementDto(row)
}

/* ---------- Хурал ---------- */

export async function listMeetings(resident, filters) {
  const rows = await meetingRepo.listForResident(
    resident.sohId,
    residentAudience(resident.entrance),
    toDateString(),
    filters,
  )
  return listResponse(rows, filters, toMeetingDto)
}

export async function getMeeting(resident, id) {
  const row = await meetingRepo.findForResident(
    resident.sohId,
    residentAudience(resident.entrance),
    id,
  )
  if (!row) throw notFound('Хурал олдсонгүй')
  return toMeetingDto(row)
}

/* ---------- Санхүү (ил тод байдал) ---------- */

export const getPayments = (resident, year) =>
  paymentService.getResidentHistory(resident.sohId, resident.id, year)

export async function listExpenses(resident, { period, ...filters }) {
  const range = parsePeriod(period)
  const rows = await txRepo.list('expense', resident.sohId, {
    ...filters,
    from: range?.from,
    to: range?.to,
  })
  return listResponse(rows, filters)
}

export async function getReportSummary(resident, period) {
  const [summary, expenseCategories] = await Promise.all([
    reportService.getSummary(resident.sohId, period),
    reportService.getExpenseByCategory(resident.sohId, period),
  ])
  return { ...summary, expenseCategories }
}
