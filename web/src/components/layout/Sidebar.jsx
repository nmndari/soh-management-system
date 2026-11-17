
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Building2,
  LayoutDashboard,
  Users,
  ChartNoAxesCombined,
  Receipt,
  Megaphone,
  CalendarDays,
  Vote,
  MessageSquare,
  Settings,
  ChevronLeft,
  LogOut,
} from 'lucide-react'

const navigation = [
  {
    title: 'ЕРӨНХИЙ',
    items: [
      { label: 'Хянах самбар', icon: LayoutDashboard, path: '/dashboard' },
    ],
  },
  {
    title: 'УДИРДЛАГА',
    items: [
      { label: 'Оршин суугчид', icon: Users, path: '/residents' },
      { label: 'Зардлын бүртгэл', icon: Receipt, path: '/expenses' },
      { label: 'Санхүүгийн тайлан', icon: ChartNoAxesCombined, path: '/reports' },
    ],
  },
  {
    title: 'ҮЙЛ АЖИЛЛАГАА',
    items: [
      { label: 'Зарлал мэдээлэл', icon: Megaphone, path: '/announcements' },
      { label: 'Хурлын мэдээлэл', icon: CalendarDays, path: '/meetings' },
      { label: 'Санал асуулга', icon: Vote, path: '/voting' },
      { label: 'Санал гомдол', icon: MessageSquare, path: '/complaints' },
    ],
  },
]

function Sidebar() {
  const navigate = useNavigate()

  const handleLogout = () => {
    navigate('/')
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Building2 size={23} />
        </div>
        <div>
          <h2>СӨХ MANAGER</h2>
          <span>Удирдлагын систем</span>
        </div>
      </div>

      <div className="sidebar-menu">
        {navigation.map((group) => (
          <div className="sidebar-group" key={group.title}>
            <p className="sidebar-group-title">{group.title}</p>

            {group.items.map((item) => {
              const Icon = item.icon

              return (
                <NavLink
                  to={item.path}
                  key={item.path}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? 'active' : ''}`
                  }
                >
                  <Icon size={19} strokeWidth={1.8} />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </div>
        ))}
      </div>

      <div className="sidebar-bottom">
        <NavLink to="/settings" className="sidebar-link">
          <Settings size={19} />
          <span>Тохиргоо</span>
        </NavLink>

        <button
          className="sidebar-link logout-button"
          onClick={handleLogout}
        >
          <LogOut size={19} />
          <span>Гарах</span>
        </button>

        <div className="sidebar-admin">
          <div className="admin-avatar">А</div>
          <div className="admin-details">
            <strong>Администратор</strong>
            <span>СӨХ менежер</span>
          </div>
          <ChevronLeft size={16} />
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
