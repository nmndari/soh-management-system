import { api } from './api'
import { categoryIdByName } from './categories'
import {
  announcementStatus,
  audience,
  filterValue,
  meetingFormat,
  meetingStatus,
  meetingType,
} from './labels'

/* ---------- Зарлал ---------- */

const announcementToView = (a) => ({
  ...a,
  status: announcementStatus.toLabel(a.status),
  audience: audience.toLabel(a.audience),
})

async function announcementBody(form, action) {
  return {
    title: form.title.trim(),
    categoryId: await categoryIdByName('announcement', form.category),
    content: form.content.trim(),
    date: form.date,
    audience: audience.toCode(form.audience),
    notify: Boolean(form.notify),
    ...(action && { action }),
  }
}

export async function listAnnouncements({ search, category, status }) {
  const categoryName = filterValue(category, 'Бүх ангилал')
  const res = await api.get('/announcements', {
    search,
    categoryId: categoryName ? await categoryIdByName('announcement', categoryName) : undefined,
    status: filterValue(status, 'Бүх төлөв', announcementStatus),
    limit: 100,
  })
  return { items: res.data.map(announcementToView), total: res.meta.total }
}

export const getAnnouncementStats = async () => (await api.get('/announcements/stats')).data

export const createAnnouncement = async (form, action) =>
  announcementToView((await api.post('/announcements', await announcementBody(form, action))).data)

export const updateAnnouncement = async (id, form, action) =>
  announcementToView((await api.put(`/announcements/${id}`, await announcementBody(form, action))).data)

export const publishAnnouncement = (id) => api.patch(`/announcements/${id}/publish`)
export const unpublishAnnouncement = (id) => api.patch(`/announcements/${id}/unpublish`)
export const deleteAnnouncement = (id) => api.del(`/announcements/${id}`)

/* ---------- Хурал ---------- */

const meetingToView = (m) => ({
  ...m,
  type: meetingType.toLabel(m.type),
  format: meetingFormat.toLabel(m.format),
  status: meetingStatus.toLabel(m.status),
  audience: audience.toLabel(m.audience),
  location: m.location ?? '',
  description: m.description ?? '',
  meetingLink: m.meetingLink ?? '',
  meetingId: m.meetingId ?? '',
  meetingPassword: m.meetingPassword ?? '',
})

const meetingBody = (form, action) => ({
  title: form.title.trim(),
  type: meetingType.toCode(form.type),
  date: form.date,
  time: form.time,
  location: form.location?.trim() || null,
  format: meetingFormat.toCode(form.format),
  meetingLink: form.meetingLink?.trim() || null,
  meetingId: form.meetingId?.trim() || null,
  meetingPassword: form.meetingPassword?.trim() || null,
  audience: audience.toCode(form.audience),
  description: form.description?.trim() || null,
  agenda: (form.agenda || []).map((item) => item.trim()).filter(Boolean),
  notify: Boolean(form.notify),
  ...(action && { action }),
})

export async function listMeetings({ search, status, type }) {
  const res = await api.get('/meetings', {
    search,
    status: filterValue(status, 'Бүх төлөв', meetingStatus),
    type: filterValue(type, 'Бүх төрөл', meetingType),
    limit: 100,
  })
  return { items: res.data.map(meetingToView), total: res.meta.total }
}

export const getMeetingStats = async () => (await api.get('/meetings/stats')).data

export const createMeeting = async (form, action) =>
  meetingToView((await api.post('/meetings', meetingBody(form, action))).data)

export const updateMeeting = async (id, form, action) =>
  meetingToView((await api.put(`/meetings/${id}`, meetingBody(form, action))).data)

export const publishMeeting = (id) => api.patch(`/meetings/${id}/publish`)
export const completeMeeting = (id) => api.patch(`/meetings/${id}/complete`)
export const unpublishMeeting = (id) => api.patch(`/meetings/${id}/unpublish`)
export const deleteMeeting = (id) => api.del(`/meetings/${id}`)

/* ---------- Мэдэгдэл ---------- */

export async function listNotifications() {
  const res = await api.get('/notifications', { limit: 20 })
  return { items: res.data, unreadCount: res.meta.unreadCount }
}

export const markNotificationRead = (id) => api.patch(`/notifications/${id}/read`)
export const markAllNotificationsRead = () => api.patch('/notifications/read-all')
