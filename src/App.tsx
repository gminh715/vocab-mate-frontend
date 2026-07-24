import { type FormEvent, useState } from 'react'
import { normalizeApiError } from './api/client'
import {
  useLoginMutation,
  useLogoutMutation,
} from './features/auth/auth-hooks'
import { loginSchema } from './features/auth/auth-schemas'
import { useAuth } from './features/auth/use-auth'
import './App.css'

function App() {
  const { currentUser, error, isInitializing } = useAuth()
  const loginMutation = useLoginMutation()
  const logoutMutation = useLogoutMutation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')

    const result = loginSchema.safeParse({ email, password })

    if (!result.success) {
      setMessage(result.error.issues[0]?.message ?? 'Check your login details.')
      return
    }

    try {
      await loginMutation.mutateAsync(result.data)
      setPassword('')
    } catch (mutationError: unknown) {
      const apiError = normalizeApiError(mutationError)
      setMessage(apiError.details?.[0] ?? apiError.message)
    }
  }

  const handleLogout = async () => {
    setMessage('')

    try {
      await logoutMutation.mutateAsync()
    } catch (mutationError: unknown) {
      setMessage(normalizeApiError(mutationError).message)
    }
  }

  if (isInitializing) {
    return (
      <main className="shell">
        <section className="card" aria-live="polite">
          <p className="eyebrow">Vocab Mate</p>
          <h1>Restoring your session…</h1>
        </section>
      </main>
    )
  }

  return (
    <main className="shell">
      <section className="card">
        <p className="eyebrow">Vocab Mate</p>
        <h1>Auth foundation connected to the Vocab Mate API.</h1>
        <p className="intro">
          Access tokens stay in memory. Refresh tokens remain in the
          backend-managed HttpOnly cookie.
        </p>

        {currentUser ? (
          <div className="account">
            <div>
              <span>Signed in as</span>
              <strong>{currentUser.profile.displayName}</strong>
              <small>
                {currentUser.email} · {currentUser.profile.currentCefrLevel}
              </small>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? 'Signing Out…' : 'Sign Out'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin}>
            <label htmlFor="email">
              Email
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                spellCheck={false}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="e.g. user@example.com…"
                required
              />
            </label>
            <label htmlFor="password">
              Password
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password…"
                required
              />
            </label>
            <button type="submit" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? 'Signing In…' : 'Sign In'}
            </button>
          </form>
        )}

        {(message || error) && (
          <p className="message" role="alert">
            {message || error?.message}
          </p>
        )}
      </section>
    </main>
  )
}

export default App
