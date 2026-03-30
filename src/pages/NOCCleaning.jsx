import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useHome } from '../context/HomeContext'
import { format } from 'date-fns'

export function NOCCleaning() {
  const { profile } = useAuth()
  const { activeHome } = useHome()
  const [clients, setClients] = useState([])
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    entries: {},
  })
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    if (!activeHome?.id) return
    fetchClients()
    fetchLogs()
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

  const fetchLogs = async () => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const { data, error } = await supabase
      .from('clean_logs')
      .select('*')
      .eq('home_id', activeHome.id)
      .eq('shift', 'night')
      .eq('date', today)

    if (error) console.error('Error:', error)
    else setLogs(data || [])
  }

  const updateClientEntry = (clientId, field, value) => {
    setFormData({
      ...formData,
      entries: {
        ...formData.entries,
        [clientId]: {
          ...formData.entries[clientId],
          [field]: value,
        },
      },
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const { error } = await supabase.from('clean_logs').insert([
        {
          home_id: activeHome.id,
          date: formData.date,
          shift: 'night',
          tasks: formData.entries,
          staff_initials: profile.full_name?.split(' ').map(n => n[0]).join(''),
        },
      ])

      if (error) throw error

      setSuccess('Night shift log submitted successfully')
      setFormData({ date: format(new Date(), 'yyyy-MM-dd'), entries: {} })
      setTimeout(() => setSuccess(null), 3000)
      await fetchLogs()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-serif font-bold">Night Shift Cleaning & Sleep Monitoring</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entry Form */}
        <div className="lg:col-span-1">
          <div className="card sticky top-6">
            <h2 className="font-serif font-bold text-lg mb-4">Night Log</h2>

            {error && <div className="mb-4 p-3 bg-red-light text-white rounded text-sm">{error}</div>}
            {success && <div className="mb-4 p-3 bg-green-600 text-white rounded text-sm">{success}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="space-y-3 text-sm">
                <label className="font-medium">Client Sleep Monitoring</label>
                {clients.map(client => (
                  <div key={client.id} className="space-y-1">
                    <label className="block text-gray-700">{client.first_name} {client.last_name}</label>
                    <input
                      type="text"
                      placeholder="Sleep quality notes (e.g., Slept well 10pm-6am)"
                      value={formData.entries[client.id]?.sleep_notes || ''}
                      onChange={(e) => updateClientEntry(client.id, 'sleep_notes', e.target.value)}
                      className="form-input text-xs"
                    />
                  </div>
                ))}
              </div>

              <button type="submit" disabled={loading} className="w-full btn-primary">
                {loading ? 'Submitting...' : 'Submit Night Log'}
              </button>
            </form>
          </div>
        </div>

        {/* Night Logs */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="font-serif font-bold text-lg mb-4">Night Shift Logs</h2>

            {logs.length === 0 ? (
              <p className="text-gray-600 text-center py-4">No night logs yet</p>
            ) : (
              <div className="space-y-4">
                {logs.map(log => (
                  <div key={log.id} className="border border-gray-200 rounded p-4">
                    <p className="text-xs text-gray-600 mb-3">
                      {format(new Date(log.created_at), 'MMM d, h:mm a')} • {log.staff_initials}
                    </p>
                    <div className="space-y-2 text-sm">
                      {Object.entries(log.tasks).map(([clientId, entry]) => (
                        <div key={clientId}>
                          <p className="font-medium">
                            {clients.find(c => c.id === clientId)?.first_name} {clients.find(c => c.id === clientId)?.last_name}
                          </p>
                          <p className="text-gray-600">{entry.sleep_notes}</p>
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
