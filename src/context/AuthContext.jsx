import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { logger } from '../lib/logger'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        logger.info('Checking authentication status...')
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          logger.error('Failed to get session:', error)
          setLoading(false)
          return
        }

        if (session?.user) {
          logger.success('Session found for user:', { userId: session.user.id, email: session.user.email })
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else {
          logger.info('No active session found')
        }
      } catch (err) {
        logger.error('Error checking auth:', err)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.info('Auth state changed:', { event, userId: session?.user?.id })

        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else {
          logger.info('User logged out')
          setUser(null)
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription?.unsubscribe()
  }, [])

  const fetchProfile = async (userId) => {
    try {
      logger.info('Fetching user profile...', { userId })
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        logger.error('Failed to fetch profile:', { error: error.message, code: error.code })
        setProfile(null)
      } else {
        logger.success('Profile loaded successfully', {
          profileId: data?.id,
          name: data?.full_name,
          role: data?.role,
        })
        setProfile(data)
      }
    } catch (err) {
      logger.error('Error fetching profile:', err)
      setProfile(null)
    }
  }

  const signIn = async (email, password) => {
    try {
      logger.info('Attempting sign in...', { email })
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        logger.error('Sign in failed:', {
          email,
          error: error.message,
          code: error.status,
        })
        throw error
      }

      logger.success('Sign in successful', { userId: data.user?.id, email })
      return data
    } catch (err) {
      logger.error('Sign in error:', err)
      throw err
    }
  }

  const signUp = async (email, password, fullName) => {
    try {
      logger.info('Attempting sign up...', { email, fullName })
      const { data, error } = await supabase.auth.signUp({ email, password })

      if (error) {
        logger.error('Sign up failed:', {
          email,
          error: error.message,
          code: error.status,
        })
        throw error
      }

      if (data.user) {
        logger.info('User created, creating profile...', { userId: data.user.id })
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              user_id: data.user.id,
              full_name: fullName,
              role: 'staff',
              active: true,
            },
          ])

        if (profileError) {
          logger.error('Failed to create profile:', {
            userId: data.user.id,
            error: profileError.message,
          })
          throw profileError
        }

        logger.success('Sign up successful, profile created', {
          userId: data.user.id,
          email,
          fullName,
        })
      }

      return data
    } catch (err) {
      logger.error('Sign up error:', err)
      throw err
    }
  }

  const signOut = async () => {
    try {
      logger.info('Signing out...')
      const { error } = await supabase.auth.signOut()

      if (error) {
        logger.error('Sign out failed:', { error: error.message })
        throw error
      }

      logger.success('Sign out successful')
    } catch (err) {
      logger.error('Sign out error:', err)
      throw err
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
