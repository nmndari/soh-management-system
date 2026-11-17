
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

const stats = [
  {
    title: 'Нийт оршин суугч',
    value: '248',
    note: 'Бүртгэлтэй оршин суугч',
    icon: Users,
    color: 'blue',
  },
  {
    title: 'Энэ сарын орлого',
    value: '12.8 сая ₮',
    note: 'Бүртгэгдсэн орлого',
    icon: Wallet,
    color: 'green',
  },
  {
    title: 'Энэ сарын зарлага',
    value: '4.2 сая ₮',
    note: 'Бүртгэгдсэн зарлага',
    icon: Receipt,
    color: 'orange',
  },
  {
    title: 'Нээлттэй санал гомдол',
    value: '08',
    note: 'Шийдвэрлэлт хүлээж буй',
    icon: Megaphone,
    color: 'purple',
  },
]

const announcements = [
  {
    title: 'Орцны цэвэрлэгээний хуваарь',
    date: '2026.11.17',
    status: 'Нийтэлсэн',
  },
  {
    title: 'Оршин суугчдын ээлжит хурал',
    date: '2026.11.15',
    status: 'Нийтэлсэн',
  },
  {
    title: 'Усны шугамын засвар үйлчилгээ',
    date: '2026.11.13',
    status: 'Ноорог',
  },
]

const meetings = [
  {
    title: 'Оршин суугчдын ээлжит хурал',
    date: '20',
    month: 'НОЯ',
    time: '18:00',
    location: 'Байрны хурлын танхим',
  },
  {
    title: 'Удирдах зөвлөлийн хурал',
    date: '25',
    month: 'НОЯ',
    time: '16:00',
    location: 'СӨХ-ийн оффис',
  },
]

function Dashboard() {
  return (
    <div className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <p className="welcome-label">ТАВТАЙ МОРИЛ, АДМИН</p>
          <h1>Хянах самбар</h1>
          <p className="page-description">
            СӨХ-ийн үйл ажиллагааны ерөнхий мэдээлэлтэй танилцана уу.
          </p>
        </div>

        <div className="today-date">
          <CalendarDays size={17} />
          2026 оны 11-р сарын 17
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

            <button className="view-all">
              Бүгдийг харах <ArrowRight size={15} />
            </button>
          </div>

          <div className="announcement-list">
            {announcements.map((item) => (
              <div className="announcement-item" key={item.title}>
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

          <button className="quick-action">
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
            {meetings.map((meeting) => (
              <div className="meeting-item" key={meeting.title}>
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

          <button className="quick-action">
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
            <p>Нийт 248 оршин суугч системд бүртгэлтэй байна.</p>
          </div>
        </div>

        <button className="view-all">
          Дэлгэрэнгүй <ArrowUpRight size={16} />
        </button>
      </section>
    </div>
  )
}

export default Dashboard
