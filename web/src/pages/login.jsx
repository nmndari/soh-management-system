
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ArrowRight,
} from 'lucide-react'
import './Login.css'

function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  
    const handleSubmit = (e) => {
    e.preventDefault()

    const demoEmail = 'admin@soh.mn'
    const demoPassword = 'Admin123!'

    if (email === demoEmail && password === demoPassword) {
        navigate('/dashboard')
    } else {
        alert('И-мэйл эсвэл нууц үг буруу байна.')
    }
    }


  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <div className="login-brand">
          <div className="login-brand-icon">
            <Building2 size={27} />
          </div>
          <span>СӨХ MANAGER</span>
        </div>

        <div className="brand-content">
          <span className="brand-label">УДИРДЛАГЫН СИСТЕМ</span>
          <h1>
            Таны СӨХ-ийн
            <br />
            үйл ажиллагаа
            <br />
            <span>нэг дор.</span>
          </h1>
          <p>
            Оршин суугчид, санхүүгийн тайлан,
            зарлал болон СӨХ-ийн өдөр тутмын
            үйл ажиллагааг нэг системээс удирдаарай.
          </p>
        </div>

        <div className="brand-footer">
          © 2026 СӨХ Manager. Бүх эрх хуулиар хамгаалагдсан.
        </div>
      </section>

      <section className="login-form-panel">
        <div className="login-form-container">
          <div className="mobile-brand">
            <Building2 size={25} />
            <strong>СӨХ MANAGER</strong>
          </div>

          <div className="login-heading">
            <span>ТАВТАЙ МОРИЛ</span>
            <h2>Нэвтрэх</h2>
            <p>
              Удирдлагын системд нэвтрэхийн тулд
              мэдээллээ оруулна уу.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="email">И-мэйл хаяг</label>
              <div className="input-wrapper">
                <Mail size={19} />
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="password">Нууц үг</label>
              <div className="input-wrapper">
                <LockKeyhole size={19} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Нууц үгээ оруулна уу"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Нууц үг нуух' : 'Нууц үг харах'}
                >
                  {showPassword
                    ? <EyeOff size={19} />
                    : <Eye size={19} />}
                </button>
              </div>
            </div>

            <div className="login-options">
              <label className="remember-option">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Намайг сана
              </label>

              <button
                type="button"
                className="forgot-button"
                onClick={() => alert('Нууц үг сэргээх хэсгийг дараа хөгжүүлнэ.')}
              >
                Нууц үг мартсан?
              </button>
            </div>

            <button type="submit" className="login-button">
              Нэвтрэх
              <ArrowRight size={18} />
            </button>
          </form>

          <p className="login-help">
            Нэвтрэх эрхтэй холбоотой асуудал гарвал
            СӨХ-ийн системийн админтай холбогдоно уу.
          </p>
        </div>
      </section>
    </main>
  )
}

export default Login