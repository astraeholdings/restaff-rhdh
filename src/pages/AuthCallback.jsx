import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { logger } from '../lib/logger'

export function AuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('confirming') // confirming | success | error
  const [error, setError] = useState(null)

  useEffect(() => {
    handleCallback()
  }, [])

  const handleCallback = async () => {
    try {
      logger.info('Auth callback triggered', { url: window.location.href })

      // Supabase automatically handles the token exchange from the URL hash
      // when using getSession() after a redirect
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        logger.error('Auth callback error:', { error: error.message })
        setError(error.message)
        setStatus('error')
        return
      }

      if (session) {
        logger.success('Email confirmed and session established', {
          userId: session.user.id,
          email: session.user.email,
        })
        setStatus('success')

        // Short delay so user can see the success message, then redirect
        setTimeout(() => {
          navigate('/dashboard', { replace: true })
        }, 1500)
      } else {
        logger.warn('Auth callback: no session after confirmation')
        setError('Confirmation processed but no session was created. Please try signing in.')
        setStatus('error')
      }
    } catch (err) {
      logger.error('Auth callback exception:', err)
      setError(err.message || 'Something went wrong during email confirmation')
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          {status === 'confirming' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <h1 className="text-2xl font-serif font-bold text-gray-900 mb-2">
                Confirming your email...
              </h1>
              <p className="text-gray-600">Please wait while we verify your account.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="text-6xl mb-4">✅</div>
              <h1 className="text-2xl font-serif font-bold text-gray-900 mb-2">
                Email Confirmed!
              </h1>
              <p className="text-gray-600 mb-4">
                Your account is verified. Redirecting you to the dashboard...
              </p>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-serif font-bold text-gray-900 mb-2">
                Confirmation Issue
              </h1>
              <p className="text-gray-600 mb-4">{error}</p>
              <div className="space-y-3">
                <Link to="/login" className="block w-full btn-primary text-center">
                  Go to Sign In
                </Link>
                <Link to="/signup" className="block w-full btn-secondary text-center">
                  Sign Up Again
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
