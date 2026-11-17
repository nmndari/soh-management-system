import { z } from 'zod'
import {
  audience,
  dateString,
  id,
  listQuery,
  money,
  optionalText,
  periodOrAll,
  periodString,
  requiredText,
  timeString,
} from './common.js'

/* ---------- Нэвтрэлт ---------- */
export const login = z.object({
  email: z.string().trim().email('И-мэйл хаяг буруу байна'),
  password: z.string().min(1, 'Нууц үг оруулна уу'),
  rememberMe: z.boolean().optional().default(false),
})
export const refreshToken = z.object({ refreshToken: z.string().min(10) })
export const logout = z.object({ refreshToken: z.string().optional() })

/* ---------- Тохиргоо ---------- */
export const settings = z.object({
  name: requiredText(150),
  address: optionalText(300),
  phone: optionalText(20),
  email: optionalText(150),
  entranceCount: z.coerce.number().int().min(1).max(50),
  monthlyFee: z.coerce.number().int().min(0),
  feeDueDay: z.coerce.number().int().min(1).max(28),
  bankName: optionalText(100),
  bankAccount: optionalText(50),
})
const categoryType = z.enum(['expense', 'income', 'announcement', 'complaint'])
export const categoryQuery = z.object({ type: categoryType.optional() })
export const categoryCreate = z.object({
  type: categoryType,
  name: requiredText(100),
  sortOrder: z.coerce.number().int().min(0).optional(),
})
export const categoryUpdate = z.object({
  name: requiredText(100),
  sortOrder: z.coerce.number().int().min(0).optional(),
})

/* ---------- Оршин суугч ---------- */
export const residentQuery = listQuery.extend({
  entrance: z.coerce.number().int().min(1).optional(),
  paymentStatus: z.enum(['paid', 'unpaid', 'no_charge']).optional(),
})
export const resident = z.object({
  lastName: requiredText(100),
  firstName: requiredText(100),
  phone: z.string().trim().regex(/^\d{8}$/, '8 оронтой дугаар оруулна уу'),
  email: z
    .string()
    .trim()
    .email('И-мэйл хаяг буруу байна')
    .max(150)
    .or(z.literal(''))
    .nullish()
    .transform((v) => (v ? v.toLowerCase() : null)),
  entrance: z.coerce.number().int().min(1, 'Орц сонгоно уу'),
  floor: z.coerce.number().int().min(1).max(200).nullish(),
  apartment: requiredText(10),
})

/* ---------- Сарын төлбөр ---------- */
export const chargeQuery = listQuery.extend({
  period: periodString.optional(),
  status: z.enum(['paid', 'partial', 'unpaid']).optional(),
  entrance: z.coerce.number().int().min(1).optional(),
})
export const chargeGenerate = z.object({ period: periodString })
export const paymentQuery = listQuery.extend({
  residentId: id.optional(),
  method: z.enum(['cash', 'bank', 'qpay']).optional(),
  from: dateString.optional(),
  to: dateString.optional(),
})
export const payment = z.object({
  residentId: id,
  chargeId: id.optional(),
  amount: money,
  method: z.enum(['cash', 'bank', 'qpay']).default('bank'),
  paidAt: dateString.optional(),
  note: optionalText(300),
})
export const historyQuery = z.object({ year: z.coerce.number().int().min(2000).max(2100).optional() })

/* ---------- Зардал / Орлого ---------- */
export const transactionQuery = listQuery.extend({
  categoryId: id.optional(),
  from: dateString.optional(),
  to: dateString.optional(),
})
export const transaction = z.object({
  title: requiredText(200),
  categoryId: id,
  description: optionalText(1000),
  amount: money,
  date: dateString,
})

/* ---------- Тайлан ---------- */
export const periodQuery = z.object({ period: periodOrAll.optional().default('all') })
export const monthlyQuery = z.object({ months: z.coerce.number().int().min(1).max(24).default(6) })
export const reportTransactionsQuery = listQuery.extend({
  period: periodOrAll.optional().default('all'),
  type: z.enum(['income', 'expense']).optional(),
})

/* ---------- Зарлал ---------- */
export const announcementQuery = listQuery.extend({
  categoryId: id.optional(),
  status: z.enum(['draft', 'published']).optional(),
})
export const announcement = z.object({
  title: requiredText(200),
  categoryId: id,
  content: requiredText(20000),
  date: dateString,
  audience: audience.default('all'),
  notify: z.boolean().default(false),
  action: z.enum(['draft', 'publish']).optional(),
})

