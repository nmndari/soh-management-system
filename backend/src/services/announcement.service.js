import { withTransaction } from '../config/db.js'
import * as repo from '../repositories/announcement.repository.js'
import { notFound } from '../utils/httpError.js'
import { listResponse } from '../utils/pagination.js'
import * as notificationService from './notification.service.js'
import { assertCategory } from './settings.service.js'

const toDto = (a) => ({ ...a, notify: Boolean(a.notify) })

export async function list(sohId, filters) {
  const rows = await repo.list(sohId, filters)
  return listResponse(rows, filters, toDto)
}

export const getStats = (sohId) => repo.stats(sohId)

export async function getById(sohId, id) {
  const row = await repo.findById(sohId, id)
  if (!row) throw notFound('Зарлал олдсонгүй')
  return toDto(row)
}

async function notifyIfNeeded(sohId, announcement, conn) {
  if (announcement.status !== 'published' || !announcement.notify) return
  await notificationService.notifyAudience(
    sohId,
    announcement.audience,
    {
      type: 'announcement_published',
      title: announcement.title,
      message: announcement.content.slice(0, 200),
      refType: 'announcement',
      refId: announcement.id,
    },
    conn,
  )
}

/** action: 'publish' → нийтэлсэн, 'draft' → ноорог */
export async function create(sohId, adminId, { action, ...data }) {
  await assertCategory(sohId, data.categoryId, 'announcement')
  const status = action === 'publish' ? 'published' : 'draft'

  const id = await withTransaction(async (conn) => {
    const { id } = await repo.create(sohId, { ...data, status, createdBy: adminId }, conn)
    await notifyIfNeeded(sohId, { ...data, id, status }, conn)
    return id
  })
  return getById(sohId, id)
}

export async function update(sohId, id, { action, ...data }) {
  await assertCategory(sohId, data.categoryId, 'announcement')
  const before = await getById(sohId, id)
  const status = action ? (action === 'publish' ? 'published' : 'draft') : before.status

  await withTransaction(async (conn) => {
    await repo.update(sohId, id, { ...data, status }, conn)
    // Зөвхөн ноорогоос нийтлэгдэх үед мэдэгдэл илгээнэ
    if (before.status !== 'published') await notifyIfNeeded(sohId, { ...data, id, status }, conn)
  })
  return getById(sohId, id)
}

export async function publish(sohId, id) {
  const before = await getById(sohId, id)
  await withTransaction(async (conn) => {
    await repo.setStatus(sohId, id, 'published', conn)
    if (before.status !== 'published') {
      await notifyIfNeeded(sohId, { ...before, status: 'published' }, conn)
    }
  })
  return getById(sohId, id)
}

export async function unpublish(sohId, id) {
  await getById(sohId, id)
  await repo.setStatus(sohId, id, 'draft')
  return getById(sohId, id)
}

export async function remove(sohId, id) {
  const changed = await repo.remove(sohId, id)
  if (!changed) throw notFound('Зарлал олдсонгүй')
}
