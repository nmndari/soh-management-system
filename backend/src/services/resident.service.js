import { withTransaction } from '../config/db.js'
import * as repo from '../repositories/resident.repository.js'
import * as settingsRepo from '../repositories/settings.repository.js'
import { badRequest, notFound } from '../utils/httpError.js'
import { listResponse } from '../utils/pagination.js'
import { currentPeriod } from '../utils/period.js'
import * as feeService from './fee.service.js'
import * as notificationService from './notification.service.js'

export const toResidentDto = (r) => ({
  id: r.id,
  lastName: r.lastName,
  firstName: r.firstName,
  phone: r.phone,
  email: r.email,
  entrance: r.entrance,
  floor: r.floor,
  apartment: r.apartment,
  paymentStatus: r.paymentStatus,
  currentCharge:
    r.chargeAmount == null
      ? null
      : {
          period: r.chargePeriod,
          amount: r.chargeAmount,
          paidAmount: r.chargePaidAmount,
          dueDate: r.chargeDueDate,
        },
})

export async function list(sohId, filters) {
  const rows = await repo.list(sohId, filters)
  return listResponse(rows, filters, toResidentDto)
}

export const getStats = (sohId) => repo.stats(sohId)

export async function getById(sohId, id) {
  const row = await repo.findById(sohId, id)
  if (!row) throw notFound('Оршин суугч олдсонгүй')
  return toResidentDto(row)
}

async function assertEntrance(sohId, entrance) {
  const soh = await settingsRepo.getSoh(sohId)
  if (soh && entrance > soh.entranceCount) {
    throw badRequest('Орцны дугаар буруу байна', {
      entrance: `1–${soh.entranceCount} хооронд байна`,
    })
  }
}

export async function create(sohId, data) {
  await assertEntrance(sohId, data.entrance)

  const id = await withTransaction(async (conn) => {
    const { id } = await repo.create(sohId, data, conn)
    // Шинэ оршин суугчид энэ сарын нэхэмжлэл үүсгэнэ
    await feeService.ensureCurrentCharge(sohId, id, currentPeriod(), conn)
    await notificationService.notifyAdmins(
      sohId,
      {
        type: 'resident_created',
        title: 'Шинэ оршин суугч',
        message: `${data.lastName} ${data.firstName} (${data.entrance}-р орц, ${data.apartment} тоот) бүртгэгдлээ.`,
        refType: 'resident',
        refId: id,
      },
      conn,
    )
    return id
  })

  return getById(sohId, id)
}

export async function update(sohId, id, data) {
  await assertEntrance(sohId, data.entrance)
  const changed = await repo.update(sohId, id, data)
  if (!changed) throw notFound('Оршин суугч олдсонгүй')
  return getById(sohId, id)
}

export async function softDelete(sohId, id) {
  const changed = await repo.softDelete(sohId, id)
  if (!changed) throw notFound('Оршин суугч олдсонгүй')
}
