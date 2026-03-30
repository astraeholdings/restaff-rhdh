import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const HomeContext = createContext()

export function HomeProvider({ children }) {
  const { profile, user } = useAuth()
  const [homes, setHomes] = useState([])
  const [activeHome, setActiveHome] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) {
      setLoading(false)
      return
    }

    const fetchHomes = async () => {
      let query = supabase.from('homes').select('*').eq('active', true)

      if (profile.role !== 'admin') {
        query = query.eq('id', profile.home_id)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching homes:', error)
      } else {
        setHomes(data || [])

        const savedHomeId = localStorage.getItem('rhdh_active_home')
        if (savedHomeId && data?.some(h => h.id === savedHomeId)) {
          setActiveHome(data.find(h => h.id === savedHomeId))
        } else if (data?.[0]) {
          const homeToSet = data[0]
          setActiveHome(homeToSet)
          localStorage.setItem('rhdh_active_home', homeToSet.id)
        }
      }

      setLoading(false)
    }

    fetchHomes()
  }, [profile])

  const selectHome = (home) => {
    setActiveHome(home)
    if (home?.id) {
      localStorage.setItem('rhdh_active_home', home.id)
    }
  }

  return (
    <HomeContext.Provider value={{ homes, activeHome, selectHome, loading }}>
      {children}
    </HomeContext.Provider>
  )
}

export function useHome() {
  const context = useContext(HomeContext)
  if (!context) {
    throw new Error('useHome must be used within HomeProvider')
  }
  return context
}
