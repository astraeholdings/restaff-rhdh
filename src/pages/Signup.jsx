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
    if (!formData.fullName.trim()) { setError('Full name is required'); return false }
    if (!formData.email.trim()) { setError('Email is required'); return false }
    if (!formData.email.includes('@')) { setError('Please enter a valid email'); return false }
    if (formData.password.length < 6) { setError('Password must be at least 6 characters'); return false }
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return false }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!validateForm()) { setLoading(false); return }

    try {
      logger.info('Signup form submitted', { email: formData.email, fullName: formData.fullName })
      const result = await signUp(formData.email, formData.password, formData.fullName)

      if (result.session) {
        logger.success('Account created and auto-confirmed, redirecting to dashboard')
        navigate('/dashboard')
      } else {
        logger.info('Account created, email confirmation required', { email: formData.email })
        setConfirmationSent(true)
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to create account'
      logger.error('Signup failed:', { email: formData.email, error: errorMessage, code: err.code, status: err.status })
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Confirmation pending screen
  if (confirmationSent) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(135deg, var(--primary-900) 0%, var(--primary-dark) 40%, var(--primary) 100%)' }}
      >
        <div className="w-full max-w-md animate-fade-in-up">
          <div
            className="rounded-2xl p-8 md:p-10 text-center"
            style={{ background: 'var(--surface-raised)', boxShadow: 'var(--shadow-xl)' }}
          >
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
              style={{ background: 'var(--info-light)' }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: '32px', color: 'var(--info)' }}>mark_email_read</span>
            </div>
            <h1 className="text-2xl font-serif font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Check Your Email</h1>
            <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>We sent a confirmation link to:</p>
            <p className="font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>{formData.email}</p>

            <div className="alert alert-info text-left mb-6">
              <div>
                <h3 className="font-semibold mb-2">Next steps:</h3>
                <ol className="text-xs space-y-1.5 list-decimal list-inside opacity-80">
                  <li>Open your email inbox</li>
                  <li>Find the email from Rising Hill (check spam/junk too)</li>
                  <li>Click the confirmation link</li>
                  <li>You&apos;ll be automatically signed in</li>
                </ol>
              </div>
            </div>

            <div className="space-y-3">
              <button onClick={() => setConfirmationSent(false)} className="w-full btn-ghost text-sm">
                Use a different email
              </button>
              <Link to="/login" className="block w-full text-center text-sm transition-colors" style={{ color: 'var(--text-tertiary)' }}>
                Already confirmed? Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, var(--primary-900) 0%, var(--primary-dark) 40%, var(--primary) 100%)' }}
    >
      <div className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="w-full max-w-md relative animate-fade-in-up">
        <div
          className="rounded-2xl p-8 md:p-10"
          style={{ background: 'var(--surface-raised)', boxShadow: 'var(--shadow-xl), 0 0 80px rgba(0,0,0,0.15)' }}
        >
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
              style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                boxShadow: '0 4px 16px rgba(30, 122, 75, 0.3)',
              }}
            >
              <span className="material-symbols-rounded text-white" style={{ fontSize: '28px', fontVariationSettings: "'FILL' 1, 'wght' 500" }}>eco</span>
            </div>
            <h1 className="text-3xl font-serif font-bold" style={{ color: 'var(--text-primary)' }}>Rising Hill</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>Create Your Account</p>
          </div>

          {error && (
            <div className="alert alert-error mb-5">
              <span className="material-symbols-rounded" style={{ fontSize: '20px', color: 'var(--danger)' }}>error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="form-label">Full Name</label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="form-input" placeholder="John Doe" required disabled={loading} />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-input" placeholder="you@example.com" required disabled={loading} />
            </div>
            <div>
              <label className="form-label">Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} className="form-input" placeholder="At least 6 characters" required disabled={loading} />
            </div>
            <div>
              <label className="form-label">Confirm Password</label>
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="form-input" required disabled={loading} />
            </div>

            <button type="submit" disabled={loading} className="w-full btn-primary py-3 text-sm font-semibold">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Account...
                </span>
              ) : 'Sign Up'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Already have an account?{' '}
              <Link to="/login" className="font-semibold transition-colors" style={{ color: 'var(--primary)' }}>Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
