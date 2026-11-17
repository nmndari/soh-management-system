
import { useState } from 'react'
import {
  Plus,
  Search,
  Megaphone,
  Send,
  FileText,
  Eye,
  Pencil,
  Trash2,
  X,
  Bell,
  CalendarDays,
  Users,
} from 'lucide-react'
import './Announcements.css'

const initialAnnouncements = [
  {
    id: 1,
    title: 'Лифтний засвар үйлчилгээ хийгдэнэ',
    category: 'Засвар үйлчилгээ',
    content:
      '11-р сарын 20-ны өдөр 10:00-16:00 цагийн хооронд лифтний төлөвлөгөөт засвар үйлчилгээ хийгдэнэ. Иймд оршин суугчид та бүхэн урьдчилан төлөвлөнө үү.',
    date: '2026-11-17',
    status: 'Нийтэлсэн',
    notify: true,
    audience: 'Бүх оршин суугч',
  },
  {
    id: 2,
    title: 'Орцны цэвэрлэгээний хуваарь',
    category: 'Үйлчилгээ',
    content:
      'Орцны их цэвэрлэгээ энэ долоо хоногийн Бямба гарагт явагдана.',
    date: '2026-11-15',
    status: 'Нийтэлсэн',
    notify: false,
    audience: 'Бүх оршин суугч',
  },
  {
    id: 3,
    title: 'Оршин суугчдын хурлын тухай',
    category: 'Хурал',
    content:
      'Оршин суугчдын ээлжит хурал 11-р сарын 25-ны өдөр зохион байгуулагдана.',
    date: '2026-11-14',
    status: 'Ноорог',
    notify: false,
    audience: 'Бүх оршин суугч',
  },
  {
    id: 4,
    title: 'Усны шугамын засвар',
    category: 'Засвар үйлчилгээ',
    content:
      'Усны шугамын засвар үйлчилгээтэй холбоотой мэдээлэл.',
    date: '2026-11-12',
    status: 'Нийтэлсэн',
    notify: true,
    audience: '1-р орц',
  },
]

const categories = [
  'Ерөнхий мэдээлэл',
  'Засвар үйлчилгээ',
  'Үйлчилгээ',
  'Хурал',
  'Анхааруулга',
  'Бусад',
]

const emptyForm = {
  title: '',
  category: 'Ерөнхий мэдээлэл',
  content: '',
  date: new Date().toISOString().slice(0, 10),
  audience: 'Бүх оршин суугч',
  notify: false,
}

const formatDate = (date) => {
  if (!date) return '-'

  const [year, month, day] = date.split('-')
  return `${year}.${month}.${day}`
}

