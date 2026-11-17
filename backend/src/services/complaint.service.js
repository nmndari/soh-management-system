import { withTransaction } from '../config/db.js'
import * as repo from '../repositories/complaint.repository.js'
import { badRequest, notFound } from '../utils/httpError.js'
import { listResponse } from '../utils/pagination.js'
import * as notificationService from './notification.service.js'
import { assertCategory } from './settings.service.js'

const utc = (s) => (s ? `${s}Z` : null)

const STATUS_TEXT = {
  new: 'Шинэ',
  in_progress: 'Шийдвэрлэж байна',
  resolved: 'Шийдвэрлэсэн',
  rejected: 'Татгалзсан',
}

function toDto({ imageUrlsJson, lastName, firstName, phone, entrance, apartment, ...c }) {
  return {
    ...c,
    imageUrls: imageUrlsJson ? JSON.parse(imageUrlsJson) : [],
    createdAt: utc(c.createdAt),
    resolvedAt: utc(c.resolvedAt),
    resident: { id: c.residentId, name: `${lastName} ${firstName}`, phone, entrance, apartment },
  }
}

const toReplyDto = (r) => ({ ...r, createdAt: utc(r.createdAt) })

async function withReplies(complaint) {
  const replies = await repo.listReplies(complaint.id)
  return { ...complaint, replies: replies.map(toReplyDto) }
}

/* ================= Админ ================= */

export async function list(sohId, filters) {
  const rows = await repo.list(sohId, filters)
  return listResponse(rows, filters, toDto)
}

export const getStats = (sohId) => repo.stats(sohId)

export async function getById(sohId, id) {
  const row = await repo.findById(sohId, id)
  if (!row) throw notFound('Санал гомдол олдсонгүй')
  return withReplies(toDto(row))
}

export async function updateStatus(sohId, id, status) {
  const before = await getById(sohId, id)
  if (before.status === status) return before

  await withTransaction(async (conn) => {
    await repo.setStatus(sohId, id, status, conn)
    await notificationService.notifyResident(
      sohId,
      before.residentId,
      {
        type: 'complaint_status',
        title: `${before.type === 'maintenance' ? 'Засварын хүсэлт' : 'Санал гомдол'}: ${STATUS_TEXT[status]}`,
        message: before.title,
        refType: 'complaint',
        refId: id,
      },
      conn,
    )
  })
  return getById(sohId, id)
}

export async function addAdminReply(sohId, adminId, id, message) {
  const complaint = await getById(sohId, id)

  await withTransaction(async (conn) => {
    await repo.addReply(
      { complaintId: id, authorType: 'admin', authorId: adminId, message },
      conn,
    )
    // Хариу бичихэд шинэ гомдлыг "шийдвэрлэж байна" болгоно
    if (complaint.status === 'new') await repo.setStatus(sohId, id, 'in_progress', conn)
    await notificationService.notifyResident(
      sohId,
      complaint.residentId,
      {
        type: 'complaint_reply',
        title: 'СӨХ таны хүсэлтэд хариу бичлээ',
        message: message.slice(0, 200),
        refType: 'complaint',
        refId: id,
      },
      conn,
    )
  })
  return getById(sohId, id)
}

/* ================= Оршин суугч ================= */

export async function createByResident(resident, data, imageUrls) {
  if (data.categoryId) await assertCategory(resident.sohId, data.categoryId, 'complaint')

  const id = await withTransaction(async (conn) => {
    const { id } = await repo.create(
      resident.sohId,
      { ...data, residentId: resident.id, imageUrls },
      conn,
    )
    await notificationService.notifyAdmins(
      resident.sohId,
      {
        type: 'complaint_created',
        title: data.type === 'maintenance' ? 'Шинэ засварын хүсэлт' : 'Шинэ санал гомдол',
        message: data.title,
        refType: 'complaint',
        refId: id,
      },
      conn,
    )
    return id
  })
  return getForResident(resident, id)
}

export async function listForResident(resident, filters) {
  const rows = await repo.list(resident.sohId, { ...filters, residentId: resident.id })
  return listResponse(rows, filters, toDto)
}

export async function getForResident(resident, id) {
  const row = await repo.findById(resident.sohId, id)
  // Бусдын гомдлыг харуулахгүй
  if (!row || row.residentId !== resident.id) throw notFound('Санал гомдол олдсонгүй')
  return withReplies(toDto(row))
}

export function assertImages(files) {
  if (files?.length > 3) throw badRequest('Хамгийн ихдээ 3 зураг', { images: '3-аас ихгүй' })
}
