import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useHome } from '../context/HomeContext'
import { Link } from 'react-router-dom'
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
    if (!activeHome?.id) { setLoading(false); return }

    const fetchData = async () => {
      try {
        const { data: clientsData } = await supabase.from('clients').select('id').eq('home_id', activeHome.id).eq('active', true)
        setActiveClients(clientsData?.length || 0)

        const today = format(new Date(), 'yyyy-MM-dd')
        const { data: clockData } = await supabase.from('clock_records').select('profile_id, action').eq('home_id', activeHome.id).gte('created_at', `${today}T00:00:00`).in('action', ['arrived', 'break end'])
        const clocked = new Set()
        clockData?.forEach(record => clocked.add(record.profile_id))
        setClockedInStaff(clocked.size)

        const { data: incidentsData } = await supabase.from('incidents').select('id').eq('home_id', activeHome.id).gte('created_at', `${today}T00:00:00`)
        setTodayIncidents(incidentsData?.length || 0)

        const { data: marData } = await supabase.from('mar_records').select('id').eq('home_id', activeHome.id).eq('status', 'given').gte('administered_at', `${today}T00:00:00`)
        setMedicationsGiven(marData?.length || 0)

        const { data: menuData } = await supabase.from('menus').select('*').eq('home_id', activeHome.id).eq('date', today).single()
        setTodayMenu(menuData)

        const { data: notesData } = await supabase.from('daily_notes').select('id').eq('home_id', activeHome.id).eq('supervisor_review_status', 'submitted')
        setPendingNotes(notesData?.length || 0)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    const clockSub = supabase
      .channel(`clock_${activeHome.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clock_records', filter: `home_id=eq.${activeHome.id}` }, () => fetchData())
      .subscribe()

    const notesSub = supabase
      .channel(`notes_${activeHome.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_notes', filter: `home_id=eq.${activeHome.id}` }, () => fetchData())
      .subscribe()

    return () => { clockSub.unsubscribe(); notesSub.unsubscribe() }
  }, [activeHome?.id])

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="skeleton h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-28 rounded-xl" />)}
        </div>
      </div>
    )
  }

  const metrics = [
    { title: 'Active Clients', value: activeClients, icon: 'group', color: '#1e7a4b', bg: '#e8f5ed' },
    { title: 'Clocked In', value: clockedInStaff, icon: 'schedule', color: '#d4a02e', bg: '#fef9ee' },
    { title: "Today's Incidents", value: todayIncidents, icon: 'warning', color: '#dc2626', bg: '#fee2e2' },
    { title: 'Meds Given', value: medicationsGiven, icon: 'medication', color: '#3b82f6', bg: '#dbeafe' },
  ]

  const quickActions = [
    { label: 'Clock In/Out', icon: 'schedule', path: '/clockinout', desc: 'Record your time' },
    { label: 'Daily Note', icon: 'edit_note', path: '/daily-notes', desc: 'Create a new note' },
    { label: 'Log Medication', icon: 'medication', path: '/mar', desc: 'Record MAR entry' },
  ]

  const mealIcons = { breakfast: 'egg_alt', lunch: 'lunch_dining', dinner: 'dinner_dining', snack: 'cookie' }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {metrics.map(m => (
          <div key={m.title} className="metric-card">
            <div className="metric-icon" style={{ background: m.bg, color: m.color }}>
              <span className="material-symbols-rounded" style={{ fontSize: '22px', fontVariationSettings: "'FILL' 1" }}>{m.icon}</span>
            </div>
            <div className="metric-value" style={{ color: m.color }}>{m.value}</div>
            <div className="metric-label">{m.title}</div>
          </div>
        ))}
      </div>

      {/* Pending Notes Alert */}
      {pendingNotes > 0 && (
        <div className="alert alert-warning">
          <span className="material-symbols-rounded" style={{ fontSize: '20px', color: 'var(--warning)' }}>rate_review</span>
          <span className="font-medium">
            {pendingNotes} daily note{pendingNotes !== 1 ? 's' : ''} awaiting supervisor review
          </span>
        </div>
      )}

      {/* Today's Menu */}
      {todayMenu && (
        <div className="card">
          <h3 className="font-serif text-lg font-bold mb-4 flex items-center gap-2">
            <span className="material-symbols-rounded" style={{ fontSize: '20px', color: 'var(--gold-dark)' }}>restaurant_menu</span>
            Today&apos;s Menu
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['breakfast', 'lunch', 'dinner', 'snack'].map(meal => (
              <div
                key={meal}
                className="rounded-xl p-3.5"
                style={{ background: 'var(--surface)', border: '1px solid var(--border-light)' }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="material-symbols-rounded" style={{ fontSize: '16px', color: 'var(--text-tertiary)' }}>{mealIcons[meal]}</span>
                  <span className="font-semibold capitalize text-xs" style={{ color: 'var(--text-tertiary)' }}>{meal}</span>
                </div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{todayMenu[meal] || 'Not set'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions & Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-serif text-lg font-bold mb-4 flex items-center gap-2">
            <span className="material-symbols-rounded" style={{ fontSize: '20px', color: 'var(--primary)' }}>bolt</span>
            Quick Actions
          </h3>
          <div className="space-y-2">
            {quickActions.map(action => (
              <Link
                key={action.path}
                to={action.path}
                className="flex items-center gap-3 p-3 rounded-xl transition-all group"
                style={{ background: 'var(--surface)', border: '1px solid var(--border-light)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary-200)'
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-light)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: 'var(--primary-50)', color: 'var(--primary)' }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>{action.icon}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{action.label}</p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{action.desc}</p>
                </div>
                <span className="material-symbols-rounded" style={{ fontSize: '18px', color: 'var(--text-tertiary)' }}>chevron_right</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="font-serif text-lg font-bold mb-4 flex items-center gap-2">
            <span className="material-symbols-rounded" style={{ fontSize: '20px', color: 'var(--success)' }}>monitoring</span>
            System Status
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Database', status: 'Connected', ok: true },
              { label: 'Realtime', status: 'Active', ok: true },
            ].map(item => (
              <div
                key={item.label}
                className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: 'var(--surface)', border: '1px solid var(--border-light)' }}
              >
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className={`status-dot ${item.ok ? 'status-dot-success' : 'status-dot-danger'}`} />
                  <span className="text-xs font-medium" style={{ color: item.ok ? 'var(--success)' : 'var(--danger)' }}>{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
