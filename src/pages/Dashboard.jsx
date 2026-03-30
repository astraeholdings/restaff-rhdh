import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useHome } from '../context/HomeContext'
import { format } from 'date-fns'

export function Dashboard() {
  const { activeHome } = useHome()
  const [activeClients, setActiveClients] = useState(0)
  const [clockedInStaff, setClockedInStaff] = useState(0)
  const [todayIncidents, setTodayIncidents] = useState(0)
  const [medicationsGiven, setMedicationsGiven] = useState(0)
  const [todayMenu, setTodayMenu] = useState(null)
  const [pendingNotes, setPendingNotes] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!activeHome?.id) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        // Active clients
        const { data: clientsData } = await supabase
          .from('clients')
          .select('id')
          .eq('home_id', activeHome.id)
          .eq('active', true)
        setActiveClients(clientsData?.length || 0)

        // Clocked in staff
        const today = format(new Date(), 'yyyy-MM-dd')
        const { data: clockData } = await supabase
          .from('clock_records')
          .select('profile_id, action')
          .eq('home_id', activeHome.id)
          .gte('created_at', `${today}T00:00:00`)
          .in('action', ['arrived', 'break end'])

        const clocked = new Set()
        clockData?.forEach(record => {
          clocked.add(record.profile_id)
        })
        setClockedInStaff(clocked.size)

        // Today's incidents
        const { data: incidentsData } = await supabase
          .from('incidents')
          .select('id')
          .eq('home_id', activeHome.id)
          .gte('created_at', `${today}T00:00:00`)
        setTodayIncidents(incidentsData?.length || 0)

        // Medications given today
        const { data: marData } = await supabase
          .from('mar_records')
          .select('id')
          .eq('home_id', activeHome.id)
          .eq('status', 'given')
          .gte('administered_at', `${today}T00:00:00`)
        setMedicationsGiven(marData?.length || 0)

        // Today's menu
        const { data: menuData } = await supabase
          .from('menus')
          .select('*')
          .eq('home_id', activeHome.id)
          .eq('date', today)
          .single()
        setTodayMenu(menuData)

        // Pending daily notes review
        const { data: notesData } = await supabase
          .from('daily_notes')
          .select('id')
          .eq('home_id', activeHome.id)
          .eq('supervisor_review_status', 'submitted')
        setPendingNotes(notesData?.length || 0)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Setup realtime subscriptions
    const clockSub = supabase
      .channel(`clock_${activeHome.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clock_records', filter: `home_id=eq.${activeHome.id}` },
        () => fetchData()
      )
      .subscribe()

    const notesSub = supabase
      .channel(`notes_${activeHome.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'daily_notes', filter: `home_id=eq.${activeHome.id}` },
        () => fetchData()
      )
      .subscribe()

    return () => {
      clockSub.unsubscribe()
      notesSub.unsubscribe()
    }
  }, [activeHome?.id])

  if (loading) {
    return <div className="text-center py-8">Loading dashboard...</div>
  }

  const MetricCard = ({ title, value, color = 'primary' }) => (
    <div className="card">
      <p className="text-gray-600 text-sm mb-2">{title}</p>
      <p className={`text-3xl font-bold text-${color}`}>{value}</p>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Active Clients" value={activeClients} />
        <MetricCard title="Clocked In Staff" value={clockedInStaff} color="gold" />
        <MetricCard title="Today's Incidents" value={todayIncidents} color="red-light" />
        <MetricCard title="Medications Given" value={medicationsGiven} />
      </div>

      {pendingNotes > 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="font-medium text-yellow-900">
            ⚠️ {pendingNotes} daily note{pendingNotes !== 1 ? 's' : ''} awaiting supervisor review
          </p>
        </div>
      )}

      {todayMenu && (
        <div className="card">
          <h3 className="font-serif text-lg font-bold mb-4">Today's Menu</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['breakfast', 'lunch', 'dinner', 'snack'].map(meal => (
              <div key={meal} className="bg-gray-50 p-3 rounded">
                <p className="font-medium capitalize text-sm mb-1">{meal}</p>
                <p className="text-sm text-gray-600">{todayMenu[meal] || 'Not set'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-serif text-lg font-bold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full btn-primary text-left">→ Clock In/Out</button>
            <button className="w-full btn-secondary text-left">→ Create Daily Note</button>
            <button className="w-full btn-secondary text-left">→ Log Medication</button>
          </div>
        </div>

        <div className="card">
          <h3 className="font-serif text-lg font-bold mb-4">System Status</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Database:</span>
              <span className="badge badge-success">Connected</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Realtime:</span>
              <span className="badge badge-success">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
