import { Navigate, Outlet } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import Header from '../components/layout/Header'
import { isLoggedIn } from '../services/api'

function AdminLayout() {
  // Нэвтрээгүй бол нэвтрэх хуудас руу
  if (!isLoggedIn()) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="admin-layout">
      <Sidebar />

      <div className="admin-main">
        <Header />

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
