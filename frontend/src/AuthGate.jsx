import { useEffect, useState } from 'react'
import App from './App'
import AuthPage from './AuthPage'
import { apiFetch, clearToken, getToken } from './api'

function AuthGate() {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(Boolean(getToken()))

  useEffect(() => {
    if (!getToken()) return

    apiFetch('/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => clearToken())
      .finally(() => setChecking(false))
  }, [])

  useEffect(() => {
    const handleLogout = () => setUser(null)
    window.addEventListener('auth:logout', handleLogout)
    return () => window.removeEventListener('auth:logout', handleLogout)
  }, [])

  function logout() {
    clearToken()
    setUser(null)
  }

  if (checking) {
    return (
      <main className='app-shell'>
        <p className='loading-message'>Loading MindDeck...</p>
      </main>
    )
  }

  if (!user) {
    return <AuthPage onAuthenticated={setUser} />
  }

  return <App user={user} onLogout={logout} />
}

export default AuthGate