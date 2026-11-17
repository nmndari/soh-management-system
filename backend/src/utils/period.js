/*
  Огноо, үеийн туслахууд. Серверийн локал цагийг (Улаанбаатар) ашиглана.
  toISOString() UTC өгдөг тул өглөө 8 цагаас өмнө өчигдрийн огноо гаргадаг — ашиглахгүй.
*/
const pad = (n) => String(n).padStart(2, '0')

export const toDateString = (d = new Date()) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const currentPeriod = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`

/** '2026-11' → { from: '2026-11-01', to: '2026-11-30' }, 'all' эсвэл хоосон → null */
export function parsePeriod(period) {
  if (!period || period === 'all') return null
  const [y, m] = period.split('-').map(Number)
  const last = new Date(y, m, 0).getDate()
  return { from: `${y}-${pad(m)}-01`, to: `${y}-${pad(m)}-${pad(last)}` }
}

/** Сүүлийн N сар, хуучнаас шинэ рүү: ['2026-06', ..., '2026-11'] */
export function lastMonths(count, d = new Date()) {
  const result = []
  for (let i = count - 1; i >= 0; i--) {
    result.push(currentPeriod(new Date(d.getFullYear(), d.getMonth() - i, 1)))
  }
  return result
}
