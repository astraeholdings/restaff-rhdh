import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useHome } from '../context/HomeContext'
import { format } from 'date-fns'

export function Incidents() {
  const { profile } = useAuth()
  const { activeHome } = useHome()
  const [clients, setClients] = useState([])
  const [incidents, setIncidents] = useState([])
  const [formData, setFormData] = useState({ client_id: '', incident_type: 'behavioral', severity: 'low', narrative: '', follow_up: '', sir_number: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => { if (!activeHome?.id) return; fetchClients(); fetchIncidents() }, [activeHome?.id])

  const fetchClients = async () => { const { data } = await supabase.from('clients').select('id, first_name, last_name').eq('home_id', activeHome.id).eq('active', true); setClients(data || []) }
  const fetchIncidents = async () => { const { data } = await supabase.from('incidents').select('*, clients(first_name, last_name), profiles(full_name)').eq('home_id', activeHome.id).order('created_at', { ascending: false }); setIncidents(data || []) }

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(null); setSuccess(null); setLoading(true)
    try {
      const { error } = await supabase.from('incidents').insert([{ home_id: activeHome.id, reported_by: profile.id, occurred_at: new Date().toISOString(), ...formData }])
      if (error) throw error
      setSuccess('Incident report submitted successfully')
      setFormData({ client_id: '', incident_type: 'behavioral', severity: 'low', narrative: '', follow_up: '', sir_number: '' })
      setTimeout(() => setSuccess(null), 3000); await fetchIncidents()
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const severityConfig = {
    high: { badge: 'badge-danger', icon: 'error', color: 'var(--danger)', border: '#fca5a5' },
    medium: { badge: 'badge-warning', icon: 'warning', color: '#d97706', border: '#fde68a' },
    low: { badge: 'badge-info', icon: 'info', color: 'var(--info)', border: '#93c5fd' },
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1>Incident Reports</h1>
        <p>Document and track incidents</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="card sticky top-6">
            <h2 className="font-serif font-bold text-lg mb-4 flex items-center gap-2">
              <span className="material-symbols-rounded" style={{ fontSize: '20px', color: 'var(--danger)' }}>report</span>
              Report Incident
            </h2>

            {error && <div className="alert alert-error mb-4"><span className="material-symbols-rounded" style={{ fontSize: '18px' }}>error</span>{error}</div>}
            {success && <div className="alert alert-success mb-4"><span className="material-symbols-rounded" style={{ fontSize: '18px' }}>check_circle</span>{success}</div>}

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div><label className="form-label">Client</label><select value={formData.client_id} onChange={(e) => setFormData({ ...formData, client_id: e.target.value })} className="form-input"><option value="">Select client...</option>{clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}</select></div>
              <div><label className="form-label">Type</label><select value={formData.incident_type} onChange={(e) => setFormData({ ...formData, incident_type: e.target.value })} className="form-input"><option value="behavioral">Behavioral</option><option value="medical">Medical</option><option value="environmental">Environmental</option><option value="allegation">Allegation</option></select></div>
              <div><label className="form-label">Severity</label><select value={formData.severity} onChange={(e) => setFormData({ ...formData, severity: e.target.value })} className="form-input"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
              <div><label className="form-label">Narrative</label><textarea value={formData.narrative} onChange={(e) => setFormData({ ...formData, narrative: e.target.value })} className="form-input" rows="3" required /></div>
              <div><label className="form-label">Follow-up Actions</label><textarea value={formData.follow_up} onChange={(e) => setFormData({ ...formData, follow_up: e.target.value })} className="form-input" rows="2" /></div>
              <div><label className="form-label">SIR Number (if applicable)</label><input type="text" value={formData.sir_number} onChange={(e) => setFormData({ ...formData, sir_number: e.target.value })} className="form-input" /></div>
              <button type="submit" disabled={loading} className="w-full btn-primary">{loading ? 'Submitting...' : 'Report Incident'}</button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="font-serif font-bold text-lg mb-4 flex items-center gap-2">
              <span className="material-symbols-rounded" style={{ fontSize: '20px', color: 'var(--gold-dark)' }}>history</span>
              Recent Reports
            </h2>

            {incidents.length === 0 ? (
              <div className="empty-state"><span className="empty-icon material-symbols-rounded" style={{ fontSize: '48px' }}>verified_user</span><p>No incidents reported</p></div>
            ) : (
              <div className="space-y-3">
                {incidents.map(incident => {
                  const sc = severityConfig[incident.severity] || severityConfig.low
                  return (
                    <div key={incident.id} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${sc.border}`, borderLeft: `4px solid ${sc.color}`, background: 'var(--surface-raised)' }}>
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold">{incident.clients?.first_name} {incident.clients?.last_name}</h3>
                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{format(new Date(incident.created_at), 'MMM d, yyyy h:mm a')}</p>
                          </div>
                          <span className={`badge ${sc.badge}`}>
                            <span className="material-symbols-rounded" style={{ fontSize: '14px' }}>{sc.icon}</span>
                            {incident.severity.toUpperCase()}
                          </span>
                        </div>
                        <div className="mb-2"><span className="tag capitalize">{incident.incident_type}</span></div>
                        <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>{incident.narrative}</p>
                        {incident.follow_up && <div className="text-sm mb-2 p-2 rounded-lg" style={{ background: 'var(--surface)' }}><span className="font-semibold text-xs" style={{ color: 'var(--text-tertiary)' }}>Follow-up:</span><p style={{ color: 'var(--text-secondary)' }}>{incident.follow_up}</p></div>}
                        {incident.sir_number && <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>SIR: {incident.sir_number}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
