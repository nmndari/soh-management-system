import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import multer from 'multer'
import { env } from '../config/env.js'
import { badRequest } from '../utils/httpError.js'

export const UPLOAD_ROOT = path.resolve(env.uploadDir)
const COMPLAINT_DIR = path.join(UPLOAD_ROOT, 'complaints')
fs.mkdirSync(COMPLAINT_DIR, { recursive: true })

const EXTENSIONS = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' }

const storage = multer.diskStorage({
  destination: COMPLAINT_DIR,
  // Хэрэглэгчийн файлын нэрийг ашиглахгүй — санамсаргүй нэр өгнө
  filename: (_req, file, cb) =>
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${EXTENSIONS[file.mimetype]}`),
})

const complaintUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 3 },
  fileFilter: (_req, file, cb) =>
    EXTENSIONS[file.mimetype]
      ? cb(null, true)
      : cb(badRequest('Зөвхөн JPG, PNG, WEBP зураг оруулна', { images: 'Зургийн төрөл буруу' })),
}).array('images', 3)

/** Гомдлын зураг (images[] ≤ 3, тус бүр ≤ 5MB). Алдааг монгол мессеж болгоно. */
export function uploadComplaintImages(req, res, next) {
  complaintUpload(req, res, (err) => {
    if (!err) return next()
    if (err instanceof multer.MulterError) {
      const messages = {
        LIMIT_FILE_SIZE: 'Зураг тус бүр 5MB-аас ихгүй байна',
        LIMIT_FILE_COUNT: 'Хамгийн ихдээ 3 зураг',
        LIMIT_UNEXPECTED_FILE: 'Хамгийн ихдээ 3 зураг, талбарын нэр "images"',
      }
      return next(badRequest(messages[err.code] || 'Файл хүлээн авахад алдаа гарлаа', { images: err.code }))
    }
    next(err)
  })
}

/** Хадгалсан файлын нийтийн зам: /uploads/complaints/xxx.jpg */
export const publicUrl = (file) =>
  `/uploads/${path.relative(UPLOAD_ROOT, file.path).split(path.sep).join('/')}`

/** Хүсэлт амжилтгүй болбол хадгалсан файлуудыг устгана */
export function removeFiles(files = []) {
  for (const file of files) fs.unlink(file.path, () => {})
}
