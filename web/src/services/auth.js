import { api, clearAuth, getAuth, setAuth } from './api'

export async function login(email, password, rememberMe) {
  const { data } = await api.post('/auth/admin/login', { email, password, rememberMe })
  setAuth(
    { accessToken: data.accessToken, refreshToken: data.refreshToken, admin: data.admin },
    rememberMe,
  )
  return data.admin
}

export async function logout() {
  const refreshToken = getAuth()?.refreshToken
  try {
    await api.post('/auth/logout', { refreshToken })
  } catch {
    // Сервер ажиллахгүй байсан ч локал нэвтрэлтийг цэвэрлэнэ
  }
  clearAuth()
}

export const currentAdmin = () => getAuth()?.admin ?? null

export async function fetchMe() {
  const { data } = await api.get('/auth/me')
  setAuth({ admin: data })
  return data
}
