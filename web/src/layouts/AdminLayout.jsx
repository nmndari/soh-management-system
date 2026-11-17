
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import Header from '../components/layout/Header'

function AdminLayout() {
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
