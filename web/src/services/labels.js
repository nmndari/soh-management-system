/*
  Сервер англи кодоор хадгална, веб монгол нэрээр харуулна.
  toLabel: 'published' → 'Нийтэлсэн', toCode: 'Нийтэлсэн' → 'published'
*/
function createLabels(map) {
  return {
    toLabel: (code) => map[code] ?? code,
    toCode: (label) => Object.keys(map).find((key) => map[key] === label) ?? label,
  }
}

export const paymentStatus = createLabels({
  paid: 'Төлсөн',
  unpaid: 'Төлөөгүй',
  no_charge: 'Нэхэмжлэлгүй',
})

export const announcementStatus = createLabels({
  published: 'Нийтэлсэн',
  draft: 'Ноорог',
})

export const meetingStatus = createLabels({
  draft: 'Ноорог',
  scheduled: 'Товлогдсон',
  completed: 'Дууссан',
})

export const meetingType = createLabels({
  regular: 'Ээлжит',
  extraordinary: 'Ээлжит бус',
})

export const meetingFormat = createLabels({
  onsite: 'Танхим',
  online: 'Онлайн',
})

export const transactionType = createLabels({
  income: 'Орлого',
  expense: 'Зарлага',
})

export const audience = {
  toLabel: (code) =>
    !code || code === 'all' ? 'Бүх оршин суугч' : `${code.split(':')[1]}-р орц`,
  toCode: (label) => {
    const match = /^(\d+)-р орц$/.exec(label || '')
    return match ? `entrance:${match[1]}` : 'all'
  },
}

/** Шүүлтүүрийн "Бүх ..." утгыг серверт явуулахгүй */
export const filterValue = (value, allLabel, labels) =>
  value === allLabel ? undefined : labels ? labels.toCode(value) : value
