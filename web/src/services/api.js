/*
  Сервертэй харьцах суурь давхарга.
  - Access token-ийг Authorization header-т нэмнэ
  - 401 ирвэл refresh token-оор нэг удаа шинэчилж дахин оролдоно
  - Алдааг ApiError болгож шиднэ (message нь серверийн монгол мессеж)
*/
const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'
const AUTH_KEY = 'soh_auth'

export class ApiError extends Error {
  constructor(status, code, message, fields) {
    super(message)
    this.status = status
    this.code = code
    this.fields = fields
  }
}

/* ---------- Token хадгалалт ---------- */
// "Намайг сана" бол localStorage, үгүй бол sessionStorage (хөтөч хаахад устна)

function readStore(store) {
  try {
    const raw = store.getItem(AUTH_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function getAuth() {
  return readStore(localStorage) || readStore(sessionStorage)
}

export function setAuth(auth, remember) {
  const current = getAuth()
  const keep = Boolean(remember ?? current?.remember)
  clearAuth()
  const store = keep ? localStorage : sessionStorage
  store.setItem(AUTH_KEY, JSON.stringify({ ...current, ...auth, remember: keep }))
}

export function clearAuth() {
  localStorage.removeItem(AUTH_KEY)
  sessionStorage.removeItem(AUTH_KEY)
}

export const isLoggedIn = () => Boolean(getAuth()?.accessToken)

/* ---------- Хүсэлт ---------- */

function buildUrl(path, query) {
  const url = new URL(BASE_URL + path, window.location.origin)
  for (const [key, value] of Object.entries(query || {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value)
  }
  return url.toString()
}

let refreshPromise = null

async function refreshTokens() {
  const refreshToken = getAuth()?.refreshToken
  if (!refreshToken) return false

  // Зэрэг ирсэн 401-үүд нэг л refresh хийнэ
  refreshPromise ??= fetch(buildUrl('/auth/refresh'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
    .then(async (res) => {
      if (!res.ok) return false
      const { data } = await res.json()
      setAuth({ accessToken: data.accessToken, refreshToken: data.refreshToken })
      return true
    })
    .catch(() => false)
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

function sessionExpired() {
  clearAuth()
  if (window.location.pathname !== '/') window.location.assign('/')
}

export async function request(path, { method = 'GET', query, body, retry = true } = {}) {
  const token = getAuth()?.accessToken

  let res
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers: {
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'NETWORK', 'Сервертэй холбогдож чадсангүй. Сервер ажиллаж байгаа эсэхийг шалгана уу.')
  }

  if (res.status === 401 && retry && !path.startsWith('/auth/')) {
    if (await refreshTokens()) return request(path, { method, query, body, retry: false })
    sessionExpired()
  }

  if (res.status === 204) return null

  const json = await res.json().catch(() => null)
  if (!res.ok) {
    const err = json?.error
    throw new ApiError(res.status, err?.code, err?.message || 'Алдаа гарлаа', err?.fields)
  }
  return json
}

export const api = {
  get: (path, query) => request(path, { query }),
  post: (path, body) => request(path, { method: 'POST', body: body ?? {} }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  del: (path) => request(path, { method: 'DELETE' }),
}

/** Алдааны мессежийг талбарын алдаатай нь нэгтгэж харуулах текст болгоно. */
export function errorText(err) {
  if (!(err instanceof ApiError) || !err.fields) return err.message
  return `${err.message}\n\n${Object.values(err.fields).join('\n')}`
}
