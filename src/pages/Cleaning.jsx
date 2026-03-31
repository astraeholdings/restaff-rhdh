import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useHome } from '../context/HomeContext'
import { format } from 'date-fns'

export function Cleaning() {
  const { profile } = useAuth()
  const { activeHome } = useHome()
  const [cleanLogs, setCleanLogs] = useState([])
  const [formData, setFormData] = useState({ date: format(new Date(), 'yyyy-MM-dd'), shift: 'day', tasks: {} })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const roomAreas = ['Living Room', 'Kitchen', 'Bathroom 1', 'Bathroom 2', 'Bedroom 1', 'Bedroom 2', 'Hallway', 'Dining Area']

  useEffect(() => { if (!activeHome?.id) return; fetchCleaningLogs() }, [activeHome?.id])

  const fetchCleaningLogs = async () => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const { data } = await supabase.from('clean_logs').select('*').eq('home_id', activeHome.id).eq('date', today).order('created_at', { ascending: false })
    setCleanLogs(data || [])
  }

  const handleTaskCheck = (area, completed) => {
    setFormData({ ...formData, tasks: { ...formData.tasks, [area]: { completed, time: new Date().toISOString() } } })
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(null); setSuccess(null); setLoading(true)
    try {
      const { error } = await supabase.from('clean_logs').insert([{ home_id: activeHome.id, date: formData.date, shift: formData.shift, tasks: formData.tasks, staff_initials: profile.full_name?.split(' ').map(n => n[0]).join('') }])
      if (error) throw error
      setSuccess('Cleaning log submitted successfully'); setTimeout(() => setSuccess(null), 3000)
      await fetchCleaningLogs()
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const completedCount = Object.values(formData.tasks).filter(t => t.completed).length

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1>Daytime Cleaning</h1>
        <p>Track cleaning tasks by area</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="card sticky top-6">
            <h2 className="font-serif font-bold text-lg mb-4 flex items-center gap-2">
              <span className="material-symbols-rounded" style={{ fontSize: '20px', color: 'var(--primary)' }}>checklist</span>
              Cleaning Checklist
            </h2>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1.5">
                <span style={{ color: 'var(--text-tertiary)' }}>Progress</span>
                <span className="font-semibold" style={{ color: 'var(--primary)' }}>{completedCount}/{roomAreas.length}</span>
              </div>
              <div className="w-full h-2 rounded-full" style={{ background: 'var(--border-light)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${(completedCount / roomAreas.length) * 100}%`, background: 'linear-gradient(90deg, var(--primary) 0%, var(--primary-400) 100%)' }} />
              </div>
            </div>

            {error && <div className="alert alert-error mb-4"><span className="material-symbols-rounded" style={{ fontSize: '18px' }}>error</span>{error}</div>}
            {success && <div className="alert alert-success mb-4"><span className="material-symbols-rounded" style={{ fontSize: '18px' }}>check_circle</span>{success}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="form-label">Date</label><input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="form-input" /></div>
                <div><label className="form-label">Shift</label><select value={formData.shift} onChange={(e) => setFormData({ ...formData, shift: e.target.value })} className="form-input"><option value="day">Day</option><option value="swing">Swing</option></select></div>
              </div>

              <div className="space-y-1.5">
                <label className="form-label">Areas</label>
                {roomAreas.map(area => (
                  <label key={area} className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all" style={{ background: formData.tasks[area]?.completed ? 'var(--success-light)' : 'var(--surface)', border: `1px solid ${formData.tasks[area]?.completed ? '#bbf7d0' : 'var(--border-light)'}` }}>
                    <input type="checkbox" checked={formData.tasks[area]?.completed || false} onChange={(e) => handleTaskCheck(area, e.target.checked)} className="checkbox-custom" />
                    <span className="text-sm" style={{ color: formData.tasks[area]?.completed ? 'var(--success)' : 'var(--text-secondary)', textDecoration: formData.tasks[area]?.completed ? 'line-through' : 'none' }}>{area}</span>
                  </label>
                ))}
              </div>

              <button type="submit" disabled={loading} className="w-full btn-primary">{loading ? 'Submitting...' : 'Submit Log'}</button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="font-serif font-bold text-lg mb-4 flex items-center gap-2">
              <span className="material-symbols-rounded" style={{ fontSize: '20px', color: 'var(--gold-dark)' }}>history</span>
              Today&apos;s Logs
            </h2>

            {cleanLogs.length === 0 ? (
              <div className="empty-state"><span className="empty-icon material-symbols-rounded" style={{ fontSize: '48px' }}>mop</span><p>No cleaning logs yet</p></div>
            ) : (
              <div className="space-y-3">
                {cleanLogs.map(log => (
                  <div key={log.id} className="rounded-xl p-4" style={{ border: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold capitalize">{log.shift} Shift</h3>
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{format(new Date(log.created_at), 'h:mm a')} &bull; {log.staff_initials}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {roomAreas.map(area => (
                        <div key={area} className="flex items-center gap-2">
                          <span className="material-symbols-rounded" style={{ fontSize: '16px', color: log.tasks[area]?.completed ? 'var(--success)' : 'var(--text-tertiary)' }}>
                            {log.tasks[area]?.completed ? 'check_circle' : 'radio_button_unchecked'}
                          </span>
                          <span style={{ color: log.tasks[area]?.completed ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>{area}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
