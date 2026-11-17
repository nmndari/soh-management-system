import { verifyAccessToken } from '../utils/tokens.js'
import { forbidden, unauthorized } from '../utils/httpError.js'
import { findActiveById } from '../repositories/resident.repository.js'

/** Bearer token шалгаж req.user = { id, role, sohId } онооно. */
export function authenticate(req, _res, next) {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')
  if (scheme !== 'Bearer' || !token) return next(unauthorized())

  try {
    const payload = verifyAccessToken(token)
    req.user = { id: Number(payload.sub), role: payload.role, sohId: payload.sohId }
    next()
  } catch {
    next(unauthorized('Нэвтрэлтийн хугацаа дууссан. Дахин нэвтэрнэ үү.'))
  }
}

export const requireRole = (...roles) => (req, _res, next) =>
  roles.includes(req.user?.role) ? next() : next(forbidden())

/**
 * Оршин суугчийн мэдээллийг (орц) ачаалж req.resident-д онооно.
 * Бүртгэлээс хасагдсан оршин суугчийн token-ийг шууд хүчингүй болгоно.
 */
export async function residentContext(req, _res, next) {
  try {
    const resident = await findActiveById(req.user.id)
    if (!resident) return next(unauthorized('Таны бүртгэл идэвхгүй болсон байна. СӨХ-д хандана уу.'))
    req.resident = { id: resident.id, sohId: resident.sohId, entrance: resident.entrance }
    next()
  } catch (err) {
    next(err)
  }
}

/** Token байвал шалгана, байхгүй бол нээлттэй үргэлжлүүлнэ (/app/config) */
export function optionalAuthenticate(req, res, next) {
  if (!req.headers.authorization) return next()
  authenticate(req, res, next)
}
