
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
} from 'lucide-react'

const initialNotifications = [
  {
    id: 1,
    title: 'Шинэ санал гомдол',
    message: 'Оршин суугчаас шинэ санал гомдол ирлээ.',
    time: '5 минутын өмнө',
    icon: MessageSquare,
    read: false,
  },
  {
    id: 2,
    title: 'Шинэ оршин суугч',
    message: 'Шинэ оршин суугч бүртгэгдлээ.',
    time: '1 цагийн өмнө',
    icon: Users,
    read: false,
  },
  {
    id: 3,
    title: 'Шинэ зарлал',
    message: 'Системд шинэ зарлал нэмэгдлээ.',
    time: 'Өчигдөр',
    icon: Megaphone,
    read: true,
  },
]

function Header() {
  const navigate = useNavigate()

  const [notifications, setNotifications] = useState(initialNotifications)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  const headerRef = useRef(null)

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length

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
  }

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((item) => ({ ...item, read: true }))
    )
  }

  const handleLogout = () => {
    setShowProfile(false)
    navigate('/')
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
            <div className="admin-avatar">А</div>

            <div className="header-profile-info">
              <strong>Администратор</strong>
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
                <div className="admin-avatar">А</div>
                <div>
                  <strong>Администратор</strong>
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
