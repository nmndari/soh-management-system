import { withTransaction } from '../config/db.js'
import * as repo from '../repositories/poll.repository.js'
import { audienceEntrance, residentAudience } from '../utils/audience.js'
import { badRequest, conflict, notFound } from '../utils/httpError.js'
import { listResponse } from '../utils/pagination.js'
import * as notificationService from './notification.service.js'

const utc = (s) => (s ? `${s}Z` : null)
const toUtcString = (iso) => (iso ? new Date(iso).toISOString().slice(0, 19) : null)

/** showVotes=false үед санал тоог нууна (оршин суугч хаагдахаас өмнө) */
function toDto(row, { showVotes = true } = {}) {
  const { optionsJson, myOptionId, ...p } = row
  const options = optionsJson ? JSON.parse(optionsJson) : []
  const total = p.totalVotes
  return {
    ...p,
    notify: Boolean(p.notify),
    startsAt: utc(p.startsAt),
    endsAt: utc(p.endsAt),
    createdAt: utc(p.createdAt),
    totalVotes: showVotes ? total : undefined,
    options: options.map((o) => ({
      id: o.id,
      text: o.text,
      ...(showVotes && {
        votes: o.votes,
        percent: total ? Math.round((o.votes / total) * 1000) / 10 : 0,
      }),
    })),
    ...(myOptionId !== undefined && { myOptionId }),
  }
}

// Хугацаа нь дууссан санал асуулгыг унших бүрт хаана (тусдаа cron шаардлагагүй)
const closeExpired = () => repo.closeExpired()

function assertDates({ startsAt, endsAt }) {
  if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
    throw badRequest('Дуусах хугацаа эхлэхээс хойш байна', { endsAt: 'Эхлэх хугацаанаас хойш' })
  }
}

const toRow = (data) => ({
  ...data,
  startsAt: toUtcString(data.startsAt),
  endsAt: toUtcString(data.endsAt),
})

/* ================= Админ ================= */

export async function list(sohId, filters) {
  await closeExpired()
  const rows = await repo.list(sohId, filters)
  return listResponse(rows, filters, (r) => toDto(r))
}

export async function getById(sohId, id) {
  await closeExpired()
  const row = await repo.findById(sohId, id)
  if (!row) throw notFound('Санал асуулга олдсонгүй')
  return toDto(row)
}

async function notifyPublished(sohId, poll, conn) {
  if (!poll.notify) return
  await notificationService.notifyAudience(
    sohId,
    poll.audience,
    {
      type: 'poll_published',
      title: `Санал асуулга: ${poll.title}`,
      message: poll.description?.slice(0, 200) ?? null,
      refType: 'poll',
      refId: poll.id,
    },
    conn,
  )
}

export async function create(sohId, adminId, { options, action, ...data }) {
  assertDates(data)
  const status = action === 'publish' ? 'active' : 'draft'

  const id = await withTransaction(async (conn) => {
    const { id } = await repo.create(sohId, { ...toRow(data), status, createdBy: adminId }, conn)
    await repo.replaceOptions(id, options, conn)
    if (status === 'active') await notifyPublished(sohId, { ...data, id }, conn)
    return id
  })
  return getById(sohId, id)
}

/** Санал авч эхэлсэн асуулгыг өөрчилбөл үр дүн гажна — зөвхөн ноорог засна */
export async function update(sohId, id, { options, action, ...data }) {
  const before = await getById(sohId, id)
  if (before.status !== 'draft') {
    throw badRequest('Зөвхөн ноорог санал асуулгыг засах боломжтой')
  }
  assertDates(data)

  await withTransaction(async (conn) => {
    await repo.update(sohId, id, toRow(data), conn)
    await repo.replaceOptions(id, options, conn)
    if (action === 'publish') {
      await repo.setStatus(sohId, id, 'active', conn)
      await notifyPublished(sohId, { ...data, id }, conn)
    }
  })
  return getById(sohId, id)
}

