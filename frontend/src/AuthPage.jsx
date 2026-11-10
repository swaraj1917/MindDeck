import { useState } from 'react'
import { apiFetch, setToken } from './api'

function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isRegister = mode === 'register'

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (isRegister && !name.trim()) {
      setError('Please enter your name.')
      return
    }

    if (isRegister && password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    try {
      setSubmitting(true)

      const body = isRegister
        ? { name: name.trim(), email: email.trim(), password }
        : { email: email.trim(), password }

      const data = await apiFetch(`/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify(body),
      })

      setToken(data.token)
      onAuthenticated(data.user)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function switchMode() {
    setMode(isRegister ? 'login' : 'register')
    setError('')
  }

  return (
    <main className='auth-shell'>
      <section className='panel auth-card'>
        <h1>{isRegister ? 'Create your account' : 'Welcome back'}</h1>
        <p>
          {isRegister
            ? 'Start building your memory.'
            : 'Log in to continue studying.'}
        </p>

        {error && <div className='error-message'>{error}</div>}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <label htmlFor='auth-name'>Name</label>
              <input
                id='auth-name'
                type='text'
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={100}
                autoComplete='name'
                required
              />
            </>
          )}

          <label htmlFor='auth-email'>Email</label>
          <input
            id='auth-email'
            type='email'
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete='email'
            required
          />

          <label htmlFor='auth-password'>Password</label>
          <input
            id='auth-password'
            type='password'
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            required
          />

          <button className='primary-button' type='submit' disabled={submitting}>
            {submitting
              ? 'Please wait...'
              : isRegister
                ? 'Create account'
                : 'Log in'}
          </button>
        </form>

        <p className='auth-switch-text'>
          {isRegister ? 'Already have an account?' : 'New to MindDeck?'}{' '}
          <button type='button' className='auth-switch' onClick={switchMode}>
            {isRegister ? 'Log in' : 'Create an account'}
          </button>
        </p>

        {!isRegister && (
          <p className='auth-hint'>
            Demo login: demo@minddeck.local / Demo@1234
          </p>
        )}
      </section>
    </main>
  )
}

export default AuthPage