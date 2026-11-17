
import { Search, Bell, ChevronDown } from 'lucide-react'

function Header() {
  return (
    <header className="top-header">
      <div className="header-search">
        <Search size={18} />
        <input placeholder="Хайх..." />
        <kbd>⌘ K</kbd>
      </div>

      <div className="header-actions">
        <button className="header-notification" aria-label="Мэдэгдэл">
          <Bell size={20} />
          <span className="notification-indicator" />
        </button>

        <div className="header-divider" />

        <button className="header-profile">
          <div className="admin-avatar">А</div>
          <div className="header-profile-info">
            <strong>Администратор</strong>
            <span>СӨХ менежер</span>
          </div>
          <ChevronDown size={16} />
        </button>
      </div>
    </header>
  )
}

export default Header
