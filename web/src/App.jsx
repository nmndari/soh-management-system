
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AdminLayout from './layouts/AdminLayout'
import './App.css'
import Expenses from './pages/Expenses'
import Residents from './pages/Residents'
import Reports from './pages/Reports'
import Announcements from './pages/Announcements'
import Meetings from './pages/Meetings'
import Voting from './pages/Voting'

function ComingSoon() {
  return (
    <div style={{ padding: 40 }}>
      <h1>Тун удахгүй</h1>
      <p>Энэ хэсгийн хөгжүүлэлт хийгдэж байна.</p>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login page */}
        <Route path="/" element={<Login />} />

        {/* Admin pages */}
        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/residents" element={<Residents />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/meetings" element={<Meetings />} />
          <Route path="/voting" element={<Voting />} />
          <Route path="/complaints" element={<ComingSoon />} />
          <Route path="/settings" element={<ComingSoon />} />
        </Route>

        {/* Unknown URLs */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
