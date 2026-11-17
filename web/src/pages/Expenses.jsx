
import { useCallback, useEffect, useState } from 'react'
import {
  Pencil,
  Plus,
  Search,
  Receipt,
  Wallet,
  CalendarDays,
  Trash2,
  X,
  ChevronDown,
  ArrowDownRight,
} from 'lucide-react'
import './Expenses.css'
import { errorText } from '../services/api'
import { getCategories } from '../services/categories'
import {
  createExpense,
  deleteExpense,
  getExpenseStats,
  listExpenses,
  updateExpense,
} from '../services/finance'
import { todayString, useDebounced } from '../utils/date'

const emptyForm = () => ({
  title: '',
  category: 'Засвар үйлчилгээ',
  description: '',
  amount: '',
  date: todayString(),
})

const formatMoney = (amount) =>
  new Intl.NumberFormat('mn-MN').format(amount) + ' ₮'

const formatDate = (date) => {
  const [year, month, day] = date.split('-')
  return `${year}.${month}.${day}`
}

function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [stats, setStats] = useState({ total: 0, thisMonth: 0, count: 0 })
  const [categories, setCategories] = useState(['Бүх ангилал'])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Бүх ангилал')
  const [showModal, setShowModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)

  const [form, setForm] = useState(emptyForm)

  const debouncedSearch = useDebounced(search)

  // Ангиллыг серверээс авна
  useEffect(() => {
    getCategories('expense')
      .then((list) => setCategories(['Бүх ангилал', ...list.map((c) => c.name)]))
      .catch((err) => alert(errorText(err)))
  }, [])

  const loadExpenses = useCallback(async () => {
    setLoading(true)
    try {
      const [list, summary] = await Promise.all([
        listExpenses({ search: debouncedSearch, category: selectedCategory }),
        getExpenseStats(),
      ])
      setExpenses(list.items)
      setStats(summary)
    } catch (err) {
      alert(errorText(err))
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, selectedCategory])

  useEffect(() => {
    loadExpenses()
  }, [loadExpenses])

  const totalExpenses = stats.total
  const monthlyExpenses = stats.thisMonth
  const filteredExpenses = expenses

  const openCreateModal = () => {
    setEditingExpense(null)
    setForm({ ...emptyForm(), category: categories[1] || '' })
    setShowModal(true)
  }

  const openEditModal = (expense) => {
    setEditingExpense(expense)
    setForm({
      title: expense.title,
      category: expense.category,
      description: expense.description || '',
      amount: String(expense.amount),
      date: expense.date,
    })
    setShowModal(true)
  }

  const handleAddExpense = async (e) => {
    e.preventDefault()

    if (!form.title.trim() || !form.amount || Number(form.amount) <= 0) {
      return
    }

    setSaving(true)
    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, form)
      } else {
        await createExpense(form)
      }
      setShowModal(false)
      setEditingExpense(null)
      setForm(emptyForm())
      await loadExpenses()
    } catch (err) {
      alert(errorText(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Энэ зардлын бүртгэлийг устгах уу?')) return

    try {
      await deleteExpense(id)
      await loadExpenses()
    } catch (err) {
      alert(errorText(err))
    }
  }

  return (
    <div className="expenses-page">
      {/* PAGE HEADING */}
      <div className="expenses-heading">
        <div>
          <span className="expenses-eyebrow">САНХҮҮГИЙН УДИРДЛАГА</span>
          <h1>Зардлын бүртгэл</h1>
          <p>СӨХ-ийн үйл ажиллагааны зардлыг бүртгэж, удирдах.</p>
        </div>

        <button
          className="add-expense-btn"
          onClick={openCreateModal}
        >
          <Plus size={18} />
          Зардал бүртгэх
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="expense-stats">
        <div className="expense-stat-card">
          <div className="expense-stat-top">
            <span>Нийт зардал</span>
            <div className="expense-stat-icon blue">
              <Wallet size={20} />
            </div>
          </div>
          <h2>{formatMoney(totalExpenses)}</h2>
          <p>Бүх бүртгэгдсэн зардал</p>
        </div>

        <div className="expense-stat-card">
          <div className="expense-stat-top">
            <span>Энэ сарын зардал</span>
            <div className="expense-stat-icon orange">
              <CalendarDays size={20} />
            </div>
          </div>
          <h2>{formatMoney(monthlyExpenses)}</h2>
          <p>Тухайн сарын бүртгэл</p>
        </div>

        <div className="expense-stat-card">
          <div className="expense-stat-top">
            <span>Нийт бүртгэл</span>
            <div className="expense-stat-icon purple">
              <Receipt size={20} />
            </div>
          </div>
          <h2>{stats.count}</h2>
          <p>Бүртгэгдсэн зардлын тоо</p>
        </div>
      </div>

      {/* EXPENSE TABLE */}
      <section className="expense-table-card">
        <div className="expense-table-heading">
          <div>
            <h3>Зардлын жагсаалт</h3>
            <p>Бүртгэгдсэн зардлуудын дэлгэрэнгүй мэдээлэл</p>
          </div>
          <span className="expense-count">
            {loading ? 'Ачаалж байна...' : `${filteredExpenses.length} бүртгэл`}
          </span>
        </div>

        {/* SEARCH AND FILTER */}
        <div className="expense-filters">
          <div className="expense-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Зардлын нэрээр хайх..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="expense-category-filter">
            <ChevronDown size={16} />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* TABLE */}
        <div className="expense-table-wrapper">
          <table className="expense-table">
            <thead>
              <tr>
                <th>ЗАРДЛЫН НЭР</th>
                <th>АНГИЛАЛ</th>
                <th>ТАЙЛБАР</th>
                <th>ОГНОО</th>
                <th>ДҮН</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="expense-name">
                        <div className="expense-row-icon">
                          <Receipt size={17} />
                        </div>
                        <strong>{item.title}</strong>
                      </div>
                    </td>

                    <td>
                      <span className="expense-category">
                        {item.category}
                      </span>
                    </td>

                    <td className="expense-description">
                      {item.description || '-'}
                    </td>

                    <td className="expense-date">
                      {formatDate(item.date)}
                    </td>

                    <td className="expense-amount">
                      {formatMoney(item.amount)}
                    </td>

                    <td className="expense-row-actions">
                      <button
                        className="delete-expense-btn edit-expense-btn"
                        onClick={() => openEditModal(item)}
                        title="Засах"
                        aria-label="Зардал засах"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="delete-expense-btn"
                        onClick={() => handleDelete(item.id)}
                        title="Устгах"
                        aria-label="Зардал устгах"
                      >
                        <Trash2 size={17} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="expense-empty">
                    <Receipt size={30} />
                    <strong>Зардал олдсонгүй</strong>
                    <span>Хайлтын нөхцөлөө өөрчлөөд үзнэ үү.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ADD EXPENSE MODAL */}
      {showModal && (
        <div
          className="expense-modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div
            className="expense-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="expense-modal-heading">
              <div>
                <span>{editingExpense ? 'ЗАСВАР' : 'ШИНЭ БҮРТГЭЛ'}</span>
                <h2>{editingExpense ? 'Зардал засах' : 'Зардал бүртгэх'}</h2>
                <p>Зардлын мэдээллийг бүрэн оруулна уу.</p>
              </div>

              <button
                className="modal-close-btn"
                onClick={() => setShowModal(false)}
                aria-label="Хаах"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleAddExpense}>
              <div className="expense-form-field">
                <label>Зардлын нэр *</label>
                <input
                  type="text"
                  placeholder="Жишээ: Лифтний засвар"
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                  required
                />
              </div>

              <div className="expense-form-row">
                <div className="expense-form-field">
                  <label>Ангилал *</label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                  >
                    {categories.slice(1).map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="expense-form-field">
                  <label>Зардлын огноо *</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm({ ...form, date: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="expense-form-field">
                <label>Зардлын дүн (₮) *</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Жишээ: 500000"
                  value={form.amount}
                  onChange={(e) =>
                    setForm({ ...form, amount: e.target.value })
                  }
                  required
                />
              </div>

              <div className="expense-form-field">
                <label>Тайлбар</label>
                <textarea
                  placeholder="Зардлын дэлгэрэнгүй тайлбар..."
                  rows="3"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>

              <div className="expense-modal-actions">
                <button
                  type="button"
                  className="cancel-expense-btn"
                  onClick={() => setShowModal(false)}
                >
                  Болих
                </button>

                <button type="submit" className="save-expense-btn" disabled={saving}>
                  <Plus size={17} />
                  {saving ? 'Хадгалж байна...' : editingExpense ? 'Хадгалах' : 'Бүртгэх'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Expenses
