import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useHome } from '../context/HomeContext'
import { format, parseISO } from 'date-fns'

export function Activities() {
  const { profile } = useAuth()
  const { activeHome } = useHome()
  const [activities, setActivities] = useState([])
  const [formData, setFormData] = useState({ title: '', location: '', start_time: '', end_time: '', attendees: '', notes: '', date: format(new Date(), 'yyyy-MM-dd') })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => { if (!activeHome?.id) return; fetchActivities() }, [activeHome?.id])

  const fetchActivities = async () => {
    const { data } = await supabase.from('activities').select('*').eq('home_id', activeHome.id).gte('date', format(new Date(), 'yyyy-MM-dd')).order('date, start_time')
    setActivities(data || [])
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(null); setSuccess(null); setLoading(true)
    try {
      const { error } = await supabase.from('activities').insert([{ home_id: activeHome.id, ...formData }])
      if (error) throw error
      setSuccess('Activity created successfully')
      setFormData({ title: '', location: '', start_time: '', end_time: '', attendees: '', notes: '', date: format(new Date(), 'yyyy-MM-dd') })
      setTimeout(() => setSuccess(null), 3000)
      await fetchActivities()
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1>Activities &amp; Outings</h1>
        <p>Schedule and manage activities</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="card sticky top-6">
            <h2 className="font-serif font-bold text-lg mb-4 flex items-center gap-2">
              <span className="material-symbols-rounded" style={{ fontSize: '20px', color: 'var(--primary)' }}>add_circle</span>
              Schedule Activity
            </h2>

            {error && <div className="alert alert-error mb-4"><span className="material-symbols-rounded" style={{ fontSize: '18px' }}>error</span>{error}</div>}
            {success && <div className="alert alert-success mb-4"><span className="material-symbols-rounded" style={{ fontSize: '18px' }}>check_circle</span>{success}</div>}

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div><label className="form-label">Date</label><input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="form-input" /></div>
              <div><label className="form-label">Title</label><input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="form-input" placeholder="e.g., Park visit" required /></div>
              <div><label className="form-label">Location</label><input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="form-input" placeholder="e.g., Central Park" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="form-label">Start</label><input type="time" value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} className="form-input" /></div>
                <div><label className="form-label">End</label><input type="time" value={formData.end_time} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })} className="form-input" /></div>
              </div>
              <div><label className="form-label">Attendees</label><textarea value={formData.attendees} onChange={(e) => setFormData({ ...formData, attendees: e.target.value })} className="form-input" rows="2" placeholder="Names or group" /></div>
              <div><label className="form-label">Notes</label><textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="form-input" rows="2" /></div>
              <button type="submit" disabled={loading} className="w-full btn-primary">{loading ? 'Creating...' : 'Schedule Activity'}</button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="font-serif font-bold text-lg mb-4 flex items-center gap-2">
              <span className="material-symbols-rounded" style={{ fontSize: '20px', color: 'var(--gold-dark)' }}>event</span>
              Upcoming Activities
            </h2>

            {activities.length === 0 ? (
              <div className="empty-state"><span className="empty-icon material-symbols-rounded" style={{ fontSize: '48px' }}>event_busy</span><p>No activities scheduled</p></div>
            ) : (
              <div className="space-y-3">
                {activities.map(activity => (
                  <div key={activity.id} className="rounded-xl p-4" style={{ border: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-base">{activity.title}</h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="material-symbols-rounded" style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>calendar_today</span>
                          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{format(parseISO(activity.date), 'EEEE, MMM d, yyyy')}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                      {activity.location && <span className="flex items-center gap-1"><span className="material-symbols-rounded" style={{ fontSize: '15px', color: 'var(--text-tertiary)' }}>location_on</span>{activity.location}</span>}
                      {activity.start_time && <span className="flex items-center gap-1"><span className="material-symbols-rounded" style={{ fontSize: '15px', color: 'var(--text-tertiary)' }}>schedule</span>{activity.start_time}{activity.end_time && ` – ${activity.end_time}`}</span>}
                      {activity.attendees && <span className="flex items-center gap-1"><span className="material-symbols-rounded" style={{ fontSize: '15px', color: 'var(--text-tertiary)' }}>group</span>{activity.attendees}</span>}
                    </div>
                    {activity.notes && <p className="text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>{activity.notes}</p>}
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
