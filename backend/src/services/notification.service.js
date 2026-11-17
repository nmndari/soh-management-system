import * as repo from '../repositories/notification.repository.js'
import * as deviceRepo from '../repositories/device.repository.js'
import { audienceEntrance } from '../utils/audience.js'
import { pushToResidents } from './push.service.js'

async function listFor(recipientType, recipientId, { unreadOnly = false, limit = 20 } = {}) {
  const [rows, unread] = await Promise.all([
    repo.listFor(recipientType, recipientId, { unreadOnly, limit }),
    repo.unreadCount(recipientType, recipientId),
  ])
  return {
    data: rows.map((r) => ({ ...r, read: Boolean(r.read) })),
    meta: { unreadCount: unread.n },
  }
}

/* ---------- Админ ---------- */
export const listForAdmin = (adminId, options) => listFor('admin', adminId, options)
export const markRead = (adminId, id) => repo.markRead('admin', adminId, id)
export const markAllRead = (adminId) => repo.markAllRead('admin', adminId)

/* ---------- Оршин суугч ---------- */
export const listForResident = (residentId, options) => listFor('resident', residentId, options)
export const markReadForResident = (residentId, id) => repo.markRead('resident', residentId, id)
export const unreadCountForResident = async (residentId) =>
  (await repo.unreadCount('resident', residentId)).n

export const registerDevice = (residentId, token, platform) =>
  deviceRepo.upsert(residentId, token, platform)
export const removeDevice = (residentId, token) => deviceRepo.remove(residentId, token)

/* ---------- Мэдэгдэл үүсгэх ---------- */

/** Вебийн хонх руу бүх админд мэдэгдэл бичнэ. */
export const notifyAdmins = (sohId, notification, conn) =>
  repo.insertForAdmins(sohId, notification, conn)

/** Зорилтот оршин суугчдад (бүгд эсвэл нэг орц) мэдэгдэл бичиж, push илгээнэ. */
export async function notifyAudience(sohId, audience, notification, conn) {
  const entrance = audienceEntrance(audience)
  const count = await repo.insertForResidents(sohId, entrance, notification, conn)
  pushToResidents(sohId, { entrance }, notification)
  return count
}

/** Нэг оршин суугчид мэдэгдэл бичиж, push илгээнэ. */
export async function notifyResident(sohId, residentId, notification, conn) {
  await repo.insertForResident(residentId, notification, conn)
  pushToResidents(sohId, { residentId }, notification)
}
