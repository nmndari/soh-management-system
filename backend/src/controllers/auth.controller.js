import * as authService from '../services/auth.service.js'

export async function login(req, res) {
  const { email, password, rememberMe } = req.body
  res.json({ data: await authService.loginAdmin(email, password, rememberMe) })
}

export async function requestOtp(req, res) {
  res.json({ data: await authService.requestOtp(req.body.phone) })
}

export async function verifyOtp(req, res) {
  res.json({ data: await authService.verifyOtp(req.body.phone, req.body.code) })
}

export async function refresh(req, res) {
  res.json({ data: await authService.refresh(req.body.refreshToken) })
}

export async function logout(req, res) {
  await authService.logout(req.body.refreshToken)
  res.status(204).end()
}

export async function me(req, res) {
  res.json({ data: await authService.me(req.user.id) })
}
