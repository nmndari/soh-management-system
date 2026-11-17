import * as announcementRepo from '../repositories/announcement.repository.js'
import * as dashboardRepo from '../repositories/dashboard.repository.js'
import * as meetingRepo from '../repositories/meeting.repository.js'
import * as reportRepo from '../repositories/report.repository.js'
import * as residentRepo from '../repositories/resident.repository.js'
import { currentPeriod, parsePeriod, toDateString } from '../utils/period.js'
import { toMeetingDto } from './meeting.service.js'

export async function getSummary(sohId) {
  const today = toDateString()
  const [residents, month, complaints, announcements, meetings] = await Promise.all([
    residentRepo.countActive(sohId),
    reportRepo.summary(sohId, parsePeriod(currentPeriod())),
    dashboardRepo.openComplaints(sohId),
    announcementRepo.recent(sohId, 3),
    meetingRepo.upcoming(sohId, today, 2),
  ])

  return {
    residentsCount: residents.n,
    monthIncome: month.totalIncome,
    monthExpense: month.totalExpense,
    openComplaints: complaints.n,
    recentAnnouncements: announcements.map((a) => ({
      id: a.id,
      title: a.title,
      date: a.date,
      status: a.status,
    })),
    upcomingMeetings: meetings.map(toMeetingDto).map((m) => ({
      id: m.id,
      title: m.title,
      date: m.date,
      time: m.time,
      location: m.location,
    })),
  }
}