export async function publish(sohId, id) {
  const poll = await getById(sohId, id)
  if (poll.status !== 'draft') throw badRequest('Зөвхөн ноорог санал асуулгыг нийтлэнэ')
  if (poll.options.length < 2) throw badRequest('Дор хаяж 2 сонголт байна')
  if (poll.endsAt && new Date(poll.endsAt) <= new Date()) {
    throw badRequest('Дуусах хугацаа өнгөрсөн байна. Хугацааг засна уу.', { endsAt: 'Ирээдүйн огноо' })
  }

  await withTransaction(async (conn) => {
    await repo.setStatus(sohId, id, 'active', conn)
    await notifyPublished(sohId, poll, conn)
  })
  return getById(sohId, id)
}

export async function close(sohId, id) {
  const poll = await getById(sohId, id)
  if (poll.status !== 'active') throw badRequest('Зөвхөн идэвхтэй санал асуулгыг хаана')
  await repo.setStatus(sohId, id, 'closed')
  return getById(sohId, id)
}

export async function remove(sohId, id) {
  const poll = await getById(sohId, id)
  if (poll.totalVotes > 0) {
    throw conflict('Санал авсан санал асуулгыг устгах боломжгүй. Хаах боломжтой.')
  }
  await repo.remove(sohId, id)
}

export async function getResults(sohId, id) {
  const poll = await getById(sohId, id)
  const eligible = await repo.eligibleCount(sohId, audienceEntrance(poll.audience))
  return {
    id: poll.id,
    title: poll.title,
    status: poll.status,
    totalVotes: poll.totalVotes,
    eligible: eligible.n,
    turnout: eligible.n ? Math.round((poll.totalVotes / eligible.n) * 1000) / 10 : 0,
    options: poll.options,
  }
}

/* ================= Оршин суугч ================= */

export async function listForResident(resident, filters) {
  await closeExpired()
  const rows = await repo.listForResident(
    resident.sohId,
    resident.id,
    residentAudience(resident.entrance),
    filters,
  )
  return listResponse(rows, filters, (r) => toDto(r, { showVotes: r.status === 'closed' }))
}

async function findForResident(resident, id) {
  await closeExpired()
  const row = await repo.findForResident(
    resident.sohId,
    resident.id,
    residentAudience(resident.entrance),
    id,
  )
  if (!row) throw notFound('Санал асуулга олдсонгүй')
  return row
}

export async function getForResident(resident, id) {
  const row = await findForResident(resident, id)
  return toDto(row, { showVotes: row.status === 'closed' })
}

export async function vote(resident, pollId, optionId) {
  const row = await findForResident(resident, pollId)
  const poll = toDto(row)

  if (poll.status !== 'active') throw badRequest('Санал асуулга хаагдсан байна')
  if (poll.startsAt && new Date(poll.startsAt) > new Date()) {
    throw badRequest('Санал асуулга хараахан эхлээгүй байна')
  }
  if (poll.myOptionId) throw conflict('Та энэ санал асуулгад аль хэдийн санал өгсөн байна')
  if (!poll.options.some((o) => o.id === optionId)) {
    throw badRequest('Сонголт буруу байна', { optionId: 'Энэ асуулгын сонголт биш' })
  }

  try {
    await repo.vote({ pollId, optionId, residentId: resident.id })
  } catch (err) {
    // Зэрэг хоёр хүсэлт ирвэл UNIQUE(poll_id, resident_id) хамгаална
    if (err?.number === 2627 || err?.number === 2601) {
      throw conflict('Та энэ санал асуулгад аль хэдийн санал өгсөн байна')
    }
    throw err
  }
  return getForResident(resident, pollId)
}

export async function getResultsForResident(resident, id) {
  const row = await findForResident(resident, id)
  if (row.status !== 'closed') {
    throw badRequest('Үр дүн санал асуулга хаагдсаны дараа харагдана')
  }
  return getResults(resident.sohId, id)
}

export const countPendingForResident = (resident) =>
  repo.countPendingForResident(resident.sohId, resident.id, residentAudience(resident.entrance))
