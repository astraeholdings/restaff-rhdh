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

      // Check for email not confirmed
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
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-serif font-bold text-primary mb-2">Rising Hill</h1>
            <p className="text-gray-600">Developmental Homes Staff Portal</p>
          </div>

          {/* Email not confirmed banner */}
          {needsConfirmation && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-300 rounded">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📧</span>
                <div>
                  <p className="font-medium text-yellow-900 mb-1">Email not confirmed yet</p>
                  <p className="text-sm text-yellow-800 mb-2">
                    Please check your inbox for <strong>{email}</strong> and click the confirmation link we sent you.
                  </p>
                  <p className="text-xs text-yellow-700">
                    Don't see it? Check your spam/junk folder. The email is from Supabase or noreply.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Generic error banner */}
          {error && !needsConfirmation && (
            <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-800 rounded text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
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
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary font-medium"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary font-medium hover:underline">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
