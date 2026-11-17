import { ZodError } from 'zod'
import { HttpError } from '../utils/httpError.js'

export function notFoundHandler(req, res) {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: `${req.method} ${req.originalUrl} олдсонгүй` },
  })
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (err instanceof ZodError) {
    const fields = {}
    for (const issue of err.issues) {
      const key = issue.path.join('.') || '_'
      if (!fields[key]) fields[key] = issue.message
    }
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Оруулсан мэдээлэл буруу байна', fields },
    })
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, ...(err.fields && { fields: err.fields }) },
    })
  }

  // Express/static-ийн 4xx алдаа (жишээ нь олдоогүй файл)
  const status = err?.status ?? err?.statusCode
  if (typeof status === 'number' && status >= 400 && status < 500 && err.type !== 'entity.parse.failed') {
    return res.status(status).json({
      error: status === 404
        ? { code: 'NOT_FOUND', message: 'Файл олдсонгүй' }
        : { code: 'BAD_REQUEST', message: 'Хүсэлт буруу байна' },
    })
  }

  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'BAD_JSON', message: 'JSON формат буруу байна' } })
  }

  // MSSQL алдааны дугаарууд
  const sqlNumber = err?.number ?? err?.originalError?.info?.number ?? err?.code
  if (sqlNumber === 2627 || sqlNumber === 2601) {
    return res.status(409).json({
      error: { code: 'DUPLICATE', message: 'Ийм бүртгэл аль хэдийн байна' },
    })
  }
  if (sqlNumber === 547) {
    return res.status(409).json({
      error: {
        code: 'IN_USE',
        message: 'Өөр бүртгэлтэй холбоотой тул энэ үйлдлийг хийх боломжгүй',
      },
    })
  }

  console.error(`[${req.method} ${req.originalUrl}]`, err)
  res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Серверт алдаа гарлаа' } })
}
