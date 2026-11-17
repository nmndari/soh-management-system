
import { useCallback, useEffect, useState } from 'react'
import {
  Wallet,
  Plus,
  Search,
  Users,
  UserCheck,
  UserX,
  Pencil,
  Trash2,
  X,
  Eye,
  Building2,
  Phone,
  Mail,
} from 'lucide-react'
import './Residents.css'
import { errorText } from '../services/api'
import {
  createResident,
  deleteResident,
  getResidentStats,
  listResidents,
  recordPayment,
  updateResident,
} from '../services/residents'
import { useDebounced } from '../utils/date'

// Төлбөрийн төлвийг сар бүрийн нэхэмжлэлээс сервер тооцдог тул маягтад байхгүй
const emptyForm = {
  lastName: '',
  firstName: '',
  phone: '',
  email: '',
  entrance: '1',
  floor: '',
  apartment: '',
}

function Residents() {
  const [residents, setResidents] = useState([])
  const [stats, setStats] = useState({ total: 0, paid: 0, unpaid: 0 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [entranceFilter, setEntranceFilter] = useState('Бүх орц')
  const [statusFilter, setStatusFilter] = useState('Бүх төлөв')
  const [showModal, setShowModal] = useState(false)
  const [selectedResident, setSelectedResident] = useState(null)
  const [viewResident, setViewResident] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const debouncedSearch = useDebounced(search)

  // Шүүлтүүрийг сервер гүйцэтгэнэ
  const loadResidents = useCallback(async () => {
    setLoading(true)
    try {
      const [list, summary] = await Promise.all([
        listResidents({
          search: debouncedSearch,
          entrance: entranceFilter,
          status: statusFilter,
        }),
        getResidentStats(),
      ])
      setResidents(list.items)
      setStats(summary)
    } catch (err) {
      alert(errorText(err))
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, entranceFilter, statusFilter])

  useEffect(() => {
    loadResidents()
  }, [loadResidents])

  const activeCount = stats.paid
  const inactiveCount = stats.unpaid

  const filteredResidents = residents

  const openAddModal = () => {
    setSelectedResident(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEditModal = (resident) => {
    setSelectedResident(resident)
    setForm({
      lastName: resident.lastName,
      firstName: resident.firstName,
      phone: resident.phone,
      email: resident.email,
      entrance: resident.entrance,
      floor: resident.floor,
      apartment: resident.apartment,
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (selectedResident) {
        await updateResident(selectedResident.id, form)
      } else {
        await createResident(form)
      }

      setShowModal(false)
      setSelectedResident(null)
      setForm(emptyForm)
      await loadResidents()
    } catch (err) {
      alert(errorText(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Энэ оршин суугчийн бүртгэлийг устгах уу?')) return

    try {
      await deleteResident(id)
      await loadResidents()
    } catch (err) {
      alert(errorText(err))
    }
  }

  // Энэ сарын үлдэгдлийг бүтэн төлсөн гэж бүртгэнэ (орлогод автоматаар орно)
  const handlePayment = async (resident) => {
    const amount = new Intl.NumberFormat('mn-MN').format(resident.remaining)
    if (!window.confirm(`${resident.lastName} ${resident.firstName}-ийн ${amount} ₮ төлбөрийг бүртгэх үү?`)) {
      return
    }

    try {
      await recordPayment(resident)
      await loadResidents()
    } catch (err) {
      alert(errorText(err))
    }
  }

  return (
    <div className="residents-page">
      {/* PAGE HEADER */}
      <div className="residents-heading">
        <div>
          <span className="residents-eyebrow">ОРШИН СУУГЧДЫН УДИРДЛАГА</span>
          <h1>Оршин суугчид</h1>
          <p>Байрны оршин суугчдын мэдээллийг бүртгэж, удирдах.</p>
        </div>

        <button className="add-resident-btn" onClick={openAddModal}>
          <Plus size={18} />
          Оршин суугч бүртгэх
        </button>
      </div>

      {/* STATISTICS */}
      <div className="resident-stats">
        <div className="resident-stat-card">
          <div className="resident-stat-icon blue">
            <Users size={21} />
          </div>
          <div>
            <p>Нийт оршин суугч</p>
            <h2>{stats.total}</h2>
          </div>
        </div>

        <div className="resident-stat-card">
          <div className="resident-stat-icon green">
            <UserCheck size={21} />
          </div>
          <div>
            <p>Төлсөн</p>
            <h2>{activeCount}</h2>
          </div>
        </div>

        <div className="resident-stat-card">
          <div className="resident-stat-icon orange">
            <UserX size={21} />
          </div>
          <div>
            <p>Төлөөгүй</p>
            <h2>{inactiveCount}</h2>
          </div>
        </div>
      </div>

      {/* RESIDENT TABLE */}
      <section className="resident-table-card">
        <div className="resident-table-heading">
          <div>
            <h3>Оршин суугчдын жагсаалт</h3>
            <p>Бүртгэлтэй оршин суугчдын мэдээлэл</p>
          </div>

          <span className="resident-count">
            {loading ? 'Ачаалж байна...' : `${filteredResidents.length} бүртгэл`}
          </span>
        </div>

        {/* SEARCH AND FILTER */}
        <div className="resident-filters">
          <div className="resident-search">
            <Search size={18} />
            <input
              placeholder="Нэр, утас, тоотоор хайх..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            value={entranceFilter}
            onChange={(e) => setEntranceFilter(e.target.value)}
          >
            <option>Бүх орц</option>
            <option value="1">1-р орц</option>
            <option value="2">2-р орц</option>
            <option value="3">3-р орц</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>Бүх төлөв</option>
            <option>Төлсөн</option>
            <option>Төлөөгүй</option>
          </select>
        </div>

        {/* TABLE */}
        <div className="resident-table-wrapper">
          <table className="resident-table">
            <thead>
              <tr>
                <th>ОРШИН СУУГЧ</th>
                <th>ХОЛБОО БАРИХ</th>
                <th>БАЙРШИЛ</th>
                <th>ТӨЛБӨР ТӨЛСӨН ЭСЭХ</th>
                <th>ҮЙЛДЭЛ</th>
              </tr>
            </thead>

            <tbody>
              {filteredResidents.length > 0 ? (
                filteredResidents.map((resident) => (
                  <tr key={resident.id}>
                    <td>
                      <div className="resident-name">
                        <div className="resident-avatar">
                          {resident.firstName.charAt(0)}
                        </div>
                        <div>
                          <strong>
                            {resident.lastName} {resident.firstName}
                          </strong>
                          <span>Оршин суугч</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="resident-contact">
                        <span><Phone size={13} /> {resident.phone}</span>
                        <span><Mail size={13} /> {resident.email || '-'}</span>
                      </div>
                    </td>

                    <td>
                      <div className="resident-location">
                        <Building2 size={16} />
                        <span>
                          {resident.entrance}-р орц · {resident.floor}-р давхар · {resident.apartment}-р тоот
                        </span>
                      </div>
                    </td>

                    <td>
                      <span className={`resident-status ${
                        resident.status === 'Төлсөн' ? 'active' : 'inactive'
                      }`}>
                        {resident.status}
                      </span>
                    </td>

                    <td>
                      <div className="resident-actions">
                        {resident.remaining > 0 && (
                          <button
                            title="Энэ сарын төлбөр бүртгэх"
                            onClick={() => handlePayment(resident)}
                          >
                            <Wallet size={16} />
                          </button>
                        )}

                        <button
                          title="Дэлгэрэнгүй"
                          onClick={() => setViewResident(resident)}
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          title="Засах"
                          onClick={() => openEditModal(resident)}
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          title="Устгах"
                          className="resident-delete"
                          onClick={() => handleDelete(resident.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="resident-empty">
                    <Users size={30} />
                    <strong>Оршин суугч олдсонгүй</strong>
                    <span>Хайлтын нөхцөлөө өөрчлөөд үзнэ үү.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div className="resident-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="resident-modal" onClick={(e) => e.stopPropagation()}>
            <div className="resident-modal-heading">
              <div>
                <span>ОРШИН СУУГЧИЙН МЭДЭЭЛЭЛ</span>
                <h2>
                  {selectedResident ? 'Мэдээлэл засах' : 'Шинээр бүртгэх'}
                </h2>
                <p>Оршин суугчийн мэдээллийг оруулна уу.</p>
              </div>

              <button type="button" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="resident-form-row">
                <div className="resident-form-field">
                  <label>Овог *</label>
                  <input
                    required
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    placeholder="Овог"
                  />
                </div>

                <div className="resident-form-field">
                  <label>Нэр *</label>
                  <input
                    required
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    placeholder="Нэр"
                  />
                </div>
              </div>

              <div className="resident-form-row">
                <div className="resident-form-field">
                  <label>Утасны дугаар *</label>
                  <input
                    required
                    type="tel"
                    pattern="[0-9]{8}"
                    title="8 оронтой утасны дугаар оруулна уу"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="99112233"
                  />
                </div>

                <div className="resident-form-field">
                  <label>И-мэйл хаяг</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="example@gmail.com"
                  />
                </div>
              </div>

              <div className="resident-form-row resident-location-fields">
                <div className="resident-form-field">
                  <label>Орц *</label>
                  <select
                    value={form.entrance}
                    onChange={(e) => setForm({ ...form, entrance: e.target.value })}
                  >
                    <option value="1">1-р орц</option>
                    <option value="2">2-р орц</option>
                    <option value="3">3-р орц</option>
                  </select>
                </div>

                <div className="resident-form-field">
                  <label>Давхар *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={form.floor}
                    onChange={(e) => setForm({ ...form, floor: e.target.value })}
                    placeholder="3"
                  />
                </div>

                <div className="resident-form-field">
                  <label>Тоот *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={form.apartment}
                    onChange={(e) => setForm({ ...form, apartment: e.target.value })}
                    placeholder="12"
                  />
                </div>
              </div>

              <div className="resident-modal-actions">
                <button
                  type="button"
                  className="resident-cancel-btn"
                  onClick={() => setShowModal(false)}
                >
                  Болих
                </button>

                <button type="submit" className="resident-save-btn" disabled={saving}>
                  <Plus size={16} />
                  {saving ? 'Хадгалж байна...' : selectedResident ? 'Хадгалах' : 'Бүртгэх'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESIDENT DETAILS */}
      {viewResident && (
        <div className="resident-modal-overlay" onClick={() => setViewResident(null)}>
          <div className="resident-modal details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="resident-modal-heading">
              <div>
                <span>ОРШИН СУУГЧИЙН МЭДЭЭЛЭЛ</span>
                <h2>Дэлгэрэнгүй мэдээлэл</h2>
              </div>
              <button type="button" onClick={() => setViewResident(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="resident-detail-profile">
              <div className="resident-avatar large">
                {viewResident.firstName.charAt(0)}
              </div>
              <h3>{viewResident.lastName} {viewResident.firstName}</h3>
              <span className={`resident-status ${
                viewResident.status === 'Төлсөн' ? 'active' : 'inactive'
              }`}>
                {viewResident.status}
              </span>
            </div>

            <div className="resident-detail-list">
              <div><span>Утасны дугаар</span><strong>{viewResident.phone}</strong></div>
              <div><span>И-мэйл</span><strong>{viewResident.email || '-'}</strong></div>
              <div><span>Орц</span><strong>{viewResident.entrance}-р орц</strong></div>
              <div><span>Давхар</span><strong>{viewResident.floor}-р давхар</strong></div>
              <div><span>Тоот</span><strong>{viewResident.apartment}-р тоот</strong></div>
            </div>

            <button className="resident-save-btn details-close" onClick={() => setViewResident(null)}>
              Хаах
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Residents
