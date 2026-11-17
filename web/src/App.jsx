
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AdminLayout from './layouts/AdminLayout'
import './App.css'
import Expenses from './pages/Expenses'

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

          <Route path="/residents" element={<ComingSoon />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/reports" element={<ComingSoon />} />
          <Route path="/announcements" element={<ComingSoon />} />
          <Route path="/meetings" element={<ComingSoon />} />
          <Route path="/voting" element={<ComingSoon />} />
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
