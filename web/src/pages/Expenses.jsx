
import { useState } from 'react'
import {
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

const initialExpenses = [
  {
    id: 1,
    title: 'Лифтний засвар үйлчилгээ',
    category: 'Засвар үйлчилгээ',
    description: 'Лифтний техникийн үзлэг, засвар',
    amount: 850000,
    date: '2026-11-15',
  },
  {
    id: 2,
    title: 'Орцны цэвэрлэгээ',
    category: 'Цэвэрлэгээ',
    description: '11-р сарын цэвэрлэгээний үйлчилгээ',
    amount: 450000,
    date: '2026-11-12',
  },
  {
    id: 3,
    title: 'Нийтийн эзэмшлийн цахилгаан',
    category: 'Ашиглалтын зардал',
    description: 'Орц болон гадна талбайн цахилгаан',
    amount: 320000,
    date: '2026-11-10',
  },
  {
    id: 4,
    title: 'Харуул хамгаалалтын үйлчилгээ',
    category: 'Үйлчилгээ',
    description: 'Харуул хамгаалалтын үйлчилгээний зардал',
    amount: 1200000,
    date: '2026-11-08',
  },
  {
    id: 5,
    title: 'Гэрэлтүүлгийн чийдэн солих',
    category: 'Засвар үйлчилгээ',
    description: 'Орцны гэрэлтүүлэг шинэчилсэн',
    amount: 180000,
    date: '2026-11-05',
  },
]

const categories = [
  'Бүх ангилал',
  'Засвар үйлчилгээ',
  'Цэвэрлэгээ',
  'Ашиглалтын зардал',
  'Үйлчилгээ',
  'Бусад',
]

const formatMoney = (amount) =>
  new Intl.NumberFormat('mn-MN').format(amount) + ' ₮'

const formatDate = (date) => {
  const [year, month, day] = date.split('-')
  return `${year}.${month}.${day}`
}

function Expenses() {
  const [expenses, setExpenses] = useState(initialExpenses)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Бүх ангилал')
  const [showModal, setShowModal] = useState(false)

  const [form, setForm] = useState({
    title: '',
    category: 'Засвар үйлчилгээ',
    description: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
  })

  const totalExpenses = expenses.reduce(
    (total, item) => total + item.amount,
    0
  )

  const currentMonth = new Date().toISOString().slice(0, 7)

  const monthlyExpenses = expenses
    .filter((item) => item.date.startsWith(currentMonth))
    .reduce((total, item) => total + item.amount, 0)

  const filteredExpenses = expenses.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase())

    const matchesCategory =
      selectedCategory === 'Бүх ангилал' ||
      item.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const handleAddExpense = (e) => {
    e.preventDefault()

    if (!form.title.trim() || !form.amount || Number(form.amount) <= 0) {
      return
    }

    const newExpense = {
      ...form,
      id: Date.now(),
      amount: Number(form.amount),
    }

    setExpenses((prev) => [newExpense, ...prev])
    setShowModal(false)

    setForm({
      title: '',
      category: 'Засвар үйлчилгээ',
      description: '',
      amount: '',
      date: new Date().toISOString().slice(0, 10),
    })
  }

  const handleDelete = (id) => {
    if (window.confirm('Энэ зардлын бүртгэлийг устгах уу?')) {
      setExpenses((prev) => prev.filter((item) => item.id !== id))
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
          onClick={() => setShowModal(true)}
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
          <h2>{expenses.length}</h2>
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
            {filteredExpenses.length} бүртгэл
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

                    <td>
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
                <span>ШИНЭ БҮРТГЭЛ</span>
                <h2>Зардал бүртгэх</h2>
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

                <button type="submit" className="save-expense-btn">
                  <Plus size={17} />
                  Бүртгэх
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
