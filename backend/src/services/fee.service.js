import * as feeRepo from '../repositories/fee.repository.js'
import * as settingsRepo from '../repositories/settings.repository.js'
import { badRequest } from '../utils/httpError.js'
import { listResponse } from '../utils/pagination.js'

export async function generateMonthlyCharges(sohId, period) {
  const soh = await settingsRepo.getSoh(sohId)
  if (!soh?.monthlyFee) {
    throw badRequest('Тохиргоонд сарын хураамжийн дүн оруулаагүй байна', { monthlyFee: 'Заавал' })
  }
  const created = await feeRepo.generateForPeriod(sohId, period)
  return { period, created }
}

export async function listCharges(sohId, filters) {
  const rows = await feeRepo.list(sohId, filters)
  return listResponse(rows, filters, (r) => ({
    id: r.id,
    resident: {
      id: r.residentId,
      name: `${r.lastName} ${r.firstName}`,
      entrance: r.entrance,
      apartment: r.apartment,
    },
    period: r.period,
    amount: r.amount,
    paidAmount: r.paidAmount,
    status: r.status,
    dueDate: r.dueDate,
  }))
}

/** Шинэ оршин суугчид энэ сарын нэхэмжлэл үүсгэнэ (хураамж тохируулсан бол). */
export const ensureCurrentCharge = (sohId, residentId, period, conn) =>
  feeRepo.ensureForResident(sohId, residentId, period, conn)
