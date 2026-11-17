
import { useEffect, useState } from 'react'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Receipt,
  CalendarDays,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import './Reports.css'
import { errorText } from '../services/api'
import { getReport } from '../services/finance'
import { currentPeriod, periodLabel, recentPeriods } from '../utils/date'

// Сонгох боломжтой үе: сүүлийн 12 сар + бүх хугацаа
const periodOptions = recentPeriods(12)

const emptyReport = {
  summary: { totalIncome: 0, totalExpense: 0, balance: 0, transactionCount: 0 },
  monthly: [],
  expenseCategories: [],
  transactions: [],
}

const categoryColors = ['#6386b5', '#d99a61', '#8d76b5', '#6b9d91', '#a3adbd']

const formatMoney = (amount) =>
  new Intl.NumberFormat('mn-MN').format(amount) + ' ₮'

const formatDate = (date) => {
  const [year, month, day] = date.split('-')
  return `${year}.${month}.${day}`
}

function Reports() {
  const [period, setPeriod] = useState(currentPeriod())
  const [report, setReport] = useState(emptyReport)

  // Тооцооллыг сервер хийнэ
  useEffect(() => {
    let cancelled = false
    getReport(period)
      .then((data) => {
        if (!cancelled) setReport(data)
      })
      .catch((err) => alert(errorText(err)))
    return () => {
      cancelled = true
    }
  }, [period])

  const { totalIncome, totalExpense, balance } = report.summary
  const monthlyData = report.monthly
  const expenseCategories = report.expenseCategories
  const filteredTransactions = report.transactions

  return (
    <div className="reports-page">
      {/* PAGE HEADING */}
      <div className="reports-heading">
        <div>
          <span className="reports-eyebrow">САНХҮҮГИЙН УДИРДЛАГА</span>
          <h1>Санхүүгийн тайлан</h1>
          <p>СӨХ-ийн орлого, зарлага болон санхүүгийн мэдээллийн нэгтгэл.</p>
        </div>

        <div className="report-period-filter">
          <CalendarDays size={17} />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            {periodOptions.map((item) => (
              <option key={item} value={item}>
                {periodLabel(item)}
              </option>
            ))}
            <option value="all">Бүх хугацаа</option>
          </select>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="report-stats">
        <div className="report-stat-card">
          <div className="report-stat-top">
            <span>Нийт орлого</span>
            <div className="report-stat-icon green">
              <TrendingUp size={20} />
            </div>
          </div>
          <h2>{formatMoney(totalIncome)}</h2>
          <p>Бүртгэгдсэн нийт орлого</p>
        </div>

        <div className="report-stat-card">
          <div className="report-stat-top">
            <span>Нийт зарлага</span>
            <div className="report-stat-icon orange">
              <TrendingDown size={20} />
            </div>
          </div>
          <h2>{formatMoney(totalExpense)}</h2>
          <p>Бүртгэгдсэн нийт зарлага</p>
        </div>

        <div className="report-stat-card">
          <div className="report-stat-top">
            <span>Үлдэгдэл</span>
            <div className="report-stat-icon blue">
              <Wallet size={20} />
            </div>
          </div>
          <h2 className={balance < 0 ? 'negative-balance' : ''}>
            {formatMoney(balance)}
          </h2>
          <p>Орлогоос зарлагыг хассан дүн</p>
        </div>

        <div className="report-stat-card">
          <div className="report-stat-top">
            <span>Гүйлгээний тоо</span>
            <div className="report-stat-icon purple">
              <Receipt size={20} />
            </div>
          </div>
          <h2>{report.summary.transactionCount}</h2>
          <p>Нийт бүртгэгдсэн гүйлгээ</p>
        </div>
      </div>

      {/* CHARTS */}
      <div className="report-charts">
        <section className="report-chart-card report-bar-card">
          <div className="report-section-heading">
            <div>
              <h3>Орлого ба зарлага</h3>
              <p>Сүүлийн 6 сарын санхүүгийн харьцуулалт</p>
            </div>
            <span className="report-chart-icon">
              <TrendingUp size={18} />
            </span>
          </div>

          <div className="report-bar-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                margin={{ top: 10, right: 5, left: 5, bottom: 0 }}
                barGap={7}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f4" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#8995a5', fontSize: 10 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#8995a5', fontSize: 10 }}
                  tickFormatter={(value) => `${value / 1000000}сая`}
                  width={55}
                />
                <Tooltip
                  formatter={(value) => formatMoney(value)}
                  contentStyle={{
                    border: '1px solid #e9edf3',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: '10px', paddingTop: '15px' }}
                />
                <Bar
                  dataKey="income"
                  name="Орлого"
                  fill="#6386b5"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={25}
                />
                <Bar
                  dataKey="expense"
                  name="Зарлага"
                  fill="#d99a61"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={25}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="report-chart-card report-pie-card">
          <div className="report-section-heading">
            <div>
              <h3>Зардлын ангилал</h3>
              <p>Ангилал тус бүрийн зардлын хэмжээ</p>
            </div>
            <span className="report-chart-icon">
              <FileText size={18} />
            </span>
          </div>

          {expenseCategories.length > 0 ? (
            <>
              <div className="report-pie-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseCategories}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                    >
                      {expenseCategories.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={categoryColors[index % categoryColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatMoney(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="report-category-list">
                {expenseCategories.map((item, index) => (
                  <div className="report-category-item" key={item.name}>
                    <div className="report-category-name">
                      <span
                        className="report-category-dot"
                        style={{
                          backgroundColor:
                            categoryColors[index % categoryColors.length],
                        }}
                      />
                      <span>{item.name}</span>
                    </div>
                    <strong>{formatMoney(item.value)}</strong>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="report-no-data">Зардлын мэдээлэл байхгүй байна.</div>
          )}
        </section>
      </div>

      {/* TRANSACTION TABLE */}
      <section className="report-table-card">
        <div className="report-table-heading">
          <div>
            <h3>Санхүүгийн гүйлгээ</h3>
            <p>Орлого болон зарлагын бүртгэлийн жагсаалт</p>
          </div>
          <span className="report-count">
            {report.summary.transactionCount} гүйлгээ
          </span>
        </div>

        <div className="report-table-wrapper">
          <table className="report-table">
            <thead>
              <tr>
                <th>ГҮЙЛГЭЭНИЙ НЭР</th>
                <th>АНГИЛАЛ</th>
                <th>ТӨРӨЛ</th>
                <th>ОГНОО</th>
                <th>ДҮН</th>
              </tr>
            </thead>

            <tbody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((item) => (
                  <tr key={`${item.type}-${item.id}`}>
                    <td>
                      <div className="report-transaction-name">
                        <div className={`report-transaction-icon ${item.type === 'Орлого' ? 'income' : 'expense'}`}>
                          {item.type === 'Орлого' ? (
                            <ArrowDownRight size={17} />
                          ) : (
                            <ArrowUpRight size={17} />
                          )}
                        </div>
                        <strong>{item.title}</strong>
                      </div>
                    </td>
                    <td>
                      <span className="report-category-badge">
                        {item.category}
                      </span>
                    </td>
                    <td>
                      <span className={`report-type-badge ${item.type === 'Орлого' ? 'income' : 'expense'}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="report-date">{formatDate(item.date)}</td>
                    <td className={`report-amount ${item.type === 'Орлого' ? 'income' : 'expense'}`}>
                      {item.type === 'Орлого' ? '+' : '-'}{formatMoney(item.amount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="report-empty">
                    <Receipt size={28} />
                    <strong>Гүйлгээ олдсонгүй</strong>
                    <span>Сонгосон хугацаанд бүртгэл байхгүй байна.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default Reports
