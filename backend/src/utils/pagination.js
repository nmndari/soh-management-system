/** ?page=1&limit=20 → { page, limit, offset }. limit ≤ 100. */
export function parsePagination(query = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1)
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 20))
  return { page, limit, offset: (page - 1) * limit }
}

/** Жагсаалтын хариу. rows-д COUNT(*) OVER() AS total багана байх ёстой. */
export function listResponse(rows, { page, limit }, mapRow = (r) => r) {
  const total = rows[0]?.total ?? 0
  return {
    data: rows.map(({ total: _t, ...row }) => mapRow(row)),
    meta: { page, limit, total },
  }
}
