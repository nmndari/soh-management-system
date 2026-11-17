
import { useState } from 'react'
import {
  Plus,
  Search,
  CalendarDays,
  CalendarClock,
  CheckCircle,
  FileText,
  Eye,
  Pencil,
  Trash2,
  X,
  Bell,
  Clock,
  MapPin,
  Users,
  Video,
  ClipboardList,
  Send,
  ListChecks,
} from 'lucide-react'
import './Meetings.css'

const initialMeetings = [
  {
    id: 1,
    title: 'Ээлжит оршин суугчдын хурал',
    type: 'Ээлжит',
    date: '2026-11-25',
    time: '18:00',
    location: 'СӨХ-ийн байр',
    format: 'Танхим',
    audience: 'Бүх оршин суугч',
    description: 'Оршин суугчдын ээлжит хурал зохион байгуулах.',
    agenda: [
      '2026 оны санхүүгийн тайлан танилцуулах',
      'Орцны засвар үйлчилгээний асуудал',
      'Ирэх улирлын төлөвлөгөө',
    ],
    status: 'Товлогдсон',
    notify: true,
  },
  {
    id: 2,
    title: 'Санхүүгийн тайлан хэлэлцэх хурал',
    type: 'Ээлжит бус',
    date: '2026-11-10',
    time: '17:00',
    location: 'СӨХ-ийн байр',
    format: 'Танхим',
    audience: 'Бүх оршин суугч',
    description: 'Санхүүгийн тайлангийн талаар хэлэлцэх.',
    agenda: [
      'Орлого, зарлагын тайлан',
      'Зардлын хуваарилалт',
    ],
    status: 'Дууссан',
    notify: false,
  },
  {
    id: 3,
    title: 'Орцны тохижилтын асуудал',
    type: 'Ээлжит бус',
    date: '2026-12-05',
    time: '16:00',
    location: '1-р орц',
    format: 'Танхим',
    audience: '1-р орц',
    description: 'Орцны тохижилтын талаар санал солилцох.',
    agenda: [
      'Орцны тохижилтын санал',
      'Засварын төсөв',
    ],
    status: 'Ноорог',
    notify: false,
  },
  {
    id: 4,
    title: 'Өвлийн бэлтгэл ажлын хурал',
    type: 'Ээлжит',
    date: '2026-11-20',
    time: '15:00',
    location: 'Онлайн',
    format: 'Онлайн',
    audience: 'Бүх оршин суугч',
    description: 'Өвлийн бэлтгэл ажлын явцын талаар мэдээлэл өгөх.',
    agenda: [
      'Халаалтын систем',
      'Цэвэрлэгээ үйлчилгээ',
    ],
    status: 'Товлогдсон',
    notify: true,
  },
]

const emptyForm = {
  title: '',
  type: 'Ээлжит',
  date: new Date().toISOString().slice(0, 10),
  time: '18:00',
  location: '',
  format: 'Танхим',
  meetingLink: '',
  meetingId: '',
  meetingPassword: '',
  audience: 'Бүх оршин суугч',
  description: '',
  agenda: [''],
  notify: false,
}

const formatDate = (date) => {
  if (!date) return '-'
  const [year, month, day] = date.split('-')
  return `${year}.${month}.${day}`
}

