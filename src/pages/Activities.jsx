import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useHome } from '../context/HomeContext'
import { format } from 'date-fns'

export function Activities() {
  const { profile } = useAuth()
  const { activeHome } = useHome()
  const [activities, setActivities] = useState([])
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    start_time: '',
    end_time: '',
    attendees: '',
    notes: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    if (!activeHome?.id) return
    fetchActivities()
  }, [activeHome?.id])

  const fetchActivities = async () => {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('home_id', activeHome.id)
      .gte('date', format(new Date(), 'yyyy-MM-dd'))
      .order('date, start_time')

    if (error) console.error('Error:', error)
    else setActivities(data || [])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const { error } = await supabase.from('activities').insert([
        {
          home_id: activeHome.id,
          ...formData,
        },
      ])

      if (error) throw error

      setSuccess('Activity created successfully')
      setFormData({
        title: '',
        location: '',
        start_time: '',
        end_time: '',
        attendees: '',
        notes: '',
        date: format(new Date(), 'yyyy-MM-dd'),
      })
      setTimeout(() => setSuccess(null), 3000)
      await fetchActivities()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-serif font-bold">Activities & Outings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* New Activity Form */}
        <div className="lg:col-span-1">
          <div className="card sticky top-6">
            <h2 className="font-serif font-bold text-lg mb-4">Schedule Activity</h2>

            {error && <div className="mb-4 p-3 bg-red-light text-white rounded text-sm">{error}</div>}
            {success && <div className="mb-4 p-3 bg-green-600 text-white rounded text-sm">{success}</div>}

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
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
                <label className="form-label">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="form-input"
                  placeholder="e.g., Park visit"
                  required
                />
              </div>

              <div>
                <label className="form-label">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="form-input"
                  placeholder="e.g., Central Park"
                />
              </div>

              <div>
                <label className="form-label">Start Time</label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">End Time</label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Attendees</label>
                <textarea
                  value={formData.attendees}
                  onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                  className="form-input"
                  rows="2"
                  placeholder="Names or group"
                />
              </div>

              <div>
                <label className="form-label">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="form-input"
                  rows="2"
                />
              </div>

              <button type="submit" disabled={loading} className="w-full btn-primary">
                {loading ? 'Creating...' : 'Schedule Activity'}
              </button>
            </form>
          </div>
        </div>

        {/* Activities List */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="font-serif font-bold text-lg mb-4">Upcoming Activities</h2>

            {activities.length === 0 ? (
              <p className="text-gray-600 text-center py-4">No activities scheduled</p>
            ) : (
              <div className="space-y-4">
                {activities.map(activity => (
                  <div key={activity.id} className="border border-gray-200 rounded p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-lg">{activity.title}</h3>
                        <p className="text-sm text-gray-600">{format(new Date(activity.date), 'EEEE, MMM d, yyyy')}</p>
                      </div>
                    </div>

                    <div className="space-y-1 text-sm mb-3">
                      {activity.location && <p><span className="text-gray-600">Location:</span> {activity.location}</p>}
                      {activity.start_time && (
                        <p>
                          <span className="text-gray-600">Time:</span> {activity.start_time}
                          {activity.end_time && ` - ${activity.end_time}`}
                        </p>
                      )}
                      {activity.attendees && <p><span className="text-gray-600">Attendees:</span> {activity.attendees}</p>}
                      {activity.notes && <p><span className="text-gray-600">Notes:</span> {activity.notes}</p>}
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
