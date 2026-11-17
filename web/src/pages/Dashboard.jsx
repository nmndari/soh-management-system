
import {
  Users,
  Wallet,
  Receipt,
  Megaphone,
  CalendarDays,
  ArrowUpRight,
  ArrowRight,
  Clock,
  MapPin,
  Plus,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDashboard } from '../services/finance'
import { announcementStatus } from '../services/labels'
import { currentAdmin } from '../services/auth'

const MONTHS = ['ЯНВ', 'ФЕВ', 'МАР', 'АПР', 'МАЙ', 'ИЮН', 'ИЮЛ', 'АВГ', 'СЕП', 'ОКТ', 'НОЯ', 'ДЕК']

// 12800000 → '12.8 сая ₮'
const formatMillions = (amount) => {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1).replace(/\.0$/, '')} сая ₮`
  }
  return `${new Intl.NumberFormat('mn-MN').format(amount)} ₮`
}

const formatDate = (date) => date.split('-').join('.')

function Dashboard() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getDashboard()
      .then(setSummary)
      .catch((err) => setError(err.message))
  }, [])

  const stats = [
    {
      title: 'Нийт оршин суугч',
      value: summary ? String(summary.residentsCount) : '—',
      note: 'Бүртгэлтэй оршин суугч',
      icon: Users,
      color: 'blue',
    },
    {
      title: 'Энэ сарын орлого',
      value: summary ? formatMillions(summary.monthIncome) : '—',
      note: 'Бүртгэгдсэн орлого',
      icon: Wallet,
      color: 'green',
    },
    {
      title: 'Энэ сарын зарлага',
      value: summary ? formatMillions(summary.monthExpense) : '—',
      note: 'Бүртгэгдсэн зарлага',
      icon: Receipt,
      color: 'orange',
    },
    {
      title: 'Нээлттэй санал гомдол',
      value: summary ? String(summary.openComplaints).padStart(2, '0') : '—',
      note: 'Шийдвэрлэлт хүлээж буй',
      icon: Megaphone,
      color: 'purple',
    },
  ]

  const announcements = (summary?.recentAnnouncements || []).map((item) => ({
    ...item,
    date: formatDate(item.date),
    status: announcementStatus.toLabel(item.status),
  }))

  const meetings = (summary?.upcomingMeetings || []).map((item) => {
    const [, month, day] = item.date.split('-')
    return { ...item, date: day, month: MONTHS[Number(month) - 1] }
  })

  const today = new Date()
  const admin = currentAdmin()

  return (
    <div className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <p className="welcome-label">
            ТАВТАЙ МОРИЛ, {(admin?.fullName || 'АДМИН').toUpperCase()}
          </p>
          <h1>Хянах самбар</h1>
          <p className="page-description">
            {error || 'СӨХ-ийн үйл ажиллагааны ерөнхий мэдээлэлтэй танилцана уу.'}
          </p>
        </div>

        <div className="today-date">
          <CalendarDays size={17} />
          {today.getFullYear()} оны {today.getMonth() + 1}-р сарын {today.getDate()}
        </div>
      </div>

      <section className="stats-grid">
        {stats.map((stat) => {
          const Icon = stat.icon

          return (
            <article className="stat-card" key={stat.title}>
              <div className={`stat-icon ${stat.color}`}>
                <Icon size={21} />
              </div>

              <p>{stat.title}</p>
              <h2>{stat.value}</h2>
              <span>{stat.note}</span>
            </article>
          )
        })}
      </section>

      <div className="dashboard-columns">
        <section className="dashboard-card">
          <div className="section-heading">
            <div>
              <h3>Сүүлийн зарлалууд</h3>
              <p>Оршин суугчдад хүргэсэн мэдээлэл</p>
            </div>

            <button className="view-all" onClick={() => navigate('/announcements')}>
              Бүгдийг харах <ArrowRight size={15} />
            </button>
          </div>

          <div className="announcement-list">
            {announcements.length === 0 && summary && (
              <p className="page-description">Зарлал алга байна.</p>
            )}
            {announcements.map((item) => (
              <div className="announcement-item" key={item.id}>
                <div className="announcement-icon">
                  <Megaphone size={19} />
                </div>

                <div className="announcement-info">
                  <strong>{item.title}</strong>
                  <span>{item.date}</span>
                </div>

                <span className={`status ${item.status === 'Ноорог' ? 'draft' : ''}`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>

          <button className="quick-action" onClick={() => navigate('/announcements')}>
            <Plus size={17} />
            Шинэ зарлал үүсгэх
          </button>
        </section>

        <section className="dashboard-card">
          <div className="section-heading">
            <div>
              <h3>Удахгүй болох хурал</h3>
              <p>Төлөвлөгдсөн уулзалтууд</p>
            </div>

            <CalendarDays size={20} className="muted-icon" />
          </div>

          <div className="meeting-list">
            {meetings.length === 0 && summary && (
              <p className="page-description">Товлогдсон хурал алга байна.</p>
            )}
            {meetings.map((meeting) => (
              <div className="meeting-item" key={meeting.id}>
                <div className="meeting-date">
                  <strong>{meeting.date}</strong>
                  <span>{meeting.month}</span>
                </div>

                <div className="meeting-info">
                  <strong>{meeting.title}</strong>
                  <span><Clock size={13} /> {meeting.time}</span>
                  <span><MapPin size={13} /> {meeting.location}</span>
                </div>
              </div>
            ))}
          </div>

          <button className="quick-action" onClick={() => navigate('/meetings')}>
            <Plus size={17} />
            Хурал төлөвлөх
          </button>
        </section>
      </div>

      <section className="dashboard-bottom">
        <div>
          <div className="bottom-icon">
            <Users size={21} />
          </div>
          <div>
            <h3>Оршин суугчдын бүртгэл</h3>
            <p>
              Нийт {summary?.residentsCount ?? '—'} оршин суугч системд бүртгэлтэй байна.
            </p>
          </div>
        </div>

        <button className="view-all" onClick={() => navigate('/residents')}>
          Дэлгэрэнгүй <ArrowUpRight size={16} />
        </button>
      </section>
    </div>
  )
}

export default Dashboard
