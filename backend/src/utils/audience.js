/** Оршин суугчийн орцонд хамаарах audience код: 2 → 'entrance:2' */
export const residentAudience = (entrance) => `entrance:${entrance}`

/** 'all' → null, 'entrance:2' → 2 */
export function audienceEntrance(audience) {
  if (!audience || audience === 'all') return null
  return Number(audience.split(':')[1])
}
