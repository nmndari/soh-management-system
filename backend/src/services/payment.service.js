import { withTransaction } from '../config/db.js'
import * as feeRepo from '../repositories/fee.repository.js'
import * as paymentRepo from '../repositories/payment.repository.js'
import * as residentRepo from '../repositories/resident.repository.js'
import * as settingsRepo from '../repositories/settings.repository.js'
import * as txRepo from '../repositories/transaction.repository.js'
import { badRequest, notFound } from '../utils/httpError.js'
import { listResponse } from '../utils/pagination.js'
import { toDateString } from '../utils/period.js'

const FEE_INCOME_CATEGORY = 'Сарын хураамж'

async function feeIncomeCategoryId(sohId, conn) {
  const existing = await settingsRepo.findCategoryByName(sohId, 'income', FEE_INCOME_CATEGORY, conn)
  if (existing) return existing.id
  const created = await settingsRepo.createCategory(
    sohId,
    { type: 'income', name: FEE_INCOME_CATEGORY },
    conn,
  )
  return created.id
}

/**
 * Төлбөр бүртгэнэ. Нэг транзакцаар:
 * 1) нэхэмжлэлийг олно (chargeId эсвэл хамгийн хуучин төлөгдөөгүй),
 * 2) incomes-д "Сарын хураамж" мөр нэмнэ (тайлан эндээс уншина),
 * 3) payments-д бичнэ, 4) нэхэмжлэлийн paid_amount-ийг нэмнэ.
 */
export async function recordPayment(sohId, adminId, data) {
  return withTransaction(async (conn) => {
    const resident = await residentRepo.findById(sohId, data.residentId, conn)
    if (!resident) throw notFound('Оршин суугч олдсонгүй')

    const charge = data.chargeId
      ? await feeRepo.findById(sohId, data.chargeId, conn)
      : await feeRepo.findOldestUnpaid(resident.id, conn)

    if (data.chargeId && (!charge || charge.residentId !== resident.id)) {
      throw badRequest('Нэхэмжлэл олдсонгүй', { chargeId: 'Буруу' })
    }
    if (!charge) {
      throw badRequest('Энэ оршин суугчид төлөгдөөгүй нэхэмжлэл алга')
    }

    const remaining = charge.amount - charge.paidAmount
    if (data.amount > remaining) {
      throw badRequest(`Төлбөрийн дүн үлдэгдлээс (${remaining}₮) их байна`, {
        amount: `${remaining}₮-өөс ихгүй`,
      })
    }

    const paidAt = data.paidAt ?? toDateString()
    const income = await txRepo.create(
      'income',
      sohId,
      {
        title: `${FEE_INCOME_CATEGORY} — ${resident.lastName} ${resident.firstName} (${charge.period})`,
        categoryId: await feeIncomeCategoryId(sohId, conn),
        description: data.note ?? null,
        amount: data.amount,
        date: paidAt.slice(0, 10),
        residentId: resident.id,
        createdBy: adminId,
      },
      conn,
    )

    const payment = await paymentRepo.create(
      sohId,
      {
        residentId: resident.id,
        chargeId: charge.id,
        amount: data.amount,
        paidAt,
        method: data.method,
        note: data.note ?? null,
        incomeId: income.id,
        createdBy: adminId,
      },
      conn,
    )

    await feeRepo.addPaid(charge.id, data.amount, conn)
    return paymentRepo.findById(sohId, payment.id, conn)
  })
}

/** Буруу бүртгэсэн төлбөрийг буцаана: нэхэмжлэлээс хасаж, холбоотой орлогыг устгана. */
export async function reversePayment(sohId, id) {
  return withTransaction(async (conn) => {
    const payment = await paymentRepo.findById(sohId, id, conn)
    if (!payment) throw notFound('Төлбөр олдсонгүй')

    if (payment.chargeId) await feeRepo.addPaid(payment.chargeId, -payment.amount, conn)
    await paymentRepo.remove(payment.id, conn)
    if (payment.incomeId) await txRepo.remove('income', sohId, payment.incomeId, conn)
  })
}

export async function list(sohId, filters) {
  const rows = await paymentRepo.list(sohId, filters)
  return listResponse(rows, filters, (r) => ({
    id: r.id,
    resident: { id: r.residentId, name: `${r.lastName} ${r.firstName}`, apartment: r.apartment },
    chargeId: r.chargeId,
    period: r.period,
    amount: r.amount,
    paidAt: r.paidAt,
    method: r.method,
    note: r.note,
  }))
}

export async function getResidentHistory(sohId, residentId, year) {
  const resident = await residentRepo.findById(sohId, residentId)
  if (!resident) throw notFound('Оршин суугч олдсонгүй')
  const [charges, payments] = await Promise.all([
    feeRepo.listByResident(residentId, year),
    paymentRepo.listByResident(residentId, year),
  ])
  const totalDebt = charges.reduce((sum, c) => sum + (c.amount - c.paidAmount), 0)
  return { charges, payments, totalDebt }
}
