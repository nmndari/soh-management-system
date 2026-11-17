
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Bell,
  ChevronDown,
  UserRound,
  Settings,
  LogOut,
  CheckCheck,
  MessageSquare,
  Megaphone,
  Users,
  X,
  CalendarDays,
} from 'lucide-react'
import { currentAdmin, fetchMe, logout } from '../../services/auth'
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../services/content'

// Мэдэгдлийн төрлөөр дүрс сонгоно
const iconByType = {
  complaint_created: MessageSquare,
  resident_created: Users,
  announcement_published: Megaphone,
  meeting_scheduled: CalendarDays,
}

// '2026-11-17T03:20:00Z' → '5 минутын өмнө'
function timeAgo(iso) {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return 'Дөнгөж сая'
  if (minutes < 60) return `${minutes} минутын өмнө`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} цагийн өмнө`
  const days = Math.floor(hours / 24)
  return days === 1 ? 'Өчигдөр' : `${days} өдрийн өмнө`
}

function Header() {
  const navigate = useNavigate()

  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [admin, setAdmin] = useState(currentAdmin())

  const headerRef = useRef(null)

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length

  // Админы мэдээлэл, мэдэгдлийг серверээс ачаална
  useEffect(() => {
    fetchMe().then(setAdmin).catch(() => {})

    const loadNotifications = () =>
      listNotifications()
        .then(({ items }) =>
          setNotifications(
            items.map((item) => ({
              ...item,
              time: timeAgo(item.createdAt),
              icon: iconByType[item.type] || Bell,
            }))
          )
        )
        .catch(() => {})

    loadNotifications()
    const timer = setInterval(loadNotifications, 60000)
    return () => clearInterval(timer)
  }, [])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        headerRef.current &&
        !headerRef.current.contains(event.target)
      ) {
        setShowNotifications(false)
        setShowProfile(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev)
    setShowProfile(false)
  }

  const toggleProfile = () => {
    setShowProfile((prev) => !prev)
    setShowNotifications(false)
  }

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, read: true } : item
      )
    )
    markNotificationRead(id).catch(() => {})
  }

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((item) => ({ ...item, read: true }))
    )
    markAllNotificationsRead().catch(() => {})
  }

  const handleLogout = async () => {
    setShowProfile(false)
    await logout()
    navigate('/', { replace: true })
  }

  const goToSettings = () => {
    setShowProfile(false)
    navigate('/settings')
  }

  return (
    <header className="top-header" ref={headerRef}>
      <div className="header-search">
        <Search size={18} />
        <input placeholder="Хайх..." />
        <kbd>⌘ K</kbd>
      </div>

      <div className="header-actions">

        {/* NOTIFICATIONS */}
        <div className="header-dropdown-wrapper">
          <button
            className={`header-notification ${showNotifications ? 'dropdown-active' : ''}`}
            aria-label="Мэдэгдэл"
            aria-expanded={showNotifications}
            onClick={toggleNotifications}
          >
            <Bell size={20} />

            {unreadCount > 0 && (
              <span className="notification-indicator" />
            )}
          </button>

          {showNotifications && (
            <div className="header-dropdown notification-dropdown">
              <div className="dropdown-heading">
                <div>
                  <h3>Мэдэгдэл</h3>
                  <span>{unreadCount} уншаагүй мэдэгдэл</span>
                </div>

                <button
                  className="dropdown-icon-btn"
                  onClick={() => setShowNotifications(false)}
                  aria-label="Хаах"
                >
                  <X size={17} />
                </button>
              </div>

              {unreadCount > 0 && (
                <button
                  className="mark-all-read"
                  onClick={markAllAsRead}
                >
                  <CheckCheck size={15} />
                  Бүгдийг уншсан болгох
                </button>
              )}

              <div className="notification-list">
                {notifications.length > 0 ? (
                  notifications.map((item) => {
                    const Icon = item.icon

                    return (
                      <button
                        key={item.id}
                        className={`notification-item ${!item.read ? 'unread' : ''}`}
                        onClick={() => markAsRead(item.id)}
                      >
                        <div className="notification-icon">
                          <Icon size={18} />
                        </div>

                        <div className="notification-content">
                          <strong>{item.title}</strong>
                          <p>{item.message}</p>
                          <span>{item.time}</span>
                        </div>

                        {!item.read && (
                          <span className="notification-unread-dot" />
                        )}
                      </button>
                    )
                  })
                ) : (
                  <div className="notification-empty">
                    <Bell size={27} />
                    <strong>Мэдэгдэл байхгүй байна</strong>
                    <span>Шинэ мэдэгдэл энд харагдана.</span>
                  </div>
                )}
              </div>

              <div className="notification-footer">
                <span>Сүүлийн мэдэгдлүүд</span>
              </div>
            </div>
          )}
        </div>

        <div className="header-divider" />

        {/* ADMIN PROFILE */}
        <div className="header-dropdown-wrapper">
          <button
            className={`header-profile ${showProfile ? 'dropdown-active' : ''}`}
            onClick={toggleProfile}
            aria-expanded={showProfile}
          >
            <div className="admin-avatar">{admin?.fullName?.charAt(0) || 'А'}</div>

            <div className="header-profile-info">
              <strong>{admin?.fullName || 'Администратор'}</strong>
              <span>СӨХ менежер</span>
            </div>

            <ChevronDown
              size={16}
              className={showProfile ? 'profile-chevron-open' : ''}
            />
          </button>

          {showProfile && (
            <div className="header-dropdown profile-dropdown">
              <div className="profile-dropdown-info">
                <div className="admin-avatar">{admin?.fullName?.charAt(0) || 'А'}</div>
                <div>
                  <strong>{admin?.fullName || 'Администратор'}</strong>
                  <span>СӨХ менежер</span>
                </div>
              </div>

              <div className="profile-dropdown-divider" />

              <button
                className="profile-menu-item"
                onClick={goToSettings}
              >
                <UserRound size={17} />
                <span>Хувийн мэдээлэл</span>
              </button>

              <button
                className="profile-menu-item"
                onClick={goToSettings}
              >
                <Settings size={17} />
                <span>Системийн тохиргоо</span>
              </button>

              <div className="profile-dropdown-divider" />

              <button
                className="profile-menu-item logout-item"
                onClick={handleLogout}
              >
                <LogOut size={17} />
                <span>Гарах</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  )
}

export default Header