function Announcements() {
  const [announcements, setAnnouncements] = useState(
    initialAnnouncements
  )

  // Search and filters
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('Бүх ангилал')
  const [statusFilter, setStatusFilter] = useState('Бүх төлөв')

  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null)
  const [viewAnnouncement, setViewAnnouncement] = useState(null)

  // Form state
  const [form, setForm] = useState(emptyForm)

  // Statistics
  const publishedCount = announcements.filter(
    (item) => item.status === 'Нийтэлсэн'
  ).length

  const draftCount = announcements.filter(
    (item) => item.status === 'Ноорог'
  ).length

  const notifiedCount = announcements.filter(
    (item) => item.notify && item.status === 'Нийтэлсэн'
  ).length

  // Filter announcements
  const filteredAnnouncements = announcements.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.content.toLowerCase().includes(search.toLowerCase())

    const matchesCategory =
      categoryFilter === 'Бүх ангилал' ||
      item.category === categoryFilter

    const matchesStatus =
      statusFilter === 'Бүх төлөв' ||
      item.status === statusFilter

    return matchesSearch && matchesCategory && matchesStatus
  })

  // Open create modal
  const openCreateModal = () => {
    setSelectedAnnouncement(null)
    setForm({
      ...emptyForm,
      date: new Date().toISOString().slice(0, 10),
    })
    setShowModal(true)
  }

  // Open edit modal
  const openEditModal = (announcement) => {
    setSelectedAnnouncement(announcement)
    setForm({ ...announcement })
    setShowModal(true)
  }

  // Close form modal
  const closeModal = () => {
    setShowModal(false)
    setSelectedAnnouncement(null)
    setForm(emptyForm)
  }

  // Create or update announcement
  const handleSubmit = (e) => {
    e.preventDefault()

    const action = e.nativeEvent.submitter?.value
    const shouldPublish = action === 'publish'

    if (!form.title.trim() || !form.content.trim()) {
      return
    }

    const newItem = {
      ...form,
      title: form.title.trim(),
      content: form.content.trim(),
      status: shouldPublish ? 'Нийтэлсэн' : 'Ноорог',
      id: selectedAnnouncement
        ? selectedAnnouncement.id
        : Date.now(),
    }

    if (selectedAnnouncement) {
      setAnnouncements((prev) =>
        prev.map((item) =>
          item.id === selectedAnnouncement.id
            ? newItem
            : item
        )
      )
    } else {
      setAnnouncements((prev) => [newItem, ...prev])
    }

    closeModal()
  }

  // Delete announcement
  const handleDelete = (id) => {
    const confirmed = window.confirm(
      'Энэ зарлалыг устгахдаа итгэлтэй байна уу?'
    )

    if (!confirmed) return

    setAnnouncements((prev) =>
      prev.filter((item) => item.id !== id)
    )

    if (viewAnnouncement?.id === id) {
      setViewAnnouncement(null)
    }
  }

  // Publish draft
  const handlePublish = (id) => {
    setAnnouncements((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: 'Нийтэлсэн' }
          : item
      )
    )
  }

  // Move published announcement to draft
  const handleUnpublish = (id) => {
    setAnnouncements((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: 'Ноорог', notify: false }
          : item
      )
    )
  }

  return (
    <div className="announcements-page">

      {/* PAGE HEADER */}
      <div className="announcements-heading">
        <div>
          <span className="announcements-eyebrow">
            МЭДЭЭЛЭЛ, ХАРИЛЦАА ХОЛБОО
          </span>

          <h1>Зарлал мэдээлэл</h1>

          <p>
            Оршин суугчдад зарлал, мэдээлэл хүргэх.
          </p>
        </div>

        <button
          className="add-announcement-btn"
          onClick={openCreateModal}
        >
          <Plus size={18} />
          Шинэ зарлал
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="announcement-stats">

        <div className="announcement-stat-card">
          <div className="announcement-stat-icon blue">
            <Megaphone size={21} />
          </div>

          <div>
            <p>Нийт зарлал</p>
            <h2>{announcements.length}</h2>
          </div>
        </div>

        <div className="announcement-stat-card">
          <div className="announcement-stat-icon green">
            <Send size={21} />
          </div>

          <div>
            <p>Нийтэлсэн</p>
            <h2>{publishedCount}</h2>
          </div>
        </div>

        <div className="announcement-stat-card">
          <div className="announcement-stat-icon orange">
            <FileText size={21} />
          </div>

          <div>
            <p>Ноорог</p>
            <h2>{draftCount}</h2>
          </div>
        </div>

        <div className="announcement-stat-card">
          <div className="announcement-stat-icon purple">
            <Bell size={21} />
          </div>

          <div>
            <p>Мэдэгдэлтэй зарлал</p>
            <h2>{notifiedCount}</h2>
          </div>
        </div>

      </div>

      {/* ANNOUNCEMENT LIST */}
      <section className="announcement-table-card">

        <div className="announcement-table-heading">
          <div>
            <h3>Зарлалын жагсаалт</h3>
            <p>Үүсгэсэн зарлал, мэдээллүүд</p>
          </div>

          <span className="announcement-count">
            {filteredAnnouncements.length} зарлал
          </span>
        </div>

        {/* SEARCH AND FILTER */}
        <div className="announcement-filters">

          <div className="announcement-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Зарлалын гарчгаар хайх..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="Бүх ангилал">Бүх ангилал</option>

            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="Бүх төлөв">Бүх төлөв</option>
            <option value="Нийтэлсэн">Нийтэлсэн</option>
            <option value="Ноорог">Ноорог</option>
          </select>

        </div>

        {/* ANNOUNCEMENT TABLE */}
        <div className="announcement-table-wrapper">

          <table className="announcement-table">

            <thead>
              <tr>
                <th>ЗАРЛАЛЫН МЭДЭЭЛЭЛ</th>
                <th>АНГИЛАЛ</th>
                <th>ХҮЛЭЭН АВАГЧ</th>
                <th>ОГНОО</th>
                <th>ТӨЛӨВ</th>
                <th>ҮЙЛДЭЛ</th>
              </tr>
            </thead>

            <tbody>

              {filteredAnnouncements.length > 0 ? (
                filteredAnnouncements.map((item) => (
                  <tr key={item.id}>

                    <td>
                      <div className="announcement-name">

                        <div className="announcement-row-icon">
                          <Megaphone size={17} />
                        </div>

                        <div>
                          <strong>{item.title}</strong>

                          <span>
                            {item.content.slice(0, 55)}
                            {item.content.length > 55 ? '...' : ''}
                          </span>
                        </div>

                      </div>
                    </td>

                    <td>
                      <span className="announcement-category">
                        {item.category}
                      </span>
                    </td>

                    <td className="announcement-audience">
                      <Users size={14} />
                      {item.audience}
                    </td>

                    <td className="announcement-date">
                      {formatDate(item.date)}
                    </td>

                    <td>
                      <div className="announcement-status-cell">

                        <span
                          className={`announcement-status ${
                            item.status === 'Нийтэлсэн'
                              ? 'published'
                              : 'draft'
                          }`}
                        >
                          {item.status}
                        </span>

                        {item.notify &&
                          item.status === 'Нийтэлсэн' && (
                            <span className="notification-indicator">
                              <Bell size={12} />
                              Push
                            </span>
                          )}

                      </div>
                    </td>

                    <td>
                      <div className="announcement-actions">

                        {/* VIEW */}
                        <button
                          type="button"
                          title="Харах"
                          onClick={() => setViewAnnouncement(item)}
                        >
                          <Eye size={16} />
                        </button>

                        {/* EDIT */}
                        <button
                          type="button"
                          title="Засах"
                          onClick={() => openEditModal(item)}
                        >
                          <Pencil size={16} />
                        </button>

                        {/* PUBLISH / UNPUBLISH */}
                        {item.status === 'Ноорог' ? (
                          <button
                            type="button"
                            title="Нийтлэх"
                            className="publish-action"
                            onClick={() => handlePublish(item.id)}
                          >
                            <Send size={15} />
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

                        {/* DELETE */}
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
                  <td colSpan="6" className="announcement-empty">

                    <Megaphone size={30} />

                    <strong>Зарлал олдсонгүй</strong>

                    <span>
                      Хайлтын нөхцөлөө өөрчлөөд үзнэ үү.
                    </span>

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
          className="announcement-modal-overlay"
          onClick={closeModal}
        >

          <div
            className="announcement-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="announcement-modal-heading">

              <div>
                <span>ЗАРЛАЛЫН УДИРДЛАГА</span>

                <h2>
                  {selectedAnnouncement
                    ? 'Зарлал засах'
                    : 'Шинэ зарлал үүсгэх'}
                </h2>

                <p>
                  Оршин суугчдад хүргэх мэдээллээ оруулна уу.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
              >
                <X size={20} />
              </button>

            </div>

            <form onSubmit={handleSubmit}>

              {/* TITLE */}
              <div className="announcement-form-field">
                <label>Зарлалын гарчиг *</label>

                <input
                  type="text"
                  required
                  maxLength={120}
                  placeholder="Зарлалын гарчгийг оруулна уу"
                  value={form.title}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      title: e.target.value,
                    })
                  }
                />
              </div>

              {/* CATEGORY AND DATE */}
              <div className="announcement-form-row">

                <div className="announcement-form-field">
                  <label>Ангилал *</label>

                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        category: e.target.value,
                      })
                    }
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="announcement-form-field">
                  <label>Нийтлэх огноо *</label>

                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        date: e.target.value,
                      })
                    }
                  />
                </div>

              </div>

              {/* AUDIENCE */}
              <div className="announcement-form-field">
                <label>Хүлээн авагч *</label>

                <select
                  value={form.audience}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      audience: e.target.value,
                    })
                  }
                >
                  <option value="Бүх оршин суугч">
                    Бүх оршин суугч
                  </option>

                  <option value="1-р орц">1-р орц</option>
                  <option value="2-р орц">2-р орц</option>
                  <option value="3-р орц">3-р орц</option>
                </select>
              </div>

              {/* CONTENT */}
              <div className="announcement-form-field">
                <label>Зарлалын агуулга *</label>

                <textarea
                  required
                  rows="6"
                  maxLength={3000}
                  placeholder="Зарлалын дэлгэрэнгүй мэдээллийг энд бичнэ үү..."
                  value={form.content}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      content: e.target.value,
                    })
                  }
                />

                <span className="announcement-char-count">
                  {form.content.length}/3000 тэмдэгт
                </span>
              </div>

              {/* PUSH NOTIFICATION */}
              <label className="announcement-notification-option">

                <input
                  type="checkbox"
                  checked={form.notify}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      notify: e.target.checked,
                    })
                  }
                />

                <div className="notification-option-icon">
                  <Bell size={18} />
                </div>

                <div>
                  <strong>Push мэдэгдэл илгээх</strong>

                  <span>
                    Нийтлэх үед сонгосон оршин суугчдад мэдэгдэл хүргэх
                  </span>
                </div>

              </label>

              {/* FORM ACTIONS */}
              <div className="announcement-modal-actions">

                <button
                  type="button"
                  className="announcement-cancel-btn"
                  onClick={closeModal}
                >
                  Болих
                </button>

                <button
                  type="submit"
                  value="draft"
                  className="announcement-draft-btn"
                >
                  <FileText size={16} />
                  Ноорог хадгалах
                </button>

                <button
                  type="submit"
                  value="publish"
                  className="announcement-publish-btn"
                >
                  <Send size={16} />
                  Нийтлэх
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      {/* VIEW ANNOUNCEMENT MODAL */}
      {viewAnnouncement && (
        <div
          className="announcement-modal-overlay"
          onClick={() => setViewAnnouncement(null)}
        >

          <div
            className="announcement-modal announcement-preview"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="announcement-modal-heading">

              <div>
                <span>ЗАРЛАЛЫН ДЭЛГЭРЭНГҮЙ</span>
                <h2>{viewAnnouncement.title}</h2>
              </div>

              <button
                type="button"
                onClick={() => setViewAnnouncement(null)}
              >
                <X size={20} />
              </button>

            </div>

            <div className="announcement-preview-meta">

              <span>{viewAnnouncement.category}</span>

              <span>
                <CalendarDays size={14} />
                {formatDate(viewAnnouncement.date)}
              </span>

            </div>

            <div className="announcement-preview-content">
              {viewAnnouncement.content}
            </div>

            <div className="announcement-preview-footer">

              <span>
                <Users size={15} />
                {viewAnnouncement.audience}
              </span>

              <span
                className={`announcement-status ${
                  viewAnnouncement.status === 'Нийтэлсэн'
                    ? 'published'
                    : 'draft'
                }`}
              >
                {viewAnnouncement.status}
              </span>

            </div>

            <button
              type="button"
              className="announcement-preview-close"
              onClick={() => setViewAnnouncement(null)}
            >
              Хаах
            </button>

          </div>
        </div>
      )}

    </div>
  )
}

export default Announcements
