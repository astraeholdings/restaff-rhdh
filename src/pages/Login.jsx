import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logger } from '../lib/logger'

export function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setNeedsConfirmation(false)
    setLoading(true)

    try {
      logger.info('Login form submitted', { email })
      await signIn(email, password)
      logger.success('Login successful, redirecting to dashboard')
      navigate('/dashboard')
    } catch (err) {
      const errorMessage = err.message || 'Failed to sign in'
      const errorCode = err.code || ''
      logger.error('Login failed:', {
        email,
        error: errorMessage,
        code: errorCode,
        status: err.status,
      })

      if (
        errorMessage.toLowerCase().includes('email not confirmed') ||
        errorCode === 'email_not_confirmed'
      ) {
        setNeedsConfirmation(true)
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, var(--primary-900) 0%, var(--primary-dark) 40%, var(--primary) 100%)',
      }}
    >
      {/* Subtle pattern overlay */}
      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="w-full max-w-md relative animate-fade-in-up">
        <div
          className="rounded-2xl p-8 md:p-10"
          style={{
            background: 'var(--surface-raised)',
            boxShadow: 'var(--shadow-xl), 0 0 80px rgba(0,0,0,0.15)',
          }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
              style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                boxShadow: '0 4px 16px rgba(30, 122, 75, 0.3)',
              }}
            >
              <span
                className="material-symbols-rounded text-white"
                style={{ fontSize: '28px', fontVariationSettings: "'FILL' 1, 'wght' 500" }}
              >
                eco
              </span>
            </div>
            <h1 className="text-3xl font-serif font-bold" style={{ color: 'var(--text-primary)' }}>Rising Hill</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>Developmental Homes Staff Portal</p>
          </div>

          {/* Email not confirmed banner */}
          {needsConfirmation && (
            <div className="alert alert-warning mb-5">
              <span className="material-symbols-rounded" style={{ fontSize: '20px', color: 'var(--warning)' }}>mail</span>
              <div>
                <p className="font-semibold mb-1">Email not confirmed yet</p>
                <p className="text-xs opacity-80">
                  Check your inbox for <strong>{email}</strong> and click the confirmation link.
                </p>
                <p className="text-xs opacity-60 mt-1">
                  Don&apos;t see it? Check your spam/junk folder.
                </p>
              </div>
            </div>
          )}

          {/* Generic error banner */}
          {error && !needsConfirmation && (
            <div className="alert alert-error mb-5">
              <span className="material-symbols-rounded" style={{ fontSize: '20px', color: 'var(--danger)' }}>error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="form-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="you@example.com"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="form-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="Enter your password"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-sm font-semibold"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Don&apos;t have an account?{' '}
              <Link
                to="/signup"
                className="font-semibold transition-colors"
                style={{ color: 'var(--primary)' }}
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
