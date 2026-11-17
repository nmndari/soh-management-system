/*
  /api/v1/auth/*  — нэвтрэлт (админ, оршин суугч)
  /api/v1/app/*   — оршин суугчийн апп (app.routes.js)
  /api/v1/*       — админ веб
*/
import { Router } from 'express'
import appRoutes from './app.routes.js'
import { complaints, polls } from '../controllers/engagement.controller.js'
import * as auth from '../controllers/auth.controller.js'
import * as settings from '../controllers/settings.controller.js'
import * as residents from '../controllers/resident.controller.js'
import * as fees from '../controllers/fee.controller.js'
import * as reports from '../controllers/report.controller.js'
import * as notifications from '../controllers/notification.controller.js'
import { createTransactionController } from '../controllers/transaction.controller.js'
import { announcementController, meetingController } from '../controllers/content.controller.js'
import { expenseService, incomeService } from '../services/transaction.service.js'
import { authenticate, requireRole } from '../middlewares/auth.js'
import { asyncHandler as h, validate } from '../middlewares/validate.js'
import { idParam } from '../validators/common.js'
import * as s from '../validators/schemas.js'

const router = Router()
const body = (schema) => validate(schema, 'body')
const query = (schema) => validate(schema, 'query')
const params = validate(idParam, 'params')

/* ---------- Нэвтрэлт (нээлттэй) ---------- */
router.post('/auth/admin/login', body(s.login), h(auth.login))
router.post('/auth/refresh', body(s.refreshToken), h(auth.refresh))
router.post('/auth/logout', body(s.logout), h(auth.logout))
router.post('/auth/resident/request-otp', body(s.otpRequest), h(auth.requestOtp))
router.post('/auth/resident/verify-otp', body(s.otpVerify), h(auth.verifyOtp))

/* ---------- Оршин суугчийн апп ---------- */
router.use('/app', appRoutes)

/* ---------- Доорх бүх зам админ эрх шаардана ---------- */
router.use(authenticate, requireRole('admin'))

router.get('/auth/me', h(auth.me))

/* Тохиргоо */
router.get('/settings', h(settings.get))
router.put('/settings', body(s.settings), h(settings.update))
router.get('/settings/categories', query(s.categoryQuery), h(settings.listCategories))
router.post('/settings/categories', body(s.categoryCreate), h(settings.createCategory))
router.put('/settings/categories/:id', params, body(s.categoryUpdate), h(settings.updateCategory))
router.delete('/settings/categories/:id', params, h(settings.deleteCategory))

/* Хянах самбар */
router.get('/dashboard/summary', h(reports.dashboard))

/* Оршин суугчид */
router.get('/residents', query(s.residentQuery), h(residents.list))
router.get('/residents/stats', h(residents.stats))
router.get('/residents/:id', params, h(residents.getById))
router.get('/residents/:id/payments', params, query(s.historyQuery), h(residents.payments))
router.post('/residents', body(s.resident), h(residents.create))
router.put('/residents/:id', params, body(s.resident), h(residents.update))
router.delete('/residents/:id', params, h(residents.remove))

/* Сарын төлбөр */
router.get('/fee-charges', query(s.chargeQuery), h(fees.listCharges))
router.post('/fee-charges/generate', body(s.chargeGenerate), h(fees.generate))
router.get('/payments', query(s.paymentQuery), h(fees.listPayments))
router.post('/payments', body(s.payment), h(fees.createPayment))
router.delete('/payments/:id', params, h(fees.deletePayment))

/* Зардал, орлого */
for (const [path, service] of [
  ['/expenses', expenseService],
  ['/incomes', incomeService],
]) {
  const c = createTransactionController(service)
  router.get(path, query(s.transactionQuery), h(c.list))
  router.get(`${path}/stats`, h(c.stats))
  router.get(`${path}/:id`, params, h(c.getById))
  router.post(path, body(s.transaction), h(c.create))
  router.put(`${path}/:id`, params, body(s.transaction), h(c.update))
  router.delete(`${path}/:id`, params, h(c.remove))
}

/* Санхүүгийн тайлан */
router.get('/reports/summary', query(s.periodQuery), h(reports.summary))
router.get('/reports/monthly', query(s.monthlyQuery), h(reports.monthly))
router.get('/reports/expense-categories', query(s.periodQuery), h(reports.expenseCategories))
router.get('/reports/transactions', query(s.reportTransactionsQuery), h(reports.transactions))

/* Зарлал */
const a = announcementController
router.get('/announcements', query(s.announcementQuery), h(a.list))
router.get('/announcements/stats', h(a.stats))
router.get('/announcements/:id', params, h(a.getById))
router.post('/announcements', body(s.announcement), h(a.create))
router.put('/announcements/:id', params, body(s.announcement), h(a.update))
router.delete('/announcements/:id', params, h(a.remove))
router.patch('/announcements/:id/publish', params, h(a.publish))
router.patch('/announcements/:id/unpublish', params, h(a.unpublish))

/* Хурал */
const m = meetingController
router.get('/meetings', query(s.meetingQuery), h(m.list))
router.get('/meetings/stats', h(m.stats))
router.get('/meetings/:id', params, h(m.getById))
router.post('/meetings', body(s.meeting), h(m.create))
router.put('/meetings/:id', params, body(s.meeting), h(m.update))
router.delete('/meetings/:id', params, h(m.remove))
router.patch('/meetings/:id/publish', params, h(m.publish))
router.patch('/meetings/:id/complete', params, h(m.complete))
router.patch('/meetings/:id/unpublish', params, h(m.unpublish))

/* Санал асуулга */
router.get('/polls', query(s.pollQuery), h(polls.list))
router.get('/polls/:id', params, h(polls.getById))
router.post('/polls', body(s.poll), h(polls.create))
router.put('/polls/:id', params, body(s.poll), h(polls.update))
router.delete('/polls/:id', params, h(polls.remove))
router.patch('/polls/:id/publish', params, h(polls.publish))
router.patch('/polls/:id/close', params, h(polls.close))
router.get('/polls/:id/results', params, h(polls.results))

/* Санал гомдол, засварын хүсэлт */
router.get('/complaints', query(s.complaintQuery), h(complaints.list))
router.get('/complaints/stats', h(complaints.stats))
router.get('/complaints/:id', params, h(complaints.getById))
router.patch('/complaints/:id/status', params, body(s.complaintStatusBody), h(complaints.updateStatus))
router.post('/complaints/:id/replies', params, body(s.complaintReply), h(complaints.reply))

/* Мэдэгдэл */
router.get('/notifications', query(s.notificationQuery), h(notifications.list))
router.patch('/notifications/read-all', h(notifications.markAllRead))
router.patch('/notifications/:id/read', params, h(notifications.markRead))

export default router