/* ---------- Хурал ---------- */
export const meetingQuery = listQuery.extend({
  status: z.enum(['draft', 'scheduled', 'completed']).optional(),
  type: z.enum(['regular', 'extraordinary']).optional(),
})
export const meeting = z.object({
  title: requiredText(200),
  type: z.enum(['regular', 'extraordinary']),
  date: dateString,
  time: timeString,
  location: optionalText(200),
  format: z.enum(['onsite', 'online']),
  meetingLink: optionalText(500).refine((v) => !v || /^https?:\/\//.test(v), 'http(s):// хаяг байна'),
  meetingId: optionalText(50),
  meetingPassword: optionalText(50),
  audience: audience.default('all'),
  description: optionalText(2000),
  agenda: z
    .array(z.string().trim().max(500))
    .max(30)
    .default([])
    .transform((items) => items.filter(Boolean)),
  notify: z.boolean().default(false),
  action: z.enum(['draft', 'publish']).optional(),
})

/* ---------- Санал асуулга (админ) ---------- */
const dateTime = z
  .string()
  .datetime({ offset: true, message: "ISO 8601 хэлбэртэй байна (жишээ: '2026-11-25T18:00:00+08:00')" })
  .nullish()
  .transform((v) => v || null)

export const pollQuery = listQuery.extend({
  status: z.enum(['draft', 'active', 'closed']).optional(),
})
export const poll = z.object({
  title: requiredText(200),
  description: optionalText(2000),
  audience: audience.default('all'),
  startsAt: dateTime,
  endsAt: dateTime,
  options: z
    .array(z.string().trim().max(300))
    .transform((items) => items.filter(Boolean))
    .refine((items) => items.length >= 2, 'Дор хаяж 2 сонголт оруулна уу')
    .refine((items) => items.length <= 10, '10-аас ихгүй сонголт')
    .refine((items) => new Set(items).size === items.length, 'Сонголт давхардсан байна'),
  notify: z.boolean().default(false),
  action: z.enum(['draft', 'publish']).optional(),
})

/* ---------- Санал гомдол (админ) ---------- */
const complaintType = z.enum(['complaint', 'maintenance'])
const complaintStatus = z.enum(['new', 'in_progress', 'resolved', 'rejected'])

export const complaintQuery = listQuery.extend({
  type: complaintType.optional(),
  status: complaintStatus.optional(),
  categoryId: id.optional(),
})
export const complaintStatusBody = z.object({ status: complaintStatus })
export const complaintReply = z.object({ message: requiredText(2000) })

/* ---------- Апп: нэвтрэлт ---------- */
const phone = z.string().trim().regex(/^\d{8}$/, '8 оронтой утасны дугаар оруулна уу')
export const otpRequest = z.object({ phone })
export const otpVerify = z.object({
  phone,
  code: z.string().trim().regex(/^\d{6}$/, '6 оронтой код оруулна уу'),
})

/* ---------- Апп ---------- */
export const appMe = z.object({
  email: z
    .string()
    .trim()
    .email('И-мэйл хаяг буруу байна')
    .max(150)
    .or(z.literal(''))
    .nullish()
    .transform((v) => (v ? v.toLowerCase() : null)),
})
export const appAnnouncementQuery = listQuery.extend({ categoryId: id.optional() })
export const appMeetingQuery = listQuery.extend({
  upcoming: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
})
export const appPollQuery = listQuery.extend({ status: z.enum(['active', 'closed']).optional() })
export const vote = z.object({ optionId: id })
export const appComplaintQuery = listQuery.extend({
  type: complaintType.optional(),
  status: complaintStatus.optional(),
})
// multipart/form-data тул бүх утга текстээр ирнэ
export const complaintCreate = z.object({
  type: complaintType.default('complaint'),
  title: requiredText(200),
  content: requiredText(5000),
  categoryId: z
    .union([id, z.literal('')])
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
})
export const appExpenseQuery = listQuery.extend({
  period: periodOrAll.optional().default('all'),
  categoryId: id.optional(),
})
export const device = z.object({
  fcmToken: z.string().trim().min(10).max(500),
  platform: z.enum(['android', 'ios']),
})

/* ---------- Мэдэгдэл ---------- */
export const notificationQuery = z.object({
  unread: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})
