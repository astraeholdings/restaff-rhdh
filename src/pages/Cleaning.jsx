import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useHome } from '../context/HomeContext'
import { format } from 'date-fns'

export function Cleaning() {
  const { profile } = useAuth()
  const { activeHome } = useHome()
  const [cleanLogs, setCleanLogs] = useState([])
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    shift: 'day',
    tasks: {},
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const roomAreas = ['Living Room', 'Kitchen', 'Bathroom 1', 'Bathroom 2', 'Bedroom 1', 'Bedroom 2', 'Hallway', 'Dining Area']

  useEffect(() => {
    if (!activeHome?.id) return
    fetchCleaningLogs()
  }, [activeHome?.id])

  const fetchCleaningLogs = async () => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const { data, error } = await supabase
      .from('clean_logs')
      .select('*')
      .eq('home_id', activeHome.id)
      .eq('date', today)
      .order('created_at', { ascending: false })

    if (error) console.error('Error:', error)
    else setCleanLogs(data || [])
  }

  const handleTaskCheck = (area, completed) => {
    setFormData({
      ...formData,
      tasks: {
        ...formData.tasks,
        [area]: {
          completed,
          time: new Date().toISOString(),
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
          shift: formData.shift,
          tasks: formData.tasks,
          staff_initials: profile.full_name?.split(' ').map(n => n[0]).join(''),
        },
      ])

      if (error) throw error

      setSuccess('Cleaning log submitted successfully')
      setTimeout(() => setSuccess(null), 3000)
      await fetchCleaningLogs()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-serif font-bold">Daytime Cleaning</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cleaning Checklist Form */}
        <div className="lg:col-span-1">
          <div className="card sticky top-6">
            <h2 className="font-serif font-bold text-lg mb-4">Cleaning Checklist</h2>

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

              <div>
                <label className="form-label">Shift</label>
                <select
                  value={formData.shift}
                  onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                  className="form-input"
                >
                  <option value="day">Day</option>
                  <option value="swing">Swing</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="font-medium text-sm">Areas Cleaned</label>
                {roomAreas.map(area => (
                  <div key={area} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={area}
                      checked={formData.tasks[area]?.completed || false}
                      onChange={(e) => handleTaskCheck(area, e.target.checked)}
                      className="w-4 h-4"
                    />
                    <label htmlFor={area} className="text-sm cursor-pointer">{area}</label>
                  </div>
                ))}
              </div>

              <button type="submit" disabled={loading} className="w-full btn-primary">
                {loading ? 'Submitting...' : 'Submit Log'}
              </button>
            </form>
          </div>
        </div>

        {/* Previous Logs */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="font-serif font-bold text-lg mb-4">Today's Logs</h2>

            {cleanLogs.length === 0 ? (
              <p className="text-gray-600 text-center py-4">No cleaning logs yet</p>
            ) : (
              <div className="space-y-4">
                {cleanLogs.map(log => (
                  <div key={log.id} className="border border-gray-200 rounded p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium capitalize">{log.shift} Shift</h3>
                        <p className="text-xs text-gray-600">
                          {format(new Date(log.created_at), 'h:mm a')} • {log.staff_initials}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {roomAreas.map(area => (
                        <div key={area} className="flex items-center gap-1">
                          <span className={log.tasks[area]?.completed ? '✓' : '—'}>
                            {log.tasks[area]?.completed ? '✓' : '—'}
                          </span>
                          <span className="text-gray-600">{area}</span>
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
