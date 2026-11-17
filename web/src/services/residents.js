import { api } from './api'
import { filterValue, paymentStatus } from './labels'

// Серверийн DTO → хуудасны хэрэглэдэг хэлбэр
const toView = (r) => ({
  ...r,
  entrance: String(r.entrance),
  floor: r.floor == null ? '' : String(r.floor),
  email: r.email ?? '',
  status: paymentStatus.toLabel(r.paymentStatus),
  remaining: r.currentCharge ? r.currentCharge.amount - r.currentCharge.paidAmount : 0,
})

const toBody = (form) => ({
  lastName: form.lastName,
  firstName: form.firstName,
  phone: form.phone,
  email: form.email || null,
  entrance: Number(form.entrance),
  floor: form.floor === '' ? null : Number(form.floor),
  apartment: String(form.apartment),
})

export async function listResidents({ search, entrance, status }) {
  const res = await api.get('/residents', {
    search,
    entrance: filterValue(entrance, 'Бүх орц'),
    paymentStatus: filterValue(status, 'Бүх төлөв', paymentStatus),
    limit: 100,
  })
  return { items: res.data.map(toView), total: res.meta.total }
}

export const getResidentStats = async () => (await api.get('/residents/stats')).data

export const createResident = async (form) => toView((await api.post('/residents', toBody(form))).data)

export const updateResident = async (id, form) =>
  toView((await api.put(`/residents/${id}`, toBody(form))).data)

export const deleteResident = (id) => api.del(`/residents/${id}`)

/** Энэ сарын үлдэгдлийг бүтэн төлсөн гэж бүртгэнэ */
export const recordPayment = (resident, method = 'bank') =>
  api.post('/payments', { residentId: resident.id, amount: resident.remaining, method })
