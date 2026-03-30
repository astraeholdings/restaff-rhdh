import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logger } from '../lib/logger'

export function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [confirmationSent, setConfirmationSent] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setError('Full name is required')
      return false
    }
    if (!formData.email.trim()) {
      setError('Email is required')
      return false
    }
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email')
      return false
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!validateForm()) {
      setLoading(false)
      return
    }

    try {
      logger.info('Signup form submitted', {
        email: formData.email,
        fullName: formData.fullName,
      })
      const result = await signUp(formData.email, formData.password, formData.fullName)

      // If session exists, user is auto-confirmed (e.g. confirmation disabled in Supabase)
      if (result.session) {
        logger.success('Account created and auto-confirmed, redirecting to dashboard')
        navigate('/dashboard')
      } else {
        // Email confirmation required - show the confirmation screen
        logger.info('Account created, email confirmation required', {
          email: formData.email,
        })
        setConfirmationSent(true)
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to create account'
      logger.error('Signup failed:', {
        email: formData.email,
        error: errorMessage,
        code: err.code,
        status: err.status,
      })
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Confirmation pending screen
  if (confirmationSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <div className="text-6xl mb-4">📧</div>
            <h1 className="text-2xl font-serif font-bold text-gray-900 mb-4">Check Your Email</h1>
            <p className="text-gray-600 mb-2">
              We sent a confirmation link to:
            </p>
            <p className="font-medium text-gray-900 mb-6">{formData.email}</p>
            <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6 text-left">
              <h3 className="font-medium text-blue-900 mb-2">Next steps:</h3>
              <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                <li>Open your email inbox</li>
                <li>Find the email from Rising Hill (check spam/junk too)</li>
                <li>Click the confirmation link</li>
                <li>You'll be automatically signed in</li>
              </ol>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => setConfirmationSent(false)}
                className="w-full btn-secondary text-sm"
              >
                Use a different email
              </button>
              <Link
                to="/login"
                className="block w-full text-center text-sm text-gray-600 hover:text-gray-900"
              >
                Already confirmed? Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-serif font-bold text-primary mb-2">Rising Hill</h1>
            <p className="text-gray-600">Create Your Account</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-800 rounded text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="form-input"
                placeholder="John Doe"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
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
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                placeholder="At least 6 characters"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
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
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
