import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import { env } from '../config/env.js'
import * as adminRepo from '../repositories/admin.repository.js'
import * as otpRepo from '../repositories/otp.repository.js'
import * as residentRepo from '../repositories/resident.repository.js'
import * as tokenRepo from '../repositories/refreshToken.repository.js'
import { badRequest, notFound, tooManyRequests, unauthorized } from '../utils/httpError.js'
import { generateRefreshToken, hashToken, signAccessToken } from '../utils/tokens.js'
import { sendOtp } from './sms.service.js'

const DAY = 86400000
const toAdminDto = (a) => ({ id: a.id, fullName: a.fullName, email: a.email, role: a.role })

// DB-д UTC цагийг 'YYYY-MM-DDTHH:mm:ss' мөрөөр дамжуулна (драйверийн цагийн бүсийн хөрвүүлэлтээс зайлсхийнэ)
const toUtcString = (date) => date.toISOString().slice(0, 19)

/** expiresAt: Date эсвэл DB-ээс уншсан UTC мөр */
async function issueTokens(user, role, expiresAt) {
  const refreshToken = generateRefreshToken()
  await tokenRepo.create({
    userType: role,
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: expiresAt instanceof Date ? toUtcString(expiresAt) : expiresAt,
  })
  return {
    accessToken: signAccessToken({ id: user.id, role, sohId: user.sohId }),
    refreshToken,
  }
}

/* ---------- Админ ---------- */

export async function loginAdmin(email, password, rememberMe) {
  const admin = await adminRepo.findByEmail(email.trim().toLowerCase())
  // Хэрэглэгч байгаа эсэхийг ил гаргахгүйн тулд нэг ижил мессеж
  const ok = admin && admin.isActive && (await bcrypt.compare(password, admin.passwordHash))
  if (!ok) throw unauthorized('И-мэйл эсвэл нууц үг буруу байна')

  const days = rememberMe ? env.jwt.refreshRememberDays : env.jwt.refreshDays
  const tokens = await issueTokens(admin, 'admin', new Date(Date.now() + days * DAY))
  await adminRepo.touchLastLogin(admin.id)
  return { ...tokens, admin: toAdminDto(admin) }
}

export async function me(adminId) {
  const admin = await adminRepo.findById(adminId)
  if (!admin) throw notFound('Хэрэглэгч олдсонгүй')
  return toAdminDto(admin)
}

/* ---------- Оршин суугч (апп): утас + OTP ---------- */

// Кодыг шууд хадгалахгүй, серверийн нууцаар HMAC хийнэ
const hashOtp = (phone, code) =>
  crypto.createHmac('sha256', env.jwt.accessSecret).update(`${phone}:${code}`).digest('hex')

export async function requestOtp(phone) {
  const resident = await residentRepo.findByPhone(phone)
  if (!resident) {
    throw notFound('Энэ дугаар бүртгэлгүй байна. СӨХ-ийн удирдлагад хандана уу.')
  }

  const [lastMinute, lastHour] = await Promise.all([
    otpRepo.countSince(phone, 60),
    otpRepo.countSince(phone, 3600),
  ])
  if (lastMinute.n > 0) throw tooManyRequests('Код дахин авахын тулд 1 минут хүлээнэ үү')
  if (lastHour.n >= 5) throw tooManyRequests('Цагт 5-аас олон код авах боломжгүй. Дараа дахин оролдоно уу.')

  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0')
  await otpRepo.invalidateAll(phone)
  await otpRepo.create({
    phone,
    codeHash: hashOtp(phone, code),
    expiresAt: toUtcString(new Date(Date.now() + env.otp.ttlSeconds * 1000)),
  })
  await sendOtp(phone, code)

  return {
    expiresIn: env.otp.ttlSeconds,
    // Хөгжүүлэлтийн горимд SMS явахгүй тул кодыг хариунд өгнө
    ...(env.otp.devMode && { devCode: code }),
  }
}

export async function verifyOtp(phone, code) {
  const otp = await otpRepo.findLatestValid(phone)
  if (!otp) throw badRequest('Код хүчингүй эсвэл хугацаа нь дууссан. Шинэ код авна уу.')

  if (otp.attempts >= env.otp.maxAttempts) {
    await otpRepo.markUsed(otp.id)
    throw tooManyRequests('Хэт олон удаа буруу оруулсан. Шинэ код авна уу.')
  }

  const expected = Buffer.from(otp.codeHash, 'hex')
  const actual = Buffer.from(hashOtp(phone, code), 'hex')
  if (!crypto.timingSafeEqual(expected, actual)) {
    await otpRepo.incrementAttempts(otp.id)
    throw badRequest('Код буруу байна', { code: 'Буруу код' })
  }

  await otpRepo.markUsed(otp.id)
  const resident = await residentRepo.findByPhone(phone)
  if (!resident) throw notFound('Оршин суугч олдсонгүй')

  // Апп удаан нэвтэрсэн хэвээр байна
  const tokens = await issueTokens(
    resident,
    'resident',
    new Date(Date.now() + env.jwt.refreshRememberDays * DAY),
  )
  return {
    ...tokens,
    resident: {
      id: resident.id,
      lastName: resident.lastName,
      firstName: resident.firstName,
      phone: resident.phone,
      entrance: resident.entrance,
    },
  }
}

/* ---------- Нийтлэг ---------- */

/** Refresh token-ийг сэлгэнэ (хуучныг хүчингүй болгож, шинийг өгнө). Хугацааг сунгахгүй. */
export async function refresh(refreshToken) {
  const tokenHash = hashToken(refreshToken)
  const stored = await tokenRepo.findValid(tokenHash)
  if (!stored) throw unauthorized('Нэвтрэлтийн хугацаа дууссан. Дахин нэвтэрнэ үү.')

  const user =
    stored.userType === 'admin'
      ? await adminRepo.findById(stored.userId)
      : await residentRepo.findActiveById(stored.userId)
  if (!user || (stored.userType === 'admin' && !user.isActive)) throw unauthorized()

  await tokenRepo.revoke(tokenHash)
  return issueTokens(user, stored.userType, stored.expiresAt)
}

export async function logout(refreshToken) {
  if (refreshToken) await tokenRepo.revoke(hashToken(refreshToken))
}
