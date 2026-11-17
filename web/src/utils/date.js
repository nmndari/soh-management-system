import { useEffect, useState } from 'react'

// toISOString() UTC огноо өгдөг тул Улаанбаатарт өглөө 8 цагаас өмнө өчигдрийн огноо гардаг.
// Иймээс локал цагаас огноо бүрдүүлнэ.
const pad = (n) => String(n).padStart(2, '0')

export const todayString = (d = new Date()) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const currentPeriod = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`

/** Сүүлийн N сар, шинэ нь эхэндээ: ['2026-11', '2026-10', ...] */
export function recentPeriods(count, d = new Date()) {
  return Array.from({ length: count }, (_, i) =>
    currentPeriod(new Date(d.getFullYear(), d.getMonth() - i, 1)),
  )
}

/** '2026-11' → '2026 оны 11 сар' */
export const periodLabel = (period) => {
  const [y, m] = period.split('-')
  return `${y} оны ${Number(m)} сар`
}

/** '2026-11' → '11 сар' */
export const monthLabel = (period) => `${Number(period.split('-')[1])} сар`

/** Debounce хийсэн утга (хайлтын талбарт) */
export function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}
