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
  const [formData, setFormData] = useState({
    client_id: '',
    incident_type: 'behavioral',
    severity: 'low',
    narrative: '',
    follow_up: '',
    sir_number: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    if (!activeHome?.id) return
    fetchClients()
    fetchIncidents()
  }, [activeHome?.id])

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('id, first_name, last_name')
      .eq('home_id', activeHome.id)
      .eq('active', true)

    if (error) console.error('Error:', error)
    else setClients(data || [])
  }

  const fetchIncidents = async () => {
    const { data, error } = await supabase
      .from('incidents')
      .select('*, clients(first_name, last_name), profiles(full_name)')
      .eq('home_id', activeHome.id)
      .order('created_at', { ascending: false })

    if (error) console.error('Error:', error)
    else setIncidents(data || [])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const { error } = await supabase.from('incidents').insert([
        {
          home_id: activeHome.id,
          reported_by: profile.id,
          occurred_at: new Date().toISOString(),
          ...formData,
        },
      ])

      if (error) throw error

      setSuccess('Incident report submitted successfully')
      setFormData({
        client_id: '',
        incident_type: 'behavioral',
        severity: 'low',
        narrative: '',
        follow_up: '',
        sir_number: '',
      })
      setTimeout(() => setSuccess(null), 3000)
      await fetchIncidents()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-serif font-bold">Incident Reports</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Form */}
        <div className="lg:col-span-1">
          <div className="card sticky top-6">
            <h2 className="font-serif font-bold text-lg mb-4">Report Incident</h2>

            {error && <div className="mb-4 p-3 bg-red-light text-white rounded text-sm">{error}</div>}
            {success && <div className="mb-4 p-3 bg-green-600 text-white rounded text-sm">{success}</div>}

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="form-label">Client</label>
                <select
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                  className="form-input"
                >
                  <option value="">Select client...</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.first_name} {client.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Type</label>
                <select
                  value={formData.incident_type}
                  onChange={(e) => setFormData({ ...formData, incident_type: e.target.value })}
                  className="form-input"
                >
                  <option value="behavioral">Behavioral</option>
                  <option value="medical">Medical</option>
                  <option value="environmental">Environmental</option>
                  <option value="allegation">Allegation</option>
                </select>
              </div>

              <div>
                <label className="form-label">Severity</label>
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  className="form-input"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="form-label">Narrative</label>
                <textarea
                  value={formData.narrative}
                  onChange={(e) => setFormData({ ...formData, narrative: e.target.value })}
                  className="form-input"
                  rows="3"
                  required
                />
              </div>

              <div>
                <label className="form-label">Follow-up Actions</label>
                <textarea
                  value={formData.follow_up}
                  onChange={(e) => setFormData({ ...formData, follow_up: e.target.value })}
                  className="form-input"
                  rows="2"
                />
              </div>

              <div>
                <label className="form-label">SIR Number (if applicable)</label>
                <input
                  type="text"
                  value={formData.sir_number}
                  onChange={(e) => setFormData({ ...formData, sir_number: e.target.value })}
                  className="form-input"
                />
              </div>

              <button type="submit" disabled={loading} className="w-full btn-primary">
                {loading ? 'Submitting...' : 'Report Incident'}
              </button>
            </form>
          </div>
        </div>

        {/* Incidents List */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="font-serif font-bold text-lg mb-4">Recent Reports</h2>

            {incidents.length === 0 ? (
              <p className="text-gray-600 text-center py-4">No incidents reported</p>
            ) : (
              <div className="space-y-4">
                {incidents.map(incident => (
                  <div key={incident.id} className="border border-gray-200 rounded p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium">
                          {incident.clients?.first_name} {incident.clients?.last_name}
                        </h3>
                        <p className="text-xs text-gray-600">
                          {format(new Date(incident.created_at), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                      <span className={`badge ${getSeverityColor(incident.severity)}`}>
                        {incident.severity.toUpperCase()}
                      </span>
                    </div>

                    <div className="mb-2">
                      <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs font-medium capitalize">
                        {incident.incident_type}
                      </span>
                    </div>

                    <p className="text-sm mb-2">{incident.narrative}</p>

                    {incident.follow_up && (
                      <div className="text-sm mb-2">
                        <span className="font-medium text-gray-700">Follow-up:</span>
                        <p className="text-gray-600">{incident.follow_up}</p>
                      </div>
                    )}

                    {incident.sir_number && (
                      <p className="text-xs text-gray-600">SIR: {incident.sir_number}</p>
                    )}
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
