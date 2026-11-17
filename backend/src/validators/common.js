import { z } from 'zod'

export const id = z.coerce.number().int().positive()
export const idParam = z.object({ id })

export const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD хэлбэртэй байна')
export const timeString = z.string().regex(/^\d{2}:\d{2}$/, 'HH:mm хэлбэртэй байна')
export const periodString = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'YYYY-MM хэлбэртэй байна')
export const periodOrAll = z.union([periodString, z.literal('all')])

export const audience = z
  .string()
  .regex(/^(all|entrance:\d{1,2})$/, "'all' эсвэл 'entrance:1' хэлбэртэй байна")

/** Хоосон мөрийг null болгоно (сонголттой текст талбар) */
export const optionalText = (max) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null))

export const requiredText = (max, message = 'Заавал бөглөнө') =>
  z.string({ required_error: message }).trim().min(1, message).max(max)

export const money = z.coerce
  .number({ invalid_type_error: 'Тоо оруулна уу' })
  .int('Бүхэл тоо байна')
  .positive('0-ээс их байна')

/** Жагсаалтын нийтлэг query: page, limit, search */
export const listQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().trim().max(100).optional().transform((v) => v || undefined),
})
