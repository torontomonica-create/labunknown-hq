import { useState } from 'react'
import { supabase } from '../lib/supabase'
import './Login.css'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleOwnerLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    else onLogin(data.user)
    setLoading(false)
  }

  const handleGuestLogin = async () => {
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'guest@labunknown.demo',
      password: 'guest-demo-2026'
    })
    if (error) setError('Guest account not set up yet.')
    else onLogin(data.user)
    setLoading(false)
  }

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <h1>LAB UNKNOWN HQ</h1>
          <p>Personal Command Center</p>
        </div>

        <form onSubmit={handleOwnerLogin} className="login-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="btn-owner" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-divider"><span>or</span></div>

        <button className="btn-guest" onClick={handleGuestLogin} disabled={loading}>
          👀 View Demo (Guest)
        </button>

        <p className="login-note">
          Guest mode shows sample data only.
        </p>
      </div>
    </div>
  )
}
