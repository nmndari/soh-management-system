export class HttpError extends Error {
  constructor(status, code, message, fields) {
    super(message)
    this.status = status
    this.code = code
    this.fields = fields
  }
}

export const badRequest = (message, fields) =>
  new HttpError(400, 'VALIDATION_ERROR', message, fields)
export const unauthorized = (message = 'Нэвтрэх шаардлагатай') =>
  new HttpError(401, 'UNAUTHORIZED', message)
export const forbidden = (message = 'Энэ үйлдлийг хийх эрхгүй байна') =>
  new HttpError(403, 'FORBIDDEN', message)
export const notFound = (message = 'Бүртгэл олдсонгүй') =>
  new HttpError(404, 'NOT_FOUND', message)
export const conflict = (message) => new HttpError(409, 'CONFLICT', message)
export const tooManyRequests = (message) => new HttpError(429, 'TOO_MANY_REQUESTS', message)
