/*
  Оршин суугчийн апп-ын API (/api/v1/app/*).
  /config-оос бусад бүх зам оршин суугчийн token шаардана.
*/
import { Router } from 'express'
import * as app from '../controllers/app.controller.js'
import {
  authenticate,
  optionalAuthenticate,
  requireRole,
  residentContext,
} from '../middlewares/auth.js'
import { uploadComplaintImages } from '../middlewares/upload.js'
import { asyncHandler as h, validate } from '../middlewares/validate.js'
import { idParam } from '../validators/common.js'
import * as s from '../validators/schemas.js'

const router = Router()
const body = (schema) => validate(schema, 'body')
const query = (schema) => validate(schema, 'query')
const params = validate(idParam, 'params')

// Апп асахад нэвтрэхээс өмнө дуудна
router.get('/config', optionalAuthenticate, h(app.config))

router.use(authenticate, requireRole('resident'), residentContext)

router.get('/me', h(app.me))
router.put('/me', body(s.appMe), h(app.updateMe))
router.get('/home', h(app.home))

router.get('/announcements', query(s.appAnnouncementQuery), h(app.announcements))
router.get('/announcements/:id', params, h(app.announcement))

router.get('/meetings', query(s.appMeetingQuery), h(app.meetings))
router.get('/meetings/:id', params, h(app.meeting))

router.get('/polls', query(s.appPollQuery), h(app.polls))
router.get('/polls/:id', params, h(app.poll))
router.post('/polls/:id/vote', params, body(s.vote), h(app.vote))
router.get('/polls/:id/results', params, h(app.pollResults))

router.get('/complaints', query(s.appComplaintQuery), h(app.complaints))
router.post('/complaints', uploadComplaintImages, h(app.createComplaint))
router.get('/complaints/:id', params, h(app.complaint))

router.get('/payments', query(s.historyQuery), h(app.payments))
router.get('/expenses', query(s.appExpenseQuery), h(app.expenses))
router.get('/reports/summary', query(s.periodQuery), h(app.reportSummary))

router.get('/notifications', query(s.notificationQuery), h(app.notifications))
router.patch('/notifications/:id/read', params, h(app.readNotification))

router.post('/devices', body(s.device), h(app.registerDevice))
router.delete('/devices/:token', h(app.removeDevice))

export default router
