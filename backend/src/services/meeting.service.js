import { withTransaction } from '../config/db.js'
import * as repo from '../repositories/meeting.repository.js'
import { badRequest, notFound } from '../utils/httpError.js'
import { listResponse } from '../utils/pagination.js'
import { toDateString } from '../utils/period.js'
import * as notificationService from './notification.service.js'

export const toMeetingDto = ({ agendaJson, meetingCode, ...m }) => ({
  ...m,
  meetingId: meetingCode,
  notify: Boolean(m.notify),
  agenda: agendaJson ? JSON.parse(agendaJson).map((a) => a.text) : [],
})

export async function list(sohId, filters) {
  const rows = await repo.list(sohId, filters)
  return listResponse(rows, filters, toMeetingDto)
}

export const getStats = (sohId) => repo.stats(sohId, toDateString())

export async function getById(sohId, id) {
  const row = await repo.findById(sohId, id)
  if (!row) throw notFound('Хурал олдсонгүй')
  return toMeetingDto(row)
}

/** Онлайн хурлыг товлохдоо линк заавал байна (DB-ийн CHECK-тэй ижил дүрэм). */
function assertLink(meeting) {
  if (meeting.format === 'online' && meeting.status !== 'draft' && !meeting.meetingLink) {
    throw badRequest('Онлайн хурлын линк оруулна уу', { meetingLink: 'Заавал' })
  }
}

const toRow = (data) => ({ ...data, meetingCode: data.meetingId })

async function notifyIfNeeded(sohId, meeting, conn) {
  if (meeting.status !== 'scheduled' || !meeting.notify) return
  await notificationService.notifyAudience(
    sohId,
    meeting.audience,
    {
      type: 'meeting_scheduled',
      title: meeting.title,
      message: `${meeting.date} ${meeting.time}, ${meeting.location ?? ''}`.trim(),
      refType: 'meeting',
      refId: meeting.id,
    },
    conn,
  )
}

export async function create(sohId, adminId, { action, agenda = [], ...data }) {
  const status = action === 'publish' ? 'scheduled' : 'draft'
  const meeting = { ...data, status }
  assertLink(meeting)

  const id = await withTransaction(async (conn) => {
    const { id } = await repo.create(sohId, { ...toRow(meeting), createdBy: adminId }, conn)
    await repo.replaceAgenda(id, agenda, conn)
    await notifyIfNeeded(sohId, { ...meeting, id }, conn)
    return id
  })
  return getById(sohId, id)
}

export async function update(sohId, id, { action, agenda = [], ...data }) {
  const before = await getById(sohId, id)
  let status = before.status
  if (action === 'publish') status = before.status === 'completed' ? 'completed' : 'scheduled'
  if (action === 'draft') status = 'draft'

  const meeting = { ...data, status }
  assertLink(meeting)

  await withTransaction(async (conn) => {
    await repo.update(sohId, id, toRow(meeting), conn)
    await repo.replaceAgenda(id, agenda, conn)
    if (before.status === 'draft') await notifyIfNeeded(sohId, { ...meeting, id }, conn)
  })
  return getById(sohId, id)
}

async function changeStatus(sohId, id, status, allowedFrom) {
  const before = await getById(sohId, id)
  if (!allowedFrom.includes(before.status)) {
    throw badRequest('Энэ төлөвөөс шилжүүлэх боломжгүй')
  }
  assertLink({ ...before, status })
  await withTransaction(async (conn) => {
    await repo.setStatus(sohId, id, status, conn)
    if (status === 'scheduled') await notifyIfNeeded(sohId, { ...before, status }, conn)
  })
  return getById(sohId, id)
}

export const publish = (sohId, id) => changeStatus(sohId, id, 'scheduled', ['draft'])
export const complete = (sohId, id) => changeStatus(sohId, id, 'completed', ['scheduled'])
export const unpublish = (sohId, id) => changeStatus(sohId, id, 'draft', ['scheduled', 'completed'])

export async function remove(sohId, id) {
  const changed = await repo.remove(sohId, id)
  if (!changed) throw notFound('Хурал олдсонгүй')
}
