import { type FormEvent, useEffect, useState } from 'react'
import { API_BASE_URL, ApiError, apiClient } from './api/client'
import { authApi } from './api/auth'
import type { MyAccount } from './api/types'
import './App.css'

type ConnectionState = 'checking' | 'connected' | 'offline'

function App() {
  const [connection, setConnection] = useState<ConnectionState>('checking')
  const [account, setAccount] = useState<MyAccount | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true

    void apiClient
      .get<string>('', { retryOnUnauthorized: false })
      .then(() => active && setConnection('connected'))
      .catch(() => active && setConnection('offline'))

    void authApi.restoreSession().then((session) => {
      if (active) setAccount(session)
    })

    return () => {
      active = false
    }
  }, [])

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')

    try {
      const session = await authApi.login({ email, password })
      setAccount(session)
      setConnection('connected')
      setPassword('')
    } catch (error) {
      setMessage(
        error instanceof ApiError
          ? error.details?.join(', ') || error.message
          : 'Không thể kết nối tới backend.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = async () => {
    setSubmitting(true)
    setMessage('')

    try {
      await authApi.logout()
      setAccount(null)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Đăng xuất thất bại.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="shell">
      <section className="card">
        <p className="eyebrow">Vocab Mate</p>
        <h1>Frontend đã sẵn sàng nói chuyện với backend.</h1>
        <p className="intro">
          API client đang dùng đúng response envelope, Bearer access token và
          HttpOnly refresh cookie của NestJS.
        </p>

        <div className={`connection connection--${connection}`}>
          <span className="status-dot" aria-hidden="true" />
          <div>
            <strong>
              {connection === 'checking'
                ? 'Đang kiểm tra kết nối'
                : connection === 'connected'
                  ? 'Backend đã kết nối'
                  : 'Backend chưa phản hồi'}
            </strong>
            <small>{API_BASE_URL}</small>
          </div>
        </div>

        {account ? (
          <div className="account">
            <div>
              <span>Đăng nhập với</span>
              <strong>{account.profile.displayName}</strong>
              <small>
                {account.email} · {account.profile.currentCefrLevel}
              </small>
            </div>
            <button type="button" onClick={handleLogout} disabled={submitting}>
              Đăng xuất
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin}>
            <label>
              Email
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="user@example.com"
                required
              />
            </label>
            <label>
              Mật khẩu
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
              />
            </label>
            <button type="submit" disabled={submitting}>
              {submitting ? 'Đang đăng nhập…' : 'Đăng nhập qua API'}
            </button>
          </form>
        )}

        {message && <p className="message" role="alert">{message}</p>}
      </section>
    </main>
  )
}

export default App
