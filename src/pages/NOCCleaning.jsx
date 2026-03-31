import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useHome } from '../context/HomeContext'
import { format } from 'date-fns'

export function NOCCleaning() {
  const { profile } = useAuth()
  const { activeHome } = useHome()
  const [clients, setClients] = useState([])
  const [formData, setFormData] = useState({ date: format(new Date(), 'yyyy-MM-dd'), entries: {} })
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => { if (!activeHome?.id) return; fetchClients(); fetchLogs() }, [activeHome?.id])

  const fetchClients = async () => { const { data } = await supabase.from('clients').select('id, first_name, last_name').eq('home_id', activeHome.id).eq('active', true); setClients(data || []) }
  const fetchLogs = async () => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const { data } = await supabase.from('clean_logs').select('*').eq('home_id', activeHome.id).eq('shift', 'night').eq('date', today)
    setLogs(data || [])
  }

  const updateClientEntry = (clientId, field, value) => {
    setFormData({ ...formData, entries: { ...formData.entries, [clientId]: { ...formData.entries[clientId], [field]: value } } })
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(null); setSuccess(null); setLoading(true)
    try {
      const { error } = await supabase.from('clean_logs').insert([{ home_id: activeHome.id, date: formData.date, shift: 'night', tasks: formData.entries, staff_initials: profile.full_name?.split(' ').map(n => n[0]).join('') }])
      if (error) throw error
      setSuccess('Night shift log submitted successfully')
      setFormData({ date: format(new Date(), 'yyyy-MM-dd'), entries: {} })
      setTimeout(() => setSuccess(null), 3000); await fetchLogs()
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1>Night Shift Cleaning &amp; Sleep</h1>
        <p>Overnight cleaning and client sleep monitoring</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="card sticky top-6">
            <h2 className="font-serif font-bold text-lg mb-4 flex items-center gap-2">
              <span className="material-symbols-rounded" style={{ fontSize: '20px', color: '#7c3aed' }}>dark_mode</span>
              Night Log
            </h2>

            {error && <div className="alert alert-error mb-4"><span className="material-symbols-rounded" style={{ fontSize: '18px' }}>error</span>{error}</div>}
            {success && <div className="alert alert-success mb-4"><span className="material-symbols-rounded" style={{ fontSize: '18px' }}>check_circle</span>{success}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="form-label">Date</label><input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="form-input" /></div>

              <div className="space-y-3">
                <label className="form-label flex items-center gap-1.5">
                  <span className="material-symbols-rounded" style={{ fontSize: '16px', color: 'var(--text-tertiary)' }}>bedtime</span>
                  Client Sleep Monitoring
                </label>
                {clients.map(client => (
                  <div key={client.id} className="rounded-lg p-3" style={{ background: 'var(--surface)', border: '1px solid var(--border-light)' }}>
                    <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--text-primary)' }}>
                      {client.first_name} {client.last_name}
                    </label>
                    <input type="text" placeholder="e.g., Slept well 10pm-6am" value={formData.entries[client.id]?.sleep_notes || ''} onChange={(e) => updateClientEntry(client.id, 'sleep_notes', e.target.value)} className="form-input text-xs" />
                  </div>
                ))}
              </div>

              <button type="submit" disabled={loading} className="w-full btn-primary">{loading ? 'Submitting...' : 'Submit Night Log'}</button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="font-serif font-bold text-lg mb-4 flex items-center gap-2">
              <span className="material-symbols-rounded" style={{ fontSize: '20px', color: '#7c3aed' }}>nights_stay</span>
              Night Shift Logs
            </h2>

            {logs.length === 0 ? (
              <div className="empty-state"><span className="empty-icon material-symbols-rounded" style={{ fontSize: '48px' }}>bedtime_off</span><p>No night logs yet</p></div>
            ) : (
              <div className="space-y-3">
                {logs.map(log => (
                  <div key={log.id} className="rounded-xl p-4" style={{ border: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
                    <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
                      {format(new Date(log.created_at), 'MMM d, h:mm a')} &bull; {log.staff_initials}
                    </p>
                    <div className="space-y-2">
                      {Object.entries(log.tasks).map(([clientId, entry]) => (
                        <div key={clientId} className="flex items-start gap-2 p-2 rounded-lg" style={{ background: 'var(--surface)' }}>
                          <span className="material-symbols-rounded" style={{ fontSize: '16px', color: '#7c3aed', marginTop: '2px' }}>bedtime</span>
                          <div>
                            <p className="text-sm font-medium">{clients.find(c => c.id === clientId)?.first_name} {clients.find(c => c.id === clientId)?.last_name}</p>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{entry.sleep_notes}</p>
                          </div>
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
