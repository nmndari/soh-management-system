/** zod схемээр req[source]-г шалгаж, цэвэрлэсэн утгаар солино. */
export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source] ?? {})
  if (!result.success) return next(result.error)
  if (source === 'query') {
    // Express 4-д req.query-г дахин оноож болно, гэхдээ тусад нь хадгалъя
    req.validatedQuery = result.data
  } else {
    req[source] = result.data
  }
  next()
}

/** async controller-ийн алдааг errorHandler руу дамжуулна. */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)
