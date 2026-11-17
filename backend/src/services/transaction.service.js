/*
  Зардал (expense) ба орлого (income)-ын бизнес логик.
  kind-ээр ялгаж нэг кодоор хоёуланг нь хэрэгжүүлнэ.
*/
import * as repo from '../repositories/transaction.repository.js'
import { notFound } from '../utils/httpError.js'
import { listResponse } from '../utils/pagination.js'
import { currentPeriod, parsePeriod } from '../utils/period.js'
import { assertCategory } from './settings.service.js'

const NOT_FOUND = { expense: 'Зардал олдсонгүй', income: 'Орлого олдсонгүй' }

export function createTransactionService(kind) {
  const getById = async (sohId, id) => {
    const row = await repo.findById(kind, sohId, id)
    if (!row) throw notFound(NOT_FOUND[kind])
    return row
  }

  return {
    async list(sohId, filters) {
      const rows = await repo.list(kind, sohId, filters)
      return listResponse(rows, filters)
    },

    getById,

    async getStats(sohId) {
      return repo.stats(kind, sohId, parsePeriod(currentPeriod()))
    },

    async create(sohId, adminId, data) {
      await assertCategory(sohId, data.categoryId, kind)
      const { id } = await repo.create(kind, sohId, { ...data, createdBy: adminId })
      return getById(sohId, id)
    },

    async update(sohId, id, data) {
      await assertCategory(sohId, data.categoryId, kind)
      const changed = await repo.update(kind, sohId, id, data)
      if (!changed) throw notFound(NOT_FOUND[kind])
      return getById(sohId, id)
    },

    async remove(sohId, id) {
      // Төлбөртэй холбоотой орлогыг устгах үед FK алдаа (547) → 409
      const changed = await repo.remove(kind, sohId, id)
      if (!changed) throw notFound(NOT_FOUND[kind])
    },
  }
}

export const expenseService = createTransactionService('expense')
export const incomeService = createTransactionService('income')
