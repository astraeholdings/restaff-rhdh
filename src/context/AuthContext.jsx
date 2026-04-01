import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { logger } from '../lib/logger'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // onAuthStateChange fires INITIAL_SESSION on mount (with or without a session),
    // so we don't need a separate getSession() call. Using both causes a race
    // condition where two concurrent fetchProfile calls can leave loading stuck.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.info('Auth state changed:', { event, userId: session?.user?.id })

        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else {
          logger.info('No active session')
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

      if (error && error.code === 'PGRST116') {
        // No profile row found — create a default one
        logger.warn('No profile found, creating default profile...', { userId })
        const { data: userData } = await supabase.auth.getUser()
        const email = userData?.user?.email || ''
        const name = email.split('@')[0] || 'New User'

        const { data: newProfile, error: insertErr } = await supabase
          .from('profiles')
          .insert([{ user_id: userId, full_name: name, role: 'staff', active: true }])
          .select()
          .single()

        if (insertErr) {
          logger.error('Failed to create default profile:', {
            error: insertErr.message,
            code: insertErr.code,
          })
          setProfile(null)
        } else {
          logger.success('Default profile created', {
            profileId: newProfile?.id,
            name: newProfile?.full_name,
          })
          setProfile(newProfile)
        }
      } else if (error) {
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

      // Build the callback URL for email confirmation
      const redirectUrl = `${window.location.origin}/auth/callback`
      logger.debug('Email confirmation redirect URL:', { redirectUrl })

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      })

      if (error) {
        logger.error('Sign up failed:', {
          email,
          error: error.message,
          code: error.status,
        })
        throw error
      }

      if (data.user) {
        logger.info('User created, creating profile...', {
          userId: data.user.id,
          hasSession: !!data.session,
        })

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
            code: profileError.code,
          })
          // Don't throw here - profile creation via RLS might fail before
          // email is confirmed; we'll retry on first login
          logger.warn('Profile creation deferred - will retry after email confirmation')
        } else {
          logger.success('Profile created', {
            userId: data.user.id,
            email,
            fullName,
          })
        }

        if (data.session) {
          logger.success('Sign up auto-confirmed (no email confirmation needed)', { email })
        } else {
          logger.info('Sign up requires email confirmation', { email })
        }
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
