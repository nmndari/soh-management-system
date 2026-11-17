import { api } from './api'

// Ангиллын жагсаалт ховор өөрчлөгддөг тул төрөл бүрээр нэг удаа ачаална
const cache = new Map()

export function getCategories(type) {
  if (!cache.has(type)) {
    const promise = api
      .get('/settings/categories', { type })
      .then((res) => res.data)
      .catch((err) => {
        cache.delete(type)
        throw err
      })
    cache.set(type, promise)
  }
  return cache.get(type)
}

/** Ангиллын нэрээр id олно (веб маягтууд нэрээр ажилладаг) */
export async function categoryIdByName(type, name) {
  const list = await getCategories(type)
  return list.find((c) => c.name === name)?.id
}
