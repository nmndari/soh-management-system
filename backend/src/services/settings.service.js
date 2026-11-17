import * as repo from '../repositories/settings.repository.js'
import { badRequest, notFound } from '../utils/httpError.js'

export async function getSettings(sohId) {
  const soh = await repo.getSoh(sohId)
  if (!soh) throw notFound('СӨХ олдсонгүй')
  return soh
}

export async function updateSettings(sohId, data) {
  await repo.updateSoh(sohId, data)
  return getSettings(sohId)
}

export const listCategories = (sohId, type) => repo.listCategories(sohId, type)

export const createCategory = (sohId, data) => repo.createCategory(sohId, data)

export async function updateCategory(sohId, id, data) {
  const changed = await repo.updateCategory(sohId, id, data)
  if (!changed) throw notFound('Ангилал олдсонгүй')
  return repo.findCategory(sohId, id)
}

export async function deleteCategory(sohId, id) {
  // Ашиглагдаж байгаа бол FK алдаа (547) → errorHandler 409 болгоно
  const changed = await repo.deleteCategory(sohId, id)
  if (!changed) throw notFound('Ангилал олдсонгүй')
}

/** Ангилал энэ СӨХ-ийнх бөгөөд зөв төрлийнх эсэхийг шалгана. */
export async function assertCategory(sohId, categoryId, type, conn) {
  const category = await repo.findCategory(sohId, categoryId, conn)
  if (!category || category.type !== type) {
    throw badRequest('Ангилал буруу байна', { categoryId: 'Ангилал олдсонгүй' })
  }
  return category
}