function Meetings() {
  const [meetings, setMeetings] = useState(initialMeetings)

  // Search and filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Бүх төлөв')
  const [typeFilter, setTypeFilter] = useState('Бүх төрөл')

  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState(null)
  const [viewMeeting, setViewMeeting] = useState(null)

  // Form state
  const [form, setForm] = useState(emptyForm)

  // Statistics
  const today = new Date().toISOString().slice(0, 10)

  const upcomingCount = meetings.filter(
    (item) => item.status === 'Товлогдсон' && item.date >= today
  ).length

  const completedCount = meetings.filter(
    (item) => item.status === 'Дууссан'
  ).length

  const draftCount = meetings.filter(
    (item) => item.status === 'Ноорог'
  ).length

  // Filter meetings
  const filteredMeetings = meetings.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.location.toLowerCase().includes(search.toLowerCase())

    const matchesStatus =
      statusFilter === 'Бүх төлөв' ||
      item.status === statusFilter

    const matchesType =
      typeFilter === 'Бүх төрөл' ||
      item.type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  // Open create modal
  const openCreateModal = () => {
    setSelectedMeeting(null)
    setForm({
      ...emptyForm,
      date: new Date().toISOString().slice(0, 10),
      agenda: [''],
    })
    setShowModal(true)
  }

  // Open edit modal
  const openEditModal = (meeting) => {
    setSelectedMeeting(meeting)
    setForm({
      ...meeting,
      agenda: meeting.agenda?.length ? [...meeting.agenda] : [''],
    })
    setShowModal(true)
  }

  // Close form modal
  const closeModal = () => {
    setShowModal(false)
    setSelectedMeeting(null)
    setForm(emptyForm)
  }

  // Update agenda item
  const updateAgenda = (index, value) => {
    setForm((prev) => ({
      ...prev,
      agenda: prev.agenda.map((item, i) =>
        i === index ? value : item
      ),
    }))
  }

  // Add agenda item
  const addAgendaItem = () => {
    setForm((prev) => ({
      ...prev,
      agenda: [...prev.agenda, ''],
    }))
  }

  // Remove agenda item
  const removeAgendaItem = (index) => {
    setForm((prev) => ({
      ...prev,
      agenda: prev.agenda.filter((_, i) => i !== index),
    }))
  }

  // Create or update meeting
  const handleSubmit = (e) => {
    e.preventDefault()

    const action = e.nativeEvent.submitter?.value
    const shouldPublish = action === 'publish'

    const cleanAgenda = form.agenda
      .map((item) => item.trim())
      .filter(Boolean)

    const newMeeting = {
      ...form,
      title: form.title.trim(),
      location: form.location.trim(),
      description: form.description.trim(),
      agenda: cleanAgenda,
      status: shouldPublish ? 'Товлогдсон' : 'Ноорог',
      id: selectedMeeting ? selectedMeeting.id : Date.now(),
    }

    if (selectedMeeting) {
      setMeetings((prev) =>
        prev.map((item) =>
          item.id === selectedMeeting.id ? newMeeting : item
        )
      )
    } else {
      setMeetings((prev) => [newMeeting, ...prev])
    }

    closeModal()
  }

  // Delete meeting
  const handleDelete = (id) => {
    if (!window.confirm('Энэ хурлыг устгахдаа итгэлтэй байна уу?')) {
      return
    }

    setMeetings((prev) =>
      prev.filter((item) => item.id !== id)
    )

    if (viewMeeting?.id === id) {
      setViewMeeting(null)
    }
  }

  // Publish draft
  const handlePublish = (id) => {
    setMeetings((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: 'Товлогдсон' }
          : item
      )
    )
  }

  // Mark meeting as completed
  const handleComplete = (id) => {
    setMeetings((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: 'Дууссан' }
          : item
      )
    )
  }

  // Convert published meeting to draft
  const handleUnpublish = (id) => {
    setMeetings((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: 'Ноорог', notify: false }
          : item
      )
    )
  }

  return (
    <div className="meetings-page">

      {/* PAGE HEADER */}
      <div className="meetings-heading">
        <div>
          <span className="meetings-eyebrow">
            ХУРАЛ, УУЛЗАЛТЫН УДИРДЛАГА
          </span>

          <h1>Хурлын мэдээлэл</h1>

          <p>
            Оршин суугчдын хурал, уулзалтыг төлөвлөж удирдах.
          </p>
        </div>

        <button
          className="add-meeting-btn"
          onClick={openCreateModal}
        >
          <Plus size={18} />
          Шинэ хурал
        </button>
      </div>

      {/* STATISTICS */}
      <div className="meeting-stats">

        <div className="meeting-stat-card">
          <div className="meeting-stat-icon blue">
            <CalendarDays size={21} />
          </div>
          <div>
            <p>Нийт хурал</p>
            <h2>{meetings.length}</h2>
          </div>
        </div>

        <div className="meeting-stat-card">
          <div className="meeting-stat-icon green">
            <CalendarClock size={21} />
          </div>
          <div>
            <p>Удахгүй болох</p>
            <h2>{upcomingCount}</h2>
          </div>
        </div>

        <div className="meeting-stat-card">
          <div className="meeting-stat-icon purple">
            <CheckCircle size={21} />
          </div>
          <div>
            <p>Зохион байгуулагдсан</p>
            <h2>{completedCount}</h2>
          </div>
        </div>

        <div className="meeting-stat-card">
          <div className="meeting-stat-icon orange">
            <FileText size={21} />
          </div>
          <div>
            <p>Ноорог</p>
            <h2>{draftCount}</h2>
          </div>
        </div>

      </div>

      {/* MEETING LIST */}
      <section className="meeting-table-card">

        <div className="meeting-table-heading">
          <div>
            <h3>Хурлын жагсаалт</h3>
            <p>Үүсгэсэн болон товлосон хурлууд</p>
          </div>

          <span className="meeting-count">
            {filteredMeetings.length} хурал
          </span>
        </div>

        {/* SEARCH AND FILTERS */}
        <div className="meeting-filters">

          <div className="meeting-search">
            <Search size={18} />
            <input
              placeholder="Хурлын нэр, байршлаар хайх..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="Бүх төрөл">Бүх төрөл</option>
            <option value="Ээлжит">Ээлжит</option>
            <option value="Ээлжит бус">Ээлжит бус</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="Бүх төлөв">Бүх төлөв</option>
            <option value="Товлогдсон">Товлогдсон</option>
            <option value="Дууссан">Дууссан</option>
            <option value="Ноорог">Ноорог</option>
          </select>

        </div>

        {/* TABLE */}
        <div className="meeting-table-wrapper">
          <table className="meeting-table">

            <thead>
              <tr>
                <th>ХУРЛЫН МЭДЭЭЛЭЛ</th>
                <th>ТӨРӨЛ</th>
                <th>ОГНОО, ЦАГ</th>
                <th>БАЙРШИЛ</th>
                <th>ТӨЛӨВ</th>
                <th>ҮЙЛДЭЛ</th>
              </tr>
            </thead>

            <tbody>

              {filteredMeetings.length > 0 ? (
                filteredMeetings.map((item) => (
                  <tr key={item.id}>

                    <td>
                      <div className="meeting-name">
                        <div className="meeting-row-icon">
                          <CalendarDays size={17} />
                        </div>
                        <div>
                          <strong>{item.title}</strong>
                          <span>{item.audience}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="meeting-type">
                        {item.type}
                      </span>
                    </td>

                    <td>
                      <div className="meeting-date">
                        <strong>{formatDate(item.date)}</strong>
                        <span>
                          <Clock size={12} />
                          {item.time}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div className="meeting-location">
                        <MapPin size={14} />
                        {item.location}
                      </div>
                    </td>

                    <td>
                      <span className={`meeting-status ${
                        item.status === 'Товлогдсон'
                          ? 'scheduled'
                          : item.status === 'Дууссан'
                            ? 'completed'
                            : 'draft'
                      }`}>
                        {item.status}
                      </span>
                    </td>

                    <td>
                      <div className="meeting-actions">

                        <button
                          type="button"
                          title="Харах"
                          onClick={() => setViewMeeting(item)}
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          type="button"
                          title="Засах"
                          onClick={() => openEditModal(item)}
                        >
                          <Pencil size={16} />
                        </button>

                        {item.status === 'Ноорог' ? (
                          <button
                            type="button"
                            title="Нийтлэх"
                            className="publish-action"
                            onClick={() => handlePublish(item.id)}
                          >
                            <Send size={15} />
                          </button>
                        ) : item.status === 'Товлогдсон' ? (
                          <button
                            type="button"
                            title="Дууссан болгох"
                            className="complete-action"
                            onClick={() => handleComplete(item.id)}
                          >
                            <CheckCircle size={16} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            title="Ноорог болгох"
                            onClick={() => handleUnpublish(item.id)}
                          >
                            <FileText size={15} />
                          </button>
                        )}

                        <button
                          type="button"
                          title="Устгах"
                          className="delete-action"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 size={16} />
                        </button>

                      </div>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="meeting-empty">
                    <CalendarDays size={30} />
                    <strong>Хурал олдсонгүй</strong>
                    <span>Хайлтын нөхцөлөө өөрчлөөд үзнэ үү.</span>
                  </td>
                </tr>
              )}

            </tbody>

          </table>
        </div>

      </section>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div
          className="meeting-modal-overlay"
          onClick={closeModal}
        >

          <div
            className="meeting-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="meeting-modal-heading">
              <div>
                <span>ХУРЛЫН УДИРДЛАГА</span>

                <h2>
                  {selectedMeeting
                    ? 'Хурлын мэдээлэл засах'
                    : 'Шинэ хурал үүсгэх'}
                </h2>

                <p>
                  Хурлын мэдээлэл болон хэлэлцэх асуудлыг оруулна уу.
                </p>
              </div>

              <button type="button" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>

              {/* TITLE */}
              <div className="meeting-form-field">
                <label>Хурлын нэр *</label>
                <input
                  required
                  maxLength={120}
                  placeholder="Хурлын нэрийг оруулна уу"
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                />
              </div>

              {/* TYPE */}
              <div className="meeting-form-row">

                <div className="meeting-form-field">
                  <label>Хурлын төрөл *</label>
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm({ ...form, type: e.target.value })
                    }
                  >
                    <option>Ээлжит</option>
                    <option>Ээлжит бус</option>
                  </select>
                </div>

                <div className="meeting-form-field">
                  <label>Хурлын хэлбэр *</label>
                  <select
                    value={form.format}
                    onChange={(e) =>
                      setForm({ ...form, format: e.target.value })
                    }
                  >
                    <option>Танхим</option>
                    <option>Онлайн</option>
                  </select>
                </div>

              </div>

              {/* DATE AND TIME */}
              <div className="meeting-form-row">

                <div className="meeting-form-field">
                  <label>Огноо *</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) =>
                      setForm({ ...form, date: e.target.value })
                    }
                  />
                </div>

                <div className="meeting-form-field">
                  <label>Эхлэх цаг *</label>
                  <input
                    type="time"
                    required
                    value={form.time}
                    onChange={(e) =>
                      setForm({ ...form, time: e.target.value })
                    }
                  />
                </div>

              </div>

              {/* LOCATION */}
              {/* LOCATION - only for in-person meetings */}
                {form.format === 'Танхим' && (
                <div className="meeting-form-field">
                    <label>Байршил *</label>
                    <input
                    required
                    placeholder="Хурал болох газрын хаяг"
                    value={form.location}
                    onChange={(e) =>
                        setForm({ ...form, location: e.target.value })
                    }
                    />
                </div>
                )}

                {/* ONLINE MEETING DETAILS - only for online meetings */}
                {form.format === 'Онлайн' && (
                <>
                    <div className="meeting-form-field">
                    <label>Онлайн хурлын холбоос *</label>
                    <input
                        type="url"
                        required
                        placeholder="https://meet.google.com/..."
                        value={form.meetingLink}
                        onChange={(e) =>
                        setForm({ ...form, meetingLink: e.target.value })
                        }
                    />
                    </div>

                    <div className="meeting-form-field">
                    <label>Хурлын ID</label>
                    <input
                        value={form.meetingId}
                        onChange={(e) =>
                        setForm({ ...form, meetingId: e.target.value })
                        }
                        placeholder="123 456 789"
                    />
                    </div>

                    <div className="meeting-form-field">
                    <label>Нууц үг</label>
                    <input
                        value={form.meetingPassword}
                        onChange={(e) =>
                        setForm({ ...form, meetingPassword: e.target.value })
                        }
                        placeholder="Хурлын нууц үг"
                    />
                    </div>
                </>
                )}

              {/* AUDIENCE */}
              <div className="meeting-form-field">
                <label>Хүлээн авагч *</label>
                <select
                  value={form.audience}
                  onChange={(e) =>
                    setForm({ ...form, audience: e.target.value })
                  }
                >
                  <option>Бүх оршин суугч</option>
                  <option>1-р орц</option>
                  <option>2-р орц</option>
                  <option>3-р орц</option>
                </select>
              </div>

              {/* DESCRIPTION */}
              <div className="meeting-form-field">
                <label>Нэмэлт тайлбар</label>
                <textarea
                  rows="3"
                  maxLength={1000}
                  placeholder="Хурлын талаар нэмэлт мэдээлэл..."
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>

              {/* AGENDA */}
              <div className="meeting-agenda-section">

                <div className="meeting-agenda-heading">
                  <div>
                    <ListChecks size={17} />
                    <label>Хэлэлцэх асуудал</label>
                  </div>

                  <button
                    type="button"
                    onClick={addAgendaItem}
                  >
                    <Plus size={15} />
                    Нэмэх
                  </button>
                </div>

                {form.agenda.map((agenda, index) => (
                  <div className="meeting-agenda-item" key={index}>

                    <span>{index + 1}</span>

                    <input
                      placeholder="Хэлэлцэх асуудлыг бичнэ үү..."
                      value={agenda}
                      onChange={(e) =>
                        updateAgenda(index, e.target.value)
                      }
                    />

                    {form.agenda.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAgendaItem(index)}
                        title="Устгах"
                      >
                        <X size={15} />
                      </button>
                    )}

                  </div>
                ))}

              </div>

              {/* NOTIFICATION */}
              <label className="meeting-notification-option">

                <input
                  type="checkbox"
                  checked={form.notify}
                  onChange={(e) =>
                    setForm({ ...form, notify: e.target.checked })
                  }
                />

                <div className="meeting-notification-icon">
                  <Bell size={18} />
                </div>

                <div>
                  <strong>Push мэдэгдэл илгээх</strong>
                  <span>
                    Хурал нийтлэх үед сонгосон оршин суугчдад мэдэгдэл хүргэх
                  </span>
                </div>

              </label>

              {/* FORM ACTIONS */}
              <div className="meeting-modal-actions">

                <button
                  type="button"
                  className="meeting-cancel-btn"
                  onClick={closeModal}
                >
                  Болих
                </button>

                <button
                  type="submit"
                  value="draft"
                  className="meeting-draft-btn"
                >
                  <FileText size={16} />
                  Ноорог хадгалах
                </button>

                <button
                  type="submit"
                  value="publish"
                  className="meeting-publish-btn"
                >
                  <Send size={16} />
                  Нийтлэх
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      {/* MEETING DETAILS */}
      {viewMeeting && (
        <div
          className="meeting-modal-overlay"
          onClick={() => setViewMeeting(null)}
        >

          <div
            className="meeting-modal meeting-details-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="meeting-modal-heading">
              <div>
                <span>ХУРЛЫН ДЭЛГЭРЭНГҮЙ</span>
                <h2>{viewMeeting.title}</h2>
              </div>

              <button
                type="button"
                onClick={() => setViewMeeting(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="meeting-details-status">
              <span className={`meeting-status ${
                viewMeeting.status === 'Товлогдсон'
                  ? 'scheduled'
                  : viewMeeting.status === 'Дууссан'
                    ? 'completed'
                    : 'draft'
              }`}>
                {viewMeeting.status}
              </span>

              <span className="meeting-type">
                {viewMeeting.type}
              </span>
            </div>

            <div className="meeting-detail-grid">

              <div>
                <CalendarDays size={17} />
                <span>Огноо</span>
                <strong>{formatDate(viewMeeting.date)}</strong>
              </div>

              <div>
                <Clock size={17} />
                <span>Эхлэх цаг</span>
                <strong>{viewMeeting.time}</strong>
              </div>

              <div>
                <MapPin size={17} />
                <span>Байршил</span>
                <strong>{viewMeeting.location}</strong>
              </div>

              <div>
                {viewMeeting.format === 'Онлайн'
                  ? <Video size={17} />
                  : <Users size={17} />}
                <span>Хурлын хэлбэр</span>
                <strong>{viewMeeting.format}</strong>
              </div>

              <div>
                <Users size={17} />
                <span>Хүлээн авагч</span>
                <strong>{viewMeeting.audience}</strong>
              </div>

              <div>
                <Bell size={17} />
                <span>Мэдэгдэл</span>
                <strong>
                  {viewMeeting.notify ? 'Идэвхтэй' : 'Идэвхгүй'}
                </strong>
              </div>

            </div>

            {viewMeeting.description && (
              <div className="meeting-detail-description">
                <h3>Нэмэлт тайлбар</h3>
                <p>{viewMeeting.description}</p>
              </div>
            )}

            <div className="meeting-detail-agenda">
              <h3>
                <ClipboardList size={17} />
                Хэлэлцэх асуудал
              </h3>

              {viewMeeting.agenda?.length > 0 ? (
                <ol>
                  {viewMeeting.agenda.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ol>
              ) : (
                <p>Хэлэлцэх асуудал бүртгэгдээгүй байна.</p>
              )}
            </div>

            <button
              type="button"
              className="meeting-details-close"
              onClick={() => setViewMeeting(null)}
            >
              Хаах
            </button>

          </div>
        </div>
      )}

    </div>
  )
}

export default Meetings
